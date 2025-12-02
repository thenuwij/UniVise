from typing import Any, Dict, List
from app.utils.database import supabase
import json


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

# Helper functions for Capstone (Program Highlights section) in roadmap unsw
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



# Helper functions for general UNSW roadmap mode
# Fetch a specific UNSW degree entry from Supabase using an identifier that matches.
def fetch_degree_by_identifier(degree_id=None, uac_code=None, program_name=None) -> Dict[str, Any]:

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
            # try exact match
            result = (
                supabase.from_("unsw_degrees_final")
                .select("*")
                .eq("program_name", program_name.strip())
                .maybe_single()
                .execute()
            )
            degree = getattr(result, "data", None)

            # fallback to partial case-insensitive match if nothing found
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
        print(f"No degree found for id={degree_id}, uac={uac_code}, name={program_name}")
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


# Helper functions for flexibility section
# Extract all course codes from json flexibility structure
def extract_all_course_codes(sections: list) -> List[str]:

    course_codes = []
    
    for section in sections:
        # Skip sections without courses (like Free Electives, General Education)
        if 'courses' in section and section['courses']:
            for course in section['courses']:
                if 'code' in course and course['code']:
                    course_codes.append(course['code'])
    
    return course_codes

# Format selected degrees for AI prompt with all the relevant details
def format_candidates_for_ai(candidates: List[Dict[str, Any]]) -> str:

    formatted = ""
    
    for i, candidate in enumerate(candidates, 1):
        shared_courses_str = ", ".join(candidate.get('shared_courses', [])[:8])  # Show first 8
        if len(candidate.get('shared_courses', [])) > 8:
            shared_courses_str += f" (and {len(candidate['shared_courses']) - 8} more)"
        
        spec = candidate.get('specialisation')
        
        if spec:
            spec_name = spec.get('spec_name', '')
            spec_type = spec.get('spec_type', '')
            program_display = f"{candidate['program_name']} + {spec_name} ({spec_type})"
        else:
            program_display = candidate['program_name']
        
        formatted += f"""
{i}. {program_display}
   Faculty: {candidate['faculty']}
   Course Overlap: {candidate['overlap_percentage']:.1f}% ({candidate['overlap_count']}/{candidate['total_current_courses']} courses)
   Shared Courses: {shared_courses_str}
   Total Courses in Target: {candidate['total_target_courses']}"""
        
        if spec:
            formatted += f"""
     RECOMMENDED SPECIALIZATION: {spec.get('spec_name')} ({spec.get('spec_type')})
   This specialization significantly improves course overlap"""
        
        formatted += "\n"
    
    return formatted

# Fetches the user's selected specialisations with CORE COURSES.
def fetch_user_specialisation_context(user_id: str, degree_code: str) -> Dict[str, Any]:

    if not user_id or not degree_code:
        return {
            "selected_major_name": None,
            "selected_major_courses": [],
            "selected_minor_name": None,
            "selected_minor_courses": [],
            "selected_honours_name": None,
            "selected_honours_courses": [],
        }

    try:
        # Get specialisation IDs
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
                "selected_major_courses": [],
                "selected_minor_name": None,
                "selected_minor_courses": [],
                "selected_honours_name": None,
                "selected_honours_courses": [],
            }

        result = {
            "selected_major_name": None,
            "selected_major_courses": [],
            "selected_minor_name": None,
            "selected_minor_courses": [],
            "selected_honours_name": None,
            "selected_honours_courses": [],
        }

        # Fetch details from unsw_specialisations
        if data.get("major_id"):
            major_resp = supabase.from_("unsw_specialisations")\
                .select("major_name, sections, overview_description")\
                .eq("id", data["major_id"])\
                .maybe_single()\
                .execute()
            
            if major_resp.data:
                result["selected_major_name"] = major_resp.data.get("major_name")
                result["selected_major_overview"] = major_resp.data.get("overview_description")
                result["selected_major_courses"] = extract_core_course_codes_from_sections(
                    major_resp.data.get("sections")
                )

        if data.get("minor_id"):
            minor_resp = supabase.from_("unsw_specialisations")\
                .select("major_name, sections, overview_description")\
                .eq("id", data["minor_id"])\
                .maybe_single()\
                .execute()
            
            if minor_resp.data:
                result["selected_minor_name"] = minor_resp.data.get("major_name")
                result["selected_minor_overview"] = minor_resp.data.get("overview_description")
                result["selected_minor_courses"] = extract_core_course_codes_from_sections(
                    minor_resp.data.get("sections")
                )

        if data.get("honours_id"):
            honours_resp = supabase.from_("unsw_specialisations")\
                .select("major_name, sections, overview_description")\
                .eq("id", data["honours_id"])\
                .maybe_single()\
                .execute()
            
            if honours_resp.data:
                result["selected_honours_name"] = honours_resp.data.get("major_name")
                result["selected_honours_overview"] = honours_resp.data.get("overview_description")
                result["selected_honours_courses"] = extract_core_course_codes_from_sections(
                    honours_resp.data.get("sections")
                )

        return result

    except Exception as e:
        print(f"[fetch_user_specialisation_context] Error: {e}")
        return {
            "selected_major_name": None,
            "selected_major_courses": [],
            "selected_minor_name": None,
            "selected_minor_courses": [],
            "selected_honours_name": None,
            "selected_honours_courses": [],
        }

# Extract CORE course codes from sections JSON. 
# Filters out electives and only returns core/required courses.
def extract_core_course_codes_from_sections(sections_data) -> List[str]:

    if not sections_data:
        return []
    
    try:
        # Parse JSON if string
        if isinstance(sections_data, str):
            sections = json.loads(sections_data)
        else:
            sections = sections_data
        
        if not isinstance(sections, list):
            return []
        
        core_course_codes = []
        
        # Keywords that indicate CORE courses (not electives)
        core_keywords = [
            "core", "required", "compulsory", "thesis", "project", 
            "capstone", "honours", "stream core", "disciplinary"
        ]
        
        # Keywords that indicate ELECTIVES (skip these)
        elective_keywords = [
            "elective", "flexible", "general education", "free elective"
        ]
        
        for section in sections:
            if not isinstance(section, dict):
                continue
            
            title = section.get("title", "").lower()
            
            # Skip overview sections
            if "overview" in title:
                continue
            
            # Skip elective sections
            if any(keyword in title for keyword in elective_keywords):
                continue
            
            # Only include core sections
            if any(keyword in title for keyword in core_keywords):
                courses = section.get("courses", [])
                if isinstance(courses, list):
                    for course in courses:
                        if isinstance(course, dict) and course.get("code"):
                            core_course_codes.append(course["code"])
        
        return core_course_codes
    
    except Exception as e:
        print(f"[extract_core_courses_from_sections] Error: {e}")
        return []
    

# Calculate overlap percentage with specialization courses weighted more heavily.
def calculate_overlap_weighted(
    current_courses: List[str],
    target_courses: List[str],
    spec_course_codes: List[str] = None
) -> float:

    if not current_courses:
        return 0.0
    
    current_set = set(current_courses)
    target_set = set(target_courses)
    shared = current_set & target_set
    
    if not spec_course_codes:
        # No specs selected - use normal calculation
        return (len(shared) / len(current_courses)) * 100
    
    spec_set = set(spec_course_codes)
    
    # Calculate weighted total
    weighted_total = 0
    for course in current_courses:
        if course in spec_set:
            weighted_total += 1.5  # Spec courses count 1.5x
        else:
            weighted_total += 1.0  # Base courses count 1.0x
    
    # Calculate weighted shared
    weighted_shared = 0
    for course in shared:
        if course in spec_set:
            weighted_shared += 1.5
        else:
            weighted_shared += 1.0
    
    return (weighted_shared / weighted_total) * 100