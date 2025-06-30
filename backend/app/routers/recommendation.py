from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user, get_student_type
from app.utils.database import supabase

router = APIRouter()


@router.get("/interests")
async def get_recommendation(
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
