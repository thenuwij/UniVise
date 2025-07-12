from fastapi import APIRouter
from app.utils.supabase_client import supabase, supabase_admin_client

router = APIRouter()

@router.delete("/delete_user/{user_id}")
async def delete_user(user_id: str):
    try:

        supabase.table("student_uni_data").delete().eq("user_id", user_id).execute()

        result = supabase_admin_client.auth.admin.delete_user(user_id)

        if result is None or getattr(result, "error", None):
            return {
                "success": True,
                "message": f"User {user_id} deleted or already removed"
            }

        return {
            "success": True,
            "message": f"User {user_id} deleted"
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
