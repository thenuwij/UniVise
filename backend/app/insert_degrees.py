from supabase import create_client
import json
import uuid
import os
from dotenv import load_dotenv

# Load from .env file in backend/
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load the JSON data
json_path = os.path.join("data", "degrees_science.json")
with open(json_path, "r") as f:
    data = json.load(f)

faculty = "Science"
for degree in data[faculty]:
    response = supabase.table("unsw_degrees").insert({
        "id": str(uuid.uuid4()),
        "program_name": degree["program_name"],
        "uac_code": degree["uac_code"],
        "faculty": faculty
    }).execute()

    if response.data:
        print("Inserted:", degree["program_name"])
    else:
        print("Insert failed for:", degree["program_name"])
