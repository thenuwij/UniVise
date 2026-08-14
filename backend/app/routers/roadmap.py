import logging

from fastapi import APIRouter, Depends, HTTPException
from app.utils.database import supabase
from dependencies import get_current_user

logger = logging.getLogger(__name__)

from .roadmap_common import (
    SchoolReq, UNSWReq, RoadmapResp,
    ensure, table_for_mode
)
from .roadmap_school import gather_school_context, ai_generate_school_payload, generate_and_update_school_careers
from .roadmap_unsw import gather_unsw_context, ai_generate_unsw_payload
from .roadmap_industry import generate_and_update_all_industry

router = APIRouter(tags=["roadmap"])

# Generate roadmap for high school students
@router.post("/school", response_model=RoadmapResp)
async def create_school(body: SchoolReq, user=Depends(get_current_user)):
    import asyncio
    
    ensure(bool(body.recommendation_id or body.degree_name), "Provide recommendation_id or degree_name.")
    ctx = await gather_school_context(user.id, body)
    payload = await ai_generate_school_payload(ctx)
    try:
        ins = (
            supabase.table("school_roadmap")
            .insert({"user_id": user.id, "degree_name": ctx.get("degree_name"), "mode": "school", "payload": payload})
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insert failed: {e}")
    if not ins.data:
        raise HTTPException(status_code=500, detail="Roadmap insert returned no data")
    rec = ins.data[0]

    # Trigger background task for careers
    asyncio.create_task(generate_and_update_school_careers(rec["id"], ctx))
    
    return {"id": rec["id"], "mode": rec["mode"], "payload": rec["payload"]}

# Generate roadmap for UNSW students, triggers background tasks for societies/careers
@router.post("/unsw", response_model=RoadmapResp)
async def create_unsw(
    body: UNSWReq,
    user=Depends(get_current_user)
):
    import time
    endpoint_start = time.time()
    
    ensure(any([body.degree_id, body.uac_code, body.program_name]),
           "Provide degree_id or uac_code or program_name.")

    # Build roadmap context & payload 
    ctx = await gather_unsw_context(user.id, body)
    payload = await ai_generate_unsw_payload(ctx)

    logger.debug(f"[TIMING] After AI generation: {time.time() - endpoint_start:.1f}s")

    # save roadmap in DB 
    db_start = time.time()
    try:
        ins = (
            supabase.table("unsw_roadmap")
            .insert({
                "user_id": user.id,
                "degree_id": ctx.get("degree_id"),
                "degree_code": ctx.get("degree_code"),
                "uac_code": ctx.get("uac_code"),
                "program_name": ctx.get("program_name") or body.program_name,
                "mode": "unsw",
                "payload": payload,
            })
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insert failed: {e}")

    logger.debug(f"[TIMING] DB insert: {time.time() - db_start:.1f}s")

    if not ins.data:
        raise HTTPException(status_code=500, detail="Roadmap insert returned no data")
    rec = ins.data[0]

    # Societies, industry experience, and career pathways are NOT generated
    # here. They are produced by POST /roadmap/unsw/{roadmap_id}/industry,
    # which the frontend calls immediately after this response.
    #
    # They used to run as an asyncio background task started before this
    # return. That works on a long-lived server but not on Lambda, which
    # freezes the execution environment as soon as the response is sent: the
    # task was suspended mid-flight and its payload write never happened, so
    # the three sections stayed empty forever. A separate request keeps the
    # work inside an invocation that is allowed to finish.
    logger.info(f"[TIMING] TOTAL ENDPOINT: {time.time() - endpoint_start:.1f}s")

    # Return immediate response to frontend
    return {"id": rec["id"], "mode": rec["mode"], "payload": rec["payload"]}

# Generate societies / industry experience / career pathways for a roadmap.
# Called by the frontend right after create_unsw returns; takes ~15-25s and
# writes the three sections into unsw_roadmap.payload, which the roadmap page
# is already polling for. Safe to call more than once.
@router.post("/unsw/{roadmap_id}/industry")
async def generate_unsw_industry(roadmap_id: str, user=Depends(get_current_user)):
    try:
        res = (
            supabase.from_("unsw_roadmap")
            .select("*").eq("id", roadmap_id).single().execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lookup failed: {e}")

    rec = res.data
    if not rec:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    if rec.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not your roadmap")

    # Already generated (e.g. the frontend retried, or the user reloaded) —
    # don't spend another round of AI calls.
    payload = rec.get("payload") or {}
    if all(payload.get(k) for k in ("industry_societies", "industry_experience", "career_pathways")):
        return {"status": "already_generated"}

    try:
        await generate_and_update_all_industry(roadmap_id, rec)
    except Exception as e:
        logger.error(f"Industry generation failed for {roadmap_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Industry generation failed: {e}")

    return {"status": "generated"}

# Get user's most recent roadmap by mode
@router.get("/{mode}", response_model=RoadmapResp)
async def get_latest(mode: str, user=Depends(get_current_user)):
    table = table_for_mode(mode)
    try:
        res = (
            supabase.from_(table)
            .select("*").eq("user_id", user.id)
            .order("created_at", desc=True).limit(1).execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")
    if not res.data:
        raise HTTPException(status_code=404, detail="No roadmap saved.")
    rec = res.data[0]
    return {"id": rec["id"], "mode": rec["mode"], "payload": rec["payload"]}

# Delete user's most recent roadmap by mode
@router.delete("/{mode}")
async def delete_latest(mode: str, user=Depends(get_current_user)):
    table = table_for_mode(mode)
    try:
        latest = (
            supabase.from_(table)
            .select("id").eq("user_id", user.id)
            .order("created_at", desc=True).limit(1).execute()
        )
        if not latest.data:
            return {"deleted": False}
        rid = latest.data[0]["id"]
        supabase.from_(table).delete().eq("id", rid).execute()
        return {"deleted": True, "id": rid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")
