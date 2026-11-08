"""Demo accounts: a private, throwaway student for visitors who don't want to sign up.

Each visitor gets their own account, flagged with app_metadata.demo (students cannot
change app_metadata), set up as a Year 2 Computer Science (Artificial Intelligence)
student. The plan is copied from the shared roadmap cache, so starting a demo makes
no AI calls. Demo accounts are deleted after DEMO_LIFETIME, or when the visitor signs out.
"""

import asyncio
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import HTTPException

from app.core.database import supabase
from app.models.roadmap import RoadmapRequest
from app.services.roadmap.cache import read_cached_roadmap, roadmap_cache_key
from app.services.roadmap.context import build_payload, gather_context

logger = logging.getLogger(__name__)

DEMO_LIFETIME = timedelta(hours=24)
MAX_DEMOS_PER_HOUR = 60
MAX_DEMO_CHAT_MESSAGES = 20
DEMO_EMAIL_DOMAIN = "demo.uni-vise.com"

DEGREE_CODE = "3778"
MAJOR_ID = "05fd4460-fe4f-4612-b93e-4af8b8079218"  # Computer Science (Artificial Intelligence)
COMPLETED_COURSES = ["COMP1511", "COMP1521", "COMP1531", "COMP2521", "MATH1081", "MATH1131", "MATH1231"]
SURVEY = {
    "degree_stage": "Bachelor's Degree",
    "academic_year": "Year 2",
    "interest_areas": ["Tech, Data & Maths", "Business & Finance"],
    "hobbies": ["Technology & Coding", "Entrepreneurship"],
}


def is_demo(user) -> bool:
    return bool((getattr(user, "app_metadata", None) or {}).get("demo"))


def demo_accounts() -> List[Any]:
    users: List[Any] = []
    page = 1
    while True:
        batch = supabase.auth.admin.list_users(page=page, per_page=1000)
        users.extend(u for u in batch if is_demo(u))
        if len(batch) < 1000:
            return users
        page += 1


def created_at(user) -> datetime:
    value = user.created_at
    return value if isinstance(value, datetime) else datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def delete_expired(accounts: List[Any], now: datetime) -> List[Any]:
    kept = []
    for account in accounts:
        if now - created_at(account) > DEMO_LIFETIME:
            try:
                supabase.auth.admin.delete_user(account.id)
            except Exception:
                logger.exception(f"[demo] could not delete expired demo account {account.id}")
        else:
            kept.append(account)
    return kept


def create_account() -> Any:
    email = f"demo-{secrets.token_hex(8)}@{DEMO_EMAIL_DOMAIN}"
    response = supabase.auth.admin.create_user({
        "email": email,
        "password": secrets.token_urlsafe(32),
        "email_confirm": True,
        "app_metadata": {"demo": True},
        "user_metadata": {"first_name": "Demo", "last_name": "Student", "student_type": "university"},
    })
    return response.user


def degree() -> Dict[str, Any]:
    rows = (
        supabase.table("unsw_degrees_final")
        .select("id, degree_code, program_name")
        .eq("degree_code", DEGREE_CODE)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        raise RuntimeError(f"Demo degree {DEGREE_CODE} not found")
    return rows[0]


def course_rows(user_id: str) -> List[Dict[str, Any]]:
    courses = (
        supabase.table("unsw_courses").select("code, title, uoc").in_("code", COMPLETED_COURSES).execute().data or []
    )
    return [
        {
            "user_id": user_id,
            "course_code": course["code"],
            "course_name": course.get("title"),
            "uoc": int(course.get("uoc") or 6),
            "is_completed": True,
            "source_type": "program",
        }
        for course in courses
    ]


def save_student(user_id: str, program: Dict[str, Any]) -> None:
    supabase.table("student_uni_data").insert({"user_id": user_id, "degree_field": program["program_name"], **SURVEY}).execute()
    supabase.table("user_enrolled_program").insert({
        "user_id": user_id,
        "degree_code": program["degree_code"],
        "program_name": program["program_name"],
        "specialisation_codes": [],
        "specialisation_names": [],
    }).execute()
    supabase.table("user_specialisation_selections").insert(
        {"user_id": user_id, "degree_code": program["degree_code"], "major_id": MAJOR_ID}
    ).execute()
    rows = course_rows(user_id)
    if rows:
        supabase.table("user_completed_courses").insert(rows).execute()


async def save_plan(user_id: str, program: Dict[str, Any]) -> None:
    ctx = await gather_context(user_id, RoadmapRequest(degree_id=program["id"]))
    cache_key = roadmap_cache_key(ctx)
    payload = await asyncio.to_thread(read_cached_roadmap, cache_key)
    if not payload:
        # The careers and societies sections are then made on first view, as for any new plan.
        logger.warning("[demo] no cached plan for the demo degree, building the base plan")
        payload = build_payload(ctx)
    payload["specialisation_ids"] = ctx["specialisation_ids"]
    payload["cache_key"] = cache_key
    await asyncio.to_thread(
        lambda: supabase.table("unsw_roadmap").insert({
            "user_id": user_id,
            "degree_id": ctx.get("degree_id"),
            "degree_code": ctx.get("degree_code"),
            "uac_code": ctx.get("uac_code"),
            "program_name": ctx.get("program_name"),
            "mode": "unsw",
            "payload": payload,
        }).execute()
    )


def sign_in_token(email: str) -> str:
    link = supabase.auth.admin.generate_link({"type": "magiclink", "email": email})
    return link.properties.hashed_token


async def start_demo() -> Dict[str, str]:
    now = datetime.now(timezone.utc)
    accounts = await asyncio.to_thread(demo_accounts)
    accounts = await asyncio.to_thread(delete_expired, accounts, now)
    if sum(1 for a in accounts if now - created_at(a) < timedelta(hours=1)) >= MAX_DEMOS_PER_HOUR:
        raise HTTPException(status_code=429, detail="The demo is busy right now. Please try again in a few minutes.")

    account = await asyncio.to_thread(create_account)
    try:
        program = await asyncio.to_thread(degree)
        await asyncio.to_thread(save_student, account.id, program)
        await save_plan(account.id, program)
        token = await asyncio.to_thread(sign_in_token, account.email)
    except Exception:
        logger.exception("[demo] setting up a demo account failed")
        await asyncio.to_thread(supabase.auth.admin.delete_user, account.id)
        raise HTTPException(status_code=500, detail="Could not start the demo. Please try again.")
    return {"token_hash": token}


def demo_chat_messages(user_id: str) -> int:
    conversations = supabase.table("conversations").select("id").eq("user_id", user_id).execute().data or []
    if not conversations:
        return 0
    return (
        supabase.table("conversation_messages")
        .select("id", count="exact")
        .in_("conversation_id", [c["id"] for c in conversations])
        .eq("sender", "user")
        .execute()
        .count
        or 0
    )


async def check_demo_chat_limit(user) -> None:
    if not is_demo(user):
        return
    if await asyncio.to_thread(demo_chat_messages, user.id) > MAX_DEMO_CHAT_MESSAGES:
        raise HTTPException(
            status_code=429,
            detail=f"The demo allows {MAX_DEMO_CHAT_MESSAGES} questions to Eunice. Create a free account to keep chatting.",
        )
