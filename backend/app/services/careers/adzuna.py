import asyncio
import os
import re
from typing import Any, Dict, List

import httpx

from app.services.careers.search_words import is_early_career

API = "https://api.adzuna.com/v1/api/jobs/au/search/1"
MAX_ROLES = 4
RESULTS_PER_SEARCH = 50
EARLY_CAREER_WORDS = "graduate grad junior entry trainee associate assistant"
MAX_DAYS_OLD = 30
MAX_BROAD_SEARCHES = 2
MIN_JOBS_BEFORE_BROAD = 10
CALLS_PER_REFRESH = MAX_ROLES * 2 + 2 + MAX_BROAD_SEARCHES
DAILY_CALL_BUDGET = 240
PAUSE_SECONDS = 1.2
BROAD_ROLE_WORDS = ("engineer", "analyst", "consultant", "officer", "scientist", "developer", "accountant", "designer", "advisor", "planner")
BLOCKED_EMPLOYERS = ("study and work",)
COMPANY_SUFFIX = re.compile(r"\b(inc|incorporated|pty|ltd|limited|llc|corp|corporation|company|co|group|australia)\b\.?", re.I)
MAX_PER_EMPLOYER = 3
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
    ads += await search(client, credentials, title_only=words, what_or=EARLY_CAREER_WORDS)
    return [listing(ad, words) for ad in ads if is_early_career(ad.get("title"))]


async def internship_ads(client: httpx.AsyncClient, credentials: Dict[str, str], searches: List[str]) -> List[Dict[str, Any]]:
    words = list(dict.fromkeys(w for s in searches for w in s.split()))
    field_words = " ".join([w for w in words if w not in GENERIC_WORDS] or words)
    ads = await search(client, credentials, title_only="intern", what_or=field_words)
    ads += await search(client, credentials, title_only="internship", what_or=field_words)
    return [listing(ad, "internship") for ad in ads if INTERNSHIP_TITLE.search(ad.get("title") or "")]


def broad_searches(searches: List[str]) -> List[str]:
    last_words = [words.split()[-1] for words in searches if words.split()]
    return [f"graduate {word}" for word in BROAD_ROLE_WORDS if word in last_words][:MAX_BROAD_SEARCHES]


def employer_key(name: str) -> str:
    return " ".join(COMPANY_SUFFIX.sub(" ", name or "").lower().split())


def title_key(title: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", (title or "").lower()))


def unique(listings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen, per_employer, kept = set(), {}, []
    for item in listings:
        employer = employer_key(item["organisation"])
        key = (title_key(item["title"]), employer)
        count_key = (employer, item["kind"])
        if key in seen or any(name in employer for name in BLOCKED_EMPLOYERS):
            continue
        seen.add(key)
        if employer and per_employer.get(count_key, 0) >= MAX_PER_EMPLOYER:
            continue
        per_employer[count_key] = per_employer.get(count_key, 0) + 1
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
        if sum(item["kind"] == "job" for item in unique(listings)) < MIN_JOBS_BEFORE_BROAD:
            for words in broad_searches(searches):
                ads = await search(client, credentials, title_only=words)
                listings += [listing(ad, words) for ad in ads if is_early_career(ad.get("title"))]
        listings += await internship_ads(client, credentials, searches)
    return unique(sorted(listings, key=lambda item: item.get("posted_at") or "", reverse=True))
