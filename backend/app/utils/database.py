from supabase import Client, create_client
from app.config import SUPABASE_URL, SUPABASE_ROLE_KEY

if not all([SUPABASE_ROLE_KEY, SUPABASE_URL]):
    raise EnvironmentError("One or more Supabase Env Variables are missing")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ROLE_KEY)