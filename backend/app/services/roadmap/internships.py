import asyncio
import logging
import time
from typing import Any, Dict
from urllib.parse import quote

from app.llm.claude_client import ask_claude_structured
from app.models.roadmap import IndustryExperienceSection
from app.services.roadmap.grounding import chosen_specialisations, course_list_for_prompt, keep_listed_codes, replace_unlisted_codes, validate_url
from app.services.roadmap.internship_timing import apply_timings, search_program_timings

logger = logging.getLogger(__name__)


async def generate_internships(context: Dict[str, Any]) -> Dict[str, Any]:

    _start = time.time()
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")

    specialisation_context = chosen_specialisations(context)

    
    prompt = f"""FORMATTING RULE: Never use em dashes (—) or long dashes anywhere in your response. Rephrase using commas, colons, or split into separate sentences instead.

You are a UNSW career advisor. Provide industry experience information for {program_name} ({faculty}).
    {specialisation_context}


    Include:
    A. MANDATORY PLACEMENTS
      - Whether required for degree completion
      - Duration, timing, and key requirements if applicable
      - course_codes: the placement or industrial training courses from the course list below (for example an industrial training course, if it is listed). If none is in the list, return an empty list and say "not listed" in details.

    B. INTERNSHIP PROGRAMS (8 programs)
      - ONLY include real internship, vacation and graduate programs that are verified to exist, run by Australian employers that hire graduates of {program_name} specifically
      - Choose employers from this degree's own field, inferred from the degree and the course list below, not just the faculty
      - Prefer employers whose main business is in this field; include a large technology company only if this degree's field is computing, software or digital design
      - Use EXACT program names as the employer advertises them
      - apply_url must be the DIRECT careers page URL for that specific program, not a generic company homepage
      - If unsure of the exact apply URL, use the company's main careers page
      - application_period: the months applications usually open
      - competitiveness: one short phrase only (e.g. "Highly competitive", "Moderate", "Rolling intake")

    C. CAREER EVENTS & WIL
      - Major career fairs or employer events
      - Work Integrated Learning subjects or co-op programs
      - wil_course_codes: WIL or industry project courses from the course list below. If none is in the list, return an empty list and say "not listed" in wil_opportunities.

    {course_list_for_prompt(context.get("program_courses") or [])}

    REQUIRED JSON OUTPUT:
    {{
      "industry_experience": {{
        "mandatory_placements": {{
          "required": true/false,
          "details": "Description or 'No mandatory placements required.'"
        }},
        "internship_programs": [
          {{
            "program_name": "Specific program name",
            "company": "Company name",
            "duration": "e.g., '10-12 weeks'",
            "timing": "e.g., 'Summer (Nov-Feb)'",
            "paid": true/false,
            "application_period": "e.g., 'March-April'",
            "competitiveness": "Brief note",
            "apply_url": "Direct URL to apply or the company's careers page"
          }}
        ],
        "career_fairs": "Description of major fairs/events",
        "wil_opportunities": "WIL subjects or co-op info"
      }}
    }}

    Use REAL company and program names.
    """

    logger.info("Industry Experience Generating...")

    try:
        section = await ask_claude_structured(prompt, IndustryExperienceSection, model="claude-haiku-4-5-20251001")
        result = section.model_dump()
        experience = result["industry_experience"]
        allowed = {c["code"] for c in context.get("program_courses") or []}
        placements = experience["mandatory_placements"]
        placements["course_codes"] = keep_listed_codes(placements["course_codes"], allowed, 10)
        placements["details"] = replace_unlisted_codes(placements["details"], allowed)
        experience["wil_course_codes"] = keep_listed_codes(experience["wil_course_codes"], allowed, 10)
        experience["wil_opportunities"] = replace_unlisted_codes(experience["wil_opportunities"], allowed)
        experience["career_fairs"] = replace_unlisted_codes(experience["career_fairs"], allowed)
        programs = experience.get("internship_programs", [])
        logger.info(f"Industry generated {len(programs)} internship programs")

        if programs:
            urls = [p.get("apply_url", "") for p in programs]
            valid_flags, timings = await asyncio.gather(
                asyncio.gather(*[validate_url(u) for u in urls]),
                search_program_timings(programs),
                return_exceptions=True,
            )
            if isinstance(timings, Exception):
                logger.error(f"[internship_timing] failed, keeping AI opening months: {timings}")
                timings = {}
            apply_timings(programs, timings)
            for program, is_valid in zip(programs, valid_flags):
                if not is_valid and program.get("application_period_source"):
                    program["apply_url"] = program["application_period_source"]
                elif not is_valid:
                    query = quote(f"{program.get('company', '')} {program.get('program_name', '')} internship apply Australia")
                    program["apply_url"] = f"https://www.google.com/search?q={query}"
                    logger.info(f"[URL] Dead link replaced for {program.get('company')}")

        logger.debug(f"[TIMING] generate_internships: {time.time() - _start:.1f}s")
        return result

    except Exception:
        return {
            "industry_experience": {
                "mandatory_placements": {
                    "required": False,
                    "details": "Information temporarily unavailable",
                    "course_codes": [],
                },
                "internship_programs": [],
                "career_fairs": "Information temporarily unavailable",
                "wil_opportunities": "Information temporarily unavailable",
                "wil_course_codes": [],
            },
            "failed": True,
        }
