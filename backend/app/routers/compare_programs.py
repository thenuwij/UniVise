"""
Program Comparison API - Calculate transfer credits and requirements between programs
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
import json

from app.utils.database import supabase

router = APIRouter()

# ---- Pydantic models --------------------------------------------------------


class ProgramComparisonRequest(BaseModel):
    user_id: str
    base_program_code: str
    base_specialisation_codes: List[str] = []
    target_program_code: str
    target_specialisation_codes: List[str] = []


class CourseTransferInfo(BaseModel):
    course_code: str
    course_name: str
    uoc: int
    transfers: bool
    category: Optional[str] = None
    mark: Optional[float] = None
    match_type: Optional[str] = None  # "exact", "equivalent", "elective", etc.
    matched_target_code: Optional[str] = None


class PrerequisiteIssue(BaseModel):
    course_code: str
    course_name: str
    required_prerequisite: str
    issue_description: str


class ProgramComparisonResponse(BaseModel):
    base_program: Dict[str, Any]
    target_program: Dict[str, Any]
    courses_that_transfer: List[CourseTransferInfo]
    courses_that_dont_transfer: List[CourseTransferInfo]
    courses_needed: List[Dict[str, Any]]
    uoc_transferred: int
    uoc_needed: int
    transfer_percentage: float
    total_new_courses_required: int
    prerequisite_issues: List[PrerequisiteIssue]
    compatibility_score: float
    estimated_additional_terms: int
    # New, richer fields
    progress_towards_target: float
    switch_difficulty_score: float
    difficulty_label: str


# ---- Helper functions -------------------------------------------------------


def parse_prerequisites(conditions_text: str) -> List[str]:
    """
    Extract course codes from prerequisite text
    Example: "Prerequisite: LEGT2751 or TABL2751 or LAWS3147"
    Returns: ["LEGT2751", "TABL2751", "LAWS3147"]
    """
    if not conditions_text:
        return []

    course_pattern = r"\b[A-Z]{4}\d{4}\b"
    courses = re.findall(course_pattern, conditions_text)
    return list(set(courses))


def check_prerequisite_issues(
    completed_courses: List[str],
    target_courses: List[Dict[str, Any]],
) -> List[PrerequisiteIssue]:
    """
    Check if student has prerequisite issues for target program courses
    """
    issues: List[PrerequisiteIssue] = []
    completed_set = set(completed_courses)

    for course in target_courses:
        course_code = course.get("code", "")
        course_name = course.get("title", "")
        prereq_text = course.get("conditions_for_enrolment", "")

        if not prereq_text or "prerequisite" not in prereq_text.lower():
            continue

        required_courses = parse_prerequisites(prereq_text)
        if required_courses:
            missing_prereqs = [p for p in required_courses if p not in completed_set]

            if course_code not in completed_set and missing_prereqs:
                issues.append(
                    PrerequisiteIssue(
                        course_code=course_code,
                        course_name=course_name,
                        required_prerequisite=", ".join(missing_prereqs),
                        issue_description=f"Missing prerequisite(s): {', '.join(missing_prereqs)}",
                    )
                )

    return issues


def calculate_compatibility_score(
    transfer_percentage: float,
    prerequisite_issues_count: int,
    uoc_needed: int,
    total_uoc_required: int,
) -> float:
    """
    Calculate overall compatibility score (0-100)
    Factors: transfer %, prereq issues, remaining work
    """
    score = transfer_percentage

    # Penalty for prerequisite issues (up to -20 points)
    prereq_penalty = min(prerequisite_issues_count * 5, 20)
    score -= prereq_penalty

    # Bonus if almost complete (>80% done)
    progress = ((total_uoc_required - uoc_needed) / max(total_uoc_required, 1)) * 100
    if progress > 80:
        score += 10

    return max(0.0, min(100.0, score))


def estimate_additional_terms(uoc_needed: int, avg_uoc_per_term: int = 18) -> int:
    """
    Estimate how many additional terms needed
    Assumes average 18 UOC per term (3 courses)
    """
    if uoc_needed <= 0:
        return 0
    return (uoc_needed + avg_uoc_per_term - 1) // avg_uoc_per_term


def infer_course_level(code: str) -> int:
    """
    Roughly infer course level from 5th character:
    e.g. COMP1511 -> 1, BINF3010 -> 3
    """
    if len(code) >= 5 and code[4].isdigit():
        return int(code[4])
    return 0


# Simple, extendable equivalence map. You can grow this with real UNSW data.
COURSE_EQUIVALENCE_GROUPS = [
    {"MATH1131", "MATH1141"},
    {"MATH1231", "MATH1241"},
    {"PHYS1121", "PHYS1131"},
    {"CHEM1011", "CHEM1031"},
    # Add more equivalence groups here as needed
]


def get_equivalent_codes(course_code: str) -> List[str]:
    """
    Given a course code, return other codes that are considered equivalent.
    """
    equivalents: List[str] = []
    for group in COURSE_EQUIVALENCE_GROUPS:
        if course_code in group:
            equivalents.extend(list(group - {course_code}))
    return equivalents


def compute_difficulty_score(
    courses_needed: List[Dict[str, Any]],
    prerequisite_issues: List[PrerequisiteIssue],
    base_program: Dict[str, Any],
    target_program: Dict[str, Any],
    uoc_needed: int,
    total_uoc_required: int,
) -> (float, str):
    """
    Heuristic difficulty score 0-100 + label.
    Higher means harder switch.
    """
    score = 0.0

    # 1) Remaining workload (up to 40 points)
    remaining_ratio = uoc_needed / max(total_uoc_required, 1)
    score += min(40.0, remaining_ratio * 40.0)  # 0–40

    # 2) Prerequisite issues (up to 25 points)
    score += min(25.0, len(prerequisite_issues) * 5.0)

    # 3) Advanced courses remaining (up to 20 points)
    advanced_needed = sum(1 for c in courses_needed if infer_course_level(c.get("code", "")) >= 3)
    score += min(20.0, advanced_needed * 2.0)

    # 4) Faculty change penalty (up to 15 points)
    base_fac = (base_program.get("faculty") or "").strip()
    target_fac = (target_program.get("faculty") or "").strip()
    if base_fac and target_fac and base_fac != target_fac:
        score += 10.0

    score = max(0.0, min(100.0, score))

    if score <= 33:
        label = "Low"
    elif score <= 66:
        label = "Moderate"
    else:
        label = "High"

    return score, label


def extract_courses_from_sections(
    sections_raw: Any,
    default_category: str = "Program Requirement",
) -> List[Dict[str, Any]]:
    """
    Extract course dicts (code, title, uoc, category) from the sections JSON
    used in unsw_degrees_final and unsw_specialisations.
    """
    if not sections_raw:
        return []

    if isinstance(sections_raw, str):
        try:
            sections = json.loads(sections_raw)
        except Exception:
            return []
    else:
        sections = sections_raw

    courses: Dict[str, Dict[str, Any]] = {}

    for section in sections:
        if not isinstance(section, dict):
            continue

        sec_title = section.get("title") or default_category
        sec_courses = section.get("courses") or []

        for c in sec_courses:
            code = c.get("code")
            if not code:
                continue

            # uoc in specialisations is often int already; in courses table it's a string
            uoc_val = c.get("uoc", 0)
            try:
                uoc_int = int(uoc_val)
            except Exception:
                uoc_int = 0

            if code not in courses:
                courses[code] = {
                    "code": code,
                    "title": c.get("name") or "",
                    "uoc": uoc_int,
                    "category": sec_title,
                    "conditions_for_enrolment": "",
                }

    return list(courses.values())


def enrich_courses_with_conditions(
    course_list: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Batch-fetch conditions_for_enrolment from 'courses' table for codes in course_list.
    """
    if not course_list:
        return course_list

    codes = [c["code"] for c in course_list]
    codes = list({c for c in codes if c})  # dedupe

    if not codes:
        return course_list

    try:
        resp = (
            supabase.table("courses")
            .select("code,conditions_for_enrolment")
            .in_("code", codes)
            .execute()
        )
    except Exception:
        return course_list

    data = resp.data or []
    cond_map = {row["code"]: row.get("conditions_for_enrolment", "") for row in data}

    for c in course_list:
        if not c.get("conditions_for_enrolment"):
            c["conditions_for_enrolment"] = cond_map.get(c["code"], "")

    return course_list


# ---- Main endpoint ----------------------------------------------------------


@router.post("/compare", response_model=ProgramComparisonResponse)
async def compare_programs(request: ProgramComparisonRequest):
    """
    Compare two programs and calculate transfer credits, requirements, and compatibility.
    Uses:
    - unsw_degrees_final for base/target programs
    - unsw_specialisations for majors/minors/honours (target_specialisation_codes)
    - user_completed_courses for student's history
    """
    try:
        # 1. Get user's completed courses
        completed_response = (
            supabase.table("user_completed_courses")
            .select("*")
            .eq("user_id", request.user_id)
            .eq("is_completed", True)
            .execute()
        )
        completed_courses = completed_response.data or []
        completed_course_codes = [c["course_code"] for c in completed_courses]
        completed_set = set(completed_course_codes)

        # 2. Get base & target program records
        base_program_resp = (
            supabase.table("unsw_degrees_final")
            .select("*")
            .eq("degree_code", request.base_program_code)
            .single()
            .execute()
        )
        base_program = base_program_resp.data

        target_program_resp = (
            supabase.table("unsw_degrees_final")
            .select("*")
            .eq("degree_code", request.target_program_code)
            .single()
            .execute()
        )
        target_program = target_program_resp.data

        if not base_program or not target_program:
            raise HTTPException(status_code=404, detail="Program not found")

        # 3. Extract program-level target courses from sections
        target_prog_courses = extract_courses_from_sections(
            target_program.get("sections"), default_category="Program Requirement"
        )

        # 4. Extract specialisation courses for selected target specialisations
        target_spec_courses: List[Dict[str, Any]] = []
        if request.target_specialisation_codes:
            spec_resp = (
                supabase.table("unsw_specialisations")
                .select("*")
                .in_("major_code", request.target_specialisation_codes)
                .execute()
            )
            specials = spec_resp.data or []
            for spec in specials:
                spec_sections = spec.get("sections")
                spec_courses = extract_courses_from_sections(
                    spec_sections,
                    default_category=spec.get("specialisation_type") or "Specialisation",
                )
                target_spec_courses.extend(spec_courses)

        # Merge & dedupe target courses
        all_target_courses_map: Dict[str, Dict[str, Any]] = {}
        for c in target_prog_courses + target_spec_courses:
            code = c["code"]
            if code not in all_target_courses_map:
                all_target_courses_map[code] = c
            else:
                # Prefer non-empty title/category
                if not all_target_courses_map[code].get("title") and c.get("title"):
                    all_target_courses_map[code]["title"] = c["title"]
                if c.get("category"):
                    all_target_courses_map[code]["category"] = c["category"]

        target_courses_full = list(all_target_courses_map.values())

        # Enrich with conditions_for_enrolment from 'courses' table
        target_courses_full = enrich_courses_with_conditions(target_courses_full)

        target_course_codes = [c["code"] for c in target_courses_full]

        # 5. Determine which completed courses transfer
        courses_that_transfer: List[CourseTransferInfo] = []
        courses_that_dont_transfer: List[CourseTransferInfo] = []
        uoc_transferred = 0

        # Prebuild a map for the target courses
        target_by_code = {c["code"]: c for c in target_courses_full}

        for completed in completed_courses:
            c_code = completed["course_code"]
            c_name = completed.get("course_name") or ""
            c_uoc = completed.get("uoc") or 0
            c_cat = completed.get("category")
            c_mark = completed.get("mark")

            match_type = None
            matched_target_code = None

            # 5a) exact match
            if c_code in target_by_code:
                match_type = "exact"
                matched_target_code = c_code
            else:
                # 5b) equivalence group match
                eq_codes = get_equivalent_codes(c_code)
                for eq in eq_codes:
                    if eq in target_by_code:
                        match_type = "equivalent"
                        matched_target_code = eq
                        break

            transfers = match_type is not None

            transfer_info = CourseTransferInfo(
                course_code=c_code,
                course_name=c_name,
                uoc=c_uoc,
                transfers=transfers,
                category=c_cat,
                mark=c_mark,
                match_type=match_type,
                matched_target_code=matched_target_code,
            )

            if transfers:
                courses_that_transfer.append(transfer_info)
                # Count only positive-UOC courses towards UOC transferred
                if c_uoc > 0:
                    uoc_transferred += c_uoc
            else:
                courses_that_dont_transfer.append(transfer_info)

        # 6. Courses still needed (target courses not already completed or matched)
        matched_target_codes = {
            c.matched_target_code
            for c in courses_that_transfer
            if c.matched_target_code
        }
        needed_courses = [
            c
            for c in target_courses_full
            if c["code"] not in completed_set
            and c["code"] not in matched_target_codes
        ]

        total_uoc_required = int(target_program.get("minimum_uoc") or target_program.get("total_uoc") or 144)
        # Only count positive-UOC courses for "needed" UOC
        uoc_needed = max(
            0,
            total_uoc_required - uoc_transferred,
        )

        total_completed = len(completed_courses)
        transfer_percentage = (
            (len(courses_that_transfer) / total_completed * 100.0)
            if total_completed > 0
            else 0.0
        )

        # 7. Check prerequisite issues against needed courses
        prerequisite_issues = check_prerequisite_issues(
            completed_course_codes, needed_courses
        )

        # 8. Compatibility score
        compatibility_score = calculate_compatibility_score(
            transfer_percentage,
            len(prerequisite_issues),
            uoc_needed,
            total_uoc_required,
        )

        # Progress towards target degree (in UOC terms)
        progress_towards_target = (
            (total_uoc_required - uoc_needed) / max(total_uoc_required, 1) * 100.0
        )

        # 9. Difficulty score
        difficulty_score, difficulty_label = compute_difficulty_score(
            needed_courses,
            prerequisite_issues,
            base_program,
            target_program,
            uoc_needed,
            total_uoc_required,
        )

        # 10. Estimate additional terms
        estimated_terms = estimate_additional_terms(uoc_needed)

        return ProgramComparisonResponse(
            base_program={
                "code": base_program["degree_code"],
                "name": base_program["program_name"],
                "total_uoc": base_program.get("minimum_uoc")
                or base_program.get("total_uoc")
                or 144,
                "faculty": base_program.get("faculty"),
            },
            target_program={
                "code": target_program["degree_code"],
                "name": target_program["program_name"],
                "total_uoc": total_uoc_required,
                "faculty": target_program.get("faculty"),
            },
            courses_that_transfer=courses_that_transfer,
            courses_that_dont_transfer=courses_that_dont_transfer,
            courses_needed=needed_courses,
            uoc_transferred=uoc_transferred,
            uoc_needed=uoc_needed,
            transfer_percentage=round(transfer_percentage, 1),
            total_new_courses_required=len(needed_courses),
            prerequisite_issues=prerequisite_issues,
            compatibility_score=round(compatibility_score, 1),
            estimated_additional_terms=estimated_terms,
            progress_towards_target=round(progress_towards_target, 1),
            switch_difficulty_score=round(difficulty_score, 1),
            difficulty_label=difficulty_label,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing programs: {str(e)}")
