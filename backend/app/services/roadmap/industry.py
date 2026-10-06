# Generated the societies, industry and careers sections in roadmap university mode

import logging
import asyncio
import re
import time
from typing import Any, Dict

logger = logging.getLogger(__name__)
from datetime import datetime
from urllib.parse import quote
import httpx
from app.core.database import supabase
from app.llm.claude_client import ask_claude_structured
from app.llm.openai_client import ask_gpt_structured
from app.models.roadmap import IndustryExperienceSection, SocietiesSection, career_pathways_schema
from app.services.roadmap.cache import write_cached_roadmap
from app.services.roadmap.career_data import fetch_career_occupations
from app.services.roadmap.professional_bodies import link_professional_bodies, professional_body_names
from app.services.roadmap.salary_search import search_role_salaries
from app.services.roadmap.unsw_queries import fetch_program_course_list, fetch_society_rows, fetch_specialisation_context

COURSE_CODE = re.compile(r"\b[A-Z]{4}\d{4}\b")


def course_list_for_prompt(courses: list) -> str:
    if not courses:
        return "The program's course list is not available, so do not name any course codes."
    sections: Dict[str, list] = {}
    for c in courses:
        sections.setdefault((c.get("section") or "Other", c.get("section_rule") or ""), []).append(c)
    blocks = []
    for (title, rule), items in sections.items():
        header = f"{title}: {rule}" if rule else title
        blocks.append(header + "\n" + "\n".join(f"- {c['code']}: {c['name']}" for c in items))
    listing = "\n\n".join(blocks)
    return f"The program's real courses, grouped by the Handbook section and its rule. Only ever name course codes from this list, never invent one:\n{listing}"


def keep_listed_codes(codes: list, allowed: set, limit: int) -> list:
    kept = []
    for code in codes or []:
        code = (code or "").strip().upper()
        if code in allowed and code not in kept:
            kept.append(code)
    return kept[:limit]


def replace_unlisted_codes(text: str, allowed: set) -> str:
    return COURSE_CODE.sub(lambda m: m.group(0) if m.group(0) in allowed else "(course not listed)", text or "")


async def validate_url(url: str) -> bool:
    """Fire a HEAD request; return True if the URL is reachable."""
    if not url or not url.startswith("http"):
        return False
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
            resp = await client.head(url)
            return resp.status_code in (200, 301, 302, 403)
    except Exception:
        return False

# OpenAI call for generating societies
async def ai_generate_societies(context: Dict[str, Any]) -> Dict[str, Any]:

    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")

    # Add specialisation context
    selected_major = context.get("selected_major_name")
    selected_minor = context.get("selected_minor_name")
    selected_honours = context.get("selected_honours_name")

    specialisation_context = ""
    if any([selected_major, selected_minor, selected_honours]):
        specialisation_context = "\nThe student has chosen the following specialisations:\n"
        if selected_major:
            specialisation_context += f"- Major: {selected_major}\n"
        if selected_minor:
            specialisation_context += f"- Minor: {selected_minor}\n"
        if selected_honours:
            specialisation_context += f"- Honours: {selected_honours}\n"

    # Fetch the verified Arc UNSW society allowlist from Supabase.
    # If fetch fails or returns empty, fall back to unconstrained generation
    # (existing behaviour) so roadmap generation never crashes.
    verified_societies_section = ""
    rows = context["societies"] if "societies" in context else fetch_society_rows()
    if rows:
        lines = []
        for row in rows:
            name = (row.get("name") or "").strip()
            if not name:
                continue
            arc_cat = (row.get("arc_category") or "Uncategorised").strip()
            short = row.get("short_name")
            line = f"{name} [{arc_cat}]"
            if short:
                line += f" ({short.strip()})"
            lines.append(line)
        verified_list_text = "\n".join(lines)
        verified_societies_section = f"""

    VERIFIED ARC UNSW SOCIETY LIST, SELECT ONLY FROM THIS LIST:
{verified_list_text}

    You MUST only recommend societies whose name appears exactly in the list above.
    Copy the name field verbatim from the list, do not paraphrase, shorten, abbreviate, or alter it in any way.
    Do not invent or include any society not present in the list above.
    The bracketed [arc_category] after each name is context only, use it to inform relevance judgements, not as a category rule.
    The faculty_specific vs cross_faculty split is still your decision based on relevance to {program_name} and the Faculty of {faculty}.
"""
        logger.info(f"[Societies] Injected {len(lines)} verified societies into prompt")
    else:
        logger.warning("[Societies] unsw_societies table returned no rows, falling back to unconstrained generation")

    prompt = f"""FORMATTING RULE: Never use em dashes (—) or long dashes anywhere in your response. Rephrase using commas, colons, or split into separate sentences instead.

You are a UNSW student engagement advisor. Generate society recommendations for {program_name} students in the Faculty of {faculty}.
    {specialisation_context}
    {verified_societies_section}

    CRITICAL ACCURACY RULES:
    - ONLY include societies that currently exist and are active on Arc UNSW (arc.unsw.edu.au).
    - NEVER invent a society. If you are not certain a society exists on Arc UNSW for this specific program and faculty, do not include it.
    - Society names must match their official Arc UNSW name exactly.
    - Select societies based solely on relevance to {program_name} and the Faculty of {faculty}. Do not default to societies from any particular discipline.

    SOCIETY NAME FORMAT (STRICT, applies to every society in faculty_specific and cross_faculty):
    - If the society is commonly known by an acronym or short form, output the format: "Full Official Society Name (ShortForm)".
      Abstract pattern only, do not copy: "[Full Official Name Of The Society] ([CommonShortForm])".
    - If the society has no commonly used acronym, output only its full official name with no brackets.
    - NEVER output a bare acronym or nickname on its own. The name field must always start with the full official name.
    - This rule applies equally to BOTH "faculty_specific[].name" AND "cross_faculty[].name".
    - This is a formatting rule only. It must not influence which societies you choose, only how you write their names.

    PROFESSIONAL BODIES:
    - "student_chapters" and "professional_affiliation" may only name bodies from this list, written exactly as shown: {professional_body_names()}.
    - Choose 1 to 3 bodies relevant to {program_name}. If none fits, return an empty list and use null for professional_affiliation.
    - Never write a URL.

    OTHER FIELD RULES:
    - All descriptions must be 1 sentence maximum, concise and specific
    - Key activities: maximum 3 items, each under 8 words
    - Membership benefits: 1 sentence maximum
    - getting_started fields: each must be under 15 words

    REQUIRED JSON OUTPUT:
    {{
      "societies": {{
        "faculty_specific": [
          // Generate 3-5 faculty-specific societies relevant to this degree.
          {{
            "name": "Full official Arc UNSW society name. If the society has a common short form, append it in brackets at the end. Never output a bare acronym alone.",
            "category": "Academic/Professional/Social",
            "relevance": "One sentence, why specifically relevant to {program_name} students",
            "key_activities": ["Activity 1 (max 8 words)", "Activity 2", "Activity 3"],
            "membership_benefits": "One sentence, concrete benefits",
            "professional_affiliation": "A professional body name from the list above, or null"
          }}
        ],
        "cross_faculty": [
          {{
            "name": "Full official Arc UNSW society name. If the society has a common short form, append it in brackets at the end. Never output a bare acronym alone.",
            "why_join": "One sentence, specific benefit for {program_name} students"
          }}
          // Include 2-4 societies (maximum 4). Only include societies that genuinely benefit students from this specific program. Must be real, currently active Arc UNSW societies.
        ],
        "professional_development": {{
          "student_chapters": ["Professional body from the list above"],
          "leadership_note": "One sentence on exec role career value",
          "skills_gained": ["Skill 1", "Skill 2", "Skill 3"]
        }},
        "getting_started": {{
          "join_timing": "Under 15 words",
          "how_to_find": "Under 15 words"
        }}
      }}
    }}
    """

    logger.info("Societies generating...")

    try:
        section = await ask_claude_structured(prompt, SocietiesSection, model="claude-haiku-4-5-20251001")
        result = section.model_dump()
        development = result["societies"]["professional_development"]
        development["professional_bodies"] = link_professional_bodies(development["student_chapters"])
        faculty_count = len(result.get('societies', {}).get('faculty_specific', []))
        logger.info(f"[Stage 1: Societies] ✓ Generated {faculty_count} societies")
        return result
        
    except Exception as e:
        logger.error(f"[Stage 1: Societies] ✗ Error: {e}")
        return {
            "societies": {
                "faculty_specific": [],
                "cross_faculty": [],
                "professional_development": {
                    "student_chapters": [],
                    "leadership_note": "Information temporarily unavailable",
                    "skills_gained": []
                },
                "getting_started": {
                    "join_timing": "O-Week and Week 1 each term",
                    "how_to_find": "Visit arc.unsw.edu.au or attend O-Week stalls"
                }
            },
            "failed": True,
        }

# Generate industry experience section in parallel
async def ai_generate_industry_experience(context: Dict[str, Any]) -> Dict[str, Any]:

    _start = time.time()
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")

    # Add specialisation context
    selected_major = context.get("selected_major_name")
    selected_minor = context.get("selected_minor_name")
    selected_honours = context.get("selected_honours_name")

    specialisation_context = ""
    if any([selected_major, selected_minor, selected_honours]):
        specialisation_context = "\nThe student has chosen the following specialisations:\n"
        if selected_major:
            specialisation_context += f"- Major: {selected_major}\n"
        if selected_minor:
            specialisation_context += f"- Minor: {selected_minor}\n"
        if selected_honours:
            specialisation_context += f"- Honours: {selected_honours}\n"

    
    prompt = f"""FORMATTING RULE: Never use em dashes (—) or long dashes anywhere in your response. Rephrase using commas, colons, or split into separate sentences instead.

You are a UNSW career advisor. Provide industry experience information for {program_name} ({faculty}).
    {specialisation_context}


    Include:
    A. MANDATORY PLACEMENTS
      - Whether required for degree completion
      - Duration, timing, and key requirements if applicable
      - course_codes: the placement or industrial training courses from the course list below (for example an industrial training course, if it is listed). If none is in the list, return an empty list and say "not listed" in details.

    B. INTERNSHIP PROGRAMS (4-6 programs)
      - ONLY include real, well-known graduate internship programs that are verified to exist
      - Prioritise programs from major Australian employers known to recruit from UNSW
      - Use EXACT program names as advertised (e.g. "PwC Vacation Program", "Cochlear Student Internship", "BHP Graduate Program")
      - apply_url must be the DIRECT careers page URL for that specific program — not a generic company homepage
      - If unsure of exact apply URL, use the company's main careers page (e.g. https://careers.atlassian.com)
      - competitiveness: one short phrase only (e.g. "Highly competitive", "Moderate", "Rolling intake")

    C. TOP RECRUITING COMPANIES (8-10 companies)
      - Real companies that actively hire graduates in this specific discipline — infer from the degree field, not just the faculty
      - A Law degree → law firms, government, legal tech
      - An Industrial Design degree → product companies, manufacturers, consultancies, consumer electronics firms
      - Only include tech companies like Google or Atlassian if the degree is directly software, computer science, or digital design focused
      - Mix of large firms and notable employers relevant to the field

    D. CAREER EVENTS & WIL
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
            "apply_url": "Direct URL to apply or company careers page (e.g., 'https://careers.pwc.com.au/students')"
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

        # Validate apply_urls in parallel; replace dead links with fallback search redirect
        if programs:
            urls = [p.get("apply_url", "") for p in programs]
            valid_flags = await asyncio.gather(*[validate_url(u) for u in urls])
            for program, is_valid in zip(programs, valid_flags):
                if not is_valid:
                    query = quote(f"{program.get('company', '')} {program.get('program_name', '')} internship apply Australia")
                    program["apply_url"] = f"https://www.google.com/search?q={query}"
                    logger.info(f"[URL] Dead link replaced for {program.get('company')}")

        logger.debug(f"[TIMING] ai_generate_industry_experience: {time.time() - _start:.1f}s")
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


# Generate career pathways section in parallel
def occupation_list_for_prompt(occupations: list) -> str:
    if not occupations:
        return "Set anzsco_code to an empty string for every role."
    listing = "\n".join(f"- {o['code']}: {o['title']}" for o in occupations)
    return (
        "OCCUPATION GROUPS: every role must belong to one of these official occupation groups (ANZSCO code: title), "
        "which are the groups graduates of this degree work in. For each role, first choose its group in anzsco_code, "
        "then give it a real job title within that group, describe that group's work, and choose courses that build that group's skills. "
        "Use different groups across the roles where the degree allows.\n" + listing
    )


async def check_certification_links(certifications: list) -> None:
    flags = await asyncio.gather(*[validate_url(c.get("url", "")) for c in certifications])
    for cert, is_valid in zip(certifications, flags):
        if not is_valid:
            query = quote(f"{cert.get('name', '')} {cert.get('provider', '')} certification")
            cert["url"] = f"https://www.google.com/search?q={query}"


def apply_salaries(pathways: dict, salaries: dict) -> None:
    for stage in ("entry_level", "mid_career", "senior"):
        for role in pathways[stage]["roles"]:
            found = salaries.get(role["title"].strip().lower())
            if found:
                role["salary_range"] = found["salary_range"]
                role["salary_source"] = {"name": found["source"], "url": found["source_url"]}
            else:
                role["salary_source"] = None


async def ai_generate_career_pathways(context: Dict[str, Any]) -> Dict[str, Any]:

    _start = time.time()
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")
    occupations = context.get("career_occupations") or []
    occupation_titles = {o["code"]: o["title"] for o in occupations}

    selected_major = context.get("selected_major_name")
    selected_minor = context.get("selected_minor_name")
    selected_honours = context.get("selected_honours_name")

    specialisation_context = ""
    if any([selected_major, selected_minor, selected_honours]):
        specialisation_context = "\nThe student has chosen the following specialisations:\n"
        if selected_major:
            specialisation_context += f"- Major: {selected_major}\n"
        if selected_minor:
            specialisation_context += f"- Minor: {selected_minor}\n"
        if selected_honours:
            specialisation_context += f"- Honours: {selected_honours}\n"

    prompt = f"""FORMATTING RULE: Never use em dashes or long dashes anywhere in your response. Rephrase using commas, colons, or split into separate sentences instead.

You are a UNSW career advisor. Describe the career pathways open to {program_name} ({faculty}) graduates.
{specialisation_context}
{occupation_list_for_prompt(occupations)}

A. ENTRY ROLES (3 roles, 0 to 2 years), B. MID ROLES (2 roles, 3 to 7 years), C. SENIOR ROLES (2 roles, 8+ years). For every role:
  - title: a job title as it appears in Australian job ads (e.g. 'Graduate Accountant', 'Junior Data Analyst')
  - salary_range: your best estimate of a typical Australian annual salary for the role, as "$X - $Y" (it is checked against current sources later)
  - description: 3 sentences at most: day-to-day work, the skills it uses, and why it suits {program_name} graduates
  - requirements: a semicolon-separated list of at most 5 discrete skills
  - degree_path: one sentence on how this degree leads to the role, naming the student's specialisation if one is given above
  - degree_courses: 2 to 3 course codes from the course list below that build the skills this role needs. Only codes from the list. Return an empty list if none fit or the list is not available.
  - next_steps: up to 3 short, concrete actions a current student can take now towards this role

D. CERTIFICATIONS (2 to 3): name, provider, importance (Required/Highly Recommended/Optional), timeline, optional notes, and url: the official page for that certification (it is link-checked).

E. MARKET: trends (1 to 2 sentences on the outlook for these roles) and geographic_notes (where in Australia the work is).

{course_list_for_prompt(context.get("program_courses") or [])}
"""

    logger.info("Career Pathways Generating...")

    try:
        section = await ask_gpt_structured(
            prompt, career_pathways_schema(list(occupation_titles)), max_tokens=5000, model="gpt-5.4-mini"
        )
        result = section.model_dump()
        pathways = result["career_pathways"]
        allowed = {c["code"] for c in context.get("program_courses") or []}
        roles = [role for stage in ("entry_level", "mid_career", "senior") for role in pathways[stage]["roles"]]
        for role in roles:
            role["degree_courses"] = keep_listed_codes(role["degree_courses"], allowed, 3)
            role["degree_path"] = replace_unlisted_codes(role["degree_path"], allowed)
            role["occupation_title"] = occupation_titles.get(role["anzsco_code"])
        salaries, _ = await asyncio.gather(
            search_role_salaries(roles, program_name),
            check_certification_links(pathways["certifications"]),
            return_exceptions=True,
        )
        if isinstance(salaries, Exception):
            logger.error(f"[salary_search] failed, keeping AI estimates: {salaries}")
            salaries = {}
        apply_salaries(pathways, salaries)
        logger.debug(f"[TIMING] ai_generate_career_pathways: {time.time() - _start:.1f}s")
        return result

    except Exception as e:
        logger.error(f"ai_generate_career_pathways failed, returning empty pathways: {e}")

        return {
            "career_pathways": {
                "entry_level": {"roles": []},
                "mid_career": {"roles": []},
                "senior": {"roles": []},
                "certifications": [],
                "market_insights": {
                    "trends": "Information temporarily unavailable",
                    "geographic_notes": "Information temporarily unavailable"
                },
            },
            "failed": True,
        }


# Generate industry experience and career pathways ssections in one call
# Generate ALL industry-related sections (societies + industry_experience
# + career_pathways) in a SINGLE background task with ONE read-modify-write
# against unsw_roadmap.payload. This replaces the previously-split
# generate_and_update_societies() and generate_and_update_industry_careers()
# functions to eliminate the last-write-wins race that became possible after
# migrating societies generation from Sonnet to Haiku (completion gap went
# from ~14s to ~2s, so the two background tasks could now finish in either
# order and overwrite each other's payload writes under load).
INDUSTRY_GENERATORS = {
    "industry_societies": (ai_generate_societies, "societies"),
    "industry_experience": (ai_generate_industry_experience, "industry_experience"),
    "career_pathways": (ai_generate_career_pathways, "career_pathways"),
}


async def generate_industry_sections(degree_code: str, program_name: str, existing: dict):

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
        context = fetch_specialisation_context(existing.get("specialisation_ids") or [])
        codes = [*context["selected_major_courses"], *context["selected_minor_courses"], *context["selected_honours_courses"]]
        return context, fetch_program_course_list(degree_code, codes), fetch_career_occupations(degree_code, context["selected_major_codes"])

    faculty, (specialisations, program_courses, career_occupations), societies = await asyncio.gather(
        asyncio.to_thread(faculty_lookup),
        asyncio.to_thread(specialisation_part),
        asyncio.to_thread(fetch_society_rows),
    )

    base_context = {
        "program_name": program_name,
        "faculty": faculty or "Not specified",
        **specialisations,
        "program_courses": program_courses,
        "career_occupations": career_occupations,
        "societies": societies,
    }

    # Run all three AI generations in parallel. asyncio.gather with
    # return_exceptions=True ensures a single failure doesn't poison the
    # others — each result is checked individually below.
    previously_failed = set(existing.get("industry_failed") or [])
    todo = [k for k in INDUSTRY_GENERATORS if not existing.get(k) or k in previously_failed]

    ai_start = time.time()
    results = await asyncio.gather(
        *[INDUSTRY_GENERATORS[k][0](base_context) for k in todo],
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
        sections[key] = result.get(INDUSTRY_GENERATORS[key][1], {})
    return sections, failed


async def generate_and_update_all_industry(roadmap_id: str, roadmap_data: dict):

    total_start = time.time()

    sections, failed = await generate_industry_sections(
        roadmap_data.get("degree_code"),
        roadmap_data.get("program_name"),
        roadmap_data.get("payload") or {},
    )

    # SINGLE read-modify-write against unsw_roadmap.payload.
    # All three sections are merged in one operation so there is no window
    # in which two concurrent background tasks can overwrite each other.
    logger.info("All industry sections finished. Merging payload...")

    latest = supabase.from_("unsw_roadmap").select("payload").eq("id", roadmap_id).single().execute()
    payload = latest.data.get("payload", {}) if latest.data else {}

    # Merge (not replace) — any existing keys in payload (e.g. mandatory
    # placements, structure, etc.) are preserved. Only the three industry
    # sections are set/overwritten.
    payload.update(sections)
    payload["industry_failed"] = failed

    supabase.from_("unsw_roadmap").update({
        "payload": payload,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", roadmap_id).execute()

    if not failed and all(payload.get(k) for k in INDUSTRY_GENERATORS):
        write_cached_roadmap(payload.get("cache_key"), payload)

    logger.info(f"[TIMING] Total industry background generation: {time.time() - total_start:.1f}s")
