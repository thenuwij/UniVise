import json
import logging
import re
from datetime import date
from typing import Any, Dict, List
from urllib.parse import urljoin, urlsplit

from app.llm.claude_client import ask_claude_text, read_web_pages

logger = logging.getLogger(__name__)

READER_MODEL = "claude-haiku-5-5"
JUDGE_MODEL = "claude-opus-5-5"
PAGES_PER_LIST = 3
CARDS_PER_PAGE = 15
MAX_PICKS = 12
SEEK = "https://www.seek.com.au"

KIND_TEXT = {
    "ai_jobs": "graduate or junior jobs. Leave out internships, vacation programs and senior roles",
    "ai_internships": "internships, vacation programs or cadetships only. Leave out graduate, permanent and senior roles",
}
KINDS = {"ai_jobs": "job", "ai_internships": "internship"}


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")


def field_slug(name: str) -> str:
    field = re.split(r"\s+-\s+", (name or "").split("/")[0])[0]
    inner = re.search(r"\(([^)]+)\)", field)
    if inner and "honours" not in inner.group(1).lower() and re.match(r"\s*(bachelor|master|doctor) of", field, re.I):
        field = inner.group(1)
    field = re.sub(r"\([^)]*\)", "", field)
    field = re.sub(r"^\s*(bachelor|master|doctor) of\s+", "", field, flags=re.I)
    return slug(field.split(",")[0])


def role_words(roles: List[Dict[str, Any]]) -> List[str]:
    words = []
    for role in roles or []:
        search = (role.get("ad_search") or "").strip()
        if search and search not in words:
            words.append(search)
    return words


def listing_pages(source: str, field_name: str, roles: List[Dict[str, Any]]) -> List[str]:
    words = role_words(roles)
    if source == "ai_jobs":
        pages = [f"{SEEK}/{slug(f'graduate {w}')}-jobs/in-All-Sydney-NSW" for w in words]
    else:
        field = field_slug(field_name)
        pages = [f"{SEEK}/{field}-internship-jobs/in-All-Sydney-NSW"] if field else []
        pages += [f"{SEEK}/{slug(f'{w} intern')}-jobs/in-All-Sydney-NSW" for w in words]
    return list(dict.fromkeys(pages))[:PAGES_PER_LIST]


def reader_prompt(pages: List[str]) -> str:
    listed = "\n".join(f"{i}. {url}" for i, url in enumerate(pages, start=1))
    return (
        f"Open each of these job site pages with web_fetch, one fetch per page:\n{listed}\n\n"
        f"From each page, copy up to {CARDS_PER_PAGE} job listing cards. Copy, do not judge or filter.\n"
        'Write one line per card, fields separated by " | ", in this order:\n'
        f"page number (1-{len(pages)}) | title | organisation | location | date (posting or closing info as shown, or -) | "
        "link (exactly as it appears, even if it starts with /)\n"
        "Write nothing else: no headings, no commentary."
    )


def parse_cards(text: str, pages: List[str]) -> List[Dict[str, Any]]:
    cards, seen = [], set()
    for line in (text or "").splitlines():
        parts = [part.strip() for part in line.split(" | ")]
        if len(parts) < 6 or not parts[0].isdigit() or not parts[1]:
            continue
        page = pages[min(max(int(parts[0]), 1), len(pages)) - 1]
        url = urljoin(page, parts[5])
        key = (parts[1].lower(), parts[2].lower())
        if urlsplit(url).scheme not in ("http", "https") or key in seen:
            continue
        seen.add(key)
        cards.append({
            "title": parts[1],
            "organisation": parts[2],
            "location": parts[3],
            "date_label": "" if parts[4] in ("-", "") else parts[4],
            "url": url,
            "source_site": "SEEK" if "seek.com" in url else urlsplit(url).hostname,
        })
    return cards


def judge_prompt(source: str, degree: str, roles: List[Dict[str, Any]], cards: List[Dict[str, Any]], today: date) -> str:
    role_titles = ", ".join(role.get("title") for role in roles or [] if role.get("title")) or "graduate roles in this field"
    numbered = "\n".join(
        f"{i}. {c['title']} | {c['organisation']} | {c['location']} | {c['date_label'] or 'no date shown'}" for i, c in enumerate(cards)
    )
    return (
        f"Today is {today.strftime('%A %d %B %Y')} in Sydney, Australia.\n"
        f"A UNSW student is studying {degree}. Their degree leads to entry-level roles such as: {role_titles}.\n\n"
        f"Below are listings copied from job sites today. Choose up to {MAX_PICKS} {KIND_TEXT[source]}.\n"
        "Choose only listings that fit this student's field and are open now. Skip anything closed or expired, posted more than "
        "30 days ago, or outside this field. Include at most 2 from the same employer, and skip duplicates.\n\n"
        f"{numbered}\n\n"
        "Answer with only a JSON array of the chosen numbers, best first."
    )


def parse_picks(text: str, count: int) -> List[int]:
    match = re.search(r"\[[\d,\s]*\]", text or "")
    if not match:
        return []
    picks = json.loads(match.group(0))
    return list(dict.fromkeys(i for i in picks if isinstance(i, int) and 0 <= i < count))


async def fetch_top_picks(source: str, degree: str, field_name: str, roles: List[Dict[str, Any]], today: date) -> List[Dict[str, Any]]:
    pages = listing_pages(source, field_name, roles)
    if not pages:
        return []
    cards = parse_cards(await read_web_pages(reader_prompt(pages), len(pages), READER_MODEL), pages)
    if not cards:
        raise ValueError("No listings could be read from the job site pages")
    picks = parse_picks(await ask_claude_text(judge_prompt(source, degree, roles, cards, today), JUDGE_MODEL), len(cards))
    logger.info(f"[careers_feed] {source}: picked {len(picks)} of {len(cards)} listings from {len(pages)} pages")
    return [
        {**cards[i], "id": f"{source}-{slug(cards[i]['url'])[:120]}", "summary": "", "category": "", "posted_at": None, "kind": KINDS[source]}
        for i in picks[:MAX_PICKS]
    ]
