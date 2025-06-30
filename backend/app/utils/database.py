import os
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OPENAPI_AI_KEY = os.environ["OPENAI_API_KEY"]

if not all([SUPABASE_ROLE_KEY, SUPABASE_URL]):
    raise EnvironmentError("One or more Supabase Env Variables are missing")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ROLE_KEY)
