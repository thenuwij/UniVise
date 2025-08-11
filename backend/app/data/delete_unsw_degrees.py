from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Delete all existing rows for Arts faculty
response = supabase.table("unsw_degrees").delete().eq("faculty", "Science").execute()

print("Deleted degrees: \n", response.data)
