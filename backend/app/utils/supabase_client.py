from supabase import create_client, Client
from app.config import SUPABASE_ANON_KEY, SUPABASE_URL

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
