from app.utils.database import supabase
from app.utils.openai_client import ask_openai
import json
import uuid
import re
from datetime import datetime


def clean_openai_response(raw):
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```json|^```|```$", "", cleaned, flags=re.MULTILINE).strip()
    return cleaned

async def get_career_recommendations(user_id: str):
    response = (
        supabase
        .from_("career_recommendations")
        .select("career_title, reason")
        .eq("user_id", user_id)
        .execute()
    )
    if not response or not response.data:
        raise Exception("Failed to fetch career recommendations")
    return response.data

async def generate_final_plan(user_id: str):

    # Check if recommendations already exist for this user
    existing = (
        supabase
        .from_("final_degree_recommendations")
        .select("id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data and len(existing.data) > 0:
        return {"message": "Recommendations already exist. Skipping generation."}

    # Get career recommendations
    recommendations = await get_career_recommendations(user_id)
    user_recs_text = "\n".join([f"- {r['career_title']} — {r['reason']}" for r in recommendations])

    # Get UNSW degrees
    degrees_response = (
        supabase
        .from_("unsw_degrees_final")
        .select("program_name")
        .execute()
    )
    if not degrees_response or not degrees_response.data:
        raise Exception("Failed to fetch UNSW degrees")

    degree_names = [d["program_name"] for d in degrees_response.data]
    unsw_degree_list = "\n".join([f"- {name}" for name in degree_names])

    # Send to OpenAI to generate final recs using unsw degrees based on the previous career/degree recommendations
    prompt = f"""
    You are a UNSW academic advisor.

    The student received these career recommendations:
    {user_recs_text}

    Now, here is a list of official UNSW degrees to choose from:
    {unsw_degree_list}

    Task:
    - Recommend up to 5 UNSW degrees that best match the career options listed.
    - For each degree, include:
        - Degree Name
        - A short reason why it matches
    - Respond in valid JSON only. No markdown or explanations.

    Example:
    [
      {{
        "degreeName": "Software Engineering (Honours)",
        "reason": "...",
      }}
    ]
    """

    result = clean_openai_response(ask_openai(prompt))
    try:
        degrees = json.loads(result)
    except Exception as e:
        raise Exception(f"Failed to parse OpenAI result: {str(e)}\nRaw output:\n{result}")

    # Insert into Supabase final_recommendations table (University students only)
    rows = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "degree_name": degree.get("degreeName"),
            "reason": degree.get("reason"),
            "created_at": datetime.utcnow().isoformat()
        }
        for degree in degrees
]

    insert_response = supabase.table("final_degree_recommendations").insert(rows).execute()

    if not insert_response or not insert_response.data:
        raise Exception("Supabase insert failed")

    return degrees
