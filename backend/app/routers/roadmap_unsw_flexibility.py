"""
Flexibility and degree switching recommendations for UNSW roadmaps.

This module handles:
- Pre-filtering similar degrees by course overlap
- AI-powered ranking and explanation of switch options
- Background generation of flexibility recommendations
"""

from typing import Any, Dict, List
import json
from app.utils.database import supabase
from app.utils.openai_client import ask_openai
from .roadmap_common import parse_json_or_500, assert_keys
from .roadmap_unsw_helpers import extract_all_course_codes, extract_keywords, are_related_faculties, format_candidates_for_ai


# ========== PRE-FILTERING FUNCTION ==========
async def pre_filter_similar_degrees(
    degree_id: str,
    final_limit: int = 15
) -> List[Dict[str, Any]]:
    """
    Pre-filter degrees to find top candidates for switching.
    
    Uses a multi-stage approach:
    1. Quick filter by faculty and keywords (reduces 400+ to ~100)
    2. Fetch course structures for filtered candidates
    3. Calculate real course overlap
    4. Return top N by overlap percentage
    
    Args:
        degree_id: Current degree ID
        final_limit: Number of top candidates to return (default 15)
        
    Returns:
        List of top candidate degrees with overlap data
    """
    
    print(f"Pre-filtering similar degrees for: {degree_id}")
    
    # 1. Get current degree information
    current_degree_response = supabase.from_("unsw_degrees")\
        .select("*")\
        .eq("id", degree_id)\
        .single()\
        .execute()
    
    if not current_degree_response.data:
        raise Exception(f"Degree not found: {degree_id}")
    
    current_degree = current_degree_response.data
    current_code = current_degree['code']
    current_faculty = current_degree.get('faculty', '')
    current_program_name = current_degree['program_name']
    
    # 2. Get course structure for current degree
    current_structure_response = supabase.from_("degree_versions_structure")\
        .select("sections")\
        .eq("degree_code", current_code)\
        .single()\
        .execute()
    
    if not current_structure_response.data:
        print(f"WARNING: No course structure found for degree code: {current_code}")
        return []
    
    # Parse current courses
    raw_sections = current_structure_response.data['sections']
    sections = json.loads(raw_sections) if isinstance(raw_sections, str) else raw_sections
    current_courses = extract_all_course_codes(sections)
    
    if not current_courses:
        print(f"WARNING: No courses found in current degree")
        return []
    
    print(f"Current degree has {len(current_courses)} courses")
    
    # 3. Get total degree count and determine adaptive limits
    total_response = supabase.from_("unsw_degrees")\
        .select("id", count="exact")\
        .execute()
    
    total_count = total_response.count - 1  # Exclude current degree
    
    # Adaptive scaling based on database size
    if total_count < 50:
        initial_candidates_pct = 0.6  # 60% for small DBs
    elif total_count < 200:
        initial_candidates_pct = 0.4  # 40% for medium DBs
    else:
        initial_candidates_pct = 0.25  # 25% for large DBs
    
    initial_candidates = max(20, min(100, int(total_count * initial_candidates_pct)))
    final_limit = min(final_limit, initial_candidates, total_count)
    
    print(f"Database size: {total_count} degrees | Analyzing: {initial_candidates} | Returning: {final_limit}")
    
    # 4. Quick filter: Get all degrees (just basic info, no courses yet)
    all_degrees_response = supabase.from_("unsw_degrees")\
        .select("id, code, program_name, faculty")\
        .neq("id", degree_id)\
        .execute()
    
    if not all_degrees_response.data:
        print(f"WARNING: No other degrees found in database")
        return []
    
    # 5. Score degrees based on faculty and keyword matching
    keywords = extract_keywords(current_program_name)
    print(f"Keywords for matching: {keywords}")
    
    candidates = []
    for degree in all_degrees_response.data:
        score = 0
        
        # Same faculty bonus (high priority)
        if degree.get('faculty') == current_faculty:
            score += 50
        
        # Related faculty bonus
        elif are_related_faculties(degree.get('faculty', ''), current_faculty):
            score += 20
        
        # Keyword match in program name
        degree_name_lower = degree['program_name'].lower()
        matching_keywords = [kw for kw in keywords if kw in degree_name_lower]
        if matching_keywords:
            score += 30 * (len(matching_keywords) / len(keywords))  # Proportional to keyword overlap
        
        # Only keep candidates with some relevance
        if score > 15:
            candidates.append({
                **degree,
                'initial_score': score
            })
    
    # Sort by initial score and take top N
    candidates.sort(key=lambda x: x['initial_score'], reverse=True)
    top_candidates = candidates[:initial_candidates]
    
    print(f"Filtered {len(all_degrees_response.data)} degrees to {len(top_candidates)} candidates")
    
    if not top_candidates:
        print(f"WARNING: No suitable candidates found")
        return []
    
    # 6. Fetch course structures for top candidates only
    candidate_codes = [c['code'] for c in top_candidates]
    
    structures_response = supabase.from_("degree_versions_structure")\
        .select("degree_code, sections")\
        .in_("degree_code", candidate_codes)\
        .execute()
    
    if not structures_response.data:
        print(f"WARNING: No course structures found for candidates")
        return []
    
    # 7. Calculate course overlap for each candidate
    final_candidates = []
    
    for structure in structures_response.data:
        try:
            raw_sections = structure['sections']
            sections = json.loads(raw_sections) if isinstance(raw_sections, str) else raw_sections

            degree_courses = extract_all_course_codes(sections)
            
            if not degree_courses:
                continue
            
            # Calculate overlap
            current_set = set(current_courses)
            degree_set = set(degree_courses)
            shared = current_set & degree_set
            
            overlap_count = len(shared)
            overlap_pct = (overlap_count / len(current_courses)) * 100 if current_courses else 0
            
            # Find matching degree info
            degree_info = next(
                (c for c in top_candidates if c['code'] == structure['degree_code']), 
                None
            )
            
            if degree_info and overlap_count > 0:  # Only include if there's some overlap
                final_candidates.append({
                    'id': degree_info['id'],
                    'code': degree_info['code'],
                    'program_name': degree_info['program_name'],
                    'faculty': degree_info.get('faculty', 'Not specified'),
                    'shared_courses': sorted(list(shared)),
                    'overlap_count': overlap_count,
                    'overlap_percentage': overlap_pct,
                    'total_current_courses': len(current_courses),
                    'total_target_courses': len(degree_courses),
                    'initial_score': degree_info['initial_score']
                })
        
        except Exception as e:
            print(f"WARNING: Error processing degree {structure.get('degree_code')}: {e}")
            continue
    
    # 8. Sort by overlap percentage and return top N
    final_candidates.sort(key=lambda x: x['overlap_percentage'], reverse=True)
    top_final = final_candidates[:final_limit]
    
    if top_final:
        print(f"Returning top {len(top_final)} degrees with overlap ranging from {top_final[0]['overlap_percentage']:.1f}% to {top_final[-1]['overlap_percentage']:.1f}%")
    
    return top_final


# ========== AI GENERATION FUNCTION ==========

async def ai_generate_flexibility_info(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 3: Generate flexibility and degree switching recommendations.

    Uses pre-filtered similar degrees and AI to provide intelligent
    recommendations with explanations.
    """

    degree_id = context.get("degree_id")
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")

    if not degree_id:
        raise Exception("degree_id required in context for flexibility generation")

    print("Starting Stage 3: Flexibility generation")

    # Pre-filter to get top similar degrees
    try:
        top_degrees = await pre_filter_similar_degrees(degree_id, final_limit=15)
    except Exception as e:
        print(f"ERROR: Pre-filtering failed: {e}")
        return {
            "flexibility_detailed": {
                "easy_switches": [],
                "error": "Unable to generate degree switching recommendations at this time."
            }
        }

    if not top_degrees:
        print("WARNING: No similar degrees found")
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
    print(f"Flexibility prompt size: ~{prompt_tokens} tokens")

   
    prompt = f"""You are a UNSW academic advisor helping a student currently enrolled in {program_name} (Faculty: {faculty}) explore degree switching options.

Below are 15 similar degrees ranked by course overlap — meaning how many courses the student has already completed or is planning to take will count towards the new degree.

TOP 15 SIMILAR DEGREES:
{candidates_text}

The current program ({program_name}) is typically focused on its core disciplines and skill areas within the Faculty of {faculty}.
Use this as a baseline when comparing how each new program differs or expands the student's career and academic trajectory.

TASK:
Recommend the TOP 5 EASIEST degrees to switch to. For each degree, provide:
1. A clear, practical explanation of why it’s a good switch — focus on course overlap, how existing courses map to the new program, and how it builds on the student’s current academic strengths.
2. Highlight what *new career paths, industries, or opportunities* this degree could open up compared to the current one.
3. List specific key benefits of switching (e.g., expanded majors, industry links, accreditations, or broader skill development).
4. Mention any important considerations or requirements (e.g., prerequisite changes, competitive entry, or WAM thresholds).

CRITICAL: Return ONLY valid JSON. No explanatory text before or after. Start with {{ and end with }}.

REQUIRED JSON FORMAT:
{{
  "easy_switches": [
    {{
      "program_name": "Exact degree name from list above",
      "faculty": "Faculty name",
      "overlap_percentage": number (from list above),
      "shared_courses": ["list", "of", "course", "codes"],
      "reason": "Explain why this is a good switch — focus on overlap, transferable skills, and what new career directions or industries this degree opens up compared to the current one.",
      "key_benefits": [
            "Short standalone phrases, not a sentence. Each item should describe one clear benefit.",
            "For example: 'Broader major choices', 'Accredited program', 'High industry demand'."
        ]
    }}
  ]
}}

Keep the tone professional and student-focused. Avoid generic phrasing — be specific about overlap, alignment, and new career opportunities.
"""

    print("Sending to AI for ranking...")

    try:
        raw = ask_openai(prompt)
        print(f"AI response received: {len(raw)} characters")

        # Clean response - extract JSON
        raw_stripped = raw.strip()
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')

        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            json_only = raw_stripped[first_brace:last_brace + 1]
            print(f"Extracted JSON from position {first_brace} to {last_brace + 1}")
        else:
            json_only = raw_stripped
            print("No JSON extraction needed")

        # Parse and validate JSON
        draft = parse_json_or_500(json_only)
        assert_keys(draft, ["easy_switches"], "flexibility")

        if not draft.get("easy_switches"):
            print("WARNING: AI returned empty recommendations")
            return {
                "flexibility_detailed": {
                    "easy_switches": [],
                    "message": "No switching recommendations could be generated."
                }
            }

        print(f"Stage 3 complete: {len(draft['easy_switches'])} recommendations generated")

        return {
            "flexibility_detailed": draft
        }

    except Exception as e:
        print(f"ERROR: Stage 3 error: {type(e).__name__}: {e}")
        return {
            "flexibility_detailed": {
                "easy_switches": [],
                "error": "Unable to generate recommendations. Please try again later."
            }
        }

# ========== BACKGROUND TASK FUNCTION ==========
async def generate_and_update_flexibility(roadmap_id: str, roadmap_data: dict):
    """
    Background task to generate flexibility recommendations and update roadmap.
    
    This function runs asynchronously after the initial roadmap is returned to the user.
    
    Args:
        roadmap_id: ID of the roadmap to update
        roadmap_data: Existing roadmap data from database
    """
    
    print(f"Background task started for roadmap: {roadmap_id}")
    
    try:
        # Build context from existing roadmap data
        context = {
            "degree_id": roadmap_data.get("degree_id"),
            "program_name": roadmap_data.get("program_name"),
            "faculty": roadmap_data.get("payload", {}).get("faculty"),
        }

        # --- NEW fallback in case faculty is missing ---
        if not context["faculty"] and context["degree_id"]:
            print("Faculty not found in payload — fetching from unsw_degrees table...")
            degree_row = (
                supabase.from_("unsw_degrees")
                .select("faculty")
                .eq("id", context["degree_id"])
                .maybe_single()
                .execute()
            )
            if degree_row and degree_row.data:
                context["faculty"] = degree_row.data.get("faculty")

        print(f"[Flexibility] Context built: {json.dumps(context, indent=2)}")

        # Generate flexibility recommendations
        flexibility = await ai_generate_flexibility_info(context)

        # === DEBUG LOG: full AI response structure ===
        print("\n========== DEBUG: FINAL FLEXIBILITY OUTPUT ==========")
        print(json.dumps(flexibility, indent=2))
        print("=====================================================\n")

        # Update roadmap payload
        payload = roadmap_data.get("payload", {})
        payload.update(flexibility)

        # Save updated payload to database
        update_response = supabase.table("unsw_roadmap") \
            .update({"payload": payload}) \
            .eq("id", roadmap_id) \
            .execute()

        # Log Supabase response
        if update_response.data:
            print(f"Flexibility updated successfully for roadmap: {roadmap_id}")
            print(f"Supabase update response: {json.dumps(update_response.data, indent=2)}")
        else:
            print(f"WARNING: Update response empty for roadmap: {roadmap_id}")

    except Exception as e:
        print(f"ERROR: Background task failed for roadmap {roadmap_id}: {type(e).__name__}: {e}")
        # Keep running, don't crash entire background worker
