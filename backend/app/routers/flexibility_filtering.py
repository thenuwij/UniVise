# app/routers/flexibility_filtering.py.py
# Find top degree switch candidates by filtering on faculty, keywords, and course overlap (specialization-aware).

from typing import Any, Dict, List
from .flexibility_filtering_helpers import (
    extract_keywords_improved,
    extract_specialization_keywords,
    fetch_current_degree,
    fetch_degree_courses,
    calculate_adaptive_limits,
    fetch_all_degrees,
    score_and_filter_candidates,
    fetch_candidate_structures,
    calculate_overlaps_with_specializations,
)


# Main entry point: pre-filter degrees to find top candidates for switching.
async def pre_filter_similar_degrees(
    degree_id: str,
    final_limit: int = 15,
    current_spec_course_codes: List[str] = None,
    current_spec_names: List[str] = None
) -> List[Dict[str, Any]]:
    
    print(f"Pre-filtering similar degrees for: {degree_id}")
    if current_spec_course_codes: 
        print(f"Specialization-aware mode: {len(current_spec_course_codes)} spec courses provided")
    if current_spec_names:
        print(f"Current specializations: {current_spec_names}")
    
    # Get current degree information
    current_degree = await fetch_current_degree(degree_id)
    current_code = current_degree['degree_code']
    current_faculty = current_degree.get('faculty', '')
    current_program_name = current_degree['program_name']
    
    # Get course structure for current degree
    current_courses = await fetch_degree_courses(current_code)
    
    # Combine with specialization courses if provided
    if current_spec_course_codes:
        all_current_courses = list(set(current_courses + current_spec_course_codes))
        print(f"Combined {len(current_courses)} degree courses + {len(current_spec_course_codes)} specialization courses = {len(all_current_courses)} total")
        current_courses = all_current_courses
    elif not current_courses:
        print(f"No courses found in current degree and no specialization courses provided")
        return []

    print(f"Current degree has {len(current_courses)} courses for matching")
    
    # Calculate adaptive limits based on database size
    total_count, initial_candidates, final_limit = await calculate_adaptive_limits(degree_id, final_limit)
    print(f"Database size: {total_count} degrees | Analyzing: {initial_candidates} | Returning: {final_limit}")
    
    # Fetch all other degrees
    all_degrees = await fetch_all_degrees(degree_id)
    if not all_degrees:
        print(f"No other degrees found in database")
        return []
    
    # Extract keywords from program and specializations
    program_keywords = extract_keywords_improved(current_program_name)
    spec_keywords = set()
    if current_spec_names:
        for spec_name in current_spec_names:
            if spec_name:
                spec_keywords.update(extract_specialization_keywords(spec_name))
    
    print(f"Program keywords: {program_keywords}")
    print(f"Specialization keywords: {spec_keywords}")
    
    # Score and filter candidates
    top_candidates = await score_and_filter_candidates(
        all_degrees, 
        current_faculty,
        current_program_name,
        program_keywords,
        spec_keywords,
        initial_candidates
    )
    
    print(f"Filtered {len(all_degrees)} degrees to {len(top_candidates)} candidates")
    
    if not top_candidates:
        print(f"WARNING: No suitable candidates found")
        return []
    
    # Fetch course structures for top candidates
    structures = await fetch_candidate_structures(top_candidates)
    
    if not structures:
        print(f"WARNING: No course structures found for candidates")
        return []
    
    # Calculate course overlap for each candidate
    final_candidates = await calculate_overlaps_with_specializations(
        structures,
        top_candidates,
        current_courses,
        current_spec_course_codes,
        spec_keywords
    )
    
    # Sort by overlap percentage and return top N
    final_candidates.sort(key=lambda x: x['overlap_percentage'], reverse=True)
    top_final = final_candidates[:final_limit]
    
    if top_final:
        print(f"Returning top {len(top_final)} degrees with overlap ranging from {top_final[0]['overlap_percentage']:.1f}% to {top_final[-1]['overlap_percentage']:.1f}%")
    
    return top_final