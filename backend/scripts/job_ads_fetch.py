"""Fetch current graduate job ads from Adzuna for the Careers step.

Collects the ad search words of every entry role in the current roadmap cache,
most used first. Each search looks for ad titles with "graduate" and those
words; a search that finds nothing is retried with the words alone, keeping
only early-career titles. Calls stop at the cap to stay inside Adzuna's daily
limit.

Run from the backend folder:
    python -m scripts.job_ads_fetch plan
    python -m scripts.job_ads_fetch dry-run --limit 10
    python -m scripts.job_ads_fetch apply

`plan` lists the searches without calling Adzuna. `dry-run` searches and
prints the ads without writing. `apply` replaces the stored ads of every
search that finished, then deletes ads posted more than 30 days ago. When the
cap leaves room for only some fallback searches, the starting point moves each
week so every empty search gets its fallback in turn; a search still waiting
for its fallback keeps its stored ads.
"""
import argparse
import os
import sys
import time
from collections import Counter
from datetime import datetime, timedelta, timezone

import httpx

from app.core.database import supabase
from app.services.roadmap.cache import PROMPT_VERSION
from app.services.roadmap.job_ads import is_early_career

API = "https://api.adzuna.com/v1/api/jobs/au/search/1"
CALL_CAP = 240
PAUSE_SECONDS = 2.5
RESULTS_PER_SEARCH = 20
ADS_PER_SEARCH = 10
MAX_DAYS_OLD = 30
WRITE_BATCH = 200


def count_searches(entry_stages: list) -> list:
    counts = Counter()
    for stage in entry_stages:
        words = {role.get("ad_search") for role in (stage or {}).get("roles", []) if role.get("ad_search")}
        counts.update(words)
    return [words for words, _ in sorted(counts.items(), key=lambda item: (-item[1], item[0]))]


def load_searches() -> list:
    rows = (
        supabase.from_("roadmap_cache")
        .select("payload->career_pathways->entry_level")
        .eq("prompt_version", PROMPT_VERSION)
        .execute()
        .data
        or []
    )
    return count_searches([row.get("entry_level") for row in rows])


def ad_row(words: str, ad: dict) -> dict:
    return {
        "search_words": words,
        "ad_id": str(ad["id"]),
        "title": ad.get("title") or "",
        "company": (ad.get("company") or {}).get("display_name"),
        "location": (ad.get("location") or {}).get("display_name"),
        "posted_at": ad.get("created"),
        "url": ad.get("redirect_url"),
    }


def unique_ads(ads: list) -> list:
    seen, kept = set(), []
    for ad in ads:
        key = ((ad.get("title") or "").strip().lower(), ((ad.get("company") or {}).get("display_name") or "").strip().lower())
        if ad.get("id") and ad.get("redirect_url") and key not in seen:
            seen.add(key)
            kept.append(ad)
    return kept[:ADS_PER_SEARCH]


def rotate(items: list, week: int, size: int) -> list:
    if not items or size <= 0:
        return items
    start = (week * size) % len(items)
    return items[start:] + items[:start]


def fetch_ads(searches: list, search, cap: int = CALL_CAP, week: int | None = None) -> tuple:
    found, calls = {}, 0
    for words in searches:
        if calls >= cap:
            break
        found[words] = search(f"graduate {words}")
        calls += 1
    empty = [w for w, ads in found.items() if not ads]
    week = datetime.now(timezone.utc).isocalendar().week if week is None else week
    fallback = rotate(empty, week, cap - calls)[: max(cap - calls, 0)]
    for words in fallback:
        found[words] = [ad for ad in search(words) if is_early_career(ad.get("title"))]
        calls += 1
    searched = {words: ads for words, ads in found.items() if ads or words in fallback}
    return {words: unique_ads(ads) for words, ads in searched.items()}, calls


def adzuna_search(client: httpx.Client, credentials: dict):
    def search(title_words: str) -> list:
        params = {
            **credentials,
            "title_only": title_words,
            "where": "NSW",
            "max_days_old": MAX_DAYS_OLD,
            "results_per_page": RESULTS_PER_SEARCH,
            "sort_by": "date",
            "content-type": "application/json",
        }
        for _ in range(2):
            time.sleep(PAUSE_SECONDS)
            response = client.get(API, params=params)
            if response.status_code != 503:
                break
        response.raise_for_status()
        return response.json().get("results") or []

    return search


def write_ads(found: dict) -> None:
    searched = list(found)
    for start in range(0, len(searched), WRITE_BATCH):
        supabase.from_("job_ads").delete().in_("search_words", searched[start:start + WRITE_BATCH]).execute()
    rows = [ad_row(words, ad) for words, ads in found.items() for ad in ads]
    for start in range(0, len(rows), WRITE_BATCH):
        supabase.from_("job_ads").insert(rows[start:start + WRITE_BATCH]).execute()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=MAX_DAYS_OLD)).isoformat()
    supabase.from_("job_ads").delete().lt("posted_at", cutoff).execute()


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=["plan", "dry-run", "apply"])
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    searches = load_searches()[: args.limit]
    print(f"{len(searches)} searches from prompt version {PROMPT_VERSION} roadmaps")
    if args.command == "plan":
        for words in searches:
            print(f"- {words}")
        return

    credentials = {"app_id": os.environ.get("ADZUNA_APP_ID"), "app_key": os.environ.get("ADZUNA_APP_KEY")}
    if not all(credentials.values()):
        sys.exit("ADZUNA_APP_ID and ADZUNA_APP_KEY must be set")
    with httpx.Client(timeout=30) as client:
        found, calls = fetch_ads(searches, adzuna_search(client, credentials))

    with_ads = sum(1 for ads in found.values() if ads)
    print(f"{calls} Adzuna calls, {with_ads} of {len(found)} searches found ads, {sum(map(len, found.values()))} ads")
    if args.command == "dry-run":
        for words, ads in found.items():
            print(f"\n{words}: {len(ads)}")
            for ad in ads[:3]:
                row = ad_row(words, ad)
                print(f"  - {row['title']} | {row['company']} | {row['location']} | {(row['posted_at'] or '')[:10]}")
        return

    write_ads(found)
    print("Stored")


if __name__ == "__main__":
    main()
