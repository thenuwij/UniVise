import asyncio
from datetime import datetime, timezone

from app.core.database import supabase

PAGE_SIZE = 1000
ID_CHUNK = 100

USER_TABLES = [
    "career_recommendations",
    "conversations",
    "degree_recommendations",
    "final_degree_recommendations",
    "mindmesh_edges",
    "mindmesh_items",
    "mindmeshes",
    "personality_results",
    "recommendation_runs",
    "school_report_analysis",
    "school_roadmap",
    "student_school_data",
    "student_uni_data",
    "unsw_roadmap",
    "user_completed_courses",
    "user_course_picks",
    "user_custom_courses",
    "user_enrolled_program",
    "user_progress_stats",
    "user_saved_items",
    "user_specialisation_selections",
]

CHILD_TABLES = {
    "conversation_messages": ("conversations", "conversation_id"),
    "career_rec_details": ("career_recommendations", "id"),
    "degree_rec_details": ("degree_recommendations", "id"),
}


def fetch_rows(table: str, column: str, values: list) -> list:
    rows = []
    for i in range(0, len(values), ID_CHUNK):
        chunk = values[i:i + ID_CHUNK]
        start = 0
        while True:
            page = (
                supabase.table(table).select("*").in_(column, chunk)
                .range(start, start + PAGE_SIZE - 1).execute()
            ).data or []
            rows.extend(page)
            if len(page) < PAGE_SIZE:
                break
            start += PAGE_SIZE
    return rows


def account_details(user_id: str) -> dict:
    account = supabase.auth.admin.get_user_by_id(user_id).user
    return {
        "id": account.id,
        "email": account.email,
        "sign_in_provider": (account.app_metadata or {}).get("provider"),
        "created_at": account.created_at,
        "last_sign_in_at": account.last_sign_in_at,
        "profile": account.user_metadata or {},
    }


async def gather_user_data(user_id: str) -> dict:
    account, *user_rows = await asyncio.gather(
        asyncio.to_thread(account_details, user_id),
        *(asyncio.to_thread(fetch_rows, table, "user_id", [user_id]) for table in USER_TABLES),
    )
    tables = dict(zip(USER_TABLES, user_rows))

    child_rows = await asyncio.gather(*(
        asyncio.to_thread(fetch_rows, child, column, [row["id"] for row in tables[parent]])
        for child, (parent, column) in CHILD_TABLES.items()
    ))
    tables.update(zip(CHILD_TABLES, child_rows))

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "account": account,
        "tables": dict(sorted(tables.items())),
    }
