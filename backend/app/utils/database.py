from supabase import Client, create_client
from app.config import SUPABASE_URL, SUPABASE_ROLE_KEY

if not all([SUPABASE_ROLE_KEY, SUPABASE_URL]):
    raise EnvironmentError("One or more Supabase Env Variables are missing")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ROLE_KEY)

def log_chatbot_session(user_id: str, message: str, response: str):
    try:
        res = supabase.table("user_chatbot_sessions").insert({
            "user_id": user_id,
            "message": message,
            "response": response
        }).execute()
        
        if res.error:
            print("Supabase insert error:", res.error)
    except Exception as e:
        print("Error logging chatbot session:", e)