from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from app.utils.database import supabase
from .user import get_user_info, get_student_type
from app.utils.openai_client import ask_openai

router = APIRouter()


@router.get("/prompt")
async def get_recommendation_prompts(user=Depends(get_current_user)):
    student_type = await get_student_type(user)
    user_info = await get_user_info(user, student_type)

    if not student_type or not user_info:
        raise HTTPException(status_code=401, detail="Invalid User")

    if student_type == "university":
        prompt = (
            "You are a career advisor for university students. Based on the following information, "
            "recommend 2–3 potential career paths or further study options that align with this student's profile:\n\n"
            f"• Degree stage: {user_info['degree_stage']}\n"
            f"• Degree field: {user_info['degree_field']}\n"
            f"• Current WAM: {user_info['wam']}\n"
            f"• Interest in switching majors: {user_info['switching_pathway']}\n"
            f"• Feelings about their current studies: {user_info['study_feelings']}\n"
            f"• Primary interest areas: {user_info['interest_areas']}\n"
            f"• Other interest areas: {user_info['interest_areas_other']}\n"
            f"• Hobbies: {user_info['hobbies']}\n"
            f"• Other hobbies: {user_info['hobbies_other']}\n"
            f"• Confidence in career direction: {user_info['confidence']}\n"
            f"• Openness to career guidance: {user_info['want_help']}\n\n"
            "Respond with a short, encouraging summary and recommendations tailored to this student."
        )

    else:
        prompt = (
            "You are a career advisor helping high school students decide on a university pathway. "
            "Use the following information to suggest 2–3 university degree options that align with this student's profile:\n\n"
            f"• Year level: {user_info['year']}\n"
            f"• Academic strengths (from subjects): {user_info['academic_strengths']}\n"
            f"• ATAR goal or estimate: {user_info['atar']}\n"
            f"• Hobbies: {user_info['hobbies']}\n"
            f"• Career interests: {user_info['career_interests']}\n"
            f"• Degree interests: {user_info['degree_interests']}\n"
            f"• Confidence in future direction: {user_info['confidence']}\n\n"
            "Provide friendly and specific degree suggestions with reasoning to guide the student."
        )
    recommendation = ask_openai(prompt)

    return recommendation
