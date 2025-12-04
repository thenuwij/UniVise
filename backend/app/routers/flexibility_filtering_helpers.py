# app/routers/flexibility_filtering_helpers.py
# Helper functions for degree pre-filtering and overlap calculation.

from typing import Any, Dict, List, Set
import json
from app.utils.database import supabase
from .roadmap_unsw_helpers import extract_all_course_codes, calculate_overlap_weighted


# Extract keywords from program name, filtering out common/stop words.
def extract_keywords_improved(program_name: str) -> Set[str]:
    stop_words = {
        'bachelor', 'master', 'of', 'the', 'in', 'and', 'for', 'with',
        'honours', 'advanced', 'program', 'degree', 'undergraduate'
    }
    words = program_name.lower().replace('(', ' ').replace(')', ' ').split()
    return {word.strip() for word in words if len(word) > 2 and word not in stop_words}


# Extract keywords from specialization name.
def extract_specialization_keywords(spec_name: str) -> Set[str]:
    if not spec_name:
        return set()
    stop_words = {'major', 'minor', 'honours', 'in', 'and', 'of', 'the'}
    words = spec_name.lower().replace('(', ' ').replace(')', ' ').split()
    return {word.strip() for word in words if len(word) > 2 and word not in stop_words}


# Check if two faculties are related/similar.
def are_related_faculties(faculty1: str, faculty2: str) -> bool:
    if not faculty1 or not faculty2:
        return False
    
    f1 = faculty1.lower().strip()
    f2 = faculty2.lower().strip()
    
    if f1 == f2:
        return True
    
    related_groups = [
        {'engineering', 'computer science', 'information technology', 'built environment'},
        {'science', 'mathematics', 'physics', 'chemistry', 'biology'},
        {'business', 'commerce', 'economics', 'management'},
        {'arts', 'humanities', 'social sciences', 'education'},
        {'medicine', 'health', 'nursing', 'public health'},
        {'law', 'legal studies'},
    ]
    
    for group in related_groups:
        f1_in_group = any(keyword in f1 for keyword in group)
        f2_in_group = any(keyword in f2 for keyword in group)
        if f1_in_group and f2_in_group:
            return True
    
    return False


# Fetch current degree information from database.
async def fetch_current_degree(degree_id: str) -> Dict[str, Any]:
    response = supabase.from_("unsw_degrees_final")\
        .select("*")\
        .eq("id", degree_id)\
        .single()\
        .execute()
    
    if not response.data:
        raise Exception(f"Degree not found: {degree_id}")
    
    return response.data


# Fetch course codes for a given degree.
async def fetch_degree_courses(degree_code: str) -> List[str]:
    response = (
        supabase.from_("unsw_degrees_final")
        .select("sections")
        .eq("degree_code", degree_code)
        .single()
        .execute()
    )
    
    if not response.data or not response.data.get("sections"):
        return []
    
    raw_sections = response.data['sections']
    sections = json.loads(raw_sections) if isinstance(raw_sections, str) else raw_sections
    return extract_all_course_codes(sections)


# Calculate adaptive limits based on database size.
async def calculate_adaptive_limits(degree_id: str, final_limit: int) -> tuple:
    response = supabase.from_("unsw_degrees_final")\
        .select("id", count="exact")\
        .execute()
    
    total_count = response.count - 1
    
    if total_count < 50:
        initial_candidates_pct = 0.6
    elif total_count < 200:
        initial_candidates_pct = 0.4
    else:
        initial_candidates_pct = 0.25
    
    initial_candidates = max(20, min(100, int(total_count * initial_candidates_pct)))
    final_limit = min(final_limit, initial_candidates, total_count)
    
    return total_count, initial_candidates, final_limit


# Fetch all degrees except current one.
async def fetch_all_degrees(degree_id: str) -> List[Dict[str, Any]]:
    response = supabase.from_("unsw_degrees_final")\
        .select("id, degree_code, program_name, faculty")\
        .neq("id", degree_id)\
        .execute()
    
    return response.data or []


# Score and filter candidate degrees based on faculty, keywords, and specialization matching.
async def score_and_filter_candidates(
    all_degrees: List[Dict[str, Any]],
    current_faculty: str,
    current_program_name: str,
    program_keywords: Set[str],
    spec_keywords: Set[str],
    initial_candidates: int
) -> List[Dict[str, Any]]:
    candidates = []
    current_is_honours = 'honours' in current_program_name.lower()
    
    field_pairs = [
        (['computer', 'software', 'information'], ['cyber', 'security', 'data', 'artificial', 'intelligence']),
        (['engineering', 'mechanical'], ['civil', 'electrical', 'aerospace']),
        (['business', 'commerce'], ['economics', 'finance', 'accounting']),
        (['science', 'physics'], ['chemistry', 'biology', 'mathematics']),
    ]
    
    for degree in all_degrees:
        score = 0
        score_breakdown = []
        
        degree_name = degree['program_name']
        degree_faculty = degree.get('faculty', '')
        degree_name_lower = degree_name.lower()
        
        # Faculty match (40 points max)
        if degree_faculty == current_faculty:
            score += 40
            score_breakdown.append("Same faculty: +40")
        elif are_related_faculties(degree_faculty, current_faculty):
            score += 20
            score_breakdown.append("Related faculty: +20")
        
        # Program keyword match (30 points max)
        degree_keywords = extract_keywords_improved(degree_name)
        keyword_overlap = program_keywords & degree_keywords
        if keyword_overlap:
            keyword_score = 30 * (len(keyword_overlap) / max(len(program_keywords), 1))
            score += keyword_score
            score_breakdown.append(f"Program keywords ({len(keyword_overlap)}): +{keyword_score:.1f}")
        
        # Degree type similarity (15 points max)
        if current_is_honours == ('honours' in degree_name_lower):
            score += 15
            score_breakdown.append("Same degree type: +15")
        
        # Specialization keyword match (25 points max)
        if spec_keywords:
            spec_match_count = sum(1 for kw in spec_keywords if kw in degree_name_lower)
            if spec_match_count > 0:
                spec_score = min(25, spec_match_count * 10)
                score += spec_score
                score_breakdown.append(f"Spec keywords ({spec_match_count}): +{spec_score}")
        
        # Field proximity bonus (10 points max)
        for primary_fields, related_fields in field_pairs:
            current_has_primary = any(f in current_program_name.lower() for f in primary_fields)
            degree_has_related = any(f in degree_name_lower for f in related_fields)
            if current_has_primary and degree_has_related:
                score += 10
                score_breakdown.append("Field proximity: +10")
                break
        
        # Minimum threshold: 25 points
        if score >= 25:
            candidates.append({
                **degree,
                'initial_score': score,
                'score_breakdown': score_breakdown
            })
    
    candidates.sort(key=lambda x: x['initial_score'], reverse=True)
    return candidates[:initial_candidates]


# Fetch course structures for candidate degrees.
async def fetch_candidate_structures(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    candidate_codes = [c['degree_code'] for c in candidates]
    response = (
        supabase.from_("unsw_degrees_final")
        .select("degree_code, sections")
        .in_("degree_code", candidate_codes)
        .execute()
    )
    return response.data or []


# Calculate course overlap for each candidate, including specialization matching.
async def calculate_overlaps_with_specializations(
    structures: List[Dict[str, Any]],
    top_candidates: List[Dict[str, Any]],
    current_courses: List[str],
    current_spec_course_codes: List[str],
    current_spec_keywords: Set[str]
) -> List[Dict[str, Any]]:
    final_candidates = []
    current_set = set(current_courses)
    
    for structure in structures:
        try:
            raw_sections = structure['sections']
            sections = json.loads(raw_sections) if isinstance(raw_sections, str) else raw_sections
            degree_courses = extract_all_course_codes(sections)
            
            if not degree_courses:
                continue
            
            degree_set = set(degree_courses)
            shared_base = current_set & degree_set
            
            if current_spec_course_codes:
                base_overlap_pct = calculate_overlap_weighted(
                    current_courses, degree_courses, current_spec_course_codes
                )
            else:
                base_overlap_pct = (len(shared_base) / len(current_courses)) * 100 if current_courses else 0
            
            degree_info = next(
                (c for c in top_candidates if c['degree_code'] == structure['degree_code']), 
                None
            )
            
            if not degree_info:
                continue
            
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
                'specialisation': None
            }
            
            if current_spec_course_codes and len(current_spec_course_codes) > 0:
                best_match = await check_specialization_improvements(
                    best_match, structure['degree_code'], degree_courses,
                    current_courses, current_set, current_spec_course_codes,
                    current_spec_keywords, base_overlap_pct, degree_info
                )
            
            if best_match['overlap_count'] > 0:
                final_candidates.append(best_match)
        
        except Exception as e:
            print(f"Error processing degree {structure.get('degree_code')}: {e}")
            continue
    
    return final_candidates


# Check if any specializations improve the overlap for a candidate degree.
async def check_specialization_improvements(
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
    try:
        spec_filter = json.dumps([{"degree_code": degree_code}])
        
        response = supabase.from_("unsw_specialisations")\
            .select("id, major_name, specialisation_type, sections")\
            .contains("sections_degrees", spec_filter)\
            .execute()
        
        if not response.data:
            return best_match
        
        # Score specializations by keyword relevance
        scored_specs = []
        for spec in response.data:
            spec_keywords = extract_specialization_keywords(spec['major_name'])
            keyword_overlap = current_spec_keywords & spec_keywords
            scored_specs.append({**spec, 'relevance_score': len(keyword_overlap)})
        
        scored_specs.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        best_spec_overlap = base_overlap_pct
        best_spec = None
        target_total_courses = []
        
        # Check top 5 most relevant specializations
        for spec in scored_specs[:5]:
            spec_sections = json.loads(spec['sections']) if isinstance(spec['sections'], str) else spec['sections']
            spec_courses = extract_all_course_codes(spec_sections)
            
            target_total_courses = list(set(degree_courses + spec_courses))
            spec_overlap_pct = calculate_overlap_weighted(
                current_courses, target_total_courses, current_spec_course_codes
            )
            
            # Only recommend if improves overlap by ≥10%
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
        
        if best_spec:
            best_match['specialisation'] = best_spec
            best_match['overlap_percentage'] = best_spec['overlap_percentage']
            best_match['shared_courses'] = best_spec['shared_courses']
            best_match['overlap_count'] = len(best_spec['shared_courses'])
            best_match['total_target_courses'] = len(target_total_courses)
    
    except Exception as e:
        print(f"Error checking specializations for {degree_code}: {e}")
    
    return best_match