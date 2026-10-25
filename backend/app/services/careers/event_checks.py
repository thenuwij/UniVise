import asyncio
import logging
import re
from datetime import date
from typing import Any, Dict, List
from urllib.parse import unquote, urlsplit

import httpx

from app.services.careers.web_search import page_key

logger = logging.getLogger(__name__)

MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36",
    "Accept-Language": "en-AU",
}
ENDED = re.compile(r"event has ended|this event has passed|sales ended|event (is )?over|past event|registration (is )?closed", re.I)
LIST_QUERY = re.compile(r"[?&](event|q|keywords|query|page)(\[\d*\])?=", re.I)
LIST_PATH = re.compile(r"/(events|news-events|events-webinars-and-courses|calendar|find|search)/?$", re.I)


def event_date(date_label: str, today: date) -> date | None:
    match = re.search(r"(\d{1,2})\s+([A-Za-z]{3})[a-z]*(?:[,\s]+(20\d{2}))?", date_label or "", re.I)
    if not match or match.group(2).lower() not in MONTHS:
        return None
    month = MONTHS.index(match.group(2).lower()) + 1
    year = int(match.group(3)) if match.group(3) else today.year if month >= today.month else today.year + 1
    try:
        return date(year, month, int(match.group(1)))
    except ValueError:
        return None


def is_list_page(url: str) -> bool:
    return bool(LIST_QUERY.search(unquote(url or "")) or LIST_PATH.search(urlsplit(url or "").path))


def upcoming(item: Dict[str, Any], today: date) -> bool:
    try:
        when = date.fromisoformat(item["event_date"]) if item.get("event_date") else event_date(item.get("date_label"), today)
    except (ValueError, TypeError):
        return False
    return when is not None and when > today


async def page_is_live(client: httpx.AsyncClient, url: str) -> bool:
    try:
        response = await client.get(url)
    except httpx.HTTPError:
        return False
    if response.status_code == 403:
        return True
    return response.status_code == 200 and not ENDED.search(response.text)


def as_calendar(item: Dict[str, Any]) -> Dict[str, Any]:
    return {**item, "kind": "calendar", "date_label": "", "id": f"calendar-{page_key(item.get('url'))}"}


async def check_events(items: List[Dict[str, Any]], today: date) -> List[Dict[str, Any]]:
    events = [
        {**item, "event_date": item.get("event_date") or event_date(item.get("date_label"), today).isoformat()}
        for item in items if not is_list_page(item.get("url")) and upcoming(item, today)
    ]
    calendars = [as_calendar(item) for item in items if is_list_page(item.get("url"))]
    candidates = events + calendars
    async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=HEADERS) as client:
        live = await asyncio.gather(*(page_is_live(client, item["url"]) for item in candidates))
    kept = [item for item, ok in zip(candidates, live) if ok]
    logger.info(f"[careers_feed] event checks kept {len(kept)} of {len(items)} events and calendars")
    return kept


def still_useful(item: Dict[str, Any], today: date) -> bool:
    if item.get("kind") == "calendar" or is_list_page(item.get("url")):
        return True
    return upcoming(item, today)


def merge_events(fresh: List[Dict[str, Any]], previous: List[Dict[str, Any]], today: date) -> List[Dict[str, Any]]:
    carried = [as_calendar(p) if is_list_page(p.get("url")) else p for p in previous if still_useful(p, today)]
    merged, seen = [], set()
    for item in fresh + carried:
        key = page_key(item.get("url"))
        if key not in seen:
            seen.add(key)
            merged.append(item)
    events = sorted((i for i in merged if i.get("kind") != "calendar"), key=lambda i: event_date(i.get("date_label"), today) or date.max)
    return events + [i for i in merged if i.get("kind") == "calendar"]
