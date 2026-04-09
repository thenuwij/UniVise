# app/routers/compare_programs.py

from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import asyncio

from app.utils.database import supabase
from app.routers.compare_programs_helpers import (
    get_level_name,
    get_equivalent_codes,
    extract_courses_from_sections,
    enrich_courses_with_conditions,
    group_courses_by_level,
    detect_critical_issues,
    calculate_recommendation,
    estimate_completion_date,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


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
    level_name: str
    courses: List[Dict[str, Any]]
    total_courses: int
    total_uoc: int
    has_prerequisite_issues: bool


class CriticalIssue(BaseModel):
    type: str
    severity: str
    message: str
    affected_courses: List[str]
    impact: str


class ProgramComparisonResponse(BaseModel):
    can_transfer: bool
    recommendation: str
    summary: Dict[str, Any]
    transfer_analysis: Dict[str, Any]
    requirements_by_level: Dict[str, LevelGroup]
    critical_issues: List[CriticalIssue]
    detailed_breakdown: Optional[Dict[str, Any]] = None


@router.post("/compare", response_model=ProgramComparisonResponse)
async def compare_programs(
    request: ProgramComparisonRequest,
    user=Depends(get_current_user),
):
    """Clear, actionable program comparison"""
    logger.info("=" * 80)
    logger.info(f"Starting program comparison for user: {request.user_id}")
    logger.info(f"Base program: {request.base_program_code}, Target: {request.target_program_code}")
    logger.info("=" * 80)

    try:
        # Define DB fetch functions
        def fetch_completed():
            return supabase.table("user_completed_courses").select("*").eq("user_id", request.user_id).eq("is_completed", True).execute()

        def fetch_base():
            return supabase.table("unsw_degrees_final").select("*").eq("degree_code", request.base_program_code).single().execute()

        def fetch_target():
            return supabase.table("unsw_degrees_final").select("*").eq("degree_code", request.target_program_code).single().execute()

        def fetch_specialisations():
            return supabase.table("unsw_specialisations").select("*").in_("major_code", request.target_specialisation_codes).execute()

        # Run DB calls in parallel
        if request.target_specialisation_codes:
            completed_response, base_program_resp, target_program_resp, spec_resp = await asyncio.gather(
                asyncio.to_thread(fetch_completed),
                asyncio.to_thread(fetch_base),
                asyncio.to_thread(fetch_target),
                asyncio.to_thread(fetch_specialisations),
            )
        else:
            completed_response, base_program_resp, target_program_resp = await asyncio.gather(
                asyncio.to_thread(fetch_completed),
                asyncio.to_thread(fetch_base),
                asyncio.to_thread(fetch_target),
            )
            spec_resp = None

        # Process completed courses
        completed_courses = completed_response.data or []
        completed_course_codes = [c["course_code"] for c in completed_courses]
        completed_set = set(completed_course_codes)
        logger.info(f"Found {len(completed_courses)} completed courses")

        completed_uoc_total = 0
        for c in completed_courses:
            try:
                completed_uoc_total += int(c.get("uoc") or 0)
            except Exception:
                pass

        # Process programs
        base_program = base_program_resp.data
        target_program = target_program_resp.data

        if not base_program or not target_program:
            raise HTTPException(status_code=404, detail="Program not found")

        logger.info(f"Base: {base_program['program_name']}, Target: {target_program['program_name']}")

        # Extract target courses
        target_prog_courses = extract_courses_from_sections(
            target_program.get("sections"), default_category="Program Requirement"
        )

        # Process specialisation courses
        target_spec_courses: List[Dict[str, Any]] = []
        if spec_resp:
            for spec in (spec_resp.data or []):
                spec_courses = extract_courses_from_sections(
                    spec.get("sections"),
                    default_category=spec.get("specialisation_type") or "Specialisation",
                )
                target_spec_courses.extend(spec_courses)

        # Merge & dedupe
        all_target_courses_map: Dict[str, Dict[str, Any]] = {}
        for c in target_prog_courses + target_spec_courses:
            code = c["code"]
            if code not in all_target_courses_map:
                all_target_courses_map[code] = c

        target_courses_full = list(all_target_courses_map.values())
        logger.info(f"Total unique target courses: {len(target_courses_full)}")

        # Enrich with prerequisites
        target_courses_full = enrich_courses_with_conditions(target_courses_full)

        # Determine transfers
        transferred_courses = []
        wasted_courses = []
        uoc_transferred = 0
        wasted_uoc = 0
        matched_target_codes = set()
        target_by_code = {c["code"]: c for c in target_courses_full}
        # Count courses where we fell back to the 6-UOC UNSW standard
        # because neither the target catalog nor the completed row carried a
        # usable UOC value. Logged after the loop so the assumption is visible.
        _uoc_fallback_count = 0

        for completed in completed_courses:
            c_code = completed["course_code"]
            c_uoc_raw = completed.get("uoc")

            match_type = None
            matched_code = None

            if c_code in target_by_code:
                match_type = "exact"
                matched_code = c_code
            else:
                eq_codes = get_equivalent_codes(c_code)
                for eq in eq_codes:
                    if eq in target_by_code:
                        match_type = "equivalent"
                        matched_code = eq
                        break

            if match_type:
                # Resolve UOC in priority order: target catalog → completed
                # row → fallback to 6 (UNSW standard). Prefer the target
                # catalog because user_completed_courses.uoc is occasionally
                # NULL/stale, which would otherwise zero out uoc_transferred
                # and leave estimated_terms wildly overestimated in
                # switch_advisor's additional_terms calculation.
                target_course = target_by_code.get(matched_code) or {}
                target_uoc = target_course.get("uoc")
                resolved_uoc = 0
                try:
                    if target_uoc not in (None, "", 0):
                        resolved_uoc = int(target_uoc)
                    elif c_uoc_raw not in (None, "", 0):
                        resolved_uoc = int(c_uoc_raw)
                except Exception:
                    resolved_uoc = 0
                if resolved_uoc <= 0:
                    resolved_uoc = 6  # UNSW standard UOC per course
                    _uoc_fallback_count += 1

                transferred_courses.append({
                    "code": c_code,
                    "name": completed.get("course_name", ""),
                    "uoc": resolved_uoc,
                    "match_type": match_type
                })
                uoc_transferred += resolved_uoc

                if matched_code:
                    matched_target_codes.add(matched_code)
                    for equiv in get_equivalent_codes(matched_code):
                        if equiv in target_by_code:
                            matched_target_codes.add(equiv)
            else:
                try:
                    wasted_course_uoc = (
                        int(c_uoc_raw) if c_uoc_raw not in (None, "", 0) else 0
                    )
                except Exception:
                    wasted_course_uoc = 0
                wasted_courses.append({
                    "code": c_code,
                    "name": completed.get("course_name", ""),
                    "uoc": wasted_course_uoc
                })
                if wasted_course_uoc:
                    wasted_uoc += wasted_course_uoc

        logger.info(
            f"Transfer: {len(transferred_courses)} courses, {uoc_transferred} UOC "
            f"(fallback 6 UOC assumed for {_uoc_fallback_count} course(s))"
        )

        # Courses needed
        needed_courses = [
            c for c in target_courses_full
            if c["code"] not in completed_set and c["code"] not in matched_target_codes
        ]
        logger.info(f"Courses still needed: {len(needed_courses)}")

        # Group by level
        grouped_raw = group_courses_by_level(needed_courses, completed_set)

        # Convert to LevelGroup models
        requirements_by_level = {}
        for level, data in grouped_raw.items():
            requirements_by_level[str(level)] = LevelGroup(
                level=level,
                level_name=get_level_name(level),
                courses=data["courses"],
                total_courses=len(data["courses"]),
                total_uoc=data["total_uoc"],
                has_prerequisite_issues=data["has_prereq_issues"]
            )

        # Calculate metrics
        total_uoc_required = int(target_program.get("minimum_uoc") or 144)
        uoc_needed = max(0, total_uoc_required - uoc_transferred)

        total_completed = len(completed_courses)
        # Course-based transfer rate (correct denominator)
        transfer_percentage = (len(transferred_courses) / max(total_completed, 1)) * 100

        estimated_terms = max(1, (uoc_needed + 17) // 18)
        completion_date = estimate_completion_date(estimated_terms)

        # Detect critical issues
        critical_issues_raw = detect_critical_issues(
            needed_courses, completed_set, base_program, target_program
        )
        critical_issues = [CriticalIssue(**issue) for issue in critical_issues_raw]

        # Count prerequisite issues
        courses_with_prereq_issues = []
        for level_group in requirements_by_level.values():
            for course in level_group.courses:
                if course.get("has_prereq_issue", False):
                    courses_with_prereq_issues.append({
                        "code": course.get("code"),
                        "level": level_group.level,
                        "missing": course.get("missing_prerequisites", [])
                    })

        # Generate recommendation
        can_transfer, recommendation = calculate_recommendation(
            uoc_needed,
            total_uoc_required,
            transfer_percentage,
            critical_issues,
            len(courses_with_prereq_issues),
            len(completed_courses),
            len(needed_courses),
            courses_with_prereq_issues
        )

        logger.info(f"Recommendation: {recommendation}, Can transfer: {can_transfer}")
        logger.info("=" * 80)

        return ProgramComparisonResponse(
            can_transfer=can_transfer,
            recommendation=recommendation,
            summary={
                # NEW: stable denominators
                "completed_courses_count": total_completed,
                "completed_uoc": completed_uoc_total,

                "courses_transfer": len(transferred_courses),
                "uoc_transfer": uoc_transferred,
                "courses_wasted": len(wasted_courses),
                "uoc_wasted": wasted_uoc,

                "courses_needed": len(needed_courses),
                "uoc_needed": uoc_needed,
                "estimated_terms": estimated_terms,
                "estimated_completion": completion_date,
                "progress_percentage": round((uoc_transferred / max(total_uoc_required, 1)) * 100, 1),

                # NEW: explicit rates
                "transfer_rate_courses": round(transfer_percentage, 1),
                "transfer_rate_uoc": round((uoc_transferred / max(completed_uoc_total, 1)) * 100, 1) if completed_uoc_total else 0,
            },
            transfer_analysis={
                # keep your original key
                "transferred_courses": transferred_courses,
                "wasted_courses": wasted_courses,

                # NEW: aliases so switch_advisor can read correctly
                "non_transferable_courses": wasted_courses,

                # NEW: explicit totals + counts for denominators
                "total_completed_courses": total_completed,
                "transferred_count": len(transferred_courses),
                "wasted_count": len(wasted_courses),

                # NEW: UOC totals
                "completed_uoc": completed_uoc_total,
                "transferred_uoc": uoc_transferred,
                "wasted_uoc": wasted_uoc,

                # Course transfer rate (correct)
                "transfer_rate": round(transfer_percentage, 1),
            },
            requirements_by_level=requirements_by_level,
            critical_issues=critical_issues,
            detailed_breakdown={
                "base_program": {
                    "code": base_program["degree_code"],
                    "name": base_program["program_name"],
                    "faculty": base_program.get("faculty"),
                    # total_uoc must be present so switch_advisor can compute
                    # base_terms_remaining. Without this, same-degree spec
                    # switches (and actually every switch) end up with
                    # base_total_uoc=0 and a massively inflated additional_terms.
                    "total_uoc": int(base_program.get("minimum_uoc") or 144),
                },
                "target_program": {
                    "code": target_program["degree_code"],
                    "name": target_program["program_name"],
                    "faculty": target_program.get("faculty"),
                    "total_uoc": total_uoc_required
                },
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in program comparison: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error comparing programs: {str(e)}")
