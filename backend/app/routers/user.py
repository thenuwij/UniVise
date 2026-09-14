from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.services import user_profile

router = APIRouter()

@router.get("/student_type")
async def get_student_type(user=Depends(get_current_user)) -> str:
    return await user_profile.get_student_type(user)


@router.get("/user_info")
async def get_user_info(
    user=Depends(get_current_user), student_type=Depends(get_student_type)
):
    return await user_profile.get_user_info(user, student_type)


@router.get("/user_recommendations")
async def get_user_recommendations(
    user=Depends(get_current_user), student_type=Depends(get_student_type)
):
    return await user_profile.get_user_recommendations(user, student_type)
