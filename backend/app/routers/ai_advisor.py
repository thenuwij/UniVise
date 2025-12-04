# app/routers/ai_advisor.py

from fastapi import APIRouter, Request, Depends, HTTPException
from app.utils.database import supabase
from app.utils.openai_client import ask_openai
from app.utils.user_context import get_user_context
from dependencies import get_current_user

router = APIRouter()


@router.post("/degree")
async def get_degree_summary(request: Request, user=Depends(get_current_user)):
    body = await request.json()
    degree_id = body.get("degree_id")

    if not degree_id:
        raise HTTPException(status_code=400, detail="Missing degree_id")

    # Fetch degree data from the final table
    degree_response = (
        supabase
        .from_("unsw_degrees_final")
        .select("program_name, overview_description, career_outcomes")
        .eq("id", degree_id)
        .single()
        .execute()
    )

    if not degree_response.data:
        raise HTTPException(status_code=404, detail="Degree not found")

    degree = degree_response.data

    # Clean and parse career outcomes if it's a comma separated string
    career_outcomes_raw = degree.get("career_outcomes", "")
    career_outcomes_list = (
        [s.strip() for s in career_outcomes_raw.split(",")]
        if isinstance(career_outcomes_raw, str)
        else []
    )

    # Fetch student profile data
    context = await get_user_context(user.id)

    prompt = f"""
    You are UniVise's Smart Advisor.
    Your job is to give the student a clear, concise, and personal recommendation for the degree below, based on their profile.

    Degree: {degree['program_name']}
    Description: {degree.get('overview_description') or 'N/A'}
    Career Outcomes: {', '.join(career_outcomes_list) or 'N/A'}

    Student Profile:
    - Personality Traits: {context['personality'].get('top_types')}
    - Strengths & Interest Areas: {context['highschool'].get('academic_strengths') or context['university'].get('interest_areas')}
    - Career Goal or Degree Focus: {context['highschool'].get('career_interests') or context['university'].get('degree_field')}

    FORMAT your answer like this:
    Fit Score: [0–100 based on how well this degree matches the student]

    Why this degree fits you:
    [2–3 short sentences directly linking the student's personality, strengths, and goals to the degree]

    Career Directions:
    • [Career path 1]
    • [Career path 2]
    • [Career path 3] (optional)

    You may also like:
    [1–2 related degrees or majors if relevant, otherwise omit]

    Tone: Friendly, encouraging, and direct.
    Avoid long paragraphs.
    No markdown formatting like **bold**.
    Keep it scannable and easy to understand at a glance.
    """

    try:
        summary = ask_openai(prompt).strip()
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")
