import asyncio
import logging

from fastapi import HTTPException
from app.core.database import supabase

logger = logging.getLogger(__name__)

UNIVERSITY_ONLY = "UniVise is for university students only"


def survey_answers(user_info: dict, field: str) -> str:
    other = (user_info.get(f"{field}_other") or "").strip()
    values = [f"Other: {other}" if value == "Other" and other else value for value in user_info.get(field) or []]
    return ", ".join(values) or "not provided"


def stored_student_type(user_id: str) -> str | None:
    try:
        account = supabase.auth.admin.get_user_by_id(user_id).user
    except Exception as e:
        logger.error(f"[student_type] account lookup failed for user {user_id}: {e}")
        return None
    return (getattr(account, "user_metadata", None) or {}).get("student_type")


async def get_student_type(user) -> str:
    # Grab it from the decoded JWT
    student_type = getattr(user, "user_metadata", {}).get("student_type")
    if student_type not in ("high_school", "university"):
        student_type = await asyncio.to_thread(stored_student_type, user.id)
    if student_type not in ("high_school", "university"):
        raise HTTPException(
            status_code=400, detail="student_type missing or invalid in token metadata"
        )
    if student_type == "high_school":
        raise HTTPException(status_code=403, detail=UNIVERSITY_ONLY)
    return student_type


async def get_user_info(user, student_type):
    if student_type == "university":
        table = "student_uni_data"
    elif student_type == "high_school":
        table = "student_school_data"
    else:
        raise HTTPException(status_code=400, detail="Invalid student type")

    try:
        resp = supabase.table(table).select("*").eq("user_id", user.id).single().execute()
    except Exception as e:
        logger.error(f"[user_info] DB query failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user info")

    if not resp.data:
        raise HTTPException(status_code=401, detail="Survey Info not Found")

    return resp.data


async def get_user_recommendations(user, student_type):
    if student_type == "university":
        recommendations = "career_recommendations"
    elif student_type == "high_school":
        recommendations = "degree_recommendations"
    else:
        raise HTTPException(status_code=400, detail="Invalid student type")

    try:
        resp = supabase.table(recommendations).select("*").eq("user_id", user.id).execute()
    except Exception as e:
        logger.error(f"[user_recommendations] DB query failed for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")

    return resp.data or []
