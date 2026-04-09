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
from .roadmap_industry import generate_and_update_industry_careers
from .roadmap_industry import generate_and_update_societies

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

# Generate roadmap for UNSW students, triggers background tasks for flexibility/societies/careers
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

    print(f"[TIMING] After AI generation: {time.time() - endpoint_start:.1f}s")

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

    print(f"[TIMING] DB insert: {time.time() - db_start:.1f}s")

    if not ins.data:
        raise HTTPException(status_code=500, detail="Roadmap insert returned no data")
    rec = ins.data[0]

    # Trigger background tasks for societies and industry/careers
    try:
        import asyncio

        def handle_task_exception(task):
            if not task.cancelled() and task.exception():
                logger.error(f"Background task failed: {task.exception()}")

        societies_task = asyncio.create_task(generate_and_update_societies(rec["id"], rec))
        societies_task.add_done_callback(handle_task_exception)

        careers_task = asyncio.create_task(generate_and_update_industry_careers(rec["id"], rec))
        careers_task.add_done_callback(handle_task_exception)
    except Exception as e:
        print(f"[Background] Failed to schedule tasks: {e}")

    print(f"[TIMING] TOTAL ENDPOINT: {time.time() - endpoint_start:.1f}s")

    # Return immediate response to frontend
    return {"id": rec["id"], "mode": rec["mode"], "payload": rec["payload"]}

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
