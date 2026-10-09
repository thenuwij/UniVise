# app/routers/compare_programs.py

from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.models.comparison import (
    ProgramComparisonRequest,
    ProgramComparisonResponse,
)
import logging
import asyncio

from app.core.database import supabase
from app.services.course_picks import fill_course_uoc
from app.services.roadmap.unsw_queries import parse_sections_json
from app.services.program_comparison import (
    courses_left,
    credit_completed_courses,
    estimate_completion_date,
    still_to_do,
    time_impact,
)
from app.services.requirements import to_uoc

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/compare", response_model=ProgramComparisonResponse)
async def compare_programs(
    request: ProgramComparisonRequest,
    user=Depends(get_current_user),
):
    """Clear, actionable program comparison"""
    logger.info("=" * 80)
    logger.info(f"Starting program comparison for user: {user.id}")
    logger.info(f"Base program: {request.base_program_code}, Target: {request.target_program_code}")
    logger.info("=" * 80)

    try:
        # Define DB fetch functions
        def fetch_completed():
            return supabase.table("user_completed_courses").select("*").eq("user_id", user.id).eq("is_completed", True).execute()

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
        logger.info(f"Found {len(completed_courses)} completed courses")


        # Process programs
        base_program = base_program_resp.data
        target_program = target_program_resp.data

        if not base_program or not target_program:
            raise HTTPException(status_code=404, detail="Program not found")

        logger.info(f"Base: {base_program['program_name']}, Target: {target_program['program_name']}")

        codes = [c["course_code"] for c in completed_courses if c.get("course_code")]
        if codes:
            catalogue = supabase.table("unsw_courses").select("code, uoc, faculty, school").in_("code", codes).execute().data or []
            found = {row["code"]: row for row in catalogue}
            completed_courses = [
                {
                    **c,
                    "uoc": c.get("uoc") if c.get("uoc") not in (None, "") else (found.get(c["course_code"]) or {}).get("uoc"),
                    "faculty": (found.get(c["course_code"]) or {}).get("faculty"),
                    "school": (found.get(c["course_code"]) or {}).get("school"),
                }
                for c in completed_courses
            ]
        completed_uoc_total = sum(to_uoc(c.get("uoc")) for c in completed_courses)

        target_lists = [(None, parse_sections_json(target_program.get("sections")))]
        if spec_resp:
            target_lists += [(spec.get("major_name"), parse_sections_json(spec.get("sections"))) for spec in (spec_resp.data or [])]
        target_lists = fill_course_uoc(target_lists)
        credit = credit_completed_courses(target_lists, completed_courses)
        todo = still_to_do(target_lists, credit)
        total_uoc_required = to_uoc(target_program.get("minimum_uoc")) or 144
        base_total_uoc = to_uoc(base_program.get("minimum_uoc")) or 144
        timing = time_impact(total_uoc_required, credit["credited_uoc"], base_total_uoc, completed_uoc_total)
        total_completed = len(completed_courses)
        counted = credit["counted_courses"]
        transfer_percentage = (counted / max(total_completed, 1)) * 100
        lost_uoc = sum(c["uoc"] for c in credit["lost"])
        pool = credit["free_pool"]
        overflow_uoc = sum(c["uoc"] for c in pool["candidates"]) - pool["used_uoc"]
        logger.info(f"Transfer: {counted} of {total_completed} courses, {credit['credited_uoc']} UOC credited")

        return ProgramComparisonResponse(
            can_transfer=True,
            recommendation="",
            summary={
                "completed_courses_count": total_completed,
                "completed_uoc": completed_uoc_total,
                "courses_transfer": counted,
                "uoc_transfer": credit["credited_uoc"],
                "courses_needed": courses_left(todo),
                "uoc_needed": timing["uoc_needed"],
                "base_uoc_left": timing["base_uoc_left"],
                "extra_uoc": timing["extra_uoc"],
                "estimated_terms": timing["estimated_terms"],
                "base_terms_remaining": timing["base_terms_remaining"],
                "extra_terms": timing["extra_terms"],
                "estimated_completion": estimate_completion_date(timing["estimated_terms"]) if timing["estimated_terms"] else "Already complete",
                "progress_percentage": round((credit["credited_uoc"] / max(total_uoc_required, 1)) * 100, 1),
                "transfer_rate_courses": round(transfer_percentage, 1),
                "transfer_rate_uoc": round((credit["credited_uoc"] / max(completed_uoc_total, 1)) * 100, 1) if completed_uoc_total else 0,
            },
            transfer_analysis={
                "transferred_courses": credit["credited"],
                "free_pool": pool,
                "free_overflow_uoc": max(overflow_uoc, 0),
                "wasted_courses": credit["lost"],
                "non_transferable_courses": credit["lost"],
                "still_to_do": todo,
                "total_completed_courses": total_completed,
                "transferred_count": counted,
                "wasted_count": len(credit["lost"]),
                "completed_uoc": completed_uoc_total,
                "transferred_uoc": credit["credited_uoc"],
                "wasted_uoc": lost_uoc + max(overflow_uoc, 0),
                "transfer_rate": round(transfer_percentage, 1),
            },
            requirements_by_level={},
            critical_issues=[],
            detailed_breakdown={
                "base_program": {
                    "code": base_program["degree_code"],
                    "name": base_program["program_name"],
                    "faculty": base_program.get("faculty"),
                    "total_uoc": base_total_uoc,
                },
                "target_program": {
                    "code": target_program["degree_code"],
                    "name": target_program["program_name"],
                    "faculty": target_program.get("faculty"),
                    "total_uoc": total_uoc_required,
                },
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in program comparison: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not compare the programs. Please try again.")
