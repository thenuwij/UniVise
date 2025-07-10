import datetime
from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from app.utils.database import supabase
from .user import get_user_info, get_student_type
from app.utils.openai_client import ask_openai

import json
import uuid
import re

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
                "Respond only with valid JSON, no intro or extra text."
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
            "For each recommendation, return a JSON object with:\n"
            "degree_name: string — The name of the degree (e.g. Bachelor of Computer Science)"
            "university_name: string — The full university name (e.g. University of Sydney)"
            "atar_requirement: int — The ATAR requirement for this degree (e.g. 90.00)\n"
            "suitability_score: int — A score from 0 to 100 indicating how well this matches the student\n"
            "estimated_completion_time: number — Estimated time to complete this degree (e.g. 3 years full-time)\n"
            "reason: string — A detailed explanation of why this degree is a good fit for the student\n\n"
            "link: string — A link to the degree page on the university website\n\n"
            "source: string — The source of the recommendation (e.g. UNSW Career Services)\n\n"
            "Respond only with valid JSON in this format, no explanation or extra text:\n"
            "[\n"
            "  {\n"
            '    "degree_name": "Bachelor of Commerce",\n'
            '    "university_name": "University of Sydney",\n'
            '    "atar_requirement": 85,\n'
            '    "suitability_score": 92,\n'
            '    "estimated_completion_time": 3.0,\n'
            '    "reason": "This degree aligns with your interests in business and finance.",\n'
            '    "link": "https://www.sydney.edu.au/courses/courses/uc/bachelor-of-commerce.html",\n'
            '    "source": "University of Sydney Handbook"\n'
            "  }\n"
            "]"
        )
    else:
        raise HTTPException(status_code=400, detail="Unknown student type")
    recommendation = ask_openai(prompt)

    if student_type == "high_school":
        cleaned = recommendation.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(
                r"^```json|^```|```$", "", cleaned, flags=re.MULTILINE
            ).strip()

        try:
            parsed = json.loads(cleaned)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error parsing recommendation: {str(e)}\nRaw output: {recommendation}",
            ) from e

        rows = []
        for rec in parsed:
            row = {
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "degree_name": rec["degree_name"],
                "university_name": rec["university_name"],
                "atar_requirement": rec["atar_requirement"],
                "suitability_score": rec["suitability_score"],
                "est_completion_years": rec.get("estimated_completion_time", 3.0),
                "reasoning": rec.get("reason"),
                "sources": rec.get("source"),
                "link": rec.get("link"),
                "created_at": datetime.datetime.now().isoformat(),
            }
            rows.append(row)

        response = supabase.table("degree_recommendations").insert(rows).execute()

        if not response:
            raise HTTPException(
                status_code=500,
                detail=f"Error saving recommendations: {response.error.message}",
            )

        return {"status": "success", "recommendations": rows}

    return recommendation
