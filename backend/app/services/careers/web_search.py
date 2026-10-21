import logging
import re
from datetime import date
from typing import Any, Dict, List
from urllib.parse import urlsplit

from app.llm.openai_client import ask_gpt_web_search
from app.models.careers import WebListings

logger = logging.getLogger(__name__)

MODEL = "gpt-5.4-mini"
MAX_LISTINGS = 10
HOST_PREFIX = re.compile(r"^(www|au|m)\.")
SEARCH_PAGE = re.compile(r"(/jobs/search|/jobs\?|-jobs/?$|-jobs/in-|/search\b|[?&](q|keywords|query)=)", re.I)

NETWORKING_TASK = (
    "Find upcoming events in the next 8 weeks where this student could meet people who work in their field.\n"
    "Kinds of event: career fairs (including UNSW Careers events), industry nights, professional body events (for example "
    "Engineers Australia, the Australian Computer Society, CPA Australia or Law Society events, whichever fit this field), "
    "meetups, hackathons, workshops, and conferences with student tickets.\n"
    "Where to look: UNSW and UNSW society event pages, professional bodies' event calendars, Eventbrite, Meetup and Humanitix.\n"
    "Location: in person in Sydney, or online events run in Australia.\n"
    "Only include events whose date is after today. Leave out events that are sold out or members-only with no student access.\n"
    "Fields: title is the event name; organisation is who runs it; location is the venue and suburb, or 'Online'; url of the "
    "event's own page; source_site such as 'Eventbrite', 'Meetup' or the organiser's name; date_label is the date and start time "
    "like 'Thu 6 Nov, 6pm'; category 'Career fair', 'Industry night', 'Meetup', 'Workshop', 'Hackathon' or 'Conference'; "
    "summary in one short sentence, mentioning if it is free or has a student price."
)


def roles_line(roles: List[Dict[str, Any]]) -> str:
    titles = [role.get("title") for role in roles or [] if role.get("title")]
    return ", ".join(titles) if titles else "graduate roles in this field"


def search_prompt(program_name: str, roles: List[Dict[str, Any]], today: date) -> str:
    return (
        f"Today is {today.strftime('%A %d %B %Y')} in Sydney, Australia.\n"
        f"A UNSW student is studying {program_name or 'a UNSW degree'}. Their degree leads to entry-level roles such as: "
        f"{roles_line(roles)}.\n\n"
        f"{NETWORKING_TASK}\n\n"
        f"Return up to {MAX_LISTINGS} results, best matches first. Every result must come from a page you found in your search. "
        "Write every date_label as a calendar date with day and month, for example 'Thu 6 Nov, 6pm'. If you are unsure an event "
        "is still on, leave it out. If you find nothing suitable, return an empty list. Never make up an event, organisation, URL "
        "or date."
    )


def page_key(url: str) -> str:
    parts = urlsplit(url or "")
    return f"{HOST_PREFIX.sub('', (parts.hostname or '').lower())}{parts.path.rstrip('/')}"


def keep_listing(url: str, searched_pages: set) -> bool:
    parts = urlsplit(url or "")
    return parts.scheme in ("http", "https") and page_key(url) in searched_pages and not SEARCH_PAGE.search(url)


async def fetch_web_events(program_name: str, roles: List[Dict[str, Any]], today: date) -> List[Dict[str, Any]]:
    result, sources = await ask_gpt_web_search(
        search_prompt(program_name, roles, today), WebListings, None,
        search_context_size="high", max_tokens=4000, model=MODEL, timeout=100,
    )
    searched_pages = {page_key(url) for url in sources}
    kept, seen = [], set()
    for item in result.listings:
        key = page_key(item.url)
        if key in seen or not keep_listing(item.url, searched_pages):
            continue
        seen.add(key)
        kept.append({"id": f"ai_networking-{key}", **item.model_dump(), "posted_at": None, "kind": "event"})
    logger.info(f"[careers_feed] ai_networking: kept {len(kept)} of {len(result.listings)} events found on searched pages")
    return kept[:MAX_LISTINGS]
