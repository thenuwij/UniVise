import logging
from typing import Any, Dict, List
from app.core.database import supabase
import json
import re

logger = logging.getLogger(__name__)


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
        logger.info("Missing degree_code in fetch_program_core_courses.")
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
            logger.info(f"No sections found for degree_code {degree_code}")
            return []

        sections_data = result.data[0].get("sections")
        sections = parse_sections_json(sections_data)
        core_courses = extract_core_courses_from_sections(sections)
        return enrich_courses_with_db_details(core_courses)
    except Exception as e:
        logger.error(f"fetch_program_core_courses failed for {degree_code}: {e}")
        return []
    

COURSE_CODE = re.compile(r"^[A-Z]{4}\d{4}$")


def normalise_program_name(name: str) -> str:
    name = re.sub(r"\s+-\s+[a-z]+(\s*\(hons\))?\s*$", "", (name or "").lower())
    name = re.sub(r"\(honours\)|\(hons\)|bachelor of", "", name)
    return re.sub(r"[^a-z]+", " ", name).strip()


def component_degree_codes(degree_code: str, program_name: str) -> list:
    codes = [degree_code]
    if program_name and "/" in program_name:
        singles = supabase.from_("unsw_degrees_final").select("degree_code, program_name").not_.like("program_name", "%/%").execute().data or []
        by_name = {normalise_program_name(r["program_name"]): r["degree_code"] for r in singles}
        codes += [by_name[n] for n in (normalise_program_name(p) for p in program_name.split("/")) if n in by_name]
    return codes


def fetch_specialisation_ids(user_id: str, degree_code: str, program_name: str) -> List[str]:
    try:
        rows = (
            supabase.from_("user_specialisation_selections")
            .select("major_id, minor_id, honours_id")
            .eq("user_id", user_id)
            .in_("degree_code", component_degree_codes(degree_code, program_name))
            .execute()
            .data
            or []
        )
    except Exception as e:
        logger.error(f"fetch_specialisation_ids failed for {degree_code}: {e}")
        return []
    return sorted({r[k] for r in rows for k in ("major_id", "minor_id", "honours_id") if r.get(k)})


SOCIETY_CATEGORIES = [
    "Faculty & Constituent",
    "Academic",
    "Professional & Networking",
    "Technology & Projects",
    "Creative Arts & Performance",
    "Charity & Social Impact",
    "Community & Inclusion",
    "International & Cultural",
]


def fetch_society_rows() -> List[Dict[str, Any]]:
    try:
        return (
            supabase.table("unsw_societies")
            .select("name, arc_category, short_name")
            .in_("arc_category", SOCIETY_CATEGORIES)
            .order("name")
            .execute()
            .data
            or []
        )
    except Exception as e:
        logger.warning(f"fetch_society_rows failed: {e}")
        return []


SPECIALISATION_SLOTS = {"Honours": "honours", "Minor": "minor"}


def fetch_specialisation_context(specialisation_ids: List[str]) -> Dict[str, Any]:
    context: Dict[str, Any] = {}
    for slot in ("major", "minor", "honours"):
        context[f"selected_{slot}_name"] = None
        context[f"selected_{slot}_courses"] = []
    context["selected_major_codes"] = []
    if not specialisation_ids:
        return context
    try:
        rows = (
            supabase.from_("unsw_specialisations")
            .select("id, major_code, major_name, specialisation_type, sections")
            .in_("id", specialisation_ids)
            .execute()
            .data
            or []
        )
    except Exception as e:
        logger.error(f"fetch_specialisation_context failed: {e}")
        return context
    names: Dict[str, List[str]] = {"major": [], "minor": [], "honours": []}
    for row in sorted(rows, key=lambda r: specialisation_ids.index(r["id"])):
        slot = SPECIALISATION_SLOTS.get(row.get("specialisation_type"), "major")
        if row.get("major_name"):
            names[slot].append(row["major_name"])
        if row.get("specialisation_type") == "Major" and row.get("major_code"):
            context["selected_major_codes"].append(row["major_code"])
        for code in extract_core_course_codes_from_sections(row.get("sections")):
            if code not in context[f"selected_{slot}_courses"]:
                context[f"selected_{slot}_courses"].append(code)
    for slot, found in names.items():
        if found:
            context[f"selected_{slot}_name"] = " and ".join(found)
    return context


def fetch_specialisation_options(degree_code: str, program_name: str) -> List[Dict[str, str]]:
    options: Dict[str, Dict[str, str]] = {}
    try:
        for code in component_degree_codes(degree_code, program_name):
            rows = (
                supabase.from_("unsw_specialisations")
                .select("id, major_code, major_name")
                .contains("sections_degrees", json.dumps([{"degree_code": code}]))
                .in_("specialisation_type", ["Major", "Honours"])
                .order("major_name")
                .execute()
                .data
                or []
            )
            for row in rows:
                if row.get("major_code") and row.get("major_name"):
                    options.setdefault(row["major_code"], {"id": row["id"], "code": row["major_code"], "name": row["major_name"]})
    except Exception as e:
        logger.error(f"fetch_specialisation_options failed for {degree_code}: {e}")
        return []
    return list(options.values())


def fetch_program_course_list(degree_code: str, extra_codes: List[str] | None = None) -> List[Dict[str, str]]:
    courses: Dict[str, Dict[str, str]] = {}
    if degree_code:
        try:
            result = (
                supabase.from_("unsw_degrees_final")
                .select("sections")
                .eq("degree_code", degree_code)
                .limit(1)
                .execute()
            )
            sections = parse_sections_json(result.data[0].get("sections")) if result.data else []
            for section in sections:
                if not isinstance(section, dict):
                    continue
                for course in section.get("courses") or []:
                    code = (course.get("code") or "").strip().upper() if isinstance(course, dict) else ""
                    if COURSE_CODE.match(code):
                        courses.setdefault(code, {
                            "name": course.get("name") or "",
                            "section": section.get("title") or "",
                            "section_rule": (section.get("description") or "").strip()[:160],
                        })
        except Exception as e:
            logger.error(f"fetch_program_course_list failed for {degree_code}: {e}")

    missing = [
        c.strip().upper() for c in extra_codes or []
        if c and COURSE_CODE.match(c.strip().upper()) and c.strip().upper() not in courses
    ]
    if missing:
        titles: Dict[str, str] = {}
        try:
            rows = supabase.from_("unsw_courses").select("code, title").in_("code", missing).execute().data or []
            titles = {row["code"]: row.get("title") or "" for row in rows}
        except Exception as e:
            logger.error(f"Course title lookup failed: {e}")
        for code in missing:
            courses.setdefault(code, {"name": titles.get(code, ""), "section": "Chosen specialisation", "section_rule": ""})

    return [{"code": code, **details} for code, details in courses.items()]


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
        logger.error(f"Error parsing sections JSON: {e}")
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
        logger.error(f"Error enriching course details: {e}")
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
        logger.error(f"Error fetching degree: {e}")

    if not degree:
        logger.info(f"No degree found for id={degree_id}, uac={uac_code}, name={program_name}")
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
# Extract CORE course codes from sections JSON. 
# Filters out electives and only returns core/required courses.
def extract_core_course_codes_from_sections(sections_data) -> List[str]:

    if not sections_data:
        return []

    try:
        sections = json.loads(sections_data) if isinstance(sections_data, str) else sections_data
        if not isinstance(sections, list):
            return []

        codes = []
        for section in sections:
            if not isinstance(section, dict):
                continue
            title = (section.get("title") or "").lower()
            if "overview" in title or "general education" in title or "flexible" in title:
                continue
            if "elective" in title and "prescribed" not in title:
                continue
            for course in section.get("courses") or []:
                if isinstance(course, dict) and course.get("code") and course["code"] not in codes:
                    codes.append(course["code"])
        return codes

    except Exception as e:
        logger.error(f"[extract_core_courses_from_sections] Error: {e}")
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