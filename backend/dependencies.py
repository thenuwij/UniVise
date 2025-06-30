from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.database import supabase  # your admin client

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
):
    token = credentials.credentials
    print("Received token:", token[:30], "...")

    try:
        user_response = supabase.auth.get_user(token)
        print("Supabase response:", user_response)

        user = getattr(user_response, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user  # This is a supabase.User object

    except Exception as e:
        print("Error verifying token:", e)
        raise HTTPException(status_code=401, detail="Invalid or expired Supabase token")


async def get_student_type(user=Depends(get_current_user)):
    profile_resp = (
        supabase.table("profiles").select("student_type").eq("id", user.id).execute()
    )

    if not profile_resp:
        raise HTTPException(status_code=401, detail="User not found")

    return profile_resp.data[0]["student_type"]
