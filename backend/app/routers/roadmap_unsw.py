from typing import Any, Dict
import json

from app.utils.openai_client import ask_openai
from .roadmap_common import parse_json_or_500, assert_keys
from .roadmap_unsw_helpers import (
    fetch_degree_by_identifier,
    fetch_degree_related_info,
    fetch_program_core_courses,
    format_core_courses_for_prompt,
    get_honours_context_for_faculty,
)

# ========== MAIN FUNCTIONS ==========
async def gather_unsw_context(user_id: str, req) -> Dict[str, Any]:
    """
    Gathers complete context for UNSW degree roadmap generation.

    Includes:
    - Degree information
    - Related info (majors, minors, double degrees)
    - Core courses with enriched details
    - Honours context
    """
    print(f"Gathering UNSW context for request: {req}")

    # 1) Fetch degree information
    degree = fetch_degree_by_identifier(
        degree_id=req.degree_id,
        uac_code=req.uac_code,
        program_name=req.program_name,
    )

    degree_id = degree.get("id")
    degree_code = degree.get("code")

    # 2) Fetch related information
    majors, minors, doubles = fetch_degree_related_info(degree_id)

    # 3) Fetch and enrich core courses
    core_courses = []
    core_courses_formatted = ""

    if degree_code:
        core_courses = fetch_program_core_courses(degree_code)
        if core_courses:
            core_courses_formatted = format_core_courses_for_prompt(core_courses)

            # Debug logging
            print(f"\n{'='*50}")
            print(f"CORE COURSES FOR AI CONTEXT ({len(core_courses)} courses)")
            print(f"{'='*50}")
            for c in core_courses[:5]:  # Show first 5
                overview_preview = (c.get('overview') or '')[:100]
                print(f"  {c['code']}: {c.get('name')} | {c.get('section')} | {overview_preview}...")
            if len(core_courses) > 5:
                print(f"  ... and {len(core_courses) - 5} more courses")
            print(f"{'='*50}\n")

    # 4) Get honours context
    faculty = degree.get("faculty")
    honours_context = get_honours_context_for_faculty(faculty)

    # 5) Return complete context
    return {
        "user_id": user_id,
        "degree_id": degree_id,
        "degree_code": degree_code,
        "program_name": degree.get("program_name") or req.program_name,
        "uac_code": degree.get("uac_code"),
        "faculty": faculty,
        "lowest_selection_rank": degree.get("lowest_selection_rank"),
        "lowest_atar": degree.get("lowest_atar"),
        "description": degree.get("description"),
        "career_outcomes": degree.get("career_outcomes"),
        "assumed_knowledge": degree.get("assumed_knowledge"),
        "handbook_url": degree.get("handbook_url"),
        "majors": majors,
        "minors": minors,
        "double_degrees": doubles,
        "core_courses": core_courses,
        "core_courses_formatted": core_courses_formatted,
        "honours_context": honours_context,
    }


async def ai_generate_unsw_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate roadmap payload using AI with gathered context.

    Uses context to generate comprehensive program information including
    capstone courses identified from the actual core curriculum.
    """
    # Extract context values
    program_name = context.get("program_name")
    uac_code = context.get("uac_code")
    lowest_sel_rank = context.get("lowest_selection_rank")
    lowest_atar = context.get("lowest_atar")
    honours_context = context.get("honours_context", "")
    core_courses_text = context.get("core_courses_formatted", "")
    majors_count = len(context.get("majors", []))
    minors_count = len(context.get("minors", []))
    core_courses_count = len(context.get("core_courses", []))

    # Build AI prompt
    prompt = f"""You are a UNSW academic advisor. Using official UNSW sources (Handbook, progression plans, etc.), provide comprehensive information for {program_name} ({uac_code}).

=== HONOURS CONTEXT FOR THIS PROGRAM ===
{honours_context}

{core_courses_text}

=== INSTRUCTIONS ===
1. Provide detailed information for ALL sections below, not just honours.
2. For entry_requirements: Use the provided ATAR/selection rank and research typical subject prerequisites.
3. For capstone:
   - You MUST ONLY choose courses that appear in the core courses list provided above.
   - Use their descriptions to identify which ones are final-year or integrative (those mentioning 'project', 'thesis', 'capstone', 'design', 'research').
   - Choose 1–2 courses that most clearly represent the final-year culminating experience.
   - If no final-year capstone-like course exists in that list, state: "No dedicated capstone course identified in the core structure."
   - Include course codes and names exactly as they appear in the provided list.
   - Describe what students do in those courses, based on their names and overviews (thesis, industry project, etc.).
4. For honours: Use the honours context above to populate all fields accurately and include as many details from context as possible.
5. For flexibility: List majors, minors, electives, exchange opportunities, or dual degree options.
6. For industry: Include work placement/internship info, relevant student societies, and typical graduate roles.
7. Return ONLY valid JSON with NO trailing commas.


=== CONTEXT DATA ===
- Program: {program_name}
- UAC Code: {uac_code}
- ATAR: {json.dumps(lowest_atar) if lowest_atar is not None else "null"}
- Selection Rank: {json.dumps(lowest_sel_rank) if lowest_sel_rank is not None else "null"}
- Faculty: {context.get("faculty", "Not specified")}
- Majors available: {majors_count}
- Minors available: {minors_count}
- Core courses provided: {core_courses_count}

=== REQUIRED JSON OUTPUT ===
{{
  "summary": "Write 2-3 engaging sentences describing what this program offers, key focus areas, and career preparation",
  "entry_requirements": {{
    "atar": {json.dumps(lowest_atar) if lowest_atar is not None else "null"},
    "selectionRank": {json.dumps(lowest_sel_rank) if lowest_sel_rank is not None else "null"},
    "subjects": ["List 2-3 of assumed knowledge or recommended HSC subjects"],
    "notes": "Mention any adjustment factors, portfolio requirements, interviews, or special entry pathways"
  }},
  "capstone": {{
    "courses": ["List specific final-year capstone course codes and names FROM THE CORE COURSES LIST, e.g., COMP4920 Professional Issues and Ethics, SENG4920 Thesis A"],
    "highlights": "Describe what students do in their capstone based on the actual courses identified - thesis, industry project, research, design challenge, etc. Be specific about the structure if multiple courses are involved (e.g., Thesis A and B over two terms)."
  }},
  "honours": {{
    "classes": ["List each Honours class with mark range from the context above"],
    "entryCriteria": "Extract precise eligibility requirements from the honours context",
    "structure": "Extract program structure details from the honours context",
    "calculation": "Extract WAM calculation methodology from the honours context",
    "requirements": "Extract completion requirements from the honours context",
    "wamRestrictions": "Extract WAM restrictions from the honours context",
    "progressionRules": "Extract progression policies from the honours context",
    "awards": "Extract award information from the honours context",
    "careerOutcomes": "Extract career outcomes from the honours context"
  }},
  "flexibility": {{
    "options": ["List concrete flexibility options: majors ({majors_count} available), minors ({minors_count} available), electives, exchange programs, dual degrees, internships, etc. Be specific."]
  }},
  "industry": {{
    "trainingInfo": "Describe any mandatory or optional work placements, internships, industrial training, or practicum requirements",
    "societies": ["List 3-5 relevant student societies (e.g., UNSW Business Society, Engineering Society, etc.)"],
    "rolesHint": "List 5-8 specific graduate job titles or career paths for this degree"
  }},
  "source": "Provide the official UNSW Handbook URL for this program"
}}

CRITICAL: Every section must contain meaningful, specific information. Do not leave any section empty or with placeholder text.
CRITICAL FOR CAPSTONE: You MUST use the core courses list provided to identify actual capstone/thesis courses from this program. Only list courses that appear in the core courses section above.
"""

    # Generate AI response
    raw = ask_openai(prompt)
    draft = parse_json_or_500(raw)

    # Validate structure
    assert_keys(
        draft,
        ["summary", "entry_requirements", "capstone", "honours", "flexibility", "industry", "source"],
        "unsw",
    )

    # Validate capstone courses against core courses (extra safety check)
    core_codes = {c["code"] for c in context.get("core_courses", []) if c.get("code")}
    capstone_courses = draft.get("capstone", {}).get("courses", [])

    if capstone_courses and core_codes:
        # Filter to only include courses that appear in core courses
        validated_capstone = []
        for course_str in capstone_courses:
            if any(code in course_str for code in core_codes):
                validated_capstone.append(course_str)

        # Update or clear capstone based on validation
        if not validated_capstone:
            draft["capstone"]["courses"] = []
            draft["capstone"]["highlights"] = (
                "No dedicated capstone or thesis course was identified among the program's core courses."
            )
            print("Capstone validation: No valid capstone courses found in core courses list")
        else:
            draft["capstone"]["courses"] = validated_capstone
            print(f"Capstone validation: {len(validated_capstone)} courses validated against core curriculum")

    # Build final payload
    payload = {
        "summary": draft.get("summary"),
        "entry_requirements": draft.get("entry_requirements"),
        "capstone": draft.get("capstone"),
        "honours": draft.get("honours"),
        "flexibility": draft.get("flexibility"),
        "industry": draft.get("industry"),
        "source": draft.get("source"),
        "program_name": program_name,
        "uac_code": uac_code,
    }

    return payload
