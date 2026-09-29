from typing import Any, Dict, List

from app.core.database import supabase


def programs_for_course(course_code: str) -> List[Dict[str, Any]]:
    """Programs whose structure includes the course, directly or through one of their specialisations."""
    response = supabase.rpc("programs_for_course", {"p_course_code": course_code}).execute()
    return response.data or []
