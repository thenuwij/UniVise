# app/routers/smart_summary.py

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

    # Fetch degree data
    degree_response = (
        supabase
        .from_("unsw_degrees")
        .select("program_name, description, career_outcomes")
        .eq("id", degree_id)
        .single()
        .execute()
    )

    if not degree_response.data:
        raise HTTPException(status_code=404, detail="Degree not found")

    degree = degree_response.data

    # Clean and parse career outcomes if it's a comma-separated string
    career_outcomes_raw = degree.get("career_outcomes", "")
    career_outcomes_list = (
        [s.strip() for s in career_outcomes_raw.split(",")]
        if isinstance(career_outcomes_raw, str)
        else []
    )


    # Fetch student profile data
    context = await get_user_context(user.id)

    # Build OpenAI prompt
    prompt = f"""
    You are a helpful and intelligent academic advisor AI.

    A student is considering the following UNSW degree: "{degree['program_name']}"  
    Degree Description: {degree['description']}  
    Career Outcomes: {degree.get('career_outcomes', [])}

    Student Profile:
    - Personality Traits: {context['personality'].get('top_types')}
    - Strengths and Interest Areas: {context['highschool'].get('academic_strengths') or context['university'].get('interest_areas')}
    - Career Goal or Degree Focus: {context['highschool'].get('career_interests') or context['university'].get('degree_field')}

    Write a polished, concise, and encouraging academic advisor-style summary that includes:

    • Why this degree is a strong fit for the student's personality, strengths, and goals  
    • The specific career paths this degree can lead to based on the students interests and goals
    • What the learning experience will be like and how it suits the student's profile  
    • Optional: Similar degrees and majors the student may also wish to explore

    Tone: Professional, clear, and supportive — like a real UNSW academic advisor.  
    Avoid: numbered lists, markdown formatting (e.g. **bold**, asterisks), and emojis.  
    Structure: Use short paragraphs with clear sentences and occasional bullet points to improve readability.
    """


    try:
        summary = ask_openai(prompt).strip()
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")
