"""Tests for deciding what the roadmap cache fill generates and deletes.

Pure logic only: given current target keys and existing cache rows, check
which roadmaps are missing or stale and which rows pruning may delete.
"""
from datetime import datetime, timedelta, timezone

from scripts import roadmap_cache_fill as fill

NOW = datetime(2026, 10, 3, tzinfo=timezone.utc)
VERSION = fill.PROMPT_VERSION


def key(code, ids=()):
    return {"cache_key": f"{code}|{','.join(ids)}|v{VERSION}|hash", "degree_code": code, "specialisation_ids": list(ids)}


def row(cache_key, days_since_refresh=1, days_since_use=1, version=VERSION, code="3707", ids=()):
    return {
        "cache_key": cache_key,
        "degree_code": code,
        "specialisation_ids": list(ids),
        "prompt_version": version,
        "refreshed_at": (NOW - timedelta(days=days_since_refresh)).isoformat(),
        "last_used_at": (NOW - timedelta(days=days_since_use)).isoformat(),
    }


def test_missing_and_stale_roadmaps_are_found():
    contexts = [({}, key("3707")), ({}, key("3502")), ({}, key("3778"))]
    rows = [row(key("3707")["cache_key"], days_since_refresh=40), row(key("3502")["cache_key"], days_since_refresh=5)]

    missing, stale, _ = fill.classify(contexts, rows, refresh_days=30, now=NOW)

    assert [k["degree_code"] for _, k in missing] == ["3778"]
    assert [k["degree_code"] for _, k in stale] == ["3707"]


def test_without_refresh_days_nothing_is_stale():
    contexts = [({}, key("3707"))]
    rows = [row(key("3707")["cache_key"], days_since_refresh=400)]

    _, stale, _ = fill.classify(contexts, rows, refresh_days=None, now=NOW)

    assert stale == []


def test_prune_keeps_current_targets_and_drops_old_or_unused_rows():
    contexts = [({}, key("3707"))]
    rows = [
        row(key("3707")["cache_key"], days_since_use=200),
        row("3707||v1|old", version=1),
        row("3502|a|v3|old-data", days_since_use=120, code="3502", ids=("a",)),
        row("3502|a|v3|recent", days_since_use=10, code="3502", ids=("a",)),
    ]

    _, _, prunable = fill.classify(contexts, rows, refresh_days=None, now=NOW)

    assert prunable == ["3707||v1|old", "3502|a|v3|old-data"]
