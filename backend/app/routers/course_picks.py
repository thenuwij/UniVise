import asyncio

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.course_picks import CoursePicksResponse
from app.services.course_picks import get_course_picks, load_inputs
from app.services.user_profile import get_student_type

router = APIRouter()


@router.get("/course-picks", response_model=CoursePicksResponse)
async def course_picks(user=Depends(get_current_user)):
    await get_student_type(user)
    inputs = await asyncio.to_thread(load_inputs, str(user.id))
    return await get_course_picks(str(user.id), inputs)
