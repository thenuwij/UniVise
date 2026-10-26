import asyncio
import logging
import time
from typing import Any, Dict
from urllib.parse import quote

from app.llm.openai_client import ask_gpt_structured
from app.models.roadmap import career_pathways_schema
from app.services.roadmap.grounding import chosen_specialisations, course_list_for_prompt, keep_listed_codes, replace_unlisted_codes, validate_url
from app.services.careers.search_words import ad_search_words

logger = logging.getLogger(__name__)


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


def specialisation_list_for_prompt(options: list) -> str:
    if not options:
        return ""
    listing = "\n".join(f"- {o['code']}: {o['name']}" for o in options)
    return (
        "SPECIALISATIONS: the student has not chosen a specialisation, and this program has few courses of its own, "
        "so suggest specialisations instead of courses. For each role, put the codes of up to 2 specialisations below "
        "that genuinely prepare a student for it in specialisations, and name them in degree_path. "
        "Leave specialisations empty for a role that none of them prepares for.\n" + listing
    )


async def check_certification_links(certifications: list) -> None:
    flags = await asyncio.gather(*[validate_url(c.get("url", "")) for c in certifications])
    for cert, is_valid in zip(certifications, flags):
        if not is_valid:
            query = quote(f"{cert.get('name', '')} {cert.get('provider', '')} certification")
            cert["url"] = f"https://www.google.com/search?q={query}"


async def generate_career_paths(context: Dict[str, Any]) -> Dict[str, Any]:

    _start = time.time()
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")
    occupations = context.get("career_occupations") or []
    occupation_titles = {o["code"]: o["title"] for o in occupations}
    occupation_figures = {o["code"]: o for o in occupations}
    options = {o["code"]: o for o in context.get("specialisation_options") or []}
    courses = [] if options else context.get("program_courses") or []

    specialisation_context = chosen_specialisations(context)

    prompt = f"""FORMATTING RULE: Never use em dashes or long dashes anywhere in your response. Rephrase using commas, colons, or split into separate sentences instead.

You are a UNSW career advisor. Describe the career pathways open to {program_name} ({faculty}) graduates.
{specialisation_context}
{occupation_list_for_prompt(occupations)}

{specialisation_list_for_prompt(list(options.values()))}

A. ENTRY ROLES (3 roles, 0 to 2 years), B. MID ROLES (2 roles, 3 to 7 years), C. SENIOR ROLES (2 roles, 8+ years). For every role:
  - title: a job title as it appears in Australian job ads (e.g. 'Graduate Accountant', 'Junior Data Analyst')
  - salary_range: your best estimate of a typical Australian annual salary for the role, as "$X - $Y"
  - description: 3 sentences at most: day-to-day work, the skills it uses, and why it suits {program_name} graduates
  - requirements: a semicolon-separated list of at most 5 discrete skills
  - degree_path: one sentence on how this degree leads to the role, naming the student's specialisation if one is given above
  - degree_courses: 2 to 3 course codes from the course list below that build the skills this role needs. Only codes from the list. Return an empty list if none fit or the list is not available.
  - specialisations: {"up to 2 codes from the SPECIALISATIONS list above, or an empty list if none prepares for this role" if options else "an empty list"}
  - next_steps: up to 3 short, concrete actions a current student can take now towards this role

D. CERTIFICATIONS (2 to 3): name, provider, importance (Required/Highly Recommended/Optional), timeline, optional notes, and url: the official page for that certification (it is link-checked).

{course_list_for_prompt(courses)}
"""

    logger.info("Career Pathways Generating...")

    try:
        section = await ask_gpt_structured(
            prompt, career_pathways_schema(list(occupation_titles), list(options)), max_tokens=5000, model="gpt-5.4-mini"
        )
        result = section.model_dump()
        pathways = result["career_pathways"]
        allowed = {c["code"] for c in courses}
        roles = [role for stage in ("entry_level", "mid_career", "senior") for role in pathways[stage]["roles"]]
        for role in roles:
            role["degree_courses"] = keep_listed_codes(role["degree_courses"], allowed, 3)
            role["degree_path"] = replace_unlisted_codes(role["degree_path"], allowed)
            role["occupation_title"] = occupation_titles.get(role["anzsco_code"])
            figures = occupation_figures.get(role["anzsco_code"]) or {}
            role["typical_pay"] = {
                "weekly": figures["weekly_earnings"],
                "period": figures["data_period"],
                "source": figures["source"],
                "source_url": figures["source_url"],
            } if figures.get("weekly_earnings") else None
            role["in_demand_nsw"] = bool(figures.get("in_demand_nsw"))
            role["specialisations"] = [options[c] for c in dict.fromkeys(role["specialisations"]) if c in options][:2]
            role["salary_source"] = None
        await check_certification_links(pathways["certifications"])
        for role in pathways["entry_level"]["roles"]:
            role["ad_search"] = ad_search_words(role["title"])
        pathways["outlook"] = context.get("career_outlook") or []
        logger.debug(f"[TIMING] generate_career_paths: {time.time() - _start:.1f}s")
        return result

    except Exception as e:
        logger.error(f"generate_career_paths failed, returning empty pathways: {e}")

        return {
            "career_pathways": {
                "entry_level": {"roles": []},
                "mid_career": {"roles": []},
                "senior": {"roles": []},
                "certifications": [],
                "outlook": [],
            },
            "failed": True,
        }
