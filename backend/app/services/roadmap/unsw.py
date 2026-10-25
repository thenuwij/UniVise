import asyncio
import logging
from typing import Any, Dict

from app.services.roadmap.unsw_queries import (
    fetch_degree_by_identifier,
    fetch_program_core_courses,
    fetch_program_course_list,
    fetch_society_rows,
    fetch_specialisation_context,
    fetch_specialisation_ids,
)

logger = logging.getLogger(__name__)

# Gathers complete context for UNSW degree roadmap generation.
async def gather_unsw_context(user_id: str, req, specialisation_ids: list | None = None) -> Dict[str, Any]:

    logger.info(f"Gathering UNSW context for request: {req}")

    degree = await asyncio.to_thread(
        fetch_degree_by_identifier,
        degree_id=req.degree_id,
        uac_code=req.uac_code,
        program_name=req.program_name,
    )

    degree_id = degree.get("id")
    degree_code = degree.get("degree_code")
    faculty = degree.get("faculty")
    program_name = degree.get("program_name") or req.program_name

    def specialisation_part():
        if specialisation_ids is not None:
            ids = sorted(specialisation_ids)
        elif user_id and degree_code:
            ids = fetch_specialisation_ids(user_id, degree_code, program_name or "")
        else:
            ids = []
        context = fetch_specialisation_context(ids)
        codes = [*context["selected_major_courses"], *context["selected_minor_courses"], *context["selected_honours_courses"]]
        return ids, context, fetch_program_course_list(degree_code, codes)

    core_courses, (recorded_ids, specialisations, program_courses), societies = await asyncio.gather(
        asyncio.to_thread(fetch_program_core_courses, degree_code),
        asyncio.to_thread(specialisation_part),
        asyncio.to_thread(fetch_society_rows),
    )

    # Return complete context
    return {
        "user_id": user_id,
        "degree_id": degree_id,
        "degree_code": degree_code,
        "program_name": program_name,
        "uac_code": degree.get("uac_code"),
        "faculty": faculty,
        "description": degree.get("overview_description"),
        "career_outcomes": degree.get("career_outcomes"),
        "handbook_url": degree.get("source_url"),
        "core_courses": core_courses,
        "specialisation_ids": recorded_ids,
        "program_courses": program_courses,
        "societies": societies,
        "selected_honours_name": specialisations.get("selected_honours_name"),
        "selected_honours_courses": specialisations.get("selected_honours_courses", []),
        "selected_major_name": specialisations.get("selected_major_name"),
        "selected_major_courses": specialisations.get("selected_major_courses", []),
        "selected_minor_name": specialisations.get("selected_minor_name"),
        "selected_minor_courses": specialisations.get("selected_minor_courses", []),
    }

def build_unsw_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "program_name": context.get("program_name"),
        "uac_code": context.get("uac_code"),
        "selected_honours_name": context.get("selected_honours_name"),
        "selected_honours_courses": context.get("selected_honours_courses", []),
        "selected_major_name": context.get("selected_major_name"),
        "selected_major_courses": context.get("selected_major_courses", []),
        "selected_minor_name": context.get("selected_minor_name"),
        "selected_minor_courses": context.get("selected_minor_courses", []),
    }
