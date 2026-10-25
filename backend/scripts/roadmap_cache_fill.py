"""Fill and refresh the shared roadmap cache.

Targets every offered program without a specialisation, plus every
specialisation combination a student used in the last 90 days.

Run from the backend folder:
    python -m scripts.roadmap_cache_fill plan
    python -m scripts.roadmap_cache_fill apply --limit 5
    python -m scripts.roadmap_cache_fill apply --refresh-days 30 --prune

`plan` only reads: it lists missing and stale roadmaps, how many students'
saved roadmaps each would update, and the rows --prune would delete. `apply`
generates the missing roadmaps (and the stale ones when --refresh-days is
given) and saves each one only when every section succeeded. Each saved cache
row is also copied into every student's saved roadmap for the same program,
specialisations and prompt version, so students see the refreshed content.
With --prune it also deletes rows from older prompt versions and rows nobody
used for 90 days, keeping every row a current target still needs.
"""
import argparse
import asyncio
import logging
import sys
import time
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.core.database import supabase
from app.services.roadmap.cache import (
    PROMPT_VERSION,
    matching_saved_roadmaps,
    roadmap_cache_key,
    update_saved_roadmaps,
    write_cached_roadmap,
)
from app.services.roadmap.industry import generate_industry_sections
from app.services.roadmap.unsw import build_unsw_payload, gather_unsw_context

UNUSED_DAYS = 90
DELETE_BATCH = 20


def parse_time(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def load_cache_rows():
    return (
        supabase.from_("roadmap_cache")
        .select("cache_key, degree_code, specialisation_ids, prompt_version, refreshed_at, last_used_at")
        .execute()
        .data
        or []
    )


def load_targets(rows, now):
    programs = (
        supabase.from_("unsw_degrees_final")
        .select("id, degree_code")
        .eq("is_offered", True)
        .order("degree_code")
        .execute()
        .data
        or []
    )
    ids_by_code = {p["degree_code"]: p["id"] for p in programs}
    targets = [(p["id"], p["degree_code"], ()) for p in programs]
    recent = now - timedelta(days=UNUSED_DAYS)
    combos = {
        (row["degree_code"], tuple(sorted(row["specialisation_ids"])))
        for row in rows
        if row["specialisation_ids"] and parse_time(row["last_used_at"]) >= recent and row["degree_code"] in ids_by_code
    }
    targets += [(ids_by_code[code], code, ids) for code, ids in sorted(combos)]
    return targets


async def build_contexts(targets):
    gate = asyncio.Semaphore(8)

    async def one(degree_id, specialisation_ids):
        async with gate:
            req = SimpleNamespace(degree_id=degree_id, uac_code=None, program_name=None)
            ctx = await gather_unsw_context(None, req, specialisation_ids=list(specialisation_ids))
            return ctx, roadmap_cache_key(ctx)

    return await asyncio.gather(*[one(degree_id, ids) for degree_id, _, ids in targets])


def classify(contexts, rows, refresh_days, now):
    rows_by_key = {row["cache_key"]: row for row in rows}
    missing, stale = [], []
    for ctx, key in contexts:
        if not key:
            continue
        row = rows_by_key.get(key["cache_key"])
        if not row:
            missing.append((ctx, key))
        elif refresh_days is not None and parse_time(row["refreshed_at"]) < now - timedelta(days=refresh_days):
            stale.append((ctx, key))
    needed = {key["cache_key"] for _, key in contexts if key}
    recent = now - timedelta(days=UNUSED_DAYS)
    prunable = [
        row["cache_key"]
        for row in rows
        if row["cache_key"] not in needed
        and (row["prompt_version"] != PROMPT_VERSION or parse_time(row["last_used_at"]) < recent)
    ]
    return missing, stale, prunable


def label(key):
    count = len(key["specialisation_ids"])
    return f"{key['degree_code']} ({count} specialisation{'s' if count != 1 else ''})" if count else f"{key['degree_code']} (base)"


async def generate(ctx, key):
    payload = build_unsw_payload(ctx)
    payload["specialisation_ids"] = ctx["specialisation_ids"]
    payload["cache_key"] = key
    sections, failed = await generate_industry_sections(ctx["degree_code"], ctx["program_name"], payload)
    if failed:
        return failed
    payload.update(sections)
    payload["industry_failed"] = []
    write_cached_roadmap(key, payload)
    return update_saved_roadmaps(key, payload)


async def generate_all(work, concurrency):
    gate = asyncio.Semaphore(concurrency)
    failures = 0

    async def one(ctx, key):
        nonlocal failures
        async with gate:
            started = time.time()
            try:
                result = await generate(ctx, key)
            except Exception as e:
                result = [f"error: {e}"]
            took = time.time() - started
            if isinstance(result, list):
                failures += 1
                print(f"FAILED  {label(key)}  {took:.0f}s  {', '.join(result)}", flush=True)
            else:
                print(f"saved   {label(key)}  {took:.0f}s  updated {result} saved roadmap{'s' if result != 1 else ''}", flush=True)

    await asyncio.gather(*[one(ctx, key) for ctx, key in work])
    return failures


def prune(keys):
    for start in range(0, len(keys), DELETE_BATCH):
        supabase.from_("roadmap_cache").delete().in_("cache_key", keys[start:start + DELETE_BATCH]).execute()


async def run(args):
    now = datetime.now(timezone.utc)
    rows = load_cache_rows()
    targets = load_targets(rows, now)
    contexts = await build_contexts(targets)
    missing, stale, prunable = classify(contexts, rows, args.refresh_days, now)
    work = (missing + stale)[: args.limit] if args.limit else missing + stale

    print(f"prompt version {PROMPT_VERSION}: {len(targets)} targets, {len(rows)} cached rows")
    print(f"missing {len(missing)}, stale {len(stale)}, to generate now {len(work)}")
    print(f"rows --prune would delete: {len(prunable)}")
    if args.command == "plan":
        for _, key in work:
            saved = len(matching_saved_roadmaps(key))
            print(f"  would generate {label(key)} and update {saved} saved roadmap{'s' if saved != 1 else ''}")
        return 0

    failures = await generate_all(work, args.concurrency)
    if args.prune and prunable:
        prune(prunable)
        print(f"deleted {len(prunable)} rows")
    print(f"done: {len(work) - failures} saved, {failures} failed")
    return 1 if failures else 0


def main():
    logging.basicConfig(level=logging.WARNING)
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=["plan", "apply"])
    parser.add_argument("--refresh-days", type=int, default=None)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--concurrency", type=int, default=3)
    parser.add_argument("--prune", action="store_true")
    sys.exit(asyncio.run(run(parser.parse_args())))


if __name__ == "__main__":
    main()
