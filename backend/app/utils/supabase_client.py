from supabase import create_client
from app.config import settings

supabase = create_client(str(settings.supabase_url), settings.supabase_anon_key)

supabase_admin_client = create_client(str(settings.supabase_url), settings.supabase_service_role_key)