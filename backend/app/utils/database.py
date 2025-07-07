from app.utils.supabase_client import supabase

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
