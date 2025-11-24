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

    Below is the official list of ALL UNSW degrees:
    {unsw_degree_list}

    IMPORTANT RULES:
    - You MUST ONLY choose degrees EXACTLY from the list above.
    - Do NOT create, modify, or infer degree names.
    - If a degree is not in the list, you CANNOT recommend it.
    - The "degreeName" field MUST match a name from the list, character-for-character.
    - If none are appropriate, return an empty JSON list [].

    Your task:
    - Recommend up to 5 UNSW degrees that best match the student’s career interests.
    - For each degree, include:
        - "degreeName": exact UNSW degree name from the list
        - "reason": a short explanation

    Respond with VALID JSON only. No markdown, no comments, no extra text.

    Example output:
    [
    {{
        "degreeName": "Software Engineering (Honours)",
        "reason": "Strong alignment with software development and technical career goals."
    }}
    ]
    """

    # --- Call OpenAI and clean the response ---
    result_raw = ask_openai(prompt)         
    result = clean_openai_response(result_raw)

    # --- Debug: print what the AI actually said ---
    print("=== RAW AI RESULT START ===")
    print(result)
    print("=== RAW AI RESULT END ===")

    try:
        degrees = json.loads(result)
    except Exception as e:
        raise Exception(f"Failed to parse OpenAI result: {str(e)}\nRaw output:\n{result}")

    # --- Debug: show parsed degrees clearly ---
    print("=== PARSED AI RECOMMENDATIONS ===")
    for d in degrees:
        print("-", d.get("degreeName"))
    print("=== END PARSED ===")


    # Insert into Supabase final_recommendations table (University students only)
    rows = []

    for degree in degrees:
        degree_name = degree.get("degreeName")
        reason = degree.get("reason")

        try:
            match = (
                supabase
                .from_("unsw_degrees_final")
                .select("id, degree_code, program_name")
                .eq("program_name", degree_name)
                .limit(1)
                .execute()
            )

            if match and match.data and len(match.data) > 0:
                degree_id = match.data[0]["id"]  # Get the actual degree ID
                degree_code = match.data[0]["degree_code"]
                print(f"Exact match: {degree_name} → {degree_code} (id: {degree_id})")
            else:
                print(f"[SKIP] No exact UNSW match found for: '{degree_name}'")
                continue  

        except Exception as e:
            print(f"[ERROR] Query failed for '{degree_name}': {e}")
            continue  

        # --- Only insert valid UNSW degrees ---
        rows.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "degree_id": degree_id,  # ADD THIS LINE
            "degree_name": degree_name,
            "reason": reason,
            "degree_code": degree_code,
            "created_at": datetime.utcnow().isoformat()
        })


    # --- DEBUG: Show what will be inserted ---
    print("\n=== FINAL DEGREE RECOMMENDATIONS TO INSERT ===")
    for r in rows:
        print(f"- {r['degree_name']} → degree_code={r['degree_code']} | reason={r['reason'][:80]}...")
    print("=============================================\n")


    insert_response = supabase.table("final_degree_recommendations").insert(rows).execute()

    if not insert_response or not insert_response.data:
        raise Exception("Supabase insert failed")

    return degrees
