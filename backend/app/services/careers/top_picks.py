import asyncio
import json
import logging
import re
from datetime import date
from typing import Any, Dict, List

import httpx

from app.llm.claude_client import ask_claude_web_search
from app.services.careers.event_checks import page_is_live
from app.services.careers.web_search import keep_listing, page_key

logger = logging.getLogger(__name__)

SEARCH_MODEL = "claude-opus-5-5"
SEARCH_EFFORT = "low"
MAX_PICKS = 4
MAX_SEARCHES = 5
LINK_CHECK_SECONDS = 10

KIND_TEXT = {
    "ai_jobs": "graduate or junior jobs. Leave out internships, vacation programs and senior roles",
    "ai_internships": "internships, vacation programs or cadetships only. Leave out graduate, permanent and senior roles",
}
KINDS = {"ai_jobs": "job", "ai_internships": "internship"}


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")


def search_prompt(source: str, degree: str, roles: List[Dict[str, Any]], today: date) -> str:
    role_titles = ", ".join(role.get("title") for role in roles or [] if role.get("title")) or "graduate roles in this field"
    return (
        f"Today is {today.strftime('%A %d %B %Y')} in Sydney, Australia.\n"
        f"A UNSW student is studying {degree}. Their degree leads to roles such as: {role_titles}.\n\n"
        f"Search the web for {KIND_TEXT[source]}, open now anywhere in Australia, that fit this student.\n"
        "Look widely: employers' own careers pages, GradConnection, Prosple, LinkedIn, Seek and other job boards. "
        f"Stop searching as soon as you have the best {MAX_PICKS} results, and return them best first. Each must be one specific job with its own page, not a search or category page. "
        "Every result must come from a page you found in your search. Only include a job if its page says it is based in Australia, and "
        "never write Australia as a guess for the location. Leave out anything closed or past its closing date. If you find "
        "nothing suitable, return an empty list. Never make up a job, employer or URL.\n"
        'Reply with only a JSON array of objects with the keys "title", "organisation" (the employer), "location" (the city), "url" (the '
        'job\'s own page), "source_site" (such as "GradConnection" or the employer\'s name) and "date_label" (the closing or posting date as '
        'shown, or an empty string).'
    )


def parse_listings(text: str) -> List[Dict[str, Any]]:
    match = re.search(r"\[.*\]", text or "", re.S)
    if not match:
        return []
    rows = json.loads(match.group(0))
    return [row for row in rows if isinstance(row, dict) and row.get("title") and row.get("url")]


async def fetch_top_picks(source: str, degree: str, roles: List[Dict[str, Any]], today: date) -> List[Dict[str, Any]]:
    text, sources = await ask_claude_web_search(search_prompt(source, degree, roles, today), SEARCH_MODEL, effort=SEARCH_EFFORT, max_uses=MAX_SEARCHES)
    listings = parse_listings(text)
    searched_pages = {page_key(url) for url in sources}
    picks, seen = [], set()
    for item in listings:
        key = page_key(item["url"])
        if key in seen or not keep_listing(item["url"], searched_pages):
            continue
        seen.add(key)
        picks.append({
            "id": f"{source}-{slug(item['url'])[:120]}",
            "title": item["title"],
            "organisation": item.get("organisation") or "",
            "location": item.get("location") or "",
            "date_label": item.get("date_label") or "",
            "url": item["url"],
            "source_site": item.get("source_site") or "",
            "summary": "",
            "category": "",
            "posted_at": None,
            "kind": KINDS[source],
        })
    async with httpx.AsyncClient(follow_redirects=True, timeout=LINK_CHECK_SECONDS, headers={"User-Agent": "Mozilla/5.0"}) as client:
        live = await asyncio.gather(*(page_is_live(client, pick["url"]) for pick in picks))
    picks = [pick for pick, is_live in zip(picks, live) if is_live]
    logger.info(f"[careers_feed] {source}: kept {len(picks)} of {len(listings)} listings")
    if not picks:
        raise ValueError("The web search found no listings")
    return picks[:MAX_PICKS]
