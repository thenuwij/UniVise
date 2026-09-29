# app/routers/smart_related.py
from fastapi import APIRouter, Depends, HTTPException
from app.models.smart_related import CourseToDegreesReq, DegreeOut
from typing import List

from app.core.auth import get_current_user
from app.core.database import supabase
from app.services.smart_related import programs_for_course

router = APIRouter(prefix="/smart-related", tags=["Smart Related"])

# List the programs whose structure includes a given course
@router.post("/degrees-for-course", response_model=List[DegreeOut])
async def degrees_for_course(req: CourseToDegreesReq, user=Depends(get_current_user)):

    if not req.course_id and not req.course_code:
        raise HTTPException(status_code=400, detail="course_id or course_code required")

    course_code = req.course_code
    if req.course_id:
        course = supabase.table("unsw_courses").select("code").eq("id", req.course_id).limit(1).execute().data
        if not course:
            raise HTTPException(status_code=404, detail="course not found")
        course_code = course[0]["code"]

    return [
        DegreeOut(
            id=program["id"],
            program_code=program["degree_code"],
            program_name=program["program_name"],
            faculty=program.get("faculty"),
        )
        for program in programs_for_course(course_code)
    ]
