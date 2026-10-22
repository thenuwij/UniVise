from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List
from zoneinfo import ZoneInfo

from app.core.database import supabase

SOURCES = ("adzuna", "ai_jobs", "ai_internships", "ai_networking")
MANUAL_SOURCES = ("ai_jobs", "ai_internships")
SYDNEY = ZoneInfo("Australia/Sydney")
RUNNING_FOR = timedelta(minutes=3)
RETRY_FAILED_AFTER = timedelta(hours=1)


def sydney_today() -> date:
    return datetime.now(SYDNEY).date()


def degree_key(roadmap: Dict[str, Any]) -> str:
    specialisation_ids = sorted((roadmap.get("payload") or {}).get("specialisation_ids") or [])
    return f"{roadmap.get('degree_code')}|{','.join(specialisation_ids)}"


def load_roadmap(roadmap_id: str, user_id: str) -> Dict[str, Any] | None:
    rows = (
        supabase.table("unsw_roadmap")
        .select("id, degree_code, program_name, payload")
        .eq("id", roadmap_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


def specialisation_names(roadmap: Dict[str, Any]) -> List[str]:
    ids = (roadmap.get("payload") or {}).get("specialisation_ids") or []
    if not ids:
        return []
    rows = supabase.table("unsw_specialisations").select("major_name").in_("id", ids).execute().data or []
    return [row["major_name"] for row in rows if row.get("major_name")]


def degree_label(roadmap: Dict[str, Any], names: List[str] | None = None) -> str:
    program_name = roadmap.get("program_name") or "a UNSW degree"
    names = specialisation_names(roadmap) if names is None else names
    return f"{program_name} - {', '.join(names)}" if names else program_name


def read_feed(key: str) -> Dict[str, Dict[str, Any]]:
    rows = supabase.table("careers_feed").select("*").eq("degree_key", key).execute().data or []
    return {row["source"]: row for row in rows}


def parse_time(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def source_state(source: str, row: Dict[str, Any] | None, today: date) -> Dict[str, Any]:
    if not row:
        return {"source": source, "status": "never", "stale": True, "refreshed_at": None, "items": []}
    now = datetime.now(timezone.utc)
    claimed_at = parse_time(row.get("claimed_at"))
    failed_at = parse_time(row.get("failed_at"))
    running = row["status"] == "running" and claimed_at is not None and now - claimed_at < RUNNING_FOR
    done_today = row.get("refresh_day") == today.isoformat() or (source in MANUAL_SOURCES and bool(row.get("refreshed_at")))
    cooling = row["status"] == "failed" and failed_at is not None and now - failed_at < RETRY_FAILED_AFTER
    if running:
        status = "running"
    elif row["status"] == "failed":
        status = "failed"
    elif row.get("refreshed_at"):
        status = "done"
    else:
        status = "never"
    return {
        "source": source,
        "status": status,
        "stale": not done_today and not running and not cooling,
        "refreshed_at": row.get("refreshed_at"),
        "items": row.get("items") or [],
    }


def claim_refresh(key: str, source: str, today: date) -> bool:
    response = supabase.rpc(
        "claim_careers_refresh", {"p_degree_key": key, "p_source": source, "p_today": today.isoformat()}
    ).execute()
    return bool(response.data)


def save_refresh(key: str, source: str, items: list, today: date) -> None:
    supabase.table("careers_feed").update({
        "items": items,
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
        "refresh_day": today.isoformat(),
        "status": "idle",
        "failed_at": None,
        "error": None,
    }).eq("degree_key", key).eq("source", source).execute()


def mark_running(key: str, source: str) -> None:
    supabase.table("careers_feed").upsert(
        {"degree_key": key, "source": source, "status": "running", "claimed_at": datetime.now(timezone.utc).isoformat(), "error": None},
        on_conflict="degree_key,source",
    ).execute()


def owns_program(user_id: str, degree_code: str | None) -> bool:
    rows = (
        supabase.table("user_enrolled_program")
        .select("degree_code")
        .eq("user_id", user_id)
        .eq("degree_code", degree_code or "")
        .limit(1)
        .execute()
        .data
    )
    return bool(rows)


def saved_program_roadmaps() -> List[Dict[str, Any]]:
    programs = supabase.table("user_enrolled_program").select("user_id, degree_code").execute().data or []
    latest = {}
    for program in programs:
        rows = (
            supabase.table("unsw_roadmap")
            .select("id, degree_code, program_name, payload, created_at")
            .eq("user_id", program["user_id"])
            .eq("degree_code", program["degree_code"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
            .data
        )
        if rows:
            latest.setdefault(degree_key(rows[0]), rows[0])
    return list(latest.values())


def mark_failed(key: str, source: str, error: str) -> None:
    supabase.table("careers_feed").update({
        "status": "failed",
        "failed_at": datetime.now(timezone.utc).isoformat(),
        "error": error[:500],
    }).eq("degree_key", key).eq("source", source).execute()


def adzuna_refreshes_today(today: date) -> int:
    response = (
        supabase.table("careers_feed")
        .select("degree_key", count="exact")
        .eq("source", "adzuna")
        .eq("refresh_day", today.isoformat())
        .execute()
    )
    return response.count or 0
