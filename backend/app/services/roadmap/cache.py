import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from app.core.database import supabase

logger = logging.getLogger(__name__)

PROMPT_VERSION = 7

HASHED_CONTEXT = (
    "program_name",
    "uac_code",
    "faculty",
    "core_courses",
    "selected_major_name",
    "selected_major_courses",
    "selected_minor_name",
    "selected_minor_courses",
    "selected_honours_name",
    "selected_honours_courses",
    "program_courses",
    "societies",
)


def roadmap_cache_key(ctx: Dict[str, Any]) -> Dict[str, Any] | None:
    degree_code = ctx.get("degree_code")
    if not degree_code:
        return None
    inputs = {k: ctx.get(k) for k in HASHED_CONTEXT}
    inputs["prompt_version"] = PROMPT_VERSION
    input_hash = hashlib.sha256(json.dumps(inputs, sort_keys=True, default=str).encode()).hexdigest()
    specialisation_ids = list(ctx.get("specialisation_ids") or [])
    return {
        "cache_key": f"{degree_code}|{','.join(specialisation_ids)}|v{PROMPT_VERSION}|{input_hash}",
        "degree_code": degree_code,
        "specialisation_ids": specialisation_ids,
        "prompt_version": PROMPT_VERSION,
        "input_hash": input_hash,
    }


def read_cached_roadmap(key: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if not key:
        return None
    try:
        rows = (
            supabase.from_("roadmap_cache")
            .select("payload")
            .eq("cache_key", key["cache_key"])
            .limit(1)
            .execute()
            .data
        )
        if not rows:
            return None
        supabase.from_("roadmap_cache").update(
            {"last_used_at": datetime.now(timezone.utc).isoformat()}
        ).eq("cache_key", key["cache_key"]).execute()
        return rows[0]["payload"]
    except Exception as e:
        logger.warning(f"[roadmap_cache] read failed: {e}")
        return None


def write_cached_roadmap(key: Dict[str, Any] | None, payload: Dict[str, Any]) -> None:
    if not key:
        return
    now = datetime.now(timezone.utc).isoformat()
    try:
        supabase.from_("roadmap_cache").upsert(
            {**key, "payload": payload, "refreshed_at": now, "last_used_at": now},
            on_conflict="cache_key",
        ).execute()
    except Exception as e:
        logger.warning(f"[roadmap_cache] write failed: {e}")
