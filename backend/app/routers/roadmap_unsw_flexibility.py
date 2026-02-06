# Handles generation of flexibility section in unsw roadmap

from typing import Any, Dict, List
import json
import asyncio
import time
from datetime import datetime
from app.utils.database import supabase
from app.utils.openai_client import ask_openai
from .roadmap_common import parse_json_or_500, assert_keys
from .roadmap_unsw_helpers import format_candidates_for_ai
from .flexibility_filtering import pre_filter_similar_degrees

# Function to prevent error of AI dropping the degree id field at times
def merge_degree_ids(draft: Dict[str, Any], selected_degrees: List[Dict[str, Any]]) -> Dict[str, Any]:
    for recommendation in draft.get("easy_switches", []):
        program_name = recommendation.get("program_name")
        
        if not program_name:
            continue
        
        # Find matching degree from selected_degrees
        for degree in selected_degrees:
            if degree['program_name'] == program_name:
                recommendation['id'] = degree.get('id')
                
                if 'degree_code' not in recommendation:
                    recommendation['degree_code'] = degree.get('degree_code')
                
                if not recommendation.get('specialisation') and degree.get('specialisation'):
                    recommendation['specialisation'] = {
                        'name': degree['specialisation'].get('spec_name'),
                        'type': degree['specialisation'].get('spec_type')
                    }
                break

    return draft


# AI call function to generate flexibility section
async def ai_generate_flexibility_info(context: Dict[str, Any]) -> Dict[str, Any]:

    degree_id = context.get("degree_id")
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")
    
    # Extract specialization context  
    selected_honours_name = context.get("selected_honours_name")
    selected_major_name = context.get("selected_major_name")
    selected_minor_name = context.get("selected_minor_name")
    selected_honours_courses = context.get("selected_honours_courses", [])
    selected_major_courses = context.get("selected_major_courses", [])
    selected_minor_courses = context.get("selected_minor_courses", [])
    
    # Combine all specialization course codes
    spec_course_codes = list(set(
        selected_honours_courses + selected_major_courses + selected_minor_courses
    ))
    
    # Build list of specialization names
    spec_names = []
    if selected_honours_name:
        spec_names.append(selected_honours_name)
    if selected_major_name:
        spec_names.append(selected_major_name)
    if selected_minor_name:
        spec_names.append(selected_minor_name)
    
    # Build human-readable specialization context
    spec_display = []
    if selected_honours_name:
        spec_display.append(f"Honours: {selected_honours_name}")
    if selected_major_name:
        spec_display.append(f"Major: {selected_major_name}")
    if selected_minor_name:
        spec_display.append(f"Minor: {selected_minor_name}")
    
    spec_context_str = ", ".join(spec_display) if spec_display else "None selected"

    if not degree_id:
        raise Exception("degree_id required in context for flexibility generation")

    print("Starting Stage 3: Flexibility generation")  
    print(f"Student's specializations: {spec_context_str}")  

    # Pre-filter to get top similar degrees (NOW WITH SPEC NAMES!)
    try:
        top_degrees = await pre_filter_similar_degrees(
            degree_id, 
            final_limit=15,
            current_spec_course_codes=spec_course_codes if spec_course_codes else None,
            current_spec_names=spec_names if spec_names else None  # NEW parameter
        )
    except Exception as e:
        print(f"ERROR: Pre-filtering failed: {e}")
        return {
            "flexibility_detailed": {
                "easy_switches": [],
                "error": "Unable to generate degree switching recommendations at this time."
            }
        }

    if not top_degrees:
        print("No similar degrees found")
        return {
            "flexibility_detailed": {
                "easy_switches": [],
                "message": "No similar degree programs found for switching recommendations."
            }
        }

    # Format candidates for AI
    candidates_text = format_candidates_for_ai(top_degrees)

    # Calculate token estimate
    prompt_tokens = (len(program_name) + len(candidates_text)) // 4
    print(f"Flexibility prompt size: {prompt_tokens} tokens")

    # Stage 3a to get degree ranking
    print("Stage 3a: Getting AI to rank and select top 5 degrees...")
    
    ranking_prompt = f"""You are a UNSW academic advisor. A student is in {program_name} (Faculty: {faculty}).

    STUDENT'S SELECTED SPECIALISATIONS: {spec_context_str}  

    Below are 15 degree switching options. Some include specific specialization recommendations that significantly improve course overlap:

    {candidates_text}

    TASK: Select the TOP 5 EASIEST degrees to switch to based on:
    - Highest course overlap (weighted - specialization courses count more) 
    - Career/academic alignment with current degree + specializations  
    - Practical switching feasibility

    CRITICAL: If a candidate has a recommended specialization listed above, you MUST include it in your response.

    REQUIRED FORMAT - Return a JSON array with OBJECTS:
    {{
    "top_5_programs": [
        {{
        "program_name": "Exact base program name from candidates",
        "specialisation_name": "Exact specialization name if listed in candidate (e.g., 'Bioinformatics Engineering'), otherwise null",
        "specialisation_type": "Exact type if listed (Major/Minor/Honours), otherwise null"
        }},
        {{
        "program_name": "Another program name",
        "specialisation_name": null,
        "specialisation_type": null
        }},
        ...
    ]
    }}

    Example output format:
    {{
    "top_5_programs": [
        {{"program_name": "Bachelor of Engineering Science", "specialisation_name": "Bioinformatics Engineering", "specialisation_type": "Major"}},
        {{"program_name": "Bachelor of Cyber Security", "specialisation_name": null, "specialisation_type": null}}
    ]
    }}"""
    
    try:
        ranking_raw = ask_openai(ranking_prompt)
        print(f"Stage 3a response received: {len(ranking_raw)} characters")

        # Clean and parse ranking response
        ranking_stripped = ranking_raw.strip()
        first_brace = ranking_stripped.find('{')
        last_brace = ranking_stripped.rfind('}')

        if first_brace != -1 and last_brace != -1:
            ranking_json = ranking_stripped[first_brace:last_brace + 1]
        else:
            ranking_json = ranking_stripped

        ranking_result = parse_json_or_500(ranking_json)
        assert_keys(ranking_result, ["top_5_programs"], "ranking")

        top_5_selections = ranking_result["top_5_programs"]
        print(f"Stage 3a complete: Top 5 selected")
        
        # Match selected programs and attach specialization info from AI ranking
        selected_degrees = []
        for selection in top_5_selections:
            # Handle both old string format and new object format for backward compatibility
            if isinstance(selection, str):
                program_name_sel = selection
                ai_spec_name = None
                ai_spec_type = None
            else:
                program_name_sel = selection.get("program_name")
                ai_spec_name = selection.get("specialisation_name")
                ai_spec_type = selection.get("specialisation_type")
            
            # Find matching degree from pre-filtered candidates
            for degree in top_degrees:
                if degree['program_name'] == program_name_sel:
                    # Create a copy to avoid modifying original
                    matched_degree = degree.copy()
                    
                    # If AI specified a specialization, use it; otherwise use what pre-filter found
                    if ai_spec_name and ai_spec_type:
                        matched_degree['ai_selected_spec'] = {
                            'name': ai_spec_name,
                            'type': ai_spec_type
                        }
                    
                    selected_degrees.append(matched_degree)
                    print(f"  ✓ {program_name_sel}" + (f" + {ai_spec_name} ({ai_spec_type})" if ai_spec_name else ""))
                    break
        
        if not selected_degrees:
            print("No degrees matched AI selection")
            return {
                "flexibility_detailed": {
                    "easy_switches": [],
                    "message": "Unable to match recommended degrees."
                }
            }

        # STage 3b to get detailed recommendations for the top 5 selected degrees
        print(f"Stage 3b: Generating detailed recommendations for {len(selected_degrees)} degrees...")
        
        # Format only the selected 5 degrees
        selected_text = format_candidates_for_ai(selected_degrees)
        detail_prompt = f"""You are a UNSW academic advisor helping a student currently enrolled in {program_name} (Faculty: {faculty}).

        STUDENT'S CURRENT SPECIALISATIONS: {spec_context_str} 

        Below are the TOP 5 EASIEST degrees to switch to:

        {selected_text}

        TASK:
        For each of these 5 degrees, provide CONCISE information:
        1. A clear, practical explanation of why it's a good switch (2-3 sentences max)
        - If a SPECIALIZATION is included, explain how it aligns with the student's current specialization path 
        - Focus on course overlap and new career opportunities
        2. Highlight what *new career paths, industries, or opportunities* this opens up
        3. List 3-4 SHORT key benefits (2-4 words each)

        CRITICAL: Return ONLY valid JSON. No explanatory text before or after.

        CRITICAL INSTRUCTIONS:
        - If a candidate above has a recommended specialization, you MUST include it in the "specialisation" field
        - Copy the EXACT specialization name and type from the candidate data
        - If no specialization is listed for a candidate, set "specialisation" to null

        REQUIRED JSON FORMAT:
        {{
        "easy_switches": [
            {{
            "program_name": "Exact degree name",
            "specialisation": {{ 
                "name": "EXACT specialization name from candidate (e.g., 'Bioinformatics Engineering')",
                "type": "EXACT type from candidate (Major/Minor/Honours)"
            }},  
            "faculty": "Faculty name",
            "overlap_percentage": number,
            "shared_courses": ["list", "of", "course", "codes"],
            "reason": "2-3 sentences explaining why this is a good switch. If specialization is included, explain how it aligns with the student's current specialization path.",
            "key_benefits": [
                "Short phrase 1",
                "Short phrase 2",
                "Short phrase 3",
                "Short phrase 4"
            ]
            }},
            {{
            "program_name": "Another degree without specialization",
            "specialisation": null,
            "faculty": "Faculty name",
            ...
            }}
        ]
        }}

        Keep responses CONCISE. When a specialization is recommended, naturally explain why it complements the student's current path. 
        """

        detail_raw = ask_openai(detail_prompt)
        print(f"Stage 3b response received: {len(detail_raw)} characters")

        # Clean response - extract JSON
        detail_stripped = detail_raw.strip()
        first_brace = detail_stripped.find('{')
        last_brace = detail_stripped.rfind('}')

        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            json_only = detail_stripped[first_brace:last_brace + 1]
            print(f"Extracted JSON from position {first_brace} to {last_brace + 1}")
        else:
            json_only = detail_stripped
            print("No JSON extraction needed")

        # multi-stage JSON parse
        try:
            draft = parse_json_or_500(json_only)
        except Exception as e:
            print(f"[Flexibility JSON Parse] Primary parse failed: {e}")
            import re

            # Basic cleanup
            cleaned = re.sub(r",(\s*[}\]])", r"\1", json_only)   # remove trailing commas
            cleaned = cleaned.replace("None", "null")            #  and pythonic nulls

            # Close any missing braces/brackets (for truncated outputs)
            open_braces = cleaned.count("{")
            close_braces = cleaned.count("}")
            open_brackets = cleaned.count("[")
            close_brackets = cleaned.count("]")
            
            while close_braces < open_braces:
                cleaned += "}"
                close_braces += 1
            while close_brackets < open_brackets:
                cleaned += "]"
                close_brackets += 1

            # Try parsing again
            try:
                draft = json.loads(cleaned)
                print("Fallback parse succeeded after auto-repair")
            except Exception as e2:
                print(f"Fallback failed: {e2}")
                draft = {"easy_switches": [], "error": "Malformed or truncated JSON"}

        # Guarantee schema key exists
        if "easy_switches" not in draft:
            draft["easy_switches"] = []
        assert_keys(draft, ["easy_switches"], "flexibility")

        if not draft.get("easy_switches"):
            print("AI returned empty recommendations")
            return {
                "flexibility_detailed": {
                    "easy_switches": [],
                    "message": "No switching recommendations could be generated."
                }
            }

        # Merge degree IDs back into recommendations 
        draft = merge_degree_ids(draft, selected_degrees)

        print(f"Stage 3b complete: {len(draft['easy_switches'])} detailed recommendations generated")

        return {
            "flexibility_detailed": draft
        }

    except Exception as e:
        print(f"Stage 3 error: {type(e).__name__}: {e}")
        return {
            "flexibility_detailed": {
                "easy_switches": [],
                "error": "Unable to generate recommendations. Please try again later."
            }
        }


# Async wrapper that schedules flexibility generation in background thread
async def generate_and_update_flexibility(roadmap_id: str, roadmap_data: dict):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _generate_and_update_flexibility_sync, roadmap_id, roadmap_data)


# Performs pre-filtering, AI generation, and saves flexibility data to database.
def _generate_and_update_flexibility_sync(roadmap_id: str, roadmap_data: dict):

    start = time.time()
    print(f"Started for roadmap: {roadmap_id}")

    try:
        # Build context
        context = {
            "degree_id": roadmap_data.get("degree_id"),
            "program_name": roadmap_data.get("program_name"),
            "faculty": roadmap_data.get("payload", {}).get("faculty"),
            "selected_honours_name": roadmap_data.get("payload", {}).get("selected_honours_name"),
            "selected_honours_courses": roadmap_data.get("payload", {}).get("selected_honours_courses", []),
            "selected_major_name": roadmap_data.get("payload", {}).get("selected_major_name"),
            "selected_major_courses": roadmap_data.get("payload", {}).get("selected_major_courses", []),
            "selected_minor_name": roadmap_data.get("payload", {}).get("selected_minor_name"),
            "selected_minor_courses": roadmap_data.get("payload", {}).get("selected_minor_courses", []),
        }

        if not context["faculty"] and context["degree_id"]:
            print("Faculty not found in payload — fetching from unsw_degrees_final table...")
            degree_row = (
                supabase.from_("unsw_degrees_final")
                .select("faculty")
                .eq("id", context["degree_id"])
                .maybe_single()
                .execute()
            )
            if degree_row and degree_row.data:
                context["faculty"] = degree_row.data.get("faculty")

        print(f"Flexibility context built: {json.dumps(context, indent=2)}")

        # Generate flexibility recommendations
        flexibility = asyncio.run(ai_generate_flexibility_info(context))

        # Load LATEST payload from database (preserve other background tasks' work)
        latest = supabase.from_("unsw_roadmap").select("payload").eq("id", roadmap_id).single().execute()
        payload = latest.data.get("payload", {}) if latest.data else {}

        # Merge only flexibility data
        payload.update(flexibility)

        # Save back to database
        update_response = (
            supabase.from_("unsw_roadmap")
            .update({
                "payload": payload,
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq("id", roadmap_id)
            .execute()
        )

        print(f"[Flexibility Thread] Update complete for {roadmap_id} "
              f"({time.time() - start:.1f}s elapsed)")
        if update_response.data:
            print(json.dumps(update_response.data, indent=2))
        else:
            print("Empty update response")

    except Exception as e:
        print(f"Flexibility section error for roadmap {roadmap_id}: {e}")