# app/utils/user_context.py

from app.utils.database import supabase
from datetime import datetime

async def get_user_context(user_id: str) -> dict:
    # === High School Profile ===
    hs_response = (
        supabase
        .from_("student_school_data")
        .select("academic_strengths, hobbies, career_interests, confidence, degree_interest")
        .eq("user_id", user_id)
        .execute()
    )
    highschool_data = hs_response.data[0] if hs_response.data else {}

    # === University Profile ===
    uni_response = (
        supabase
        .from_("student_uni_data")
        .select("degree_stage, academic_year, degree_field, switching_pathway, study_feelings, interest_areas, hobbies, confidence, want_help")
        .eq("user_id", user_id)
        .execute()
    )
    university_data = uni_response.data[0] if uni_response.data else {}

    # === Final Degree Recommendation ===
    roadmap_response = (
        supabase
        .from_("final_degree_recommendations")
        .select("degree_name, reason, year_1_courses, year_2_courses, year_3_courses, year_4_courses, specialisations")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    roadmap_data = roadmap_response.data[0] if roadmap_response.data else {}

    # === Personality Result ===
    personality_response = (
        supabase
        .from_("personality_results")
        .select("trait_scores, top_types, result_summary, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    personality_data = personality_response.data[0] if personality_response.data else {}

    return {
        "highschool": highschool_data,
        "university": university_data,
        "roadmap": roadmap_data,
        "personality": personality_data,
    }

