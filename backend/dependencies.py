from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.database import supabase

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
