from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.utils.database import supabase
from dependencies import get_current_user

from .roadmap_common import (
    SchoolReq, UNSWReq, TranscriptReq, RoadmapResp,
    ensure, table_for_mode
)
from .roadmap_school import gather_school_context, ai_generate_school_payload
from .roadmap_unsw import gather_unsw_context, ai_generate_unsw_payload
from .roadmap_unsw_flexibility import generate_and_update_flexibility
from .roadmap_industry import generate_and_update_industry_careers

router = APIRouter(tags=["roadmap"])

@router.post("/school", response_model=RoadmapResp)
async def create_school(body: SchoolReq, user=Depends(get_current_user)):
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
    rec = ins.data[0]
    return {"id": rec["id"], "mode": rec["mode"], "payload": rec["payload"]}

@router.post("/unsw", response_model=RoadmapResp)
async def create_unsw(
    body: UNSWReq,
    background_tasks: BackgroundTasks,  
    user=Depends(get_current_user)
):
    ensure(any([body.degree_id, body.uac_code, body.program_name]),
           "Provide degree_id or uac_code or program_name.")

    # --- Stage 1: build roadmap context & payload ---
    ctx = await gather_unsw_context(user.id, body)
    payload = await ai_generate_unsw_payload(ctx)

    # --- Stage 2: save roadmap in DB ---
    try:
        ins = (
            supabase.table("unsw_roadmap")
            .insert({
                "user_id": user.id,
                "degree_id": ctx.get("degree_id"),
                "uac_code": ctx.get("uac_code"),
                "program_name": ctx.get("program_name") or body.program_name,
                "mode": "unsw",
                "payload": payload,
            })
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insert failed: {e}")

    rec = ins.data[0]

    # --- Stage 3 & 4: trigger BOTH background tasks in parallel ---
    try:
        import asyncio
        
        print(f"[Background] Launching flexibility + industry/careers in parallel for roadmap: {rec['id']}")
        
        # Create both tasks immediately (they'll run concurrently)
        asyncio.create_task(generate_and_update_flexibility(rec["id"], rec))
        asyncio.create_task(generate_and_update_industry_careers(rec["id"], rec))
        
    except Exception as e:
        print(f"[Background] Failed to schedule tasks: {e}")


    # --- Stage 5: return immediate response to frontend ---
    return {"id": rec["id"], "mode": rec["mode"], "payload": rec["payload"]}


@router.post("/unsw/{roadmap_id}/flexibility")
async def generate_flexibility(
    roadmap_id: str,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user)
):
    """
    Generate flexibility/degree switching recommendations for an existing UNSW roadmap.
    
    This runs as a background task, so the endpoint returns immediately.
    The flexibility data is added to the roadmap payload once generation completes.
    """
    
    # Verify roadmap exists and belongs to user
    try:
        roadmap_response = supabase.table("unsw_roadmap")\
            .select("*")\
            .eq("id", roadmap_id)\
            .eq("user_id", user.id)\
            .single()\
            .execute()
    except Exception as e:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    if not roadmap_response.data:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    roadmap_data = roadmap_response.data
    
    # Check if flexibility already exists
    if roadmap_data.get("payload", {}).get("flexibility_detailed"):
        return {
            "status": "already_exists",
            "message": "Flexibility recommendations already exist for this roadmap"
        }
    
    # Schedule background task to generate flexibility
    background_tasks.add_task(
        generate_and_update_flexibility,
        roadmap_id,
        roadmap_data
    )
    
    return {
        "status": "generating",
        "message": "Flexibility recommendations are being generated in the background"
    }

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
