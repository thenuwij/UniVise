from typing import Any, Dict, List
from app.utils.database import supabase
import json

# =========================
# HONOURS CONTEXTS
# =========================

CORE_COURSE_KEYWORDS = [
    "core",
    "stream core",
    "disciplinary core",
    "level 1",
    "level 2",
    "level 3",
    "level 4",
    "project",
    "thesis",
    "capstone",
    "design",
    "honours",
]

# =========================
# HELPER FUNCTIONS
# =========================

#------------- Honours Section ----------------
#------------- Honours Section ----------------
def get_honours_context_for_faculty(faculty: str) -> str:
    """
    Fetches Honours context text from the honours_contexts table in Supabase.
    If no faculty-specific context is found (e.g., not Business or Engineering),
    it automatically falls back to the 'General' context.
    """
    try:
        # Normalise input
        faculty_clean = (faculty or "General").strip().lower()

        # Query Supabase for that faculty
        result = (
            supabase.from_("honours_contexts")
            .select("description")
            .ilike("faculty", f"%{faculty_clean}%")
            .maybe_single()
            .execute()
        )

        data = getattr(result, "data", None)

        # If data exists and has description → return it
        if data and data.get("description"):
            return data["description"]

        # Otherwise, fallback to General
        fallback = (
            supabase.from_("honours_contexts")
            .select("description")
            .ilike("faculty", "%general%")
            .maybe_single()
            .execute()
        )

        if fallback and getattr(fallback, "data", None):
            return fallback.data["description"]

        # Nothing found at all
        print(f"No honours context found for '{faculty_clean}' (even General missing).")
        return ""

    except Exception as e:
        print(f"Error fetching honours context from DB: {e}")
        return ""


#------------- Capstone Section ----------------
def fetch_program_core_courses(degree_code: str) -> List[Dict[str, Any]]:
    if not degree_code:
        print("Missing degree_code in fetch_program_core_courses.")
        return []
    try:
        result = supabase.from_("degree_versions_structure").select("sections").eq("degree_code", degree_code).limit(1).execute()
        if not result.data:
            return []
        sections_data = result.data[0].get("sections")
        sections = parse_sections_json(sections_data)
        core_courses = extract_core_courses_from_sections(sections)
        return enrich_courses_with_db_details(core_courses)
    except Exception as e:
        print(f"fetch_program_core_courses failed for {degree_code}: {e}")
        return []
    

def parse_sections_json(sections_data) -> list:
    if not sections_data:
        return []
    try:
        if isinstance(sections_data, str):
            sections = json.loads(sections_data)
            if isinstance(sections, str):
                sections = json.loads(sections)
        else:
            sections = sections_data
        return sections if isinstance(sections, list) else []
    except (json.JSONDecodeError, TypeError, AttributeError) as e:
        print(f"Error parsing sections JSON: {e}")
        return []
    
def extract_core_courses_from_sections(sections: list) -> List[Dict[str, Any]]:
    core_courses = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        title = section.get("title", "").lower()
        if "overview" in title:
            continue
        if any(k in title for k in CORE_COURSE_KEYWORDS):
            for course in section.get("courses", []) or []:
                if isinstance(course, dict) and course.get("code"):
                    core_courses.append({
                        "code": course["code"],
                        "name": course.get("name", ""),
                        "uoc": course.get("uoc", 6),
                        "section": section.get("title", ""),
                    })
    return core_courses

def enrich_courses_with_db_details(courses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not courses:
        return courses
    try:
        codes = [c["code"] for c in courses if c.get("code")]
        if not codes:
            return courses
        result = supabase.from_("unsw_courses").select(
            "code, title, overview, study_level, faculty, school"
        ).in_("code", codes).execute()
        if not result.data:
            return courses
        details_map = {row["code"]: row for row in result.data}
        for c in courses:
            d = details_map.get(c["code"])
            if d:
                c.update({
                    "overview": d.get("overview", ""),
                    "faculty": d.get("faculty", ""),
                    "school": d.get("school", ""),
                    "title": d.get("title", c.get("name", "")),
                    "study_level": d.get("study_level", ""),
                })
    except Exception as e:
        print(f"Error enriching course details: {e}")
    return courses


def format_core_courses_for_prompt(courses: List[Dict[str, Any]]) -> str:
    if not courses:
        return ""
    formatted = "\n=== PROGRAM CORE COURSES (Detailed) ===\n"
    formatted += "The following core courses are part of this program's structure:\n\n"
    sections_map = {}
    for c in courses:
        section = c.get("section", "Core Courses")
        sections_map.setdefault(section, []).append(c)
    for section, items in sections_map.items():
        formatted += f"{section}:\n"
        for course in items:
            formatted += f"  - {course['code']}: {course.get('name') or course.get('title', '')} ({course.get('uoc', 6)} UOC)\n"
            overview = (course.get("overview") or "").strip()
            if overview:
                truncated = overview[:400] + "..." if len(overview) > 400 else overview
                formatted += f"    ↳ {truncated}\n"
        formatted += "\n"
    formatted += (
        "IMPORTANT: Use these course details to identify final-year 'capstone', 'project', "
        "'thesis', or 'design' courses that represent the culminating experience in the degree.\n"
    )
    return formatted



#------------- General Roadmap UNSW ----------------
def fetch_degree_by_identifier(degree_id=None, uac_code=None, program_name=None) -> Dict[str, Any]:
    degree = None
    try:
        if degree_id:
            result = supabase.from_("unsw_degrees").select("*").eq("id", degree_id).limit(1).execute()
            degree = result.data[0] if result.data else None
        if not degree and uac_code:
            result = supabase.from_("unsw_degrees").select("*").eq("uac_code", uac_code).limit(1).execute()
            degree = result.data[0] if result.data else None
        if not degree and program_name:
            result = supabase.from_("unsw_degrees").select("*").ilike("program_name", f"%{program_name}%").limit(1).execute()
            degree = result.data[0] if result.data else None
    except Exception as e:
        print(f"Error fetching degree: {e}")

    if not degree:
        return {
            "id": degree_id,
            "program_name": program_name,
            "uac_code": uac_code,
            "code": None,  # use "code" now
            "faculty": None,
            "lowest_selection_rank": None,
            "lowest_atar": None,
            "description": None,
            "career_outcomes": None,
            "assumed_knowledge": None,
            "handbook_url": None,
            "school": None,
        }

    # Include the corrected degree_code in the returned dict
    return degree



def fetch_degree_related_info(degree_id: str):
    majors, minors, doubles = [], [], []
    if not degree_id:
        return majors, minors, doubles
    try:
        m = supabase.from_("degree_majors").select("major_name").eq("degree_id", degree_id).execute()
        majors = [r["major_name"] for r in (m.data or []) if r.get("major_name")]
        n = supabase.from_("degree_minors").select("minor_name").eq("degree_id", degree_id).execute()
        minors = [r["minor_name"] for r in (n.data or []) if r.get("minor_name")]
        d = supabase.from_("degree_double_degrees").select("program_name").eq("degree_id", degree_id).execute()
        doubles = [r["program_name"] for r in (d.data or []) if r.get("program_name")]
    except Exception as e:
        print(f"Error fetching related degree info: {e}")
    return majors, minors, doubles
