"""
Degree pre-filtering and overlap calculation for flexibility recommendations.

This module handles:
- Initial degree filtering by faculty and keywords
- Course overlap calculation (specialization-aware)
- Specialization matching and overlap improvements
"""

from typing import Any, Dict, List, Set
import json
from app.utils.database import supabase
from .roadmap_unsw_helpers import extract_all_course_codes, calculate_overlap_weighted


# ========== IMPROVED KEYWORD EXTRACTION ==========

def extract_keywords_improved(program_name: str) -> Set[str]:
    """
    Extract meaningful keywords from program name with better filtering.
    
    Improvements:
    - Removes common words (bachelor, of, the, etc.)
    - Keeps field-specific terms
    - Returns a set for efficient lookup
    """
    # Common words to ignore
    stop_words = {
        'bachelor', 'master', 'of', 'the', 'in', 'and', 'for', 'with',
        'honours', 'advanced', 'program', 'degree', 'undergraduate'
    }
    
    # Split and clean
    words = program_name.lower().replace('(', ' ').replace(')', ' ').split()
    keywords = {word.strip() for word in words if len(word) > 2 and word not in stop_words}
    
    return keywords


def extract_specialization_keywords(spec_name: str) -> Set[str]:
    """Extract keywords from specialization name."""
    if not spec_name:
        return set()
    
    stop_words = {'major', 'minor', 'honours', 'in', 'and', 'of', 'the'}
    words = spec_name.lower().replace('(', ' ').replace(')', ' ').split()
    return {word.strip() for word in words if len(word) > 2 and word not in stop_words}


# ========== IMPROVED FACULTY RELATIONSHIP ==========

def are_related_faculties_improved(faculty1: str, faculty2: str) -> bool:
    """
    Check if two faculties are related/similar.
    
    Improved version with more comprehensive relationships.
    """
    if not faculty1 or not faculty2:
        return False
    
    # Normalize names
    f1 = faculty1.lower().strip()
    f2 = faculty2.lower().strip()
    
    if f1 == f2:
        return True
    
    # Define faculty relationship groups
    related_groups = [
        # Engineering & Technology
        {'engineering', 'computer science', 'information technology', 'built environment'},
        
        # Sciences
        {'science', 'mathematics', 'physics', 'chemistry', 'biology'},
        
        # Business & Commerce
        {'business', 'commerce', 'economics', 'management'},
        
        # Arts & Humanities
        {'arts', 'humanities', 'social sciences', 'education'},
        
        # Health & Medicine
        {'medicine', 'health', 'nursing', 'public health'},
        
        # Law & Legal
        {'law', 'legal studies'},
    ]
    
    # Check if both faculties are in same group
    for group in related_groups:
        f1_in_group = any(keyword in f1 for keyword in group)
        f2_in_group = any(keyword in f2 for keyword in group)
        if f1_in_group and f2_in_group:
            return True
    
    return False


# ========== MAIN PRE-FILTERING FUNCTION ==========

async def pre_filter_similar_degrees(
    degree_id: str,
    final_limit: int = 15,
    current_spec_course_codes: List[str] = None,
    current_spec_names: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Pre-filter degrees to find top candidates for switching.
    NOW SPECIALIZATION-AWARE when current_spec_course_codes is provided. 
    
    Uses a multi-stage approach:
    1. Quick filter by faculty and keywords (reduces 400+ to ~100)
    2. Fetch course structures for filtered candidates
    3. Calculate real course overlap (including specializations if beneficial) 
    4. Return top N by overlap percentage
    
    Args:
        degree_id: Current degree ID
        final_limit: Number of top candidates to return (default 15)
        current_spec_course_codes: List of course codes from student's selected specializations
        current_spec_names: List of specialization names (e.g., ["Artificial Intelligence"])
        
    Returns:
        List of top candidate degrees with overlap data (may include specialization recommendations) 
    """
    
    print(f"Pre-filtering similar degrees for: {degree_id}")
    if current_spec_course_codes: 
        print(f"Specialization-aware mode: {len(current_spec_course_codes)} spec courses provided")
    if current_spec_names:
        print(f"Current specializations: {current_spec_names}")
    
    # 1. Get current degree information
    current_degree = await _fetch_current_degree(degree_id)
    current_code = current_degree['degree_code']
    current_faculty = current_degree.get('faculty', '')
    current_program_name = current_degree['program_name']
    
    # 2. Get course structure for current degree
    current_courses = await _fetch_degree_courses(current_code)
    
    # Combine with specialization courses if provided
    if current_spec_course_codes:
        all_current_courses = list(set(current_courses + current_spec_course_codes))
        print(f"Combined {len(current_courses)} degree courses + {len(current_spec_course_codes)} specialization courses = {len(all_current_courses)} total")
        current_courses = all_current_courses
    elif not current_courses:
        print(f"WARNING: No courses found in current degree and no specialization courses provided")
        return []

    print(f"Current degree has {len(current_courses)} courses for matching")
    
    # 3. Get total degree count and determine adaptive limits
    total_count, initial_candidates, final_limit = await _calculate_adaptive_limits(degree_id, final_limit)
    print(f"Database size: {total_count} degrees | Analyzing: {initial_candidates} | Returning: {final_limit}")
    
    # 4. Quick filter: Get all degrees (just basic info, no courses yet)
    all_degrees = await _fetch_all_degrees(degree_id)
    if not all_degrees:
        print(f"WARNING: No other degrees found in database")
        return []
    
    # 5. Extract keywords from program and specializations
    program_keywords = extract_keywords_improved(current_program_name)
    spec_keywords = set()
    if current_spec_names:
        for spec_name in current_spec_names:
            if spec_name:  # Check not None
                spec_keywords.update(extract_specialization_keywords(spec_name))
    
    print(f"Program keywords: {program_keywords}")
    print(f"Specialization keywords: {spec_keywords}")
    
    # 6. Score degrees based on faculty, keywords, and specialization matching
    top_candidates = await _score_and_filter_candidates_improved(
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
    
    # 7. Fetch course structures for top candidates only
    structures = await _fetch_candidate_structures(top_candidates)
    
    if not structures:
        print(f"WARNING: No course structures found for candidates")
        return []
    
    # 8. Calculate course overlap for each candidate
    final_candidates = await _calculate_overlaps_with_specializations(
        structures,
        top_candidates,
        current_courses,
        current_spec_course_codes,
        spec_keywords
    )
    
    # 9. Sort by overlap percentage and return top N
    final_candidates.sort(key=lambda x: x['overlap_percentage'], reverse=True)
    top_final = final_candidates[:final_limit]
    
    if top_final:
        print(f"Returning top {len(top_final)} degrees with overlap ranging from {top_final[0]['overlap_percentage']:.1f}% to {top_final[-1]['overlap_percentage']:.1f}%")
    
    return top_final


# ========== HELPER FUNCTIONS ==========

async def _fetch_current_degree(degree_id: str) -> Dict[str, Any]:
    """Fetch current degree information."""
    current_degree_response = supabase.from_("unsw_degrees_final")\
        .select("*")\
        .eq("id", degree_id)\
        .single()\
        .execute()
    
    if not current_degree_response.data:
        raise Exception(f"Degree not found: {degree_id}")
    
    return current_degree_response.data


async def _fetch_degree_courses(degree_code: str) -> List[str]:
    """Fetch course codes for a degree."""
    structure_response = (
        supabase.from_("unsw_degrees_final")
        .select("sections")
        .eq("degree_code", degree_code)
        .single()
        .execute()
    )
    
    if not structure_response.data or not structure_response.data.get("sections"):
        print(f"WARNING: No sections data for degree {degree_code}")
        return []
    
    raw_sections = structure_response.data['sections']
    sections = json.loads(raw_sections) if isinstance(raw_sections, str) else raw_sections
    return extract_all_course_codes(sections)


async def _calculate_adaptive_limits(degree_id: str, final_limit: int) -> tuple:
    """Calculate adaptive limits based on database size."""
    total_response = supabase.from_("unsw_degrees_final")\
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
    
    return total_count, initial_candidates, final_limit


async def _fetch_all_degrees(degree_id: str) -> List[Dict[str, Any]]:
    """Fetch all degrees except current one."""
    all_degrees_response = supabase.from_("unsw_degrees_final")\
        .select("id, degree_code, program_name, faculty")\
        .neq("id", degree_id)\
        .execute()
    
    return all_degrees_response.data or []


async def _score_and_filter_candidates_improved(
    all_degrees: List[Dict[str, Any]],
    current_faculty: str,
    current_program_name: str,
    program_keywords: Set[str],
    spec_keywords: Set[str],
    initial_candidates: int
) -> List[Dict[str, Any]]:
    """
    IMPROVED scoring with multiple criteria and specialization awareness.
    
    Scoring criteria (120 points max):
    1. Faculty Match (40 points)
    2. Program Keyword Match (30 points)
    3. Degree Type Similarity (15 points)
    4. Specialization Keyword Match (25 points) - NEW!
    5. Field Proximity Bonus (10 points) - NEW!
    
    Threshold: 25 points minimum (up from 15)
    """
    candidates = []
    
    # Determine current degree type
    current_is_honours = 'honours' in current_program_name.lower()
    
    for degree in all_degrees:
        score = 0
        score_breakdown = []
        
        degree_name = degree['program_name']
        degree_faculty = degree.get('faculty', '')
        degree_name_lower = degree_name.lower()
        
        # ============================================================
        # CRITERION 1: Faculty Match (40 points max)
        # ============================================================
        if degree_faculty == current_faculty:
            score += 40
            score_breakdown.append("Same faculty: +40")
        elif are_related_faculties_improved(degree_faculty, current_faculty):
            score += 20
            score_breakdown.append("Related faculty: +20")
        
        # ============================================================
        # CRITERION 2: Program Keyword Match (30 points max)
        # ============================================================
        degree_keywords = extract_keywords_improved(degree_name)
        keyword_overlap = program_keywords & degree_keywords
        
        if keyword_overlap:
            keyword_score = 30 * (len(keyword_overlap) / max(len(program_keywords), 1))
            score += keyword_score
            score_breakdown.append(f"Program keywords ({len(keyword_overlap)}): +{keyword_score:.1f}")
        
        # ============================================================
        # CRITERION 3: Degree Type Similarity (15 points max)
        # ============================================================
        degree_is_honours = 'honours' in degree_name_lower
        
        if current_is_honours == degree_is_honours:
            score += 15
            score_breakdown.append("Same degree type: +15")
        
        # ============================================================
        # CRITERION 4: Specialization Keyword Match (25 points max) - NEW!
        # ============================================================
        if spec_keywords:
            # Check if degree name contains specialization keywords
            spec_match_count = sum(1 for kw in spec_keywords if kw in degree_name_lower)
            if spec_match_count > 0:
                spec_score = min(25, spec_match_count * 10)
                score += spec_score
                score_breakdown.append(f"Spec keywords ({spec_match_count}): +{spec_score}")
        
        # ============================================================
        # CRITERION 5: Field Proximity Bonus (10 points max) - NEW!
        # ============================================================
        # Boost degrees in closely related fields
        field_pairs = [
            (['computer', 'software', 'information'], ['cyber', 'security', 'data', 'artificial', 'intelligence']),
            (['engineering', 'mechanical'], ['civil', 'electrical', 'aerospace']),
            (['business', 'commerce'], ['economics', 'finance', 'accounting']),
            (['science', 'physics'], ['chemistry', 'biology', 'mathematics']),
        ]
        
        for primary_fields, related_fields in field_pairs:
            current_has_primary = any(f in current_program_name.lower() for f in primary_fields)
            degree_has_related = any(f in degree_name_lower for f in related_fields)
            
            if current_has_primary and degree_has_related:
                score += 10
                score_breakdown.append("Field proximity: +10")
                break
        
        # ============================================================
        # MINIMUM THRESHOLD: 25 points (increased from 15)
        # ============================================================
        if score >= 25:
            candidates.append({
                **degree,
                'initial_score': score,
                'score_breakdown': score_breakdown
            })
    
    # Sort by score and return top N
    candidates.sort(key=lambda x: x['initial_score'], reverse=True)
    top_candidates = candidates[:initial_candidates]
    
    # Log top 10 for debugging
    if top_candidates:
        print(f"\n[Scoring] Top 10 candidates:")
        for i, candidate in enumerate(top_candidates[:10], 1):
            print(f"  {i}. {candidate['program_name']} - Score: {candidate['initial_score']:.1f}")
            print(f"     {', '.join(candidate['score_breakdown'])}")
        print()
    
    return top_candidates


async def _fetch_candidate_structures(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Fetch course structures for candidate degrees."""
    candidate_codes = [c['degree_code'] for c in candidates]
    structures_response = (
        supabase.from_("unsw_degrees_final")
        .select("degree_code, sections")
        .in_("degree_code", candidate_codes)
        .execute()
    )
    
    return structures_response.data or []


async def _calculate_overlaps_with_specializations(
    structures: List[Dict[str, Any]],
    top_candidates: List[Dict[str, Any]],
    current_courses: List[str],
    current_spec_course_codes: List[str],
    current_spec_keywords: Set[str]
) -> List[Dict[str, Any]]:
    """Calculate course overlap for each candidate, including specialization matching."""
    final_candidates = []
    current_set = set(current_courses)
    
    for structure in structures:
        try:
            # Parse degree courses
            raw_sections = structure['sections']
            sections = json.loads(raw_sections) if isinstance(raw_sections, str) else raw_sections
            degree_courses = extract_all_course_codes(sections)
            
            if not degree_courses:
                continue
            
            # Calculate BASE overlap first
            degree_set = set(degree_courses)
            shared_base = current_set & degree_set
            
            # Use weighted overlap if specs are provided
            if current_spec_course_codes:
                base_overlap_pct = calculate_overlap_weighted(
                    current_courses, 
                    degree_courses, 
                    current_spec_course_codes
                )
            else:
                base_overlap_pct = (len(shared_base) / len(current_courses)) * 100 if current_courses else 0
            
            # Find matching degree info
            degree_info = next(
                (c for c in top_candidates if c['degree_code'] == structure['degree_code']), 
                None
            )
            
            if not degree_info:
                continue
            
            # Create base match object
            best_match = {
                'id': degree_info['id'],
                'degree_code': degree_info['degree_code'],
                'program_name': degree_info['program_name'],
                'faculty': degree_info.get('faculty', 'Not specified'),
                'overlap_percentage': base_overlap_pct,
                'shared_courses': sorted(list(shared_base)),
                'overlap_count': len(shared_base),
                'total_current_courses': len(current_courses),
                'total_target_courses': len(degree_courses),
                'initial_score': degree_info['initial_score'],
                'specialisation': None  # Will be populated if a spec improves overlap
            }
            
            # Check specializations if student has specializations selected
            if current_spec_course_codes and len(current_spec_course_codes) > 0:
                best_match = await _check_specialization_improvements(
                    best_match,
                    structure['degree_code'],
                    degree_courses,
                    current_courses,
                    current_set,
                    current_spec_course_codes,
                    current_spec_keywords,
                    base_overlap_pct,
                    degree_info
                )
            
            # Add to final candidates if there's overlap
            if best_match['overlap_count'] > 0:
                final_candidates.append(best_match)
        
        except Exception as e:
            print(f"WARNING: Error processing degree {structure.get('degree_code')}: {e}")
            continue
    
    return final_candidates


async def _check_specialization_improvements(
    best_match: Dict[str, Any],
    degree_code: str,
    degree_courses: List[str],
    current_courses: List[str],
    current_set: set,
    current_spec_course_codes: List[str],
    current_spec_keywords: Set[str],
    base_overlap_pct: float,
    degree_info: Dict[str, Any]
) -> Dict[str, Any]:
    """Check if any specializations improve the overlap."""
    try:
        # Fetch available specializations for this degree
        spec_filter = json.dumps([{"degree_code": degree_code}])
        
        available_specs_response = supabase.from_("unsw_specialisations")\
            .select("id, major_name, specialisation_type, sections")\
            .contains("sections_degrees", spec_filter)\
            .execute()
        
        if not available_specs_response.data:
            return best_match
        
        # Score specializations by relevance
        scored_specs = []
        for spec in available_specs_response.data:
            spec_name = spec['major_name']
            spec_keywords = extract_specialization_keywords(spec_name)
            
            # Calculate keyword overlap with current specialization
            keyword_overlap = current_spec_keywords & spec_keywords
            relevance_score = len(keyword_overlap)
            
            scored_specs.append({
                **spec,
                'relevance_score': relevance_score
            })
        
        # Sort by relevance and check top 5
        scored_specs.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        best_spec_overlap = base_overlap_pct
        best_spec = None
        
        # Check top 5 most relevant specializations
        for spec in scored_specs[:5]:
            spec_sections = json.loads(spec['sections']) if isinstance(spec['sections'], str) else spec['sections']
            spec_courses = extract_all_course_codes(spec_sections)
            
            # Combine target degree + this spec
            target_total_courses = list(set(degree_courses + spec_courses))
            
            # Calculate overlap with student's total courses (weighted)
            spec_overlap_pct = calculate_overlap_weighted(
                current_courses,
                target_total_courses,
                current_spec_course_codes
            )
            
            # Only recommend spec if it improves overlap by ≥10%
            if spec_overlap_pct > best_spec_overlap + 10:
                target_set = set(target_total_courses)
                shared_with_spec = current_set & target_set
                
                best_spec = {
                    'spec_id': spec['id'],
                    'spec_name': spec['major_name'],
                    'spec_type': spec['specialisation_type'],
                    'overlap_percentage': spec_overlap_pct,
                    'shared_courses': sorted(list(shared_with_spec)),
                    'relevance_score': spec['relevance_score']
                }
                best_spec_overlap = spec_overlap_pct
        
        # Update match if a spec was beneficial
        if best_spec:
            best_match['specialisation'] = best_spec
            best_match['overlap_percentage'] = best_spec['overlap_percentage']
            best_match['shared_courses'] = best_spec['shared_courses']
            best_match['overlap_count'] = len(best_spec['shared_courses'])
            best_match['total_target_courses'] = len(target_total_courses)
            
            print(f"  ✓ {degree_info['program_name']} + {best_spec['spec_name']}: "
                  f"{best_spec['overlap_percentage']:.1f}% (base: {base_overlap_pct:.1f}%, relevance: {best_spec['relevance_score']})")
    
    except Exception as e:
        print(f"WARNING: Error checking specializations for {degree_code}: {e}")
    
    return best_match