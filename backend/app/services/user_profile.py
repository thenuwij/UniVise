import logging

from fastapi import HTTPException
from app.core.database import supabase

logger = logging.getLogger(__name__)


async def get_student_type(user) -> str:
    # Grab it from the decoded JWT
    student_type = getattr(user, "user_metadata", {}).get("student_type")
    if student_type not in ("high_school", "university"):
        raise HTTPException(
            status_code=400, detail="student_type missing or invalid in token metadata"
        )
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
