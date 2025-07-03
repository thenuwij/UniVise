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
        if user_info["switching_pathway"] == "No, I’m happy with my current path":
            is_switching = False
            prompt = (
                "You are a university career advisor for UNSW students. Based on the following student's profile, "
                "recommend 4–5 university courses they should enrol in next:\n\n"
                f"• Degree field: {user_info['degree_field']}\n"
                f"• Degree stage: {user_info['degree_stage']}\n"
                f"• Current WAM: {user_info['wam']}\n"
                f"• Study feelings: {user_info['study_feelings']}\n"
                f"• Interests: {user_info['interest_areas']} / {user_info['interest_areas_other']}\n"
                f"• Hobbies: {user_info['hobbies']}\n\n"
                "Return a JSON array with the following for each course:\n"
                "- 'course': name/code of the recommended course\n"
                "- 'reason': short explanation why it matches\n"
                "- 'term': when the student should take it (e.g. Year 2 Term 1)\n"
                "- 'skill_focus': main skills the course builds\n\n"
                "Respond only with valid JSON, no intro."
            )
        else:
            is_switching = True
            prompt = (
                "You are a university career advisor for UNSW students helping a student consider switching degrees. Based on their profile:\n\n"
                f"• Current field: {user_info['degree_field']}\n"
                f"• Current WAM: {user_info['wam']}\n"
                f"• Reason for switching: {user_info['study_feelings']}\n"
                f"• Interests: {user_info['interest_areas']} / {user_info['interest_areas_other']}\n"
                f"• Hobbies: {user_info['hobbies']}\n"
                f"• Confidence in career direction: {user_info['confidence']}\n\n"
                "Recommend 4–5 alternative degrees in JSON. Each object should include:\n"
                "- 'degree': suggested degree\n"
                "- 'reason': why it suits them better\n"
                "- 'transfer_ease': how hard it would be to switch from their current field\n"
                "- 'university': recommended uni for it\n"
                "- 'suitability_score': match score (0–100)\n\n"
                "Respond only with valid JSON, no explanation or extra text."
            )
    elif student_type == "high_school":
        is_switching = False
        prompt = (
            "You are a highschool advisor for university major selection. A high school student has shared the following profile:\n\n"
            f"• Year level: {user_info['year']}\n"
            f"• Academic strengths: {user_info['academic_strengths']}\n"
            f"• ATAR goal or estimate: {user_info['atar']}\n"
            f"• Hobbies: {user_info['hobbies']}\n"
            f"• Career interests: {user_info['career_interests']}\n"
            f"• Degree interests: {user_info['degree_interest']}\n"
            f"• Confidence in future direction: {user_info['confidence']}\n\n"
            "Using this information, return 4–5 recommended degrees as a JSON array. "
            "Each item should include:\n"
            "- 'degree': a recommended degree name\n"
            "- 'atar': a rough ATAR cutoff (based on common Australian unis)\n"
            "- 'university': a suggested university that offers this degree\n"
            "- 'suitability_score': a number from 0–100 showing how well this matches the student\n"
            "- 'reason': 1–2 sentences explaining the match\n\n"
            "Respond only with valid JSON, no explanation or intro."
        )
    else:
        raise HTTPException(status_code=400, detail="Unknown student type")
    recommendation = ask_openai(prompt)

    insert_resp = (
        supabase.table("recommendations")
        .insert(
            {
                "user_id": user.id,
                "student_type": student_type,
                "is_switching": is_switching,
                "recommendation": recommendation,
            }
        )
        .execute()
    )

    if not insert_resp.data:
        raise HTTPException(status_code=500, detail="Failed to save recommendation")

    return recommendation
