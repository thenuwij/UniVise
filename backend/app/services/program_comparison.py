import re
import json
import logging
from typing import List, Dict, Any
from datetime import datetime

from app.core.database import supabase
from app.services.requirements import _read_target, tidy_sections, to_uoc

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

    logger.debug(f"Enriching {len(codes)} courses with prerequisite data")

    try:
        resp = supabase.table("unsw_courses").select("code,conditions_for_enrolment").in_("code", codes).execute()
        data = resp.data or []
        
        logger.debug(f"Fetched conditions for {len(data)} courses from database")
        cond_map = {row["code"]: row.get("conditions_for_enrolment", "") for row in data}
        
        with_conditions = sum(1 for v in cond_map.values() if v and v.strip())
        logger.debug(f"Courses with actual prerequisite data: {with_conditions}/{len(data)}")

        for c in course_list:
            if not c.get("conditions_for_enrolment"):
                c["conditions_for_enrolment"] = cond_map.get(c["code"], "")
    except Exception as e:
        logger.error(f"Error fetching course conditions: {str(e)}", exc_info=True)

    return course_list


def group_courses_by_level(courses: List[Dict[str, Any]], completed_codes: set) -> Dict[str, Any]:
    """Group courses by level with metadata"""
    logger.debug(f"Grouping {len(courses)} courses by level")
    
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
    Determine transfer feasibility using a feasibility score (0-100).
    Higher score = easier transfer.

    Returns (can_transfer: bool, recommendation: str)

    Recommendation levels:
    - "Not Yet Started": No courses completed (edge case)
    - "Easy Transfer": Score >= 70
    - "Moderate Effort": Score 45-69
    - "Very Difficult": Score < 45
    """

    logger.debug("Calculating feasibility score:")
    logger.debug(f"  Transfer rate: {transfer_percentage:.1f}%")
    logger.debug(f"  Courses completed: {completed_courses_count}")
    logger.debug(f"  Courses needed: {courses_needed_count}")
    logger.debug(f"  UOC needed: {uoc_needed}")

    # ─── Edge Case: No courses completed ───────────────────────────
    if completed_courses_count == 0:
        logger.debug("  → No courses completed, returning 'Not Yet Started'")
        return True, "Not Yet Started"

    # ─── FACTOR 1: Transfer Efficiency (0-45 points) ───────────────
    # This is the most important factor - losing completed work is costly
    if transfer_percentage >= 90:
        transfer_score = 45
    elif transfer_percentage >= 80:
        transfer_score = 40
    elif transfer_percentage >= 70:
        transfer_score = 32
    elif transfer_percentage >= 60:
        transfer_score = 24
    elif transfer_percentage >= 50:
        transfer_score = 16
    elif transfer_percentage >= 30:
        transfer_score = 8
    else:
        # Below 30% transfer rate is very poor
        transfer_score = 0

    logger.debug(f"  Transfer efficiency: {transfer_percentage:.1f}% → {transfer_score}/45 points")

    # ─── FACTOR 2: Remaining Workload (0-30 points) ────────────────
    # Based on estimated terms to completion (UOC / 18 per term)
    estimated_terms = max(1, (uoc_needed + 17) // 18)

    if estimated_terms <= 2:
        workload_score = 30  # Less than a year - very manageable
    elif estimated_terms <= 4:
        workload_score = 22  # 1-1.5 years - reasonable
    elif estimated_terms <= 6:
        workload_score = 14  # 1.5-2 years - significant
    elif estimated_terms <= 8:
        workload_score = 6   # 2-2.5 years - heavy
    else:
        workload_score = 0   # 3+ years - major commitment

    logger.debug(f"  Workload: {uoc_needed} UOC, ~{estimated_terms} terms → {workload_score}/30 points")

    # ─── FACTOR 3: Blockers & Issues (0-15 points) ─────────────────
    blocker_score = 15  # Start with full points, subtract for issues

    # Faculty change penalty (check critical issues)
    faculty_change_issues = [
        i for i in critical_issues
        if (i.type if hasattr(i, 'type') else i.get('type')) == "faculty_change"
    ]
    if faculty_change_issues:
        blocker_score -= 5
        logger.debug("  Faculty change detected → -5 points")

    # Prerequisite chain issues - these can seriously delay completion
    relevant_prereq_count = 0
    for course_info in courses_with_prereqs:
        course_level = course_info.get("level", 0)
        # Count all prereq issues, but weight level 1-2 higher (foundation courses)
        if course_level <= 2:
            relevant_prereq_count += 2  # Foundation prereqs are more blocking
        else:
            relevant_prereq_count += 1

    if relevant_prereq_count > 0:
        # Scale: 1-4 issues = -2, 5-10 = -4, 11-20 = -6, 20+ = -8
        if relevant_prereq_count <= 4:
            prereq_penalty = 2
        elif relevant_prereq_count <= 10:
            prereq_penalty = 4
        elif relevant_prereq_count <= 20:
            prereq_penalty = 6
        else:
            prereq_penalty = 8
        blocker_score -= prereq_penalty
        logger.debug(f"  Prereq issues (weighted): {relevant_prereq_count} → -{prereq_penalty} points")

    # Advanced course load issues
    advanced_issues = [
        i for i in critical_issues
        if (i.type if hasattr(i, 'type') else i.get('type')) == "advanced_requirements"
    ]
    if advanced_issues:
        blocker_score -= 2
        logger.debug("  Heavy advanced load → -2 points")

    blocker_score = max(0, blocker_score)  # Floor at 0
    logger.debug(f"  Blockers final: {blocker_score}/15 points")

    # ─── FACTOR 4: Early Student Bonus (0-10 points) ───────────────
    # Students who switch early have less to lose and more flexibility
    if completed_courses_count <= 8:
        early_bonus = 10  # First year - great time to switch
    elif completed_courses_count <= 16:
        early_bonus = 5   # Second year - still good
    else:
        early_bonus = 0   # Later years - no bonus

    logger.debug(f"  Early student bonus: {early_bonus}/10 points")

    # ─── Calculate Final Score ─────────────────────────────────────
    total_score = transfer_score + workload_score + blocker_score + early_bonus
    logger.info(f"  TOTAL FEASIBILITY SCORE: {total_score}/100")

    # ─── Determine Recommendation ───��──────────────────────────────
    can_transfer = True

    if total_score >= 70:
        recommendation = "Easy Transfer"
    elif total_score >= 45:
        recommendation = "Moderate Effort"
    else:
        recommendation = "Very Difficult"
        # Only set can_transfer to False for extremely poor scenarios
        if total_score < 20:
            can_transfer = False

    logger.info(f"  → RECOMMENDATION: {recommendation} (can_transfer={can_transfer})")

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

# ---- Crediting completed courses against a target program -------------------

RULE_PATTERN = re.compile(r"\b([A-Za-z]{4}\d{0,3})([*x#]{1,4})(?![A-Za-z0-9*#])", re.IGNORECASE)
TERM_UOC = 18


def _course_uoc(course: Dict[str, Any], fallback: Any = None) -> int:
    for value in (course.get("uoc"), fallback):
        if value not in (None, ""):
            try:
                return int(float(value))
            except (TypeError, ValueError):
                continue
    return 6


def _codes(section: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [c for c in section.get("courses") or [] if isinstance(c, dict) and c.get("code")]


def _is_free_space(section: Dict[str, Any]) -> bool:
    if section.get("kind") == "free_elective":
        return True
    return bool(re.search(r"free elective", section.get("title") or "", re.IGNORECASE)) and not _codes(section)


def _free_uoc(section: Dict[str, Any]) -> int:
    return to_uoc(section.get("uoc")) or _read_target(section.get("description"))


def _is_container(section: Dict[str, Any]) -> bool:
    codes = _codes(section)
    return bool(codes) and to_uoc(section.get("uoc")) > 0 and all(_course_uoc(c) == 0 for c in codes)


def _rule_patterns(section: Dict[str, Any]) -> List[Dict[str, Any]]:
    if section.get("rules"):
        return section["rules"]
    text = f"{section.get('description') or ''} {section.get('notes') or ''}"
    return [{"prefix": prefix.upper()} for prefix, stars in RULE_PATTERN.findall(text) if len(prefix) + len(stars) == 8]


def _matches_rule(code: str, rules: List[Dict[str, Any]], row: Dict[str, Any] = None) -> bool:
    code = code.upper()
    row = row or {}
    for rule in rules:
        if code in rule.get("except", []):
            continue
        if rule.get("prefix") and code.startswith(rule["prefix"]):
            return True
        if rule.get("orgs") and {row.get("faculty"), row.get("school")} & set(rule["orgs"]):
            level = int(code[4]) if len(code) > 4 and code[4].isdigit() else None
            if not rule.get("levels") or level in rule["levels"]:
                return True
    return False


def _rules_label(rules: List[Dict[str, Any]]) -> str:
    prefixes = [r["prefix"].ljust(8, "*") for r in rules if r.get("prefix")]
    parts = [f"any {', '.join(prefixes)} course"] if prefixes else []
    parts += [f"courses from {' or '.join(r['orgs'])}" for r in rules if r.get("orgs")]
    return " or ".join(parts)


def _named_sections(section_lists: List[tuple]) -> List[Dict[str, Any]]:
    out = []
    for label, raw in section_lists:
        for section in tidy_sections(raw):
            out.append({**section, "name": f"{label}: {section['title']}" if label else section["title"]})
    return out


def credit_completed_courses(section_lists: List[tuple], completed_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    sections = _named_sections(section_lists)
    listed = {c["code"] for s in sections if s.get("kind") not in ("info", "limit") for c in _codes(s)}
    rows = {r["course_code"]: r for r in completed_rows if r.get("course_code")}
    as_target: Dict[str, str] = {}
    for code in rows:
        if code in listed:
            as_target[code] = code
        else:
            match = next((eq for eq in get_equivalent_codes(code) if eq in listed), None)
            if match:
                as_target[match] = code

    credited: Dict[str, Dict[str, Any]] = {}
    section_used: Dict[str, int] = {}

    def credit(done_code: str, uoc: int, section_name: str, match_type: str) -> int:
        credited[done_code] = {
            "code": done_code,
            "name": rows[done_code].get("course_name") or "",
            "uoc": uoc,
            "section": section_name,
            "match_type": match_type,
        }
        section_used[section_name] = section_used.get(section_name, 0) + uoc
        return uoc

    def credit_listed(course: Dict[str, Any], section_name: str) -> int:
        done_code = as_target[course["code"]]
        return credit(done_code, _course_uoc(course, rows[done_code].get("uoc")), section_name, "exact" if done_code == course["code"] else "equivalent")

    def open_listed(section):
        return [c for c in _codes(section) if c["code"] in as_target and as_target[c["code"]] not in credited]

    for section in sections:
        if (section.get("kind") or "core") == "core":
            for course in open_listed(section):
                if not course.get("choice"):
                    credit_listed(course, section["name"])
    chosen = set()
    for section in sections:
        if (section.get("kind") or "core") in ("core", "choice"):
            for course in open_listed(section):
                key = (section["name"], course.get("choice"))
                if course.get("choice") and key not in chosen:
                    chosen.add(key)
                    credit_listed(course, section["name"])
    for section in sections:
        if section.get("kind") != "elective":
            continue
        cap = to_uoc(section.get("uoc"))
        for course in open_listed(section):
            if cap and section_used.get(section["name"], 0) >= cap:
                break
            credit_listed(course, section["name"])
    for section in sections:
        cap = to_uoc(section.get("uoc"))
        patterns = _rule_patterns(section)
        if patterns and (section.get("kind") == "elective" or cap):
            for code in [c for c in rows if c not in credited and _matches_rule(c, patterns, rows[c])]:
                if cap and section_used.get(section["name"], 0) >= cap:
                    break
                credit(code, _course_uoc({}, rows[code].get("uoc")), section["name"], "rule")

    leftovers = [code for code in rows if code not in credited]
    free_sections = [s for s in sections if _is_free_space(s)]
    free_uoc = sum(_free_uoc(s) for s in free_sections)
    candidates = [code for code in leftovers if _course_uoc({}, rows[code].get("uoc")) > 0] if free_uoc else []
    room, fits = free_uoc, 0
    for uoc in sorted(_course_uoc({}, rows[code].get("uoc")) for code in candidates):
        if uoc <= room:
            room -= uoc
            fits += 1
    pool = {
        "uoc": free_uoc,
        "used_uoc": free_uoc - room,
        "fits_count": fits,
        "candidates": [{"code": c, "name": rows[c].get("course_name") or "", "uoc": _course_uoc({}, rows[c].get("uoc"))} for c in candidates],
        "sections": [s["name"] for s in free_sections],
    }
    lost = [{"code": c, "name": rows[c].get("course_name") or "", "uoc": to_uoc(rows[c].get("uoc"))} for c in leftovers if c not in candidates]
    return {
        "credited": list(credited.values()),
        "free_pool": pool,
        "lost": lost,
        "credited_uoc": sum(c["uoc"] for c in credited.values()) + pool["used_uoc"],
        "counted_courses": len(credited) + fits,
        "section_used": section_used,
        "credited_target_codes": {target for target, done in as_target.items() if done in credited},
    }


def still_to_do(section_lists: List[tuple], credit: Dict[str, Any]) -> List[Dict[str, Any]]:
    done = credit["credited_target_codes"]
    used = credit["section_used"]
    items = []
    for section in _named_sections(section_lists):
        kind = section.get("kind") or "core"
        uoc = to_uoc(section.get("uoc"))
        codes = _codes(section)
        if _is_free_space(section):
            continue
        if kind == "general_education" and uoc:
            items.append({"title": section["name"], "type": "open", "uoc_left": uoc, "note": "courses outside your faculty"})
        elif kind == "unlisted" and uoc:
            items.append({"title": section["name"], "type": "open", "uoc_left": uoc, "note": "courses listed in the Handbook"})
        elif _is_container(section):
            left = [c["code"] for c in codes if c["code"] not in done]
            if left:
                items.append({"title": section["name"], "type": "core", "left": left, "choices": []})
        elif kind == "elective":
            left = max(uoc - used.get(section["name"], 0), 0)
            if uoc and left:
                item = {"title": section["name"], "type": "elective", "uoc_left": left, "options": len(codes)}
                also = _rules_label(_rule_patterns(section))
                if also:
                    item["also"] = also
                items.append(item)
        elif kind in ("core", "choice"):
            left = [c["code"] for c in codes if not c.get("choice") and c["code"] not in done]
            groups: Dict[str, List[str]] = {}
            for c in codes:
                if c.get("choice"):
                    groups.setdefault(c["choice"], []).append(c["code"])
            choices = [g for g in groups.values() if not any(code in done for code in g)]
            if left or choices:
                items.append({"title": section["name"], "type": "core", "left": left, "choices": choices})
    pool = credit["free_pool"]
    if pool["uoc"] - pool["used_uoc"] > 0:
        items.append({"title": "Free electives", "type": "open", "uoc_left": pool["uoc"] - pool["used_uoc"], "note": "any approved courses"})
    return items


def courses_left(items: List[Dict[str, Any]]) -> int:
    total = 0
    for item in items:
        if item["type"] == "core":
            total += len(item["left"]) + len(item["choices"])
        else:
            total += -(-item["uoc_left"] // 6)
    return total


def time_impact(target_min_uoc: int, credited_uoc: int, base_min_uoc: int, completed_uoc: int) -> Dict[str, int]:
    uoc_needed = max(target_min_uoc - credited_uoc, 0)
    base_left = max(base_min_uoc - completed_uoc, 0)
    target_terms = -(-uoc_needed // TERM_UOC)
    base_terms = -(-base_left // TERM_UOC)
    return {
        "uoc_needed": uoc_needed,
        "base_uoc_left": base_left,
        "extra_uoc": uoc_needed - base_left,
        "estimated_terms": target_terms,
        "base_terms_remaining": base_terms,
        "extra_terms": target_terms - base_terms,
    }
