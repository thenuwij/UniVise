from supabase import create_client
from backend.app.config import settings

supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
