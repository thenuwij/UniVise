import asyncio
import logging
from typing import Any, Dict

from app.services.careers.adzuna import fetch_adzuna_listings
from app.services.careers.event_checks import check_events, merge_events
from app.services.careers.feed import (
    MANUAL_SOURCES,
    SOURCES,
    adzuna_refreshes_today,
    claim_refresh,
    degree_label,
    degree_key,
    mark_failed,
    mark_running,
    read_feed,
    save_refresh,
    source_state,
    sydney_today,
)
from app.services.careers.relevance import keep_relevant
from app.services.careers.top_picks import fetch_top_picks
from app.services.careers.web_search import fetch_web_events

logger = logging.getLogger(__name__)


def entry_roles(roadmap: Dict[str, Any]) -> list:
    payload = roadmap.get("payload") or {}
    return ((payload.get("career_pathways") or {}).get("entry_level") or {}).get("roles") or []


def feed_response(roadmap: Dict[str, Any]) -> Dict[str, Any]:
    key = degree_key(roadmap)
    rows = read_feed(key)
    today = sydney_today()
    return {"degree_key": key, "sources": [source_state(source, rows.get(source), today) for source in SOURCES]}


async def fetch_listings(source: str, roadmap: Dict[str, Any], today, previous: list) -> list:
    roles = entry_roles(roadmap)
    program_name = await asyncio.to_thread(degree_label, roadmap)
    if source in MANUAL_SOURCES:
        return await fetch_top_picks(source, program_name, roles, today)
    if source == "adzuna":
        refreshes = await asyncio.to_thread(adzuna_refreshes_today, today)
        return await keep_relevant(await fetch_adzuna_listings(roles, refreshes), program_name, roles)
    events = await keep_relevant(await fetch_web_events(program_name, roles, today), program_name, roles)
    return merge_events(await check_events(events, today), previous, today)


async def run_refresh(roadmap: Dict[str, Any], source: str, key: str, today) -> None:
    try:
        previous = ((await asyncio.to_thread(read_feed, key)).get(source) or {}).get("items") or []
        items = await fetch_listings(source, roadmap, today, previous)
        await asyncio.to_thread(save_refresh, key, source, items, today)
    except Exception as e:
        logger.exception(f"[careers_feed] {source} refresh failed for {key}")
        await asyncio.to_thread(mark_failed, key, source, f"{type(e).__name__}: {e}")


async def refresh_source(roadmap: Dict[str, Any], source: str) -> Dict[str, Any]:
    key = degree_key(roadmap)
    today = sydney_today()
    existing = (await asyncio.to_thread(read_feed, key)).get(source) or {}
    already_made = source in MANUAL_SOURCES and bool(existing.get("refreshed_at"))
    if not already_made and await asyncio.to_thread(claim_refresh, key, source, today):
        await run_refresh(roadmap, source, key, today)
    rows = await asyncio.to_thread(read_feed, key)
    return source_state(source, rows.get(source), today)


async def force_refresh(roadmap: Dict[str, Any], source: str) -> Dict[str, Any]:
    key = degree_key(roadmap)
    today = sydney_today()
    await asyncio.to_thread(mark_running, key, source)
    await run_refresh(roadmap, source, key, today)
    rows = await asyncio.to_thread(read_feed, key)
    return source_state(source, rows.get(source), today)
