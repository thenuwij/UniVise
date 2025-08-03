from supabase import create_client
import json
import uuid
import os
from dotenv import load_dotenv

# === Load Supabase credentials ===
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# === Load JSON data ===
json_path = os.path.join("data", "degrees_engineering.json")
with open(json_path, "r") as f:
    degrees = json.load(f)

faculty = "Engineering"

for degree in degrees:
    # Match by program_name and optional uac_code
    filters = {
        "program_name": degree["program_name"]
    }
    if "uac_code" in degree:
        filters["uac_code"] = degree["uac_code"]

    result = supabase.table("unsw_degrees").select("id").match(filters).execute()

    if not result.data:
        # Degree not found — insert new row
        degree_id = str(uuid.uuid4())
        insert_fields = {
            "id": degree_id,
            "program_name": degree["program_name"],
            "uac_code": degree.get("uac_code"),
            "faculty": faculty,
            "duration_years": degree.get("duration_years"),
            "lowest_selection_rank": degree.get("lowest_selection_rank"),
            "lowest_atar": degree.get("lowest_atar"),
            "portfolio_available": degree.get("portfolio_available"),
            "description": degree.get("description"),
            "career_outcomes": (
                ", ".join(degree["career_outcomes"]) if isinstance(degree["career_outcomes"], list)
                else degree.get("career_outcomes")
            ),
            "assumed_knowledge": degree.get("assumed_knowledge")
        }
        supabase.table("unsw_degrees").insert(insert_fields).execute()
        print("🆕 Inserted:", degree["program_name"])
    else:
        # Degree already exists — update existing row
        degree_id = result.data[0]["id"]
        update_fields = {
            "duration_years": degree.get("duration_years"),
            "lowest_selection_rank": degree.get("lowest_selection_rank"),
            "lowest_atar": degree.get("lowest_atar"),
            "portfolio_available": degree.get("portfolio_available"),
            "description": degree.get("description"),
            "career_outcomes": (
                ", ".join(degree["career_outcomes"]) if isinstance(degree["career_outcomes"], list)
                else degree.get("career_outcomes")
            ),
            "assumed_knowledge": degree.get("assumed_knowledge"),
            "faculty": faculty
        }
        supabase.table("unsw_degrees").update(update_fields).eq("id", degree_id).execute()
        print("✅ Updated:", degree["program_name"])

    # === Add majors ===
    for major in degree.get("majors", []):
        supabase.table("degree_majors").insert({
            "id": str(uuid.uuid4()),
            "degree_id": degree_id,
            "major_name": major
        }).execute()

    # === Add minors ===
    for minor in degree.get("minors", []):
        supabase.table("degree_minors").insert({
            "id": str(uuid.uuid4()),
            "degree_id": degree_id,
            "minor_name": minor
        }).execute()

    # === Add double degrees ===
    for double_degree in degree.get("double_degrees", []):
        supabase.table("degree_double_degrees").insert({
            "id": str(uuid.uuid4()),
            "degree_id": degree_id,
            "double_degree_name": double_degree
        }).execute()

print("🎉 Finished inserting/updating all degrees.")
