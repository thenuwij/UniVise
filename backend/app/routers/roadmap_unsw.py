from typing import Any, Dict
import json
import time

from app.utils.openai_client import ask_openai
from .roadmap_common import parse_json_or_500, assert_keys
from .roadmap_unsw_helpers import (
    fetch_degree_by_identifier,
    fetch_degree_related_info,
    fetch_program_core_courses,
    format_core_courses_for_prompt,
    fetch_user_specialisation_context,
)

# Gathers complete context for UNSW degree roadmap generation.
async def gather_unsw_context(user_id: str, req) -> Dict[str, Any]:

    total_start = time.time()

    print(f"Gathering UNSW context for request: {req}")

    # Fetch degree information
    t1 = time.time()
    degree = fetch_degree_by_identifier(
        degree_id=req.degree_id,
        uac_code=req.uac_code,
        program_name=req.program_name,
    )

    print(f"[TIMING] fetch_degree_by_identifier: {time.time() - t1:.1f}s")

    degree_id = degree.get("id")
    degree_code = degree.get("degree_code")

    # Fetch related information
    t2 = time.time()
    majors, minors, doubles = fetch_degree_related_info(degree_id)
    print(f"[TIMING] fetch_degree_related_info: {time.time() - t2:.1f}s")

    # Fetch core courses
    core_courses = []
    core_courses_formatted = ""

    # print(f"Degree ID: {degree_id}")
    # print(f"Degree Code: {degree_code}")
    # print(f"Program Name: {degree.get('program_name')}")
    # print(f"Faculty: {degree.get('faculty')}")

    if degree_code:
        t3 = time.time()
        core_courses = fetch_program_core_courses(degree_code)
        print(f"[TIMING] fetch_program_core_courses: {time.time() - t3:.1f}s")
        if core_courses:
            t4 = time.time()
            core_courses_formatted = format_core_courses_for_prompt(core_courses)
            print(f"[TIMING] format_core_courses_for_prompt: {time.time() - t4:.1f}s")

            # Debug logging
            # print(f"\n{'='*50}")
            # print(f"CORE COURSES FOR AI CONTEXT ({len(core_courses)} courses)")
            # print(f"{'='*50}")

            for c in core_courses[:5]:  # Show first 5
                overview_preview = (c.get('overview') or '')[:100]
                print(f"  {c['code']}: {c.get('name')} | {c.get('section')} | {overview_preview}...")
            if len(core_courses) > 5:
                print(f"  ... and {len(core_courses) - 5} more courses")
            print(f"{'='*50}\n")

    faculty = degree.get("faculty")
    
    specialisations = {}
    if user_id and degree_code:
        try:
            specialisations = fetch_user_specialisation_context(user_id, degree_code)
            print(f"[TIMING] Fetched specialisations: {specialisations.get('selected_honours_name', 'None')}")
        except Exception as e:
            print(f"[ERROR] Failed to fetch specialisations: {e}")


    # Return complete context
    return {
        "user_id": user_id,
        "degree_id": degree_id,
        "degree_code": degree_code,
        "program_name": degree.get("program_name") or req.program_name,
        "uac_code": degree.get("uac_code"),
        "faculty": faculty,
        "lowest_selection_rank": degree.get("lowest_selection_rank"),
        "lowest_atar": degree.get("lowest_atar"),
        "description": degree.get("overview_description"),
        "career_outcomes": degree.get("career_outcomes"),
        "assumed_knowledge": degree.get("assumed_knowledge"),
        "handbook_url": degree.get("source_url"),
        "majors": majors,
        "minors": minors,
        "double_degrees": doubles,
        "core_courses": core_courses,
        "core_courses_formatted": core_courses_formatted,
        "selected_honours_name": specialisations.get("selected_honours_name"),
        "selected_honours_courses": specialisations.get("selected_honours_courses", []),
        "selected_honours_overview": specialisations.get("selected_honours_overview"),
        "selected_major_name": specialisations.get("selected_major_name"),
        "selected_major_courses": specialisations.get("selected_major_courses", []),
        "selected_minor_name": specialisations.get("selected_minor_name"),
        "selected_minor_courses": specialisations.get("selected_minor_courses", []),
    }

# generate general program information except honours
async def ai_generate_general_info(context: Dict[str, Any]) -> Dict[str, Any]:

    # Extract context values
    program_name = context.get("program_name")
    uac_code = context.get("uac_code")
    lowest_sel_rank = context.get("lowest_selection_rank")
    lowest_atar = context.get("lowest_atar")
    core_courses_text = context.get("core_courses_formatted", "")
    majors_count = len(context.get("majors", []))
    minors_count = len(context.get("minors", []))
    core_courses_count = len(context.get("core_courses", []))
    selected_honours = context.get("selected_honours_name")
    selected_honours_courses = context.get("selected_honours_courses", [])
    selected_honours_overview = context.get("selected_honours_overview")
    selected_major_name = context.get("selected_major_name")
    selected_major_courses = context.get("selected_major_courses", [])
    selected_minor_name = context.get("selected_minor_name")
    selected_minor_courses = context.get("selected_minor_courses", [])

    # Build specialisation courses context for ALL THREE types (honours, major, minor)
    specialisation_courses_text = ""
    has_any_specialisation = selected_honours_courses or selected_major_courses or selected_minor_courses

    if has_any_specialisation:
        specialisation_courses_text = "\n=== STUDENT'S SELECTED SPECIALISATIONS ===\n"
        
        if selected_honours and selected_honours_courses:
            specialisation_courses_text += f"Honours: {selected_honours}\n"
            specialisation_courses_text += f"Core Honours Courses: {', '.join(selected_honours_courses)}\n\n"
        
        if selected_major_name and selected_major_courses:
            specialisation_courses_text += f"Major: {selected_major_name}\n"
            specialisation_courses_text += f"Core Major Courses: {', '.join(selected_major_courses)}\n\n"
        
        if selected_minor_name and selected_minor_courses:
            specialisation_courses_text += f"Minor: {selected_minor_name}\n"
            specialisation_courses_text += f"Core Minor Courses: {', '.join(selected_minor_courses)}\n\n"
        
        specialisation_courses_text += "IMPORTANT: When selecting signature courses, prioritize courses from the student's selected specialisations that showcase advanced/unique aspects of their chosen pathway.\n"
        
        # Build log message
        selected_list = []
        if selected_honours: selected_list.append(f"Honours: {selected_honours}")
        if selected_major_name: selected_list.append(f"Major: {selected_major_name}")
        if selected_minor_name: selected_list.append(f"Minor: {selected_minor_name}")
        print(f"[Capstone] Including specialisation courses - {', '.join(selected_list)}")
    else:
        print(f"[Capstone] No specialisations selected, using core courses only")
        

    # Token monitoring
    prompt_est_tokens = len(core_courses_text) // 4
    print(f"Stage 1 prompt size: ~{prompt_est_tokens} tokens")

    # Build AI prompt for general info
    prompt = f"""You are a UNSW academic advisor. Using official UNSW sources (Handbook, progression plans, etc.), provide comprehensive information for {program_name} ({uac_code}).

{core_courses_text}

{specialisation_courses_text}

=== INSTRUCTIONS ===
1. For entry_requirements: Use the provided ATAR/selection rank and research typical subject prerequisites.

2. For capstone (PROGRAM HIGHLIGHTS):
   - In "courses": List 2-3 SIGNATURE courses that best represent this program
   - Choose from BOTH the core courses list AND specialisation courses (if provided above)
   - Prioritize: final-year capstone projects, industry partnership courses, thesis/research units, or advanced technical courses
   
   - In "highlights": Write 2-3 sentences about what makes this program VALUABLE and why students should choose it.
     Focus on PRACTICAL VALUE and OUTCOMES:
     * What unique skills or expertise will students develop?
     * What real-world experience or hands-on learning opportunities are available?
     * How does the program prepare students for their career or further study?
     * What makes graduates of this program competitive in the job market?
     * What professional development or industry connections does the program provide?
     
     DO NOT write generic statements like "strong industry connections" or "excellent career prospects"
     DO write value-focused statements like "Develops advanced financial modeling skills through live trading simulations and professional-grade tools, preparing graduates for analyst roles in investment banking"

4. For industry: Include work placement/internship info, relevant student societies, and typical graduate roles.
5. Return ONLY valid JSON with NO trailing commas.

=== CONTEXT DATA ===
- Program: {program_name}
- UAC Code: {uac_code}
- ATAR_provided: {json.dumps(lowest_atar)}
- SelectionRank_provided: {json.dumps(lowest_sel_rank)}
- Faculty: {context.get("faculty", "Not specified")}
- Majors available: {majors_count}
- Minors available: {minors_count}
- Core courses provided: {core_courses_count}
{"- Selected Honours: " + selected_honours + " (" + str(len(selected_honours_courses)) + " core courses)" if selected_honours else ""}
{"- Selected Major: " + selected_major_name + " (" + str(len(selected_major_courses)) + " core courses)" if selected_major_name else ""}
{"- Selected Minor: " + selected_minor_name + " (" + str(len(selected_minor_courses)) + " core courses)" if selected_minor_name else ""}

=== REQUIRED JSON OUTPUT ===
{{
  "summary": "Write 2-3 engaging sentences describing what this program offers, key focus areas, and career preparation",
  "entry_requirements": {{
    "atar": "Output ONLY a number (no words). If ATAR_provided is a number, use it exactly. If it is null, output a realistic UNSW ATAR cutoff as a pure integer or float.",
    "selectionRank": "Output ONLY a number (no words). If SelectionRank_provided is a number, use it exactly. If it is null, output a realistic UNSW selection rank cutoff as a pure integer or float.",
    "subjects": ["List 2-3 assumed knowledge or recommended HSC subjects"],
    "notes": "Mention adjustment factors or pathways"
  }},

  "capstone": {{
    "courses": ["List 2-3 signature course codes and names - choose from BOTH core courses AND specialisation courses (if provided). Prioritize advanced/unique courses."],
    "highlights": "Write 2-3 sentences with SPECIFIC, CONCRETE details about opportunities, partnerships, facilities, outcomes, and career advantages. Include real company names, actual numbers, and tangible benefits."
  }},
  "flexibility": {{
    "options": ["List concrete flexibility options: majors ({majors_count} available), minors ({minors_count} available), electives, exchange programs, dual degrees, internships, etc. Be specific."]
  }},
  "industry": {{
    "trainingInfo": "Describe any mandatory or optional work placements, internships, industrial training, or practicum requirements",
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
    all_valid_codes = {c["code"] for c in context.get("core_courses", []) if c.get("code")}
    all_valid_codes.update(selected_honours_courses)
    all_valid_codes.update(selected_major_courses)
    all_valid_codes.update(selected_minor_courses)

    capstone_courses = draft.get("capstone", {}).get("courses", [])

    if capstone_courses and all_valid_codes:
        validated_capstone = []
        for course_str in capstone_courses:
            if any(code in course_str for code in all_valid_codes):
                validated_capstone.append(course_str)

        if not validated_capstone:
            draft["capstone"]["courses"] = []
            draft["capstone"]["highlights"] = (
                "No dedicated capstone or signature course was identified among the program's courses."
            )
            print("Capstone validation: No valid courses found")
        else:
            draft["capstone"]["courses"] = validated_capstone
            source = 'core + specialisation' if has_any_specialisation else 'core only'
            print(f"Capstone validation: {len(validated_capstone)} courses validated from {source}")
    print("Stage 1: General program information generated successfully")
    return draft

# Stage 2: Return hardcoded honours information based on faculty.
async def ai_generate_honours_info(context: Dict[str, Any]) -> Dict[str, Any]:

    faculty = context.get("faculty", "").lower()
    
    print(f"Stage 2: Fetching hardcoded honours for faculty: {faculty}")
    
    # Hardcoded honours structures
    HONOURS_DATA = {
        "business": {
            "classes": [
                "Class 1 – Mark of 85 and above",
                "Class 2 Division 1 – 75 to 84",
                "Class 2 Division 2 – 65 to 74",
                "Class 3 – 50 to 64"
            ],
            "entryCriteria": "Admission to Honours at UNSW Business School normally requires a minimum overall and major WAM of 70–80, completion of all core and major requirements, and the availability of an academic supervisor. Some specialisations (e.g., Finance) require a higher WAM or minimum grades in specific courses. Entry is competitive and based on academic merit and supervisor capacity.",
            "structure": "Honours is an optional one-year advanced program that combines advanced coursework and an independent research thesis in the student's major area of study. It is available to high-achieving students from business-related or quantitative degrees across disciplines such as Accounting, Finance, Economics, Marketing, Information Systems, Actuarial Studies, Business Analytics, Human Resource Management, and International Business.",
            "calculation": "The Honours mark is based on 50% coursework and 50% thesis performance, allowing students to demonstrate both analytical and research capability. The final classification reflects combined performance across both components.",
            "requirements": "Students must complete advanced coursework units and an independent research thesis under academic supervision. All core and major requirements from the undergraduate degree must be completed before commencing Honours. Students must maintain satisfactory progress and meet thesis submission deadlines.",
            "wamRestrictions": "Some specialisations require a higher WAM threshold or minimum grades in specific prerequisite courses. WAM calculations follow standard UNSW policies regarding fail grades, repeat attempts, and course exclusions. Dual degree students should consult their program authority for specific WAM requirements.",
            "progressionRules": "Students must maintain satisfactory academic progress throughout the Honours year. Progression is monitored through coursework performance and thesis milestones. Students who fail to meet progression requirements may be required to show cause or withdraw from the program. Appeals are handled through the Business School's academic progress review process.",
            "awards": "High-performing Honours graduates may be eligible for faculty prizes, scholarships, and academic recognition. The University Medal may be awarded to exceptional students who demonstrate outstanding performance across coursework and thesis components, though specific criteria vary by discipline.",
            "careerOutcomes": "Completion of Honours provides a strong foundation for postgraduate study or research (e.g., Master's or PhD) and enhances career prospects in academic and professional roles. Honours graduates are highly regarded by employers and research institutions for their advanced analytical skills and independent research capability."
        },
        
        "engineering": {
            "classes": [
                "Class 1 – Honours WAM ≥ 80 and thesis mark ≥ 65",
                "Class 2 Division 1 – Honours WAM ≥ 75 and thesis mark ≥ 65",
                "Class 2 Division 2 – Honours WAM ≥ 65 and thesis mark ≥ 65"
            ],
            "entryCriteria": "All graduates of the Bachelor of Engineering (Honours) program are awarded the Honours degree. The specific Class of Honours is determined by performance in upper-level coursework and thesis research. Honours is embedded within the four-year program, not a separate year of study. Students must complete all degree requirements including Industrial Training before the Honours classification is determined.",
            "structure": "The Bachelor of Engineering (Honours) is a four-year accredited degree that integrates professional coursework, industrial training, and a substantial thesis project. Students complete core and disciplinary courses throughout the program, with Honours assessment based on final-year performance. The thesis may be completed across two terms (Thesis A and B) as decided by each School, equivalent to at least 12 UoC of Level 4 courses.",
            "calculation": "The Faculty WAM is used to determine the class of Honours and differs from the overall WAM shown on transcripts. It is calculated automatically after completing all degree requirements including Industrial Training. Only courses counting toward the Engineering program are used. Courses are weighted by level: Level 1 and General Education ×1, Level 2 ×2, Level 3 ×3, Level 4 ×4. The WAM is calculated to one decimal place without rounding.",
            "requirements": "Students must complete all core courses, disciplinary requirements, Industrial Training (mandatory), and a final-year thesis or design project of at least 12 UoC. The thesis component is assessed based on research quality, technical execution, and written communication. Students who complete the program but do not meet Class 1 or 2 thresholds still graduate with Bachelor of Engineering (Honours) without a class designation.",
            "wamRestrictions": "Fail grades use the first attempt mark. Academic Withdrawals (AW) count as 00FL (Fail). Courses from external institutions are excluded from the Faculty WAM. For dual degrees, only courses within the Engineering stream are included. Students with a WAM ≥ 65 may substitute up to 6 UoC of Advanced Disciplinary (Level 5) courses; students with a WAM ≥ 75 may substitute up to 12 UoC.",
            "progressionRules": "No Level 4 BE course may be taken until 102 UoC of BE stream courses are passed. No Level 3 BE course may be taken until all Introductory Core courses are passed. Students must show cause if: two fails in any core course, failure in >50% of BE courses after 84 UoC, or WAM below 50 with 48+ UoC remaining. Students failing progression standards are reviewed by the Engineering Transfer Appeals Committee and may be transferred to Bachelor of Engineering Science (3706).",
            "awards": "The University Medal is the highest undergraduate honour, awarded to students with a Faculty WAM > 85, thesis mark > 65, no failures, and performance comparable to previous medal recipients. Additional faculty awards and prizes may be available for exceptional academic achievement and research excellence.",
            "careerOutcomes": "The BE (Honours) program develops technical mastery, professional competence, and research capability. Its combination of coursework, design projects, and thesis work prepares graduates for accreditation with Engineers Australia, higher research degrees (Master's, PhD), and advanced industry roles in engineering leadership, research and development, and technical innovation."
        },
        
        "general": {
            "classes": [
                "Class 1 – Mark 85 and above",
                "Class 2 Division 1 – 75 to 84",
                "Class 2 Division 2 – 65 to 74",
                "Class 3 – 50 to 64"
            ],
            "entryCriteria": "Entry into Honours is competitive and based on academic merit, normally requiring a strong academic record in the major area of study (WAM ≥ 65), completion of all undergraduate requirements, and approval of a suitable supervisor. Some disciplines may require additional prerequisites or portfolios. Selection is based on academic performance and the availability of appropriate supervision.",
            "structure": "The Honours program at UNSW provides an opportunity for high-achieving students to extend their undergraduate studies through advanced coursework and independent research. Honours programs typically combine advanced disciplinary coursework with a supervised research project or thesis. In creative and design disciplines, this may include practice-based or studio components; in scientific and professional fields, it generally involves a written research thesis.",
            "calculation": "Honours classifications are determined by performance across coursework and research components. The specific weighting and calculation methodology varies by faculty and discipline. Students should consult their program authority for detailed assessment criteria. WAM calculations follow standard UNSW policies.",
            "requirements": "Students must complete all specified coursework units and submit a research thesis or equivalent creative work under academic supervision. Specific requirements vary by discipline but typically include advanced seminars, methodology training, and an independent research project. Students must maintain satisfactory progress and meet all submission deadlines.",
            "wamRestrictions": "WAM calculations follow standard UNSW policies regarding fail grades, repeat attempts, and course exclusions. External courses may be included or excluded depending on faculty policies. Dual degree students should consult their program authority for specific requirements. Some disciplines may have additional grade requirements for specific prerequisite courses.",
            "progressionRules": "Students must maintain satisfactory academic progress throughout the Honours year. Progression requirements vary by discipline but typically include meeting coursework standards and achieving thesis milestones. Students who fail to meet progression requirements may be required to show cause. Appeals are handled through the relevant faculty's academic progress review process.",
            "awards": "Honours degrees recognise academic excellence and may make students eligible for faculty prizes, scholarships, and academic recognition. High-performing students may be considered for the University Medal or other prestigious awards, subject to meeting specific criteria including high WAM, excellent thesis performance, and no fail grades.",
            "careerOutcomes": "Honours degrees recognise academic excellence and provide a pathway to postgraduate research or professional advancement. Honours graduates develop strong analytical, research, and communication skills that are highly valued by employers and research institutions. The qualification enhances career prospects in both academic and professional contexts."
        }
    }
    
    # Determine which honours structure to use
    if "business" in faculty or "commerce" in faculty or "economics" in faculty:
        honours_data = HONOURS_DATA["business"]
        print("Stage 2: Using Business honours structure")
    elif "engineering" in faculty:
        honours_data = HONOURS_DATA["engineering"]
        print("Stage 2: Using Engineering honours structure")
    else:
        honours_data = HONOURS_DATA["general"]
        print(f"Stage 2: Using General honours structure (no specific match for '{faculty}')")
    
    print("Stage 2: Honours information retrieved instantly (hardcoded)")
    return {"honours": honours_data}


# Generate complete roadmap payload using PARALLEL two-stage AI generation.
# Both sections will run concurrently using threads
async def ai_generate_unsw_payload(context: Dict[str, Any]) -> Dict[str, Any]:

    import asyncio
    import time
    from concurrent.futures import ThreadPoolExecutor
    
    total_start = time.time()

    # print("Starting PARALLEL two-stage AI generation for degree")
    # print(f"Program: {context.get('program_name')}")
    # print(f"Degree code: {context.get('degree_code')}")
    # print(f"Core courses in context: {len(context.get('core_courses', []))}")

    # Fallback honours structure
    fallback_honours = {
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

    # Wrapper functions with timing
    def run_general():
        start = time.time()
        print(f"[Stage 1] STARTED at {start:.1f}")
        result = asyncio.run(ai_generate_general_info(context))
        elapsed = time.time() - start
        print(f"[Stage 1] COMPLETED in {elapsed:.1f}s")
        return result
    
    def run_honours():
        start = time.time()
        print(f"[Stage 2] STARTED at {start:.1f}")
        result = asyncio.run(ai_generate_honours_info(context))
        elapsed = time.time() - start
        print(f"[Stage 2] COMPLETED in {elapsed:.1f}s")
        return result

    # Run both AI calls in parallel using ThreadPoolExecutor
    loop = asyncio.get_event_loop()
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        general_future = loop.run_in_executor(executor, run_general)
        honours_future = loop.run_in_executor(executor, run_honours)
        
        # Wait for both to complete
        try:
            general_info = await general_future
        except Exception as e:
            print(f"Stage 1 failed: {e}")
            raise Exception("Failed to generate general program information")
        
        try:
            honours_info = await honours_future
        except Exception as e:
            print(f"Stage 2 failed: {e}")
            honours_info = fallback_honours

    # Debugging
    # total_elapsed = time.time() - total_start
    # print(f"\n{'='*50}")
    # print(f"TOTAL PARALLEL GENERATION TIME: {total_elapsed:.1f}s")
    # print(f"{'='*50}\n")

    # Combine both stages into ONE payload
    payload = {
        "summary": general_info.get("summary"),
        "entry_requirements": general_info.get("entry_requirements"),
        "capstone": general_info.get("capstone"),
        "honours": honours_info.get("honours"),
        "flexibility": general_info.get("flexibility"),
        "industry": general_info.get("industry"),
        "program_name": context.get("program_name"),
        "uac_code": context.get("uac_code"),
        "selected_honours_name": context.get("selected_honours_name"),
        "selected_honours_courses": context.get("selected_honours_courses", []),
        "selected_major_name": context.get("selected_major_name"),
        "selected_major_courses": context.get("selected_major_courses", []),
        "selected_minor_name": context.get("selected_minor_name"),
        "selected_minor_courses": context.get("selected_minor_courses", []),
    }

    print("Parallel two-stage generation complete!")
    return payload
