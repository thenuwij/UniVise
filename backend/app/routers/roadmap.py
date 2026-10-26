import logging
import time

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.database import supabase
from app.models.roadmap import UNSWReq, RoadmapResp
from app.services.roadmap.cache import read_cached_roadmap, roadmap_cache_key
from app.services.roadmap.context import build_payload, gather_context
from app.services.roadmap.sections import generate_and_save_sections

logger = logging.getLogger(__name__)

router = APIRouter(tags=["roadmap"])

@router.post("/unsw", response_model=RoadmapResp)
async def create_roadmap(
    body: UNSWReq,
    user=Depends(get_current_user)
):
    endpoint_start = time.time()
    
    if not any([body.degree_id, body.uac_code, body.program_name]):
        raise HTTPException(status_code=400, detail="Provide degree_id or uac_code or program_name.")

    # Build roadmap context & payload 
    ctx = await gather_context(user.id, body)
    cache_key = roadmap_cache_key(ctx)
    payload = read_cached_roadmap(cache_key) or build_payload(ctx)
    payload["specialisation_ids"] = ctx["specialisation_ids"]
    payload["cache_key"] = cache_key

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
        logger.exception(f"UNSW roadmap insert failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Could not save the roadmap. Please try again.")

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
# Called by the frontend right after create_roadmap returns; takes ~15-25s and
# writes the three sections into unsw_roadmap.payload, which the roadmap page
# is already polling for. Safe to call more than once.
@router.post("/unsw/{roadmap_id}/industry")
async def generate_roadmap_sections(roadmap_id: str, user=Depends(get_current_user)):
    try:
        res = (
            supabase.from_("unsw_roadmap")
            .select("*").eq("id", roadmap_id).single().execute()
        )
    except Exception as e:
        logger.exception(f"Roadmap lookup failed for {roadmap_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not load the roadmap. Please try again.")

    rec = res.data
    if not rec:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    if rec.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not your roadmap")

    # Already generated (e.g. the frontend retried, or the user reloaded) —
    # don't spend another round of AI calls.
    payload = rec.get("payload") or {}
    sections = ("industry_societies", "industry_experience", "career_pathways")
    if all(payload.get(k) for k in sections) and not payload.get("industry_failed"):
        return {"status": "already_generated"}

    try:
        await generate_and_save_sections(roadmap_id, rec)
    except Exception as e:
        logger.exception(f"Industry generation failed for {roadmap_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not finish the roadmap. Please try again.")

    return {"status": "generated"}
