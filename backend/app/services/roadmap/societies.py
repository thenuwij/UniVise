import logging
from typing import Any, Dict

from app.llm.claude_client import ask_claude_structured
from app.models.roadmap import SocietiesSection
from app.services.roadmap.grounding import chosen_specialisations
from app.services.roadmap.professional_bodies import link_professional_bodies, professional_body_names
from app.services.roadmap.queries import fetch_society_rows

logger = logging.getLogger(__name__)


async def generate_societies(context: Dict[str, Any]) -> Dict[str, Any]:

    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")

    specialisation_context = chosen_specialisations(context)

    career_titles = [o["title"] for o in context.get("career_occupations") or [] if o.get("title")][:12]
    career_context = ""
    if career_titles:
        career_context = f"\nCareers this degree commonly leads to: {', '.join(career_titles)}.\n"

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
    {career_context}
    {verified_societies_section}

    CRITICAL ACCURACY RULES:
    - ONLY include societies that currently exist and are active on Arc UNSW (arc.unsw.edu.au).
    - NEVER invent a society. If you are not certain a society exists on Arc UNSW for this specific program and faculty, do not include it.
    - Society names must match their official Arc UNSW name exactly.
    - Select societies based solely on relevance to {program_name} and the Faculty of {faculty}. Do not default to societies from any particular discipline.
    - When careers are listed above, prefer societies that build skills, projects or contacts for those careers, and name the career they help in "relevance" or "why_join".

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
