from fastapi import Depends, HTTPException, status
from app.utils.supabase_client import supabase
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):