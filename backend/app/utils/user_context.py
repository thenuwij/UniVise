# app/utils/user_context.py

from app.utils.database import supabase

def _first_or_empty(res):
    try:
        data = getattr(res, "data", None) or []
        return data[0] if isinstance(data, list) and data else {}
    except Exception:
        return {}

def _select_latest(table: str, cols: str, user_id: str, order_col: str | None):
    """
    Try selecting latest by order_col if provided; if that fails (column missing),
    retry without ordering. Always returns a dict (possibly empty).
    """
    # 1) try with ordering (if requested)
    if order_col:
        try:
            res = (
                supabase
                .from_(table)
                .select(cols)
                .eq("user_id", user_id)
                .order(order_col, desc=True)
                .limit(1)
                .execute()
            )
            got = _first_or_empty(res)
            if got:
                return got
        except Exception:
            pass  # fall through to no-order

    # 2) no ordering fallback
    res = (
        supabase
        .from_(table)
        .select(cols)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return _first_or_empty(res)

async def get_user_context(user_id: str) -> dict:
    # === High School Profile (no created_at assumption) ===
    highschool_data = _select_latest(
        table="student_school_data",
        cols="academic_strengths,hobbies,career_interests,confidence,degree_interest",
        user_id=user_id,
        order_col=None,   # set to "created_at" if that column exists in your schema
    )

    # === University Profile (avoid created_at ordering; it doesn't exist) ===
    university_data = _select_latest(
        table="student_uni_data",
        cols="degree_stage,academic_year,degree_field,switching_pathway,study_feelings,interest_areas,hobbies,confidence,want_help",
        user_id=user_id,
        order_col=None,   # was causing 42703 before
    )

    # === Final Degree Recommendation (created_at likely exists; try it, fall back if not) ===
    plan_raw = _select_latest(
        table="final_degree_recommendations",
        cols="degree_name,reason,created_at",
        user_id=user_id,
        order_col="created_at",   # will auto-fallback if missing
    )

    final_plan = {
        "degree_name": plan_raw.get("degree_name"),
        "reason": plan_raw.get("reason"),
        "created_at": plan_raw.get("created_at"),
        "years": [],            # keep stable shape for callers expecting it
        "specialisations": [],  # removed in DB; expose empty list for compat
    }

    # === Personality Result (created_at may exist; try it, fall back if not) ===
    personality_data = _select_latest(
        table="personality_results",
        cols="trait_scores,top_types,result_summary,created_at",
        user_id=user_id,
        order_col="created_at",
    )

    return {
        "highschool": highschool_data or {},
        "university": university_data or {},
        "personality": personality_data or {},
        "final_plan": final_plan,
        "roadmap": final_plan,   # backward-compatible alias
    }
