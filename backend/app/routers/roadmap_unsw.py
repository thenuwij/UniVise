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


async def ai_generate_general_info(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 1: Generate general program information (everything except honours).
    
    This is a lighter prompt focused on program overview, entry requirements,
    capstone, flexibility, and industry connections.
    """
    # Extract context values
    program_name = context.get("program_name")
    uac_code = context.get("uac_code")
    lowest_sel_rank = context.get("lowest_selection_rank")
    lowest_atar = context.get("lowest_atar")
    core_courses_text = context.get("core_courses_formatted", "")
    majors_count = len(context.get("majors", []))
    minors_count = len(context.get("minors", []))
    core_courses_count = len(context.get("core_courses", []))

    # Token monitoring
    prompt_est_tokens = len(core_courses_text) // 4
    print(f"Stage 1 prompt size: ~{prompt_est_tokens} tokens")

    # Build AI prompt for general info
    prompt = f"""You are a UNSW academic advisor. Using official UNSW sources (Handbook, progression plans, etc.), provide comprehensive information for {program_name} ({uac_code}).

{core_courses_text}

=== INSTRUCTIONS ===
1. For entry_requirements: Use the provided ATAR/selection rank and research typical subject prerequisites.
2. For capstone:
   - You MUST ONLY choose courses that appear in the core courses list provided above.
   - Use their descriptions to identify which ones are final-year or integrative (those mentioning 'project', 'thesis', 'capstone', 'design', 'research').
   - Choose 1–2 courses that most clearly represent the final-year culminating experience.
   - If no final-year capstone-like course exists in that list, state: "No dedicated capstone course identified in the core structure."
   - Include course codes and names exactly as they appear in the provided list.
   - Describe what students do in those courses, based on their names and overviews (thesis, industry project, etc.).
3. For flexibility: List majors, minors, electives, exchange opportunities, or dual degree options.
4. For industry: Include work placement/internship info, relevant student societies, and typical graduate roles.
5. Return ONLY valid JSON with NO trailing commas.

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

CRITICAL FOR CAPSTONE: You MUST use the core courses list provided to identify actual capstone/thesis courses from this program. Only list courses that appear in the core courses section above.
"""

    print("Stage 1: Generating general program information...")
    raw = ask_openai(prompt)
    draft = parse_json_or_500(raw)

    # Validate structure
    assert_keys(
        draft,
        ["summary", "entry_requirements", "capstone", "flexibility", "industry", "source"],
        "unsw_general",
    )

    # Validate capstone courses against core courses
    core_codes = {c["code"] for c in context.get("core_courses", []) if c.get("code")}
    capstone_courses = draft.get("capstone", {}).get("courses", [])

    if capstone_courses and core_codes:
        validated_capstone = []
        for course_str in capstone_courses:
            if any(code in course_str for code in core_codes):
                validated_capstone.append(course_str)

        if not validated_capstone:
            draft["capstone"]["courses"] = []
            draft["capstone"]["highlights"] = (
                "No dedicated capstone or thesis course was identified among the program's core courses."
            )
            print("Capstone validation: No valid capstone courses found in core courses list")
        else:
            draft["capstone"]["courses"] = validated_capstone
            print(f"Capstone validation: {len(validated_capstone)} courses validated against core curriculum")

    print("Stage 1: General program information generated successfully")
    return draft


async def ai_generate_honours_info(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 2: Generate detailed honours information with OPTIMIZED prompt.
    
    Compressed instructions while maintaining extraction quality.
    """
    program_name = context.get("program_name")
    uac_code = context.get("uac_code")
    honours_context = context.get("honours_context", "")

    # Token monitoring
    honours_tokens = len(honours_context) // 4
    print(f"Stage 2 honours context size: ~{honours_tokens} tokens")
    
    if honours_tokens > 2000:
        print("Large honours context - may need compression in future")

    # OPTIMIZED: Compressed prompt while keeping extraction quality
    prompt = f"""Extract detailed honours information for {program_name} ({uac_code}). Preserve ALL specific numbers, thresholds, and requirements from the context below.

HONOURS CONTEXT:
{honours_context}

EXTRACTION RULES:
- Include EVERY specific number (WAM thresholds, UOC, percentages, mark ranges)
- Preserve technical terms (Faculty WAM, Honours WAM, etc.)
- Keep all policies and procedures
- Write comprehensive paragraphs (not bullet points)

OUTPUT (all fields are paragraph strings except "classes" which is an array):
{{
  "honours": {{
    "classes": ["List each class with exact mark criteria, e.g. 'Class 1 – Mark ≥85 and thesis ≥65'"],
    "entryCriteria": "Extract ALL entry requirements: exact WAM thresholds (overall and major-specific), prerequisites, supervisor approval requirements, competitive selection details, specialization differences, capacity limits",
    "structure": "Extract ALL structural details: embedded/separate year, duration, total UOC, coursework component (percentage, UOC, levels), thesis component (percentage, UOC, terms), industrial training, discipline variations",
    "calculation": "Extract COMPLETE methodology: WAM type used, exact weighting formula (e.g. Level 1 ×1, Level 2 ×2...), percentage splits, included/excluded courses, classification thresholds, decimal precision, rounding rules",
    "requirements": "Extract ALL completion requirements: specific course requirements, thesis standards, minimum UOC, industrial training details, performance minimums, milestones, deadlines",
    "wamRestrictions": "Extract ALL WAM rules: fail grade treatment, Academic Withdrawal handling, repeat attempts, external courses, substitution policies with exact thresholds, dual degree differences, exclusions",
    "progressionRules": "Extract ALL policies: UOC milestones with exact numbers, failure thresholds and limits, show cause triggers, transfer procedures and target degrees, appeals processes with committee names, review timelines",
    "awards": "Extract ALL awards: University Medal with exact criteria (WAM, thesis, no fails), Dean's awards, prizes, recognitions with specific requirements",
    "careerOutcomes": "Extract ALL benefits: specific postgraduate pathways, professional accreditation bodies by name, career roles and industries, research opportunities, academic positions, employment advantages"
  }}
}}

CRITICAL: Return ONLY the JSON object above. No explanatory text before or after. Start with {{ and end with }}. Ensure all JSON is valid with proper closing braces.
"""

    print("Stage 2: Generating honours information...")
    
    try:
        raw = ask_openai(prompt)
        print(f"Stage 2: Raw AI response length: {len(raw)} characters")
        
        # Clean the response - remove any text before first { and after last }
        raw_stripped = raw.strip()
        
        # Find first { and last }
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            json_only = raw_stripped[first_brace:last_brace+1]
            print(f"Stage 2: Extracted JSON from position {first_brace} to {last_brace+1}")
        else:
            json_only = raw_stripped
            print(f"Stage 2: No JSON extraction needed")
        
        # Try to parse the cleaned response
        draft = parse_json_or_500(json_only)
        print(f"Stage 2: JSON parsed successfully")
        
        # Validate structure
        assert_keys(draft, ["honours"], "unsw_honours")
        print(f"Stage 2: Structure validated successfully")
        
    except json.JSONDecodeError as e:
        print(f"Stage 2 JSON parsing failed: {e}")
        print(f"Raw response preview: {raw[:500]}...")
        # Return minimal honours structure to prevent total failure
        return {
            "honours": {
                "classes": [],
                "entryCriteria": "Honours information temporarily unavailable.",
                "structure": "Honours information temporarily unavailable.",
                "calculation": "Honours information temporarily unavailable.",
                "requirements": "Honours information temporarily unavailable.",
                "wamRestrictions": "Honours information temporarily unavailable.",
                "progressionRules": "Honours information temporarily unavailable.",
                "awards": "Honours information temporarily unavailable.",
                "careerOutcomes": "Honours information temporarily unavailable."
            }
        }
    except Exception as e:
        print(f"Stage 2 unexpected error: {type(e).__name__}: {e}")
        # Return minimal honours structure
        return {
            "honours": {
                "classes": [],
                "entryCriteria": "Honours information temporarily unavailable.",
                "structure": "Honours information temporarily unavailable.",
                "calculation": "Honours information temporarily unavailable.",
                "requirements": "Honours information temporarily unavailable.",
                "wamRestrictions": "Honours information temporarily unavailable.",
                "progressionRules": "Honours information temporarily unavailable.",
                "awards": "Honours information temporarily unavailable.",
                "careerOutcomes": "Honours information temporarily unavailable."
            }
        }

    print("Stage 2: Honours information generated successfully")
    return draft


async def ai_generate_unsw_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate complete roadmap payload using optimized two-stage AI generation.
    
    Stage 1: General program information (lighter, faster)
    Stage 2: Detailed honours information (compressed prompt, better stability)
    
    This approach balances detail with reliability.
    """
    print("Starting two-stage AI generation (optimized)...")
    
    # Stage 1: Generate general info
    general_info = await ai_generate_general_info(context)
    
    # Stage 2: Generate honours info with compressed prompt (with fallback)
    try:
        honours_info = await ai_generate_honours_info(context)
    except Exception as e:
        print(f"Stage 2 failed, using fallback honours structure: {e}")
        honours_info = {
            "honours": {
                "classes": [],
                "entryCriteria": "Honours information could not be generated at this time.",
                "structure": "Honours information could not be generated at this time.",
                "calculation": "Honours information could not be generated at this time.",
                "requirements": "Honours information could not be generated at this time.",
                "wamRestrictions": "Honours information could not be generated at this time.",
                "progressionRules": "Honours information could not be generated at this time.",
                "awards": "Honours information could not be generated at this time.",
                "careerOutcomes": "Honours information could not be generated at this time."
            }
        }
    
    # Combine both stages
    payload = {
        "summary": general_info.get("summary"),
        "entry_requirements": general_info.get("entry_requirements"),
        "capstone": general_info.get("capstone"),
        "honours": honours_info.get("honours"),
        "flexibility": general_info.get("flexibility"),
        "industry": general_info.get("industry"),
        "source": general_info.get("source"),
        "program_name": context.get("program_name"),
        "uac_code": context.get("uac_code"),
    }

    print("Two-stage generation complete!")
    return payload