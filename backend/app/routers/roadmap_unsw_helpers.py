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
        result = (
            supabase.from_("unsw_degrees_final")
            .select("sections")
            .eq("degree_code", degree_code)
            .limit(1)
            .execute()
        )
        if not result.data or not result.data[0].get("sections"):
            print(f"No sections found for degree_code {degree_code}")
            return []

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
    """
    Fetch a specific UNSW degree entry from Supabase using the most reliable identifier.
    Uses exact program_name match before fallback to ilike partial match.
    """
    degree = None
    try:
        if degree_id:
            result = (
                supabase.from_("unsw_degrees_final")
                .select("*")
                .eq("id", degree_id)
                .maybe_single()
                .execute()
            )
            degree = getattr(result, "data", None)

        if not degree and uac_code:
            result = (
                supabase.from_("unsw_degrees_final")
                .select("*")
                .eq("uac_code", uac_code)
                .maybe_single()
                .execute()
            )
            degree = getattr(result, "data", None)

        if not degree and program_name:
            # Step 1: try exact match
            result = (
                supabase.from_("unsw_degrees_final")
                .select("*")
                .eq("program_name", program_name.strip())
                .maybe_single()
                .execute()
            )
            degree = getattr(result, "data", None)

            # Step 2: fallback to partial case-insensitive match if nothing found
            if not degree:
                result = (
                    supabase.from_("unsw_degrees_final")
                    .select("*")
                    .ilike("program_name", f"%{program_name.strip()}%")
                    .maybe_single()
                    .execute()
                )
                degree = getattr(result, "data", None)

    except Exception as e:
        print(f"Error fetching degree: {e}")

    if not degree:
        print(f"[WARN] No degree found for id={degree_id}, uac={uac_code}, name={program_name}")
        return {
            "id": degree_id,
            "program_name": program_name,
            "uac_code": uac_code,
            "degree_code": None, 
            "faculty": None,
            "lowest_selection_rank": None,
            "lowest_atar": None,
            "overview_description": None,
            "career_outcomes": None,
            "assumed_knowledge": None,
            "source_url": None,
            "school": None,
            "duration": None,
            "level": None,
            "cricos_code": None,
        }

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


# ========== HELPER FUNCTIONS FOR FLEXIBILITY SECTION ==========
def extract_all_course_codes(sections: list) -> List[str]:
    """
    Extract all course codes from sections JSON structure.
    
    Args:
        sections: Parsed JSON "sections" array from unsw_degrees_final

    Returns:
        List of course codes (e.g., ["ACTL1101", "COMM1170", "MATH1151"])
    
    Example sections structure:
        [
            {
                "title": "Level 1 Core Courses",
                "courses": [
                    {"code": "ACTL1101", "name": "...", "uoc": 6},
                    {"code": "COMM1170", "name": "...", "uoc": 6}
                ]
            }
        ]
    """
    course_codes = []
    
    for section in sections:
        # Skip sections without courses (like Free Electives, General Education)
        if 'courses' in section and section['courses']:
            for course in section['courses']:
                if 'code' in course and course['code']:
                    course_codes.append(course['code'])
    
    return course_codes


def extract_keywords(program_name: str) -> List[str]:
    """
    Extract meaningful keywords from degree name for matching.
    
    Args:
        program_name: Full degree name (e.g., "Bachelor of Commerce (Finance)", "Bachelor of Engineering (Hons)")
        
    Returns:
        List of keywords (e.g., ["computer", "science"])
    
    Filters out common stopwords like "bachelor", "of", "honours", etc.
    """
    stopwords = {
        'bachelor', 'of', 'honours', 'advanced', 'master', 
        'diploma', 'certificate', 'and', 'the', 'in', 'with'
    }
    
    # Replace slashes with spaces and split
    words = program_name.lower().replace('/', ' ').replace('(', ' ').replace(')', ' ').split()
    
    # Filter out stopwords and short words
    keywords = [w for w in words if w not in stopwords and len(w) > 3]
    
    return keywords


def are_related_faculties(faculty1: str, faculty2: str) -> bool:
    """
    Check if two faculties are related for transfer purposes.
    
    Related faculties typically have easier credit transfer policies
    and similar administrative processes.
    
    Args:
        faculty1: First faculty name
        faculty2: Second faculty name
        
    Returns:
        True if faculties are in the same related group
    """
    # Normalize faculty names (lowercase for comparison)
    f1 = faculty1.lower() if faculty1 else ""
    f2 = faculty2.lower() if faculty2 else ""
    
    # Define related faculty groups
    related_groups = [
        # Business/Commerce/Economics group
        ['business', 'commerce', 'economics'],
        
        # Engineering/IT/Computer Science group
        ['engineering', 'computer', 'information technology', 'it'],
        
        # Science/Mathematics group
        ['science', 'mathematics', 'statistics'],
        
        # Arts/Humanities/Social Sciences group
        ['arts', 'humanities', 'social sciences', 'design', 'architecture'],
        
        # Health/Medical group
        ['medicine', 'health', 'nursing', 'medical'],
        
        # Law group
        ['law', 'legal']
    ]
    
    # Check if both faculties are in the same group
    for group in related_groups:
        in_group_1 = any(keyword in f1 for keyword in group)
        in_group_2 = any(keyword in f2 for keyword in group)
        
        if in_group_1 and in_group_2:
            return True
    
    return False


def format_candidates_for_ai(candidates: List[Dict[str, Any]]) -> str:
    """
    Format candidate degrees for AI prompt with all relevant details.
    
    Args:
        candidates: List of candidate degrees with overlap data
        
    Returns:
        Formatted string for AI prompt
    """
    formatted = ""
    
    for i, candidate in enumerate(candidates, 1):
        shared_courses_str = ", ".join(candidate.get('shared_courses', [])[:8])  # Show first 8
        if len(candidate.get('shared_courses', [])) > 8:
            shared_courses_str += f" (and {len(candidate['shared_courses']) - 8} more)"
        
        formatted += f"""
{i}. {candidate['program_name']}
   Faculty: {candidate['faculty']}
   Course Overlap: {candidate['overlap_percentage']:.1f}% ({candidate['overlap_count']}/{candidate['total_current_courses']} courses)
   Shared Courses: {shared_courses_str}
   Total Courses in Target: {candidate['total_target_courses']}
"""
    
    return formatted

# Fecth specialisation context for user 
def fetch_user_specialisation_context(user_id: str, degree_code: str) -> Dict[str, Any]:
    """
    Fetches the user's selected major, minor, and honours specialisations.
    """
    if not user_id or not degree_code:
        return {
            "selected_major_name": None,
            "selected_minor_name": None,
            "selected_honours_name": None,
        }

    try:
        response = (
            supabase.from_("user_specialisation_selections")
            .select("major_id, minor_id, honours_id")
            .eq("user_id", user_id)
            .eq("degree_code", degree_code)
            .maybe_single()
            .execute()
        )

        data = getattr(response, "data", None)
        if not data:
            return {
                "selected_major_name": None,
                "selected_minor_name": None,
                "selected_honours_name": None,
            }

        # Fetch the actual specialisation names by ID
        result = {
            "selected_major_name": None,
            "selected_minor_name": None,
            "selected_honours_name": None,
        }

        if data.get("major_id"):
            major_resp = supabase.from_("unsw_specialisations").select("major_name").eq("id", data["major_id"]).maybe_single().execute()
            if major_resp.data:
                result["selected_major_name"] = major_resp.data.get("major_name")

        if data.get("minor_id"):
            minor_resp = supabase.from_("unsw_specialisations").select("major_name").eq("id", data["minor_id"]).maybe_single().execute()
            if minor_resp.data:
                result["selected_minor_name"] = minor_resp.data.get("major_name")

        if data.get("honours_id"):
            honours_resp = supabase.from_("unsw_specialisations").select("major_name").eq("id", data["honours_id"]).maybe_single().execute()
            if honours_resp.data:
                result["selected_honours_name"] = honours_resp.data.get("major_name")

        return result

    except Exception as e:
        print(f"[fetch_user_specialisation_context] Error: {e}")
        return {
            "selected_major_name": None,
            "selected_minor_name": None,
            "selected_honours_name": None,
        }