import asyncio
import os
import re
from typing import Any, Dict, List

import httpx

from app.services.roadmap.job_ads import is_early_career

API = "https://api.adzuna.com/v1/api/jobs/au/search/1"
MAX_ROLES = 4
RESULTS_PER_SEARCH = 20
MAX_DAYS_OLD = 30
CALLS_PER_REFRESH = MAX_ROLES * 2 + 2
DAILY_CALL_BUDGET = 240
PAUSE_SECONDS = 1.2
GENERIC_WORDS = {"engineer", "engineering", "support", "analyst", "graduate", "junior", "officer", "assistant", "specialist", "consultant", "technician"}
INTERNSHIP_TITLE = re.compile(r"\b(intern|internship|vacation|vacationer|cadet|cadetship)\b", re.I)


class AdzunaUnavailable(Exception):
    """Adzuna can't be called right now (no credentials, daily budget used, or refused)."""


def role_searches(roles: List[Dict[str, Any]]) -> List[str]:
    words = []
    for role in roles or []:
        search = (role.get("ad_search") or "").strip()
        if search and search not in words:
            words.append(search)
    return words[:MAX_ROLES]


def listing(ad: Dict[str, Any], role: str) -> Dict[str, Any]:
    title = ad.get("title") or ""
    return {
        "id": f"adzuna-{ad['id']}",
        "title": title,
        "organisation": (ad.get("company") or {}).get("display_name") or "",
        "location": (ad.get("location") or {}).get("display_name") or "",
        "url": ad.get("redirect_url"),
        "source_site": "Adzuna",
        "posted_at": ad.get("created"),
        "date_label": "",
        "summary": "",
        "category": "Internship" if INTERNSHIP_TITLE.search(title) else "Graduate role",
        "kind": "internship" if INTERNSHIP_TITLE.search(title) else "job",
        "role": role,
    }


async def search(client: httpx.AsyncClient, credentials: Dict[str, str], **query) -> List[Dict[str, Any]]:
    params = {
        **credentials,
        **query,
        "where": "NSW",
        "max_days_old": MAX_DAYS_OLD,
        "results_per_page": RESULTS_PER_SEARCH,
        "sort_by": "date",
        "content-type": "application/json",
    }
    for _ in range(2):
        await asyncio.sleep(PAUSE_SECONDS)
        response = await client.get(API, params=params)
        if response.status_code not in (429, 503):
            break
        await asyncio.sleep(PAUSE_SECONDS * 2)
    if response.status_code in (429, 503):
        raise AdzunaUnavailable(f"Adzuna answered HTTP {response.status_code}")
    response.raise_for_status()
    return [ad for ad in response.json().get("results") or [] if ad.get("id") and ad.get("redirect_url")]


async def role_ads(client: httpx.AsyncClient, credentials: Dict[str, str], words: str) -> List[Dict[str, Any]]:
    ads = await search(client, credentials, title_only=f"graduate {words}")
    if not ads:
        ads = [ad for ad in await search(client, credentials, title_only=words) if is_early_career(ad.get("title"))]
    return [listing(ad, words) for ad in ads]


async def internship_ads(client: httpx.AsyncClient, credentials: Dict[str, str], searches: List[str]) -> List[Dict[str, Any]]:
    words = list(dict.fromkeys(w for s in searches for w in s.split()))
    field_words = " ".join([w for w in words if w not in GENERIC_WORDS] or words)
    ads = await search(client, credentials, title_only="intern", what_or=field_words)
    ads += await search(client, credentials, title_only="internship", what_or=field_words)
    return [listing(ad, "internship") for ad in ads if INTERNSHIP_TITLE.search(ad.get("title") or "")]


def unique(listings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen, kept = set(), []
    for item in listings:
        key = (item["title"].strip().lower(), item["organisation"].strip().lower())
        if key not in seen:
            seen.add(key)
            kept.append(item)
    return kept


async def fetch_adzuna_listings(roles: List[Dict[str, Any]], refreshes_today: int) -> List[Dict[str, Any]]:
    credentials = {"app_id": os.environ.get("ADZUNA_APP_ID"), "app_key": os.environ.get("ADZUNA_APP_KEY")}
    if not all(credentials.values()):
        raise AdzunaUnavailable("ADZUNA_APP_ID and ADZUNA_APP_KEY are not set")
    if (refreshes_today + 1) * CALLS_PER_REFRESH > DAILY_CALL_BUDGET:
        raise AdzunaUnavailable("Adzuna's daily call budget is used up")
    searches = role_searches(roles)
    if not searches:
        return []
    listings = []
    async with httpx.AsyncClient(timeout=20) as client:
        for words in searches:
            listings += await role_ads(client, credentials, words)
        listings += await internship_ads(client, credentials, searches)
    listings = unique(listings)
    return sorted(listings, key=lambda item: item.get("posted_at") or "", reverse=True)
