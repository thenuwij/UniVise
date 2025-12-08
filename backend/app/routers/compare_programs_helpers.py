import re
import json
import logging
from typing import List, Dict, Any
from datetime import datetime

from app.utils.database import supabase

logger = logging.getLogger(__name__)


COURSE_EQUIVALENCE_GROUPS = [
    {"MATH1131", "MATH1141"},  
    {"MATH1231", "MATH1241"}, 
    {"PHYS1121", "PHYS1131"},  
    {"CHEM1011", "CHEM1031"}, 
    {"MATH1081", "MATH1091"},  
]


def infer_course_level(code: str) -> int:
    """Extract level from course code (COMP1511 -> 1)"""
    if len(code) >= 5 and code[4].isdigit():
        return int(code[4])
    return 0


def get_level_name(level: int) -> str:
    """Convert level number to readable name"""
    if level == 0:
        return "Uncategorized"
    return f"Level {level}"


def get_equivalent_codes(course_code: str) -> List[str]:
    """Get equivalent course codes"""
    equivalents: List[str] = []
    for group in COURSE_EQUIVALENCE_GROUPS:
        if course_code in group:
            equivalents.extend(list(group - {course_code}))
    return equivalents


# ---- Prerequisite parsing ---------------------------------------------------

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
        return {"type": "none", "courses": []}
    
    course_pattern = r"\b[A-Z]{4}\d{4}\b"
    all_courses = re.findall(course_pattern, conditions_text)
    
    if not all_courses:
        return {"type": "none", "courses": []}
    
    unique_courses = list(dict.fromkeys(all_courses))
    
    if len(unique_courses) == 1:
        return {"type": "single", "courses": unique_courses}
    
    conditions_lower = conditions_text.lower()
    
    # Check for parentheses - indicates grouped OR within AND
    if "(" in conditions_text and ")" in conditions_text:
        paren_pattern = r'\(([^)]+)\)'
        paren_matches = re.findall(paren_pattern, conditions_text)
        
        or_groups = []
        and_courses = []
        
        for match in paren_matches:
            group_courses = re.findall(course_pattern, match)
            if " or " in match.lower() and len(group_courses) > 1:
                or_groups.append(group_courses)
            else:
                and_courses.extend(group_courses)
        
        text_without_parens = re.sub(paren_pattern, '', conditions_text)
        outside_courses = re.findall(course_pattern, text_without_parens)
        and_courses.extend(outside_courses)
        and_courses = list(dict.fromkeys(and_courses))
        
        if or_groups:
            return {
                "type": "mixed",
                "courses": and_courses,
                "or_groups": or_groups
            }
        else:
            return {"type": "and", "courses": unique_courses}
    
    or_count = conditions_lower.count(" or ")
    and_count = conditions_lower.count(" and ")
    
    if or_count > 0 and and_count == 0:
        return {"type": "or", "courses": unique_courses}
    
    elif and_count > 0 and or_count == 0:
        return {"type": "and", "courses": unique_courses}
    
    elif and_count > 0 and or_count > 0:
        and_parts = re.split(r'\s+and\s+', conditions_lower)
        or_groups = []
        and_courses = []
        original_parts = re.split(r'\s+and\s+', conditions_text, flags=re.IGNORECASE)
        
        for i, part_lower in enumerate(and_parts):
            if i < len(original_parts):
                part_original = original_parts[i]
                part_courses = re.findall(course_pattern, part_original)
                
                if " or " in part_lower and len(part_courses) > 1:
                    or_groups.append(part_courses)
                else:
                    and_courses.extend(part_courses)
        
        if or_groups:
            and_courses = list(dict.fromkeys(and_courses))
            return {
                "type": "mixed",
                "courses": and_courses,
                "or_groups": or_groups
            }
        else:
            return {"type": "and", "courses": unique_courses}
    
    else:
        return {"type": "and", "courses": unique_courses}


def check_prerequisite_satisfied(prereq_info: Dict[str, Any], completed_codes: set) -> tuple:
    """
    Check if prerequisite requirement is satisfied.
    Returns (is_satisfied, missing_courses)
    """
    prereq_type = prereq_info.get("type", "none")
    courses = prereq_info.get("courses", [])
    or_groups = prereq_info.get("or_groups", [])
    
    if prereq_type == "none" or (not courses and not or_groups):
        return True, []
    
    def is_course_completed(required_course: str, completed: set) -> bool:
        if required_course in completed:
            return True
        equivalents = get_equivalent_codes(required_course)
        return any(eq in completed for eq in equivalents)
    
    if prereq_type == "single":
        if is_course_completed(courses[0], completed_codes):
            return True, []
        return False, courses
    
    if prereq_type == "or":
        if any(is_course_completed(c, completed_codes) for c in courses):
            return True, []
        return False, courses
    
    if prereq_type == "and":
        missing = [c for c in courses if not is_course_completed(c, completed_codes)]
        if not missing:
            return True, []
        return False, missing
    
    if prereq_type == "mixed":
        missing_and = [c for c in courses if not is_course_completed(c, completed_codes)]
        
        unsatisfied_groups = []
        for group in or_groups:
            if not any(is_course_completed(c, completed_codes) for c in group):
                unsatisfied_groups.append(group)
        
        all_missing = missing_and.copy()
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
        return course_list

    codes = list({c["code"] for c in course_list if c.get("code")})
    if not codes:
        return course_list

    logger.info(f"Enriching {len(codes)} courses with prerequisite data")

    try:
        resp = supabase.table("unsw_courses").select("code,conditions_for_enrolment").in_("code", codes).execute()
        data = resp.data or []
        
        logger.info(f"Fetched conditions for {len(data)} courses from database")
        cond_map = {row["code"]: row.get("conditions_for_enrolment", "") for row in data}
        
        with_conditions = sum(1 for v in cond_map.values() if v and v.strip())
        logger.info(f"Courses with actual prerequisite data: {with_conditions}/{len(data)}")

        for c in course_list:
            if not c.get("conditions_for_enrolment"):
                c["conditions_for_enrolment"] = cond_map.get(c["code"], "")
    except Exception as e:
        logger.error(f"Error fetching course conditions: {str(e)}", exc_info=True)

    return course_list


def group_courses_by_level(courses: List[Dict[str, Any]], completed_codes: set) -> Dict[str, Any]:
    """Group courses by level with metadata"""
    logger.info(f"Grouping {len(courses)} courses by level")
    
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
        
        conditions = course.get("conditions_for_enrolment", "")
        prereq_info = parse_prerequisites(conditions)
        is_satisfied, missing_prereqs = check_prerequisite_satisfied(prereq_info, completed_codes)
        
        has_issue = not is_satisfied
        
        if has_issue:
            total_prereq_issues += 1
        
        grouped[level]["courses"].append({
            "code": course["code"],
            "name": course["title"],
            "uoc": course["uoc"],
            "category": course.get("category", ""),
            "level": level,  # Add level to course data for difficulty calculation
            "has_prereq_issue": has_issue,
            "missing_prerequisites": missing_prereqs,
            "prereq_type": prereq_info.get("type", "none")
        })
        grouped[level]["total_uoc"] += course["uoc"]
        if has_issue:
            grouped[level]["has_prereq_issues"] = True
    
    logger.info(f"Total courses with prerequisite issues: {total_prereq_issues}")
    
    # Return raw dict - caller will convert to Pydantic models
    return {level: data for level, data in sorted(grouped.items())}


def detect_critical_issues(
    needed_courses: List[Dict[str, Any]],
    completed_codes: set,
    base_program: Dict[str, Any],
    target_program: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Detect critical blockers for transfer - returns dicts for caller to convert"""
    issues = []
    
    # Check for prerequisite chains
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
        issues.append({
            "type": "prerequisite_chain",
            "severity": "high",
            "message": f"{len(courses_with_prereqs)} courses have missing prerequisites",
            "affected_courses": [c["code"] for c in courses_with_prereqs[:5]],
            "impact": "You'll need to complete foundation courses before advancing"
        })
    
    # Check for faculty change
    base_fac = (base_program.get("faculty") or "").strip()
    target_fac = (target_program.get("faculty") or "").strip()
    if base_fac and target_fac and base_fac != target_fac:
        issues.append({
            "type": "faculty_change",
            "severity": "medium",
            "message": f"Switching faculties: {base_fac} → {target_fac}",
            "affected_courses": [],
            "impact": "May require additional general education or faculty requirements"
        })
    
    # Check for heavy advanced course load
    level_3_plus = [c for c in needed_courses if c.get("level", 0) >= 3]
    if len(level_3_plus) > 10:
        issues.append({
            "type": "advanced_requirements",
            "severity": "medium",
            "message": f"{len(level_3_plus)} advanced courses (Level 3+) required",
            "affected_courses": [c["code"] for c in level_3_plus[:5]],
            "impact": "Significant advanced coursework required"
        })
    
    return issues


def calculate_recommendation(
    uoc_needed: int,
    total_uoc_required: int,
    transfer_percentage: float,
    critical_issues: List[Any],
    prerequisite_issues_count: int,
    completed_courses_count: int,
    courses_needed_count: int,
    courses_with_prereqs: List[Dict[str, Any]]
) -> tuple:
    """
    Determine transfer feasibility and difficulty from student's perspective.
    Returns (can_transfer, recommendation)
    
    Improved scoring system (0-100 points, lower = easier):
    - 0-25: Easy Transfer
    - 26-45: Moderate Effort  
    - 46-65: Significant Commitment
    - 66-85: Very Difficult
    - 86+: Nearly Impossible (can_transfer = False)
    """
    
    logger.info(f"Calculating difficulty (improved algorithm):")
    logger.info(f"  Transfer rate: {transfer_percentage:.1f}%")
    logger.info(f"  Courses completed: {completed_courses_count}")
    logger.info(f"  Courses needed: {courses_needed_count}")
    logger.info(f"  UOC needed: {uoc_needed}/{total_uoc_required}")
    
    score = 0
    
    # 1. OVERALL PROGRESS (0-25 points) - Most important factor
    # Consider how much of the degree is already complete
    progress_percentage = ((total_uoc_required - uoc_needed) / max(total_uoc_required, 1)) * 100
    
    if progress_percentage >= 75:  # Almost done
        progress_score = 0
    elif progress_percentage >= 50:  # Halfway
        progress_score = 8
    elif progress_percentage >= 25:  # Quarter done
        progress_score = 15
    else:  # Just starting
        progress_score = 25
    
    score += progress_score
    logger.info(f"  Overall progress: {progress_percentage:.1f}% → +{progress_score} points")
    
    # 2. TRANSFER EFFICIENCY (0-20 points) - How well courses transfer
    if transfer_percentage >= 80:  # Excellent transfer
        transfer_score = 0
    elif transfer_percentage >= 60:  # Good transfer
        transfer_score = 5
    elif transfer_percentage >= 40:  # Moderate transfer
        transfer_score = 10
    elif transfer_percentage >= 20:  # Poor transfer
        transfer_score = 15
    else:  # Very poor transfer
        transfer_score = 20
    
    score += transfer_score
    logger.info(f"  Transfer efficiency: {transfer_percentage:.1f}% → +{transfer_score} points")
    
    # 3. REMAINING WORKLOAD (0-25 points) - Absolute course count
    if courses_needed_count <= 8:  # 1 year or less
        workload_score = 0
    elif courses_needed_count <= 16:  # ~2 years
        workload_score = 8
    elif courses_needed_count <= 24:  # ~3 years
        workload_score = 15
    elif courses_needed_count <= 32:  # ~4 years
        workload_score = 20
    else:  # More than 4 years
        workload_score = 25
    
    score += workload_score
    logger.info(f"  Remaining workload: {courses_needed_count} courses → +{workload_score} points")
    
    # 4. COURSE LEVEL DIFFICULTY (0-15 points) - Weight by course levels
    # Level 3-4 courses are significantly harder than Level 1-2
    level_penalties = {
        1: 0.3,   # Level 1 is easiest
        2: 0.5,   # Level 2 moderate
        3: 1.0,   # Level 3 hard
        4: 1.5,   # Level 4 hardest
        0: 0.5    # Unknown level, assume moderate
    }
    
    level_difficulty = 0
    level_breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 0: 0}
    
    for course in courses_with_prereqs:
        level = course.get("level", 0)
        level_breakdown[level] = level_breakdown.get(level, 0) + 1
        level_difficulty += level_penalties.get(level, 0.5)
    
    level_score = min(15, level_difficulty * 0.5)  # Cap at 15 points
    score += level_score
    logger.info(f"  Course level difficulty: L1={level_breakdown.get(1,0)}, L2={level_breakdown.get(2,0)}, L3={level_breakdown.get(3,0)}, L4={level_breakdown.get(4,0)} → +{level_score:.1f} points")
    
    # 5. PREREQUISITE COMPLEXITY (0-15 points)
    is_early_student = completed_courses_count < 18
    
    # Count relevant prerequisite issues
    relevant_prereq_issues = 0
    for course_info in courses_with_prereqs:
        course_level = course_info.get("level", 0)
        # Early students: ignore Level 3+ prereq issues (they'll handle them later)
        if is_early_student and course_level >= 3:
            continue
        relevant_prereq_issues += 1
    
    if relevant_prereq_issues == 0:
        prereq_score = 0
    elif relevant_prereq_issues <= 3:
        prereq_score = 3
    elif relevant_prereq_issues <= 6:
        prereq_score = 7
    elif relevant_prereq_issues <= 10:
        prereq_score = 11
    else:
        prereq_score = 15
    
    score += prereq_score
    logger.info(f"  Prerequisite issues (relevant): {relevant_prereq_issues} → +{prereq_score} points")
    
    # 6. TIME TO COMPLETION (0-10 points)
    estimated_terms = max(1, (uoc_needed + 17) // 18)
    
    if estimated_terms <= 2:  # ≤1 year
        time_score = 0
    elif estimated_terms <= 4:  # ≤2 years
        time_score = 3
    elif estimated_terms <= 6:  # ≤3 years
        time_score = 6
    else:  # 3+ years
        time_score = 10
    
    score += time_score
    logger.info(f"  Time to completion: {estimated_terms} terms → +{time_score} points")
    
    # 7. CRITICAL BLOCKERS (0-10 points)
    blocker_score = 0
    
    # Faculty change
    faculty_change_issues = [i for i in critical_issues if (i.type if hasattr(i, 'type') else i.get('type')) == "faculty_change"]
    if faculty_change_issues:
        blocker_score += 5
        logger.info(f"  Faculty change detected → +5 points")
    
    # Heavy advanced course load (for non-early students)
    if not is_early_student:
        advanced_issues = [i for i in critical_issues if (i.type if hasattr(i, 'type') else i.get('type')) == "advanced_requirements"]
        if advanced_issues:
            blocker_score += 5
            logger.info(f"  Heavy advanced load → +5 points")
    
    score += blocker_score
    logger.info(f"  Critical blockers: +{blocker_score} points")
    
    # FINAL SCORE
    logger.info(f"  ═══════════════════════════════")
    logger.info(f"  TOTAL SCORE: {score:.1f}/100")
    logger.info(f"  ═══════════════════════════════")
    
    # Determine recommendation with improved thresholds
    can_transfer = True
    
    if score <= 25:
        recommendation = "Easy Transfer"
        logger.info(f"  → RECOMMENDATION: Easy Transfer (minimal effort required)")
    elif score <= 45:
        recommendation = "Moderate Effort"
        logger.info(f"  → RECOMMENDATION: Moderate Effort (reasonable commitment)")
    elif score <= 65:
        recommendation = "Significant Commitment"
        logger.info(f"  → RECOMMENDATION: Significant Commitment (substantial work needed)")
    elif score <= 85:
        recommendation = "Very Difficult"
        logger.info(f"  → RECOMMENDATION: Very Difficult (major undertaking)")
    else:
        recommendation = "Very Difficult"
        can_transfer = False
        logger.info(f"  → RECOMMENDATION: Very Difficult (nearly impossible, consider alternatives)")
    
    return can_transfer, recommendation


def estimate_completion_date(terms_needed: int) -> str:
    """Estimate completion date based on terms"""
    current_date = datetime.now()
    current_month = current_date.month
    
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
    
    terms_map = {"T1": 0, "T2": 1, "T3": 2}
    current_term_num = terms_map[next_term]
    
    completion_term_num = (current_term_num + terms_needed) % 3
    completion_year = year + ((current_term_num + terms_needed) // 3)
    
    term_names = ["T1", "T2", "T3"]
    completion_term = term_names[completion_term_num]
    
    return f"{completion_term} {completion_year}"