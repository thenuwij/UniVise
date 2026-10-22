import asyncio

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.models.careers import CareersFeedResponse, CareersRefreshReq, CareersSourceState
from app.services.careers.feed import load_roadmap, owns_program
from app.services.careers.refresh import feed_response, refresh_source

router = APIRouter(tags=["Careers"])


@router.get("/careers/feed", response_model=CareersFeedResponse)
async def careers_feed(roadmap_id: str, user=Depends(get_current_user)):
    roadmap = await asyncio.to_thread(load_roadmap, roadmap_id, str(user.id))
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    if not await asyncio.to_thread(owns_program, str(user.id), roadmap.get("degree_code")):
        raise HTTPException(status_code=403, detail="Careers updates are only for your own program")
    return await asyncio.to_thread(feed_response, roadmap)


@router.post("/careers/refresh", response_model=CareersSourceState)
async def refresh_careers_source(body: CareersRefreshReq, user=Depends(get_current_user)):
    roadmap = await asyncio.to_thread(load_roadmap, body.roadmap_id, str(user.id))
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    if not await asyncio.to_thread(owns_program, str(user.id), roadmap.get("degree_code")):
        raise HTTPException(status_code=403, detail="Careers updates are only for your own program")
    return await refresh_source(roadmap, body.source)
