"""
Program Comparison API (REDESIGNED) - Clear, actionable transfer analysis
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
import json
import logging
from datetime import datetime, timedelta

from app.utils.database import supabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# ---- Pydantic models --------------------------------------------------------

class ProgramComparisonRequest(BaseModel):
    user_id: str
    base_program_code: str
    base_specialisation_codes: List[str] = []
    target_program_code: str
    target_specialisation_codes: List[str] = []


class SimpleCourse(BaseModel):
    code: str
    name: str
    uoc: int
    level: int
    mark: Optional[float] = None


class LevelGroup(BaseModel):
    level: int
    level_name: str  # "Level 1", "Level 2", etc.
    courses: List[Dict[str, Any]]
    total_courses: int
    total_uoc: int
    has_prerequisite_issues: bool


class CriticalIssue(BaseModel):
    type: str  # "prerequisite_chain", "faculty_change", "advanced_requirements"
    severity: str  # "high", "medium", "low"
    message: str
    affected_courses: List[str]
    impact: str  # Human-readable impact


class ProgramComparisonResponse(BaseModel):
    # Simple yes/no/maybe answer
    can_transfer: bool
    recommendation: str  # "Easy Transfer", "Moderate Effort", "Significant Commitment", "Very Difficult"
    
    # Summary stats (only the essential ones)
    summary: Dict[str, Any]
    
    # What transfers
    transfer_analysis: Dict[str, Any]
    
    # What you need - GROUPED BY LEVEL
    requirements_by_level: Dict[str, LevelGroup]
    
    # Critical blockers
    critical_issues: List[CriticalIssue]
    
    # Optional: detailed breakdown (for advanced view)
    detailed_breakdown: Optional[Dict[str, Any]] = None


# ---- Helper functions -------------------------------------------------------

def infer_course_level(code: str) -> int:
    """Extract level from course code (COMP1511 -> 1)"""
    if len(code) >= 5 and code[4].isdigit():
        return int(code[4])
    return 0


def get_level_name(level: int) -> str:
    """Convert level number to readable name"""
    if level == 0:
        return "Uncategorized"
    else:
        return f"Level {level}"


COURSE_EQUIVALENCE_GROUPS = [
    {"MATH1131", "MATH1141"},  # Mathematics 1A (standard and higher)
    {"MATH1231", "MATH1241"},  # Mathematics 1B (standard and higher)
    {"PHYS1121", "PHYS1131"},  # Physics (standard and higher)
    {"CHEM1011", "CHEM1031"},  # Chemistry (standard and higher)
    {"MATH1081", "MATH1091"},  # Discrete Maths (standard and higher)
    # Add more as needed
]


def get_equivalent_codes(course_code: str) -> List[str]:
    """Get equivalent course codes"""
    equivalents: List[str] = []
    for group in COURSE_EQUIVALENCE_GROUPS:
        if course_code in group:
            equivalents.extend(list(group - {course_code}))
    return equivalents


def parse_prerequisites(conditions_text: str) -> Dict[str, Any]:
    """
    Parse prerequisite text and return structured requirement.
    
    HANDLES:
    1. Simple: "COMP1511" → single
    2. Pure OR: "COMP1511 or COMP1917" → or
    3. Pure AND: "COMP1511 and COMP1521" → and
    4. Parentheses: "COMP1531 AND (COMP2521 OR COMP1927)" → mixed with or_groups
    
    Returns:
    {
        "type": "single" | "or" | "and" | "mixed",
        "courses": [...],  # Required courses
        "or_groups": [[...], [...]]  # Groups where you need ONE from each
    }
    """
    if not conditions_text:
        logger.debug("No conditions text provided")
        return {"type": "none", "courses": []}
    
    # Extract all course codes
    course_pattern = r"\b[A-Z]{4}\d{4}\b"
    all_courses = re.findall(course_pattern, conditions_text)
    
    if not all_courses:
        return {"type": "none", "courses": []}
    
    unique_courses = list(dict.fromkeys(all_courses))  # Preserve order
    
    if len(unique_courses) == 1:
        return {"type": "single", "courses": unique_courses}
    
    conditions_lower = conditions_text.lower()
    
    # Check for parentheses - indicates grouped OR within AND
    if "(" in conditions_text and ")" in conditions_text:
        logger.debug(f"Detected parentheses in: {conditions_text}")
        
        # Extract content in parentheses
        paren_pattern = r'\(([^)]+)\)'
        paren_matches = re.findall(paren_pattern, conditions_text)
        
        or_groups = []
        and_courses = []
        
        for match in paren_matches:
            # Extract courses from this parenthesized section
            group_courses = re.findall(course_pattern, match)
            if " or " in match.lower() and len(group_courses) > 1:
                # This is an OR group
                or_groups.append(group_courses)
            else:
                # Parentheses but no OR - just required courses
                and_courses.extend(group_courses)
        
        # Get courses OUTSIDE parentheses
        # Remove parenthesized sections and find remaining courses
        text_without_parens = re.sub(paren_pattern, '', conditions_text)
        outside_courses = re.findall(course_pattern, text_without_parens)
        and_courses.extend(outside_courses)
        
        # Remove duplicates while preserving order
        and_courses = list(dict.fromkeys(and_courses))
        
        if or_groups:
            logger.debug(f"Mixed logic: and_courses={and_courses}, or_groups={or_groups}")
            return {
                "type": "mixed",
                "courses": and_courses,
                "or_groups": or_groups
            }
        else:
            # Had parentheses but no OR groups - treat as AND
            return {"type": "and", "courses": unique_courses}
    
    # No parentheses - check for OR vs AND
    or_count = conditions_lower.count(" or ")
    and_count = conditions_lower.count(" and ")
    
    if or_count > 0 and and_count == 0:
        # Pure OR
        logger.debug(f"Pure OR: {unique_courses}")
        return {"type": "or", "courses": unique_courses}
    
    elif and_count > 0 and or_count == 0:
        # Pure AND
        logger.debug(f"Pure AND: {unique_courses}")
        return {"type": "and", "courses": unique_courses}
    
    elif and_count > 0 and or_count > 0:
        # Mixed without parentheses - e.g., "A or B and C"
        # Interpret as: (A or B) and C (OR has lower precedence)
        logger.debug(f"Mixed AND/OR without parens: {conditions_text}")
        
        # Split by "and" 
        and_parts = re.split(r'\s+and\s+', conditions_lower)
        
        or_groups = []
        and_courses = []
        
        # Get the original text parts (preserve case)
        original_parts = re.split(r'\s+and\s+', conditions_text, flags=re.IGNORECASE)
        
        for i, part_lower in enumerate(and_parts):
            if i < len(original_parts):
                part_original = original_parts[i]
                part_courses = re.findall(course_pattern, part_original)
                
                if " or " in part_lower and len(part_courses) > 1:
                    # This part is an OR group
                    or_groups.append(part_courses)
                else:
                    # Single required course(s)
                    and_courses.extend(part_courses)
        
        if or_groups:
            and_courses = list(dict.fromkeys(and_courses))
            logger.debug(f"Mixed: and_courses={and_courses}, or_groups={or_groups}")
            return {
                "type": "mixed",
                "courses": and_courses,
                "or_groups": or_groups
            }
        else:
            # Shouldn't reach here, but fallback to AND
            return {"type": "and", "courses": unique_courses}
    
    else:
        # No clear AND/OR - single or default to AND
        return {"type": "and", "courses": unique_courses}


def check_prerequisite_satisfied(prereq_info: Dict[str, Any], completed_codes: set) -> tuple[bool, List[str]]:
    """
    Check if prerequisite requirement is satisfied.
    Returns (is_satisfied, missing_courses)
    
    IMPORTANT: Considers course equivalences (e.g., MATH1131 satisfies MATH1141 requirement)
    
    For OR: satisfied if ANY course is completed (including equivalents)
    For AND: satisfied if ALL courses are completed (including equivalents)
    For MIXED: satisfied if ALL and_courses completed AND at least one from each or_group
    For single: satisfied if the course is completed (including equivalents)
    """
    prereq_type = prereq_info.get("type", "none")
    courses = prereq_info.get("courses", [])
    or_groups = prereq_info.get("or_groups", [])
    
    if prereq_type == "none" or (not courses and not or_groups):
        return True, []
    
    # Helper function: check if a required course is satisfied by completed courses
    def is_course_completed(required_course: str, completed: set) -> bool:
        """Check if required course or any of its equivalents are completed"""
        if required_course in completed:
            return True
        # Check equivalents
        equivalents = get_equivalent_codes(required_course)
        return any(eq in completed for eq in equivalents)
    
    if prereq_type == "single":
        if is_course_completed(courses[0], completed_codes):
            return True, []
        return False, courses
    
    if prereq_type == "or":
        # Satisfied if ANY is completed (including equivalents)
        if any(is_course_completed(c, completed_codes) for c in courses):
            return True, []
        # All are missing - show all options
        return False, courses
    
    if prereq_type == "and":
        # Satisfied if ALL are completed (including equivalents)
        missing = [c for c in courses if not is_course_completed(c, completed_codes)]
        if not missing:
            return True, []
        return False, missing
    
    if prereq_type == "mixed":
        # Check AND courses (with equivalences)
        missing_and = [c for c in courses if not is_course_completed(c, completed_codes)]
        
        # Check OR groups - need at least one from each group (with equivalences)
        unsatisfied_groups = []
        for group in or_groups:
            if not any(is_course_completed(c, completed_codes) for c in group):
                # None from this group completed - add all as options
                unsatisfied_groups.append(group)
        
        # Combine: missing AND courses + unsatisfied OR groups
        all_missing = missing_and.copy()
        
        # For unsatisfied OR groups, add all options so frontend can show "ONE of: X OR Y OR Z"
        for group in unsatisfied_groups:
            all_missing.extend(group)
        
        if not all_missing:
            return True, []
        
        return False, all_missing
    
    return True, []


def extract_courses_from_sections(
    sections_raw: Any,
    default_category: str = "Program Requirement",
) -> List[Dict[str, Any]]:
    """Extract courses from program/specialisation sections"""
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
                    "level": infer_course_level(code),
                    "conditions_for_enrolment": "",
                }

    return list(courses.values())


def enrich_courses_with_conditions(
    course_list: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Fetch prerequisite conditions from unsw_courses table"""
    if not course_list:
        logger.info("No courses to enrich")
        return course_list

    codes = list({c["code"] for c in course_list if c.get("code")})
    if not codes:
        logger.warning("No valid course codes found to enrich")
        return course_list

    logger.info(f"Enriching {len(codes)} courses with prerequisite data")
    logger.debug(f"Course codes to fetch: {codes[:10]}...")  # Show first 10

    try:
        resp = supabase.table("unsw_courses").select("code,conditions_for_enrolment").in_("code", codes).execute()
        data = resp.data or []
        
        logger.info(f"Fetched conditions for {len(data)} courses from database")
        
        # Log sample of fetched data
        if data:
            sample = data[0]
            logger.debug(f"Sample fetched data: {sample['code']} -> {sample.get('conditions_for_enrolment', 'NONE')[:50]}...")
        
        cond_map = {row["code"]: row.get("conditions_for_enrolment", "") for row in data}
        
        # Count how many have actual conditions
        with_conditions = sum(1 for v in cond_map.values() if v and v.strip())
        logger.info(f"Courses with actual prerequisite data: {with_conditions}/{len(data)}")

        for c in course_list:
            if not c.get("conditions_for_enrolment"):
                fetched_condition = cond_map.get(c["code"], "")
                c["conditions_for_enrolment"] = fetched_condition
                if fetched_condition:
                    logger.debug(f"Added condition for {c['code']}: {fetched_condition[:50]}...")
    except Exception as e:
        logger.error(f"Error fetching course conditions: {str(e)}", exc_info=True)

    return course_list


def group_courses_by_level(courses: List[Dict[str, Any]], completed_codes: set) -> Dict[str, LevelGroup]:
    """Group courses by level with metadata"""
    logger.info(f"Grouping {len(courses)} courses by level")
    logger.info(f"Student has completed {len(completed_codes)} courses: {list(completed_codes)[:5]}...")
    
    grouped = {}
    total_prereq_issues = 0
    
    for course in courses:
        level = course.get("level", 0)
        if level not in grouped:
            grouped[level] = {
                "courses": [],
                "total_uoc": 0,
                "has_prereq_issues": False
            }
        
        # Parse prerequisite requirements
        conditions = course.get("conditions_for_enrolment", "")
        prereq_info = parse_prerequisites(conditions)
        is_satisfied, missing_prereqs = check_prerequisite_satisfied(prereq_info, completed_codes)
        
        has_issue = not is_satisfied
        
        if has_issue:
            logger.debug(f"{course['code']}: Missing prereqs {missing_prereqs} (type: {prereq_info.get('type')})")
            total_prereq_issues += 1
        
        grouped[level]["courses"].append({
            "code": course["code"],
            "name": course["title"],
            "uoc": course["uoc"],
            "category": course.get("category", ""),
            "has_prereq_issue": has_issue,
            "missing_prerequisites": missing_prereqs,
            "prereq_type": prereq_info.get("type", "none")  # Track type for display
        })
        grouped[level]["total_uoc"] += course["uoc"]
        if has_issue:
            grouped[level]["has_prereq_issues"] = True
    
    logger.info(f"Total courses with prerequisite issues: {total_prereq_issues}")
    
    # Convert to LevelGroup objects
    result = {}
    for level, data in sorted(grouped.items()):
        logger.info(f"Level {level}: {len(data['courses'])} courses, {data['total_uoc']} UOC, prereq_issues={data['has_prereq_issues']}")
        result[str(level)] = LevelGroup(
            level=level,
            level_name=get_level_name(level),
            courses=data["courses"],
            total_courses=len(data["courses"]),
            total_uoc=data["total_uoc"],
            has_prerequisite_issues=data["has_prereq_issues"]
        )
    
    return result


def detect_critical_issues(
    needed_courses: List[Dict[str, Any]],
    completed_codes: set,
    base_program: Dict[str, Any],
    target_program: Dict[str, Any]
) -> List[CriticalIssue]:
    """Detect critical blockers for transfer"""
    issues = []
    
    # 1. Check for prerequisite chains
    courses_with_prereqs = []
    for course in needed_courses:
        prereq_info = parse_prerequisites(course.get("conditions_for_enrolment", ""))
        is_satisfied, missing_prereqs = check_prerequisite_satisfied(prereq_info, completed_codes)
        
        if not is_satisfied:
            courses_with_prereqs.append({
                "code": course["code"],
                "missing": missing_prereqs,
                "type": prereq_info.get("type", "none")
            })
    
    if len(courses_with_prereqs) > 5:
        issues.append(CriticalIssue(
            type="prerequisite_chain",
            severity="high",
            message=f"{len(courses_with_prereqs)} courses have missing prerequisites",
            affected_courses=[c["code"] for c in courses_with_prereqs[:5]],
            impact="You'll need to complete foundation courses before advancing"
        ))
    
    # 2. Check for faculty change
    base_fac = (base_program.get("faculty") or "").strip()
    target_fac = (target_program.get("faculty") or "").strip()
    if base_fac and target_fac and base_fac != target_fac:
        issues.append(CriticalIssue(
            type="faculty_change",
            severity="medium",
            message=f"Switching faculties: {base_fac} → {target_fac}",
            affected_courses=[],
            impact="May require additional general education or faculty requirements"
        ))
    
    # 3. Check for heavy advanced course load
    level_3_plus = [c for c in needed_courses if c.get("level", 0) >= 3]
    if len(level_3_plus) > 10:
        issues.append(CriticalIssue(
            type="advanced_requirements",
            severity="medium",
            message=f"{len(level_3_plus)} advanced courses (Level 3+) required",
            affected_courses=[c["code"] for c in level_3_plus[:5]],
            impact="Significant advanced coursework required"
        ))
    
    return issues


def calculate_recommendation(
    uoc_needed: int,
    total_uoc_required: int,
    transfer_percentage: float,
    critical_issues: List[CriticalIssue],
    prerequisite_issues_count: int,
    completed_courses_count: int,
    courses_needed_count: int,
    courses_with_prereqs: List[Dict[str, Any]]
) -> tuple[bool, str]:
    """
    Determine transfer feasibility and difficulty from student's perspective.
    
    Factors:
    1. Transfer efficiency - how much work is wasted?
    2. Remaining workload - how many more courses needed?
    3. Critical blockers - actual roadblocks (faculty change, relevant prereqs)
    """
    
    logger.info(f"Calculating difficulty (student-focused):")
    logger.info(f"  Transfer rate: {transfer_percentage:.1f}%")
    logger.info(f"  Courses completed: {completed_courses_count}")
    logger.info(f"  Courses needed: {courses_needed_count}")
    
    score = 0
    
    # ========================================================================
    # Factor 1: Transfer Efficiency (0-30 points)
    # How much of your work carries over?
    # ========================================================================
    if transfer_percentage >= 80:
        transfer_score = 0   # Almost everything counts!
    elif transfer_percentage >= 60:
        transfer_score = 10  # Most stuff counts
    elif transfer_percentage >= 40:
        transfer_score = 20  # Half wasted - moderate pain
    elif transfer_percentage >= 20:
        transfer_score = 25  # Mostly wasted - significant pain
    else:
        transfer_score = 30  # Almost all wasted - very painful
    
    score += transfer_score
    logger.info(f"  Transfer efficiency: {transfer_percentage:.1f}% → +{transfer_score} points")
    
    # ========================================================================
    # Factor 2: Remaining Workload (0-40 points)
    # How many MORE courses do you need?
    # ========================================================================
    if courses_needed_count <= 6:
        workload_score = 0   # 1-2 terms
    elif courses_needed_count <= 12:
        workload_score = 10  # 2-4 terms
    elif courses_needed_count <= 18:
        workload_score = 20  # 4-6 terms
    elif courses_needed_count <= 24:
        workload_score = 30  # 6-8 terms
    else:
        workload_score = 40  # 8+ terms
    
    score += workload_score
    logger.info(f"  Remaining workload: {courses_needed_count} courses → +{workload_score} points")
    
    # ========================================================================
    # Factor 3: Critical Blockers (0-30 points)
    # Actual roadblocks that matter
    # ========================================================================
    blocker_score = 0
    
    # 3a. Faculty change (always significant)
    faculty_change_issues = [i for i in critical_issues if i.type == "faculty_change"]
    if faculty_change_issues:
        blocker_score += 15
        logger.info(f"  Faculty change detected → +15 points")
    
    # 3b. Prerequisite issues (smart detection)
    # Only count Level 1-2 prereqs, and only if they're actually blockers
    # Ignore Level 3+ prereqs for early students (they'll do foundation first)
    is_early_student = completed_courses_count < 18  # Less than 2 years
    
    level_1_2_prereq_issues = 0
    for course_info in courses_with_prereqs:
        course_level = course_info.get("level", 0)
        
        # For early students: only count Level 1-2 prereq issues
        if is_early_student and course_level >= 3:
            continue  # Ignore Level 3+ - they'll do them later
        
        # For senior students: count all prereq issues
        level_1_2_prereq_issues += 1
    
    if level_1_2_prereq_issues > 0:
        prereq_penalty = min(10, level_1_2_prereq_issues * 0.5)  # 0.5 per issue, max 10
        blocker_score += prereq_penalty
        logger.info(f"  Prereq issues (relevant): {level_1_2_prereq_issues} → +{prereq_penalty:.1f} points")
    
    # 3c. Heavy advanced course load (only for senior students)
    if not is_early_student:
        advanced_issues = [i for i in critical_issues if i.type == "advanced_requirements"]
        if advanced_issues:
            blocker_score += 5
            logger.info(f"  Heavy advanced load → +5 points")
    
    score += blocker_score
    logger.info(f"  Total blockers: +{blocker_score} points")
    
    # ========================================================================
    # Final Score → Recommendation
    # ========================================================================
    logger.info(f"  TOTAL SCORE: {score}/100")
    
    can_transfer = True
    if score <= 30:
        recommendation = "Easy Transfer"
    elif score <= 69:
        recommendation = "Moderate Effort"
    else:
        recommendation = "Very Difficult"
        if score > 85:
            can_transfer = False  # Realistically not feasible
    
    logger.info(f"  → RECOMMENDATION: {recommendation}")
    
    return can_transfer, recommendation


def estimate_completion_date(terms_needed: int) -> str:
    """Estimate completion date based on terms"""
    # UNSW terms: T1 (Feb-May), T2 (Jun-Sep), T3 (Sep-Dec)
    current_date = datetime.now()
    current_month = current_date.month
    
    # Determine next available term
    if current_month <= 2:
        next_term = "T1"
        year = current_date.year
    elif current_month <= 6:
        next_term = "T2"
        year = current_date.year
    elif current_month <= 9:
        next_term = "T3"
        year = current_date.year
    else:
        next_term = "T1"
        year = current_date.year + 1
    
    # Calculate completion
    terms_map = {"T1": 0, "T2": 1, "T3": 2}
    current_term_num = terms_map[next_term]
    
    completion_term_num = (current_term_num + terms_needed) % 3
    completion_year = year + ((current_term_num + terms_needed) // 3)
    
    term_names = ["T1", "T2", "T3"]
    completion_term = term_names[completion_term_num]
    
    return f"{completion_term} {completion_year}"


# ---- Main endpoint ----------------------------------------------------------

@router.post("/compare", response_model=ProgramComparisonResponse)
async def compare_programs(request: ProgramComparisonRequest):
    """
    REDESIGNED: Clear, actionable program comparison
    """
    logger.info("="*80)
    logger.info(f"Starting program comparison for user: {request.user_id}")
    logger.info(f"Base program: {request.base_program_code}, Target: {request.target_program_code}")
    logger.info(f"Target specialisations: {request.target_specialisation_codes}")
    logger.info("="*80)
    
    try:
        # 1. Get user's completed courses
        logger.info("Step 1: Fetching completed courses...")
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
        logger.info(f"Found {len(completed_courses)} completed courses")

        # 2. Get base & target programs
        logger.info("Step 2: Fetching program data...")
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
            logger.error("Program not found in database")
            raise HTTPException(status_code=404, detail="Program not found")
        
        logger.info(f"Base: {base_program['program_name']}")
        logger.info(f"Target: {target_program['program_name']}")

        # 3. Extract target courses
        logger.info("Step 3: Extracting target program courses...")
        target_prog_courses = extract_courses_from_sections(
            target_program.get("sections"), default_category="Program Requirement"
        )
        logger.info(f"Extracted {len(target_prog_courses)} courses from target program")

        # 4. Add specialisation courses
        logger.info("Step 4: Adding specialisation courses...")
        target_spec_courses: List[Dict[str, Any]] = []
        if request.target_specialisation_codes:
            spec_resp = (
                supabase.table("unsw_specialisations")
                .select("*")
                .in_("major_code", request.target_specialisation_codes)
                .execute()
            )
            specials = spec_resp.data or []
            logger.info(f"Found {len(specials)} specialisations")
            for spec in specials:
                spec_sections = spec.get("sections")
                spec_courses = extract_courses_from_sections(
                    spec_sections,
                    default_category=spec.get("specialisation_type") or "Specialisation",
                )
                logger.info(f"Added {len(spec_courses)} courses from {spec.get('major_name')}")
                target_spec_courses.extend(spec_courses)

        # Merge & dedupe
        logger.info("Step 5: Merging and deduplicating courses...")
        all_target_courses_map: Dict[str, Dict[str, Any]] = {}
        for c in target_prog_courses + target_spec_courses:
            code = c["code"]
            if code not in all_target_courses_map:
                all_target_courses_map[code] = c

        target_courses_full = list(all_target_courses_map.values())
        logger.info(f"Total unique target courses: {len(target_courses_full)}")
        
        # CRITICAL: Enrich with prerequisites
        logger.info("Step 6: Enriching courses with prerequisite data...")
        target_courses_full = enrich_courses_with_conditions(target_courses_full)

        # 5. Determine transfers
        logger.info("Step 7: Analyzing course transfers...")
        transferred_courses = []
        wasted_courses = []
        uoc_transferred = 0
        matched_target_codes = set()  # Track which TARGET courses are satisfied

        target_by_code = {c["code"]: c for c in target_courses_full}

        for completed in completed_courses:
            c_code = completed["course_code"]
            c_uoc = completed.get("uoc") or 0
            
            match_type = None
            matched_code = None

            # Exact match
            if c_code in target_by_code:
                match_type = "exact"
                matched_code = c_code
                logger.debug(f"  {c_code}: Exact match with target")
            else:
                # Equivalence - check if this completed course is equivalent to any target course
                eq_codes = get_equivalent_codes(c_code)
                logger.debug(f"  {c_code}: Checking equivalents {eq_codes}")
                for eq in eq_codes:
                    if eq in target_by_code:
                        match_type = "equivalent"
                        matched_code = eq  # This is the TARGET course that was matched
                        logger.debug(f"  {c_code}: Matched target course {eq} via equivalence")
                        break

            if match_type:
                transferred_courses.append({
                    "code": c_code,
                    "name": completed.get("course_name", ""),
                    "uoc": c_uoc,
                    "match_type": match_type
                })
                if c_uoc > 0:
                    uoc_transferred += c_uoc
                
                # Track which target course was satisfied
                if matched_code:
                    matched_target_codes.add(matched_code)
                    logger.debug(f"  Added {matched_code} to matched_target_codes")
                    
                    # ALSO mark equivalents of the matched course as satisfied
                    # E.g., if MATH1131 transfers, also mark MATH1141 as satisfied
                    equiv_of_matched = get_equivalent_codes(matched_code)
                    for equiv in equiv_of_matched:
                        if equiv in target_by_code:
                            matched_target_codes.add(equiv)
                            logger.debug(f"  Also added equivalent {equiv} to matched_target_codes")
            else:
                logger.debug(f"  {c_code}: No match found")
                wasted_courses.append({
                    "code": c_code,
                    "name": completed.get("course_name", ""),
                    "uoc": c_uoc
                })
        
        logger.info(f"Transfer analysis: {len(transferred_courses)} transfer, {len(wasted_courses)} don't transfer")
        logger.info(f"UOC transferred: {uoc_transferred}")
        logger.info(f"Matched target codes: {matched_target_codes}")

        # 6. Courses needed
        logger.info("Step 8: Determining courses still needed...")
        # Use matched_target_codes instead of transferred course codes
        needed_courses = [
            c for c in target_courses_full
            if c["code"] not in completed_set and c["code"] not in matched_target_codes
        ]
        logger.info(f"Courses still needed: {len(needed_courses)}")

        # 7. Group by level
        logger.info("Step 9: Grouping needed courses by level...")
        requirements_by_level = group_courses_by_level(needed_courses, completed_set)

        # 8. Calculate metrics
        total_uoc_required = int(target_program.get("minimum_uoc") or 144)
        uoc_needed = max(0, total_uoc_required - uoc_transferred)
        
        total_completed = len(completed_courses)
        transfer_percentage = (len(transferred_courses) / max(total_completed, 1)) * 100

        estimated_terms = max(1, (uoc_needed + 17) // 18)  # Round up, min 1 term
        completion_date = estimate_completion_date(estimated_terms)

        # 9. Detect critical issues
        critical_issues = detect_critical_issues(
            needed_courses,
            completed_set,
            base_program,
            target_program
        )

        # Count prerequisite issues and get course details
        courses_with_prereq_issues = []
        for level_group in requirements_by_level.values():
            for course in level_group.courses:
                if course.get("has_prereq_issue", False):
                    courses_with_prereq_issues.append({
                        "code": course.get("code"),
                        "level": level_group.level,
                        "missing": course.get("missing_prerequisites", [])
                    })
        
        prereq_issue_count = len(courses_with_prereq_issues)

        # 10. Generate recommendation with new student-focused logic
        can_transfer, recommendation = calculate_recommendation(
            uoc_needed,
            total_uoc_required,
            transfer_percentage,
            critical_issues,
            prereq_issue_count,
            len(completed_courses),  # How many courses student has done
            len(needed_courses),      # How many more courses needed
            courses_with_prereq_issues  # Details about prereq issues
        )

        # 11. Build response
        logger.info("Step 10: Building final response...")
        logger.info(f"Recommendation: {recommendation}")
        logger.info(f"Can transfer: {can_transfer}")
        logger.info(f"Critical issues: {len(critical_issues)}")
        logger.info("="*80)
        logger.info("Comparison complete!")
        logger.info("="*80)
        
        return ProgramComparisonResponse(
            can_transfer=can_transfer,
            recommendation=recommendation,
            summary={
                "courses_transfer": len(transferred_courses),
                "uoc_transfer": uoc_transferred,
                "courses_needed": len(needed_courses),
                "uoc_needed": uoc_needed,
                "estimated_terms": estimated_terms,
                "estimated_completion": completion_date,
                "progress_percentage": round((uoc_transferred / max(total_uoc_required, 1)) * 100, 1)
            },
            transfer_analysis={
                "transferred_courses": transferred_courses,
                "wasted_courses": wasted_courses,
                "transfer_rate": round(transfer_percentage, 1)
            },
            requirements_by_level=requirements_by_level,
            critical_issues=critical_issues,
            detailed_breakdown={
                "base_program": {
                    "code": base_program["degree_code"],
                    "name": base_program["program_name"],
                    "faculty": base_program.get("faculty")
                },
                "target_program": {
                    "code": target_program["degree_code"],
                    "name": target_program["program_name"],
                    "faculty": target_program.get("faculty"),
                    "total_uoc": total_uoc_required
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in program comparison: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error comparing programs: {str(e)}")