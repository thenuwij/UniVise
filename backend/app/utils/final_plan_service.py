from app.utils.database import supabase
from app.utils.openai_client import ask_openai
import json
import uuid
import re
from datetime import datetime

def safe_get_year_courses(breakdown, year):
    return breakdown.get(year, [])

async def generate_final_plan(user_id: str):
    # Step 1: Fetch career recommendations
    rec_response = (
        supabase
        .from_("career_recommendations")
        .select("career_title, reason")
        .eq("user_id", user_id)
        .execute()
    )

    if not rec_response or not rec_response.data:
        raise Exception("Failed to fetch career recommendations")

    recommendations = rec_response.data

    # Step 2: Fetch UNSW degrees
    degrees_response = (
        supabase
        .from_("unsw_degrees")
        .select("program_name")
        .execute()
    )

    if not degrees_response or not degrees_response.data:
        raise Exception("Failed to fetch UNSW degrees")

    degree_names = [d["program_name"] for d in degrees_response.data]

    # Step 3: Build OpenAI prompt
    user_recs_text = "\n".join([f"- {r['career_title']} — {r['reason']}" for r in recommendations])
    unsw_degree_list = "\n".join([f"- {name}" for name in degree_names])

    prompt = f"""
You are a UNSW academic advisor.

The student received these career recommendations:
{user_recs_text}

Now, here is a list of official UNSW degrees to choose from:
{unsw_degree_list}

Task:
- Recommend up to 2 UNSW degrees that best match the career options listed.
- For each degree, include:
  - Degree Name
  - A short reason why it matches
  - A realistic year-by-year course breakdown (real UNSW course codes)
  - Mention any relevant specialisations or double degrees
- Respond in valid JSON only. No markdown or explanations.

Example:
[
  {{
    "degreeName": "Software Engineering (Honours)",
    "reason": "...",
    "courseBreakdown": {{
      "Year 1": ["COMP1511", "MATH1131", "ENGG1000"],
      "Year 2": ["COMP2511", "ELEC2142", "GENZ2000"]
    }},
    "specialisations": [...],
    "doubleDegrees": [...]
  }}
]
"""

    # Step 4: Query OpenAI
    result = ask_openai(prompt).strip()
    if result.startswith("```"):
        result = re.sub(r"^```json|^```|```$", "", result, flags=re.MULTILINE).strip()

    try:
        degrees = json.loads(result)
    except Exception as e:
        raise Exception(f"Failed to parse OpenAI result: {str(e)}\nRaw output:\n{result}")

    # Step 5: Insert each degree into Supabase
    rows = []
    for degree in degrees:
        breakdown = degree.get("courseBreakdown", {})

        row = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "degree_name": degree.get("degreeName"),
            "reason": degree.get("reason"),
            "year_1_courses": safe_get_year_courses(breakdown, "Year 1"),
            "year_2_courses": safe_get_year_courses(breakdown, "Year 2"),
            "year_3_courses": safe_get_year_courses(breakdown, "Year 3"),
            "year_4_courses": safe_get_year_courses(breakdown, "Year 4"),
            "specialisations": degree.get("specialisations", []),
            "created_at": datetime.utcnow().isoformat()
        }
        rows.append(row)

    insert_response = supabase.table("final_degree_recommendations").insert(rows).execute()

    if not insert_response or not insert_response.data:
        raise Exception("Supabase insert failed")

    return degrees
