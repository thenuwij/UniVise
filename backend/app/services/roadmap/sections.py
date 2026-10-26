import asyncio
import logging
import time
from datetime import datetime

from app.core.database import supabase
from app.services.roadmap.cache import write_cached_roadmap
from app.services.roadmap.career_data import fetch_career_data
from app.services.roadmap.career_paths import generate_career_paths
from app.services.roadmap.internships import generate_internships
from app.services.roadmap.societies import generate_societies
from app.services.roadmap.unsw_queries import fetch_program_course_list, fetch_society_rows, fetch_specialisation_context, fetch_specialisation_options

logger = logging.getLogger(__name__)

THIN_PROGRAM_COURSES = 5
SECTION_GENERATORS = {
    "industry_societies": (generate_societies, "societies"),
    "industry_experience": (generate_internships, "industry_experience"),
    "career_pathways": (generate_career_paths, "career_pathways"),
}


async def generate_sections(degree_code: str, program_name: str, existing: dict):

    def faculty_lookup():
        if not degree_code:
            return None
        try:
            rows = (
                supabase.from_("unsw_degrees_final")
                .select("faculty")
                .eq("degree_code", degree_code)
                .limit(1)
                .execute()
                .data
            )
            return rows[0].get("faculty") if rows else None
        except Exception as e:
            logger.error(f"Failed to load faculty for {degree_code}: {e}")
            return None

    def specialisation_part():
        ids = existing.get("specialisation_ids") or []
        context = fetch_specialisation_context(ids)
        codes = [*context["selected_major_courses"], *context["selected_minor_courses"], *context["selected_honours_courses"]]
        program_courses = fetch_program_course_list(degree_code, codes)
        thin = not ids and len(program_courses) <= THIN_PROGRAM_COURSES
        options = fetch_specialisation_options(degree_code, program_name) if thin else []
        return context, program_courses, fetch_career_data(degree_code, context["selected_major_codes"]), options

    faculty, (specialisations, program_courses, career_data, specialisation_options), societies = await asyncio.gather(
        asyncio.to_thread(faculty_lookup),
        asyncio.to_thread(specialisation_part),
        asyncio.to_thread(fetch_society_rows),
    )

    base_context = {
        "program_name": program_name,
        "faculty": faculty or "Not specified",
        **specialisations,
        "program_courses": program_courses,
        "career_occupations": career_data["occupations"],
        "career_outlook": career_data["outlook"],
        "specialisation_options": specialisation_options,
        "societies": societies,
    }

    previously_failed = set(existing.get("industry_failed") or [])
    todo = [k for k in SECTION_GENERATORS if not existing.get(k) or k in previously_failed]

    ai_start = time.time()
    results = await asyncio.gather(
        *[SECTION_GENERATORS[k][0](base_context) for k in todo],
        return_exceptions=True,
    )

    logger.debug(f"[TIMING] Societies + Industry + Career Pathways generated in {time.time() - ai_start:.1f}s")

    sections = {}
    failed = []
    for key, result in zip(todo, results):
        if isinstance(result, Exception):
            logger.error(f"{key} generation failed: {result}")
            result = {}
        if not result or result.get("failed"):
            failed.append(key)
        sections[key] = result.get(SECTION_GENERATORS[key][1], {})
    return sections, failed


async def generate_and_save_sections(roadmap_id: str, roadmap_data: dict):

    total_start = time.time()

    sections, failed = await generate_sections(
        roadmap_data.get("degree_code"),
        roadmap_data.get("program_name"),
        roadmap_data.get("payload") or {},
    )

    logger.info("All industry sections finished. Merging payload...")

    latest = supabase.from_("unsw_roadmap").select("payload").eq("id", roadmap_id).single().execute()
    payload = latest.data.get("payload", {}) if latest.data else {}

    # Merge (not replace) — any existing keys in payload (e.g. mandatory
    # placements, structure, etc.) are preserved. Only the three generated
    # sections are set/overwritten.
    payload.update(sections)
    payload["industry_failed"] = failed

    supabase.from_("unsw_roadmap").update({
        "payload": payload,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", roadmap_id).execute()

    if not failed and all(payload.get(k) for k in SECTION_GENERATORS):
        write_cached_roadmap(payload.get("cache_key"), payload)

    logger.info(f"[TIMING] Total industry background generation: {time.time() - total_start:.1f}s")
