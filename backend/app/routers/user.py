from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from app.utils.database import supabase

router = APIRouter()

@router.get("/student_type")
async def get_student_type(user=Depends(get_current_user)) -> str:
    # Grab it from the decoded JWT
    student_type = getattr(user, "user_metadata", {}).get("student_type")
    if student_type not in ("high_school", "university"):
        raise HTTPException(
            status_code=400, detail="student_type missing or invalid in token metadata"
        )
    return student_type


@router.get("/user_info")
async def get_user_info(
    user=Depends(get_current_user), student_type=Depends(get_student_type)
):
    if student_type == "university":
        table = "student_uni_data"
    elif student_type == "high_school":
        table = "student_school_data"
    else:
        raise HTTPException(status_code=400, detail="Invalid student type")

    resp = supabase.table(table).select("*").eq("user_id", user.id).single().execute()

    if not resp:
        raise HTTPException(status_code=401, detail="Survey Info not Found")

    return resp.data


@router.get("/user_recommendations")
async def get_user_recommendations(
    user=Depends(get_current_user), student_type=Depends(get_student_type)
):
    if student_type == "university":
        recommendations = "career_recommendations"
    elif student_type == "high_school":
        recommendations = "degree_recommendations"
    else:
        raise HTTPException(status_code=400, detail="Invalid student type")

    resp = supabase.table(recommendations).select("*").eq("user_id", user.id).execute()

    if not resp:
        raise HTTPException(status_code=401, detail="Recommendations Info not Found")

    return resp.data


@router.get("user/academic_analysis")
async def get_user_academic_analysis(
    user=Depends(get_current_user), student_type=Depends(get_student_type)
):
    if student_type == "university":
        table = "transcript_analysis"
    elif student_type == "high_school":
        table = "school_report_analysis"
    else:
        raise HTTPException(status_code=400, detail="Invalid student type")

    resp = supabase.table(table).select("analysis").eq("user_id", user.id).execute()

    if not resp:
        raise HTTPException(status_code=401, detail="Academic Analysis not Found")

    return resp.data
