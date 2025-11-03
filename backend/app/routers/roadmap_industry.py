"""
Enhanced industry and careers information for UNSW roadmaps.

This module generates rich, real-world industry and career insights using:
- Web search for current internship programs, salaries, and industry trends
- AI synthesis to provide actionable, student-focused information
- Structured sections: Societies → Industry Training → Career Pathways

Background task approach with fallback to basic data.
"""

from typing import Any, Dict, List
import json
from app.utils.openai_client import ask_openai
from .roadmap_common import parse_json_or_500, assert_keys


# ========== HELPER: WEB SEARCH INTEGRATION ==========
async def search_industry_data(program_name: str, faculty: str) -> Dict[str, str]:
    """
    Perform targeted web searches to gather real-world industry data.
    
    Returns search results for:
    - Internship programs
    - Graduate salaries
    - Industry partners
    - Career pathways
    - Student societies
    """
    
    # Note: You'll need to integrate with your web_search tool
    # For now, returning structure that would be populated
    
    searches_to_perform = {
        "internships": f"{program_name} UNSW internships industry placement programs 2024",
        "salaries": f"{program_name} graduate salary Australia 2024",
        "employers": f"UNSW {faculty} industry partners employers hiring graduates",
        "careers": f"{program_name} career pathways progression Australia",
        "societies": f"UNSW {faculty} student societies clubs",
        "certifications": f"{program_name} professional certifications requirements Australia"
    }
    
    print(f"[Industry Enhancement] Would search for:")
    for key, query in searches_to_perform.items():
        print(f"  - {key}: {query}")
    
    # Placeholder - integrate with your actual web_search tool
    # Example: results = await web_search(query)
    
    return {
        "internships_context": "# Search results would go here",
        "salaries_context": "# Search results would go here",
        "employers_context": "# Search results would go here",
        "careers_context": "# Search results would go here",
        "societies_context": "# Search results would go here",
        "certifications_context": "# Search results would go here"
    }


# ========== STAGE 1: SOCIETIES (PARALLEL) ==========
async def ai_generate_societies(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate societies and community information.
    Optimized prompt - reduced society count but maintains quality.
    """
    
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")
    
    prompt = f"""You are a UNSW student engagement advisor with deep knowledge of Arc UNSW societies and campus life.

Provide society and community information for {program_name} students in the Faculty of {faculty}.

Include:

A. FACULTY-SPECIFIC SOCIETIES (4-5 societies)
   - Use REAL society names from UNSW Arc
   - Include both academic and social societies
   - Specify what makes each relevant to {program_name} students
   - Include typical membership benefits (workshops, networking, socials, competitions)
   - Note if they're affiliated with professional bodies

B. CROSS-FACULTY SOCIETIES (2 societies)
   - Broader UNSW societies that {program_name} students commonly join

C. KEY EVENTS & OPPORTUNITIES (2-3 events)
   - Faculty-specific networking nights and industry panels
   - Annual competitions, hackathons, case competitions
   - Career expos and employer information sessions

D. PROFESSIONAL DEVELOPMENT
   - Student chapters of professional organizations (list only)
   - Brief note on leadership opportunities and skills gained

REQUIRED JSON OUTPUT:
{{
  "societies": {{
    "faculty_specific": [
      {{
        "name": "Official society name (e.g., 'UNSW Computing Society (CompSoc)')",
        "category": "Academic/Professional/Social",
        "relevance": "Why this matters for {program_name} students (1 sentence)",
        "key_activities": ["Activity 1", "Activity 2", "Activity 3"],
        "membership_benefits": "What students gain",
        "professional_affiliation": "Professional body name or null"
      }}
    ],
    "cross_faculty": [
      {{
        "name": "Society name",
        "why_join": "Why {program_name} students benefit from this"
      }}
    ],
    "major_events": [
      {{
        "event_name": "Event name",
        "description": "What happens",
        "frequency": "Annual/Per term",
        "typical_timing": "e.g., 'Week 3, Term 1'"
      }}
    ],
    "professional_development": {{
      "student_chapters": ["Professional org 1", "Professional org 2"],
      "leadership_note": "Brief description of exec roles and career value",
      "skills_gained": ["Skill 1", "Skill 2", "Skill 3"]
    }},
    "getting_started": {{
      "join_timing": "Best time to join",
      "how_to_find": "Where to discover societies",
      "cost_range": "Typical membership fees"
    }}
  }}
}}

Use REAL UNSW society names. Be specific with events and benefits. 
Return ONLY valid JSON. Start with {{ and end with }}.
"""
    
    print("[Stage 1: Societies] Generating...")
    
    try:
        raw = ask_openai(prompt)
        
        raw_stripped = raw.strip()
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        json_only = raw_stripped[first_brace:last_brace + 1] if first_brace != -1 else raw_stripped
        
        result = parse_json_or_500(json_only)
        faculty_count = len(result.get('societies', {}).get('faculty_specific', []))
        events_count = len(result.get('societies', {}).get('major_events', []))
        print(f"[Stage 1: Societies] ✓ Generated {faculty_count} societies, {events_count} events")
        return result
        
    except Exception as e:
        print(f"[Stage 1: Societies] ✗ Error: {e}")
        return {
            "societies": {
                "faculty_specific": [],
                "cross_faculty": [],
                "major_events": [],
                "professional_development": {
                    "student_chapters": [],
                    "leadership_note": "Information temporarily unavailable",
                    "skills_gained": []
                },
                "getting_started": {
                    "join_timing": "O-Week and Week 1 each term",
                    "how_to_find": "Visit arc.unsw.edu.au or attend O-Week stalls",
                    "cost_range": "$5-15 per year typically"
                }
            }
        }

# ========== STAGE 2: INDUSTRY EXPERIENCE (PARALLEL) ==========
async def ai_generate_industry_experience(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate industry experience and internship information.
    Optimized: Cleaner structure, reduced token count, maintains quality.
    """
    
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")
    
    prompt = f"""You are a UNSW career advisor. Provide industry experience information for {program_name} ({faculty}).

Include:
A. MANDATORY PLACEMENTS
   - Whether required for degree completion
   - Duration, timing, and key requirements if applicable

B. INTERNSHIP PROGRAMS (4-6 programs)
   - Use REAL program names (e.g., "PwC Actuarial Cadetship", "Google STEP Internship")
   - Company, duration, timing, paid/unpaid status
   - Application periods and competitiveness

C. TOP RECRUITING COMPANIES (8-10 companies)
   - Real companies that actively hire UNSW {faculty} graduates
   - Mix of large firms and notable employers

D. CAREER EVENTS & WIL
   - Major career fairs or employer events
   - Work Integrated Learning subjects or co-op programs

REQUIRED JSON OUTPUT:
{{
  "industry_experience": {{
    "mandatory_placements": {{
      "required": true/false,
      "details": "Description or 'No mandatory placements required.'"
    }},
    "internship_programs": [
      {{
        "program_name": "Specific program name",
        "company": "Company name",
        "duration": "e.g., '10-12 weeks'",
        "timing": "e.g., 'Summer (Nov-Feb)'",
        "paid": true/false,
        "application_period": "e.g., 'March-April'",
        "competitiveness": "Brief note"
      }}
    ],
    "top_recruiting_companies": ["Company 1", "Company 2", "...8-10 total"],
    "career_fairs": "Description of major fairs/events",
    "wil_opportunities": "WIL subjects or co-op info"
  }}
}}

Use REAL company and program names. Return ONLY valid JSON. Start with {{ and end with }}.
"""
    
    print("[Stage 2: Industry Experience] Generating...")
    
    try:
        raw = ask_openai(prompt)
        
        raw_stripped = raw.strip()
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        json_only = raw_stripped[first_brace:last_brace + 1] if first_brace != -1 else raw_stripped
        
        result = parse_json_or_500(json_only)
        print(f"[Stage 2: Industry] ✓ Generated {len(result.get('industry_experience', {}).get('internship_programs', []))} internship programs")
        return result
        
    except Exception as e:
        print(f"[Stage 2: Industry] ✗ Error: {e}")
        return {
            "industry_experience": {
                "mandatory_placements": {
                    "required": False,
                    "details": "Information temporarily unavailable"
                },
                "internship_programs": [],
                "top_recruiting_companies": [],
                "career_fairs": "Information temporarily unavailable",
                "wil_opportunities": "Information temporarily unavailable"
            }
        }


# ========== STAGE 3: CAREER PATHWAYS (PARALLEL) ==========
# ========== STAGE 3: CAREER PATHWAYS (PARALLEL) ==========
async def ai_generate_career_pathways(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate career pathways information.
    Ultra-optimized: Reduced output size to prevent truncation.
    """
    
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")
    
    prompt = f"""You are a UNSW career advisor. Provide career info for {program_name} ({faculty}) graduates.

A. ENTRY ROLES (3 roles, 0-2yrs)
   - Title, salary AUD, 1-sentence description, requirements, 2-3 hiring companies

B. MID ROLES (2 roles, 3-7yrs)
   - Title, salary, description, requirements, 2-3 hiring companies

C. SENIOR ROLES (2 roles, 8+yrs)
   - Title, salary, description, requirements, 2-3 hiring companies

D. CERTIFICATIONS (2-3 certs)
   - Name, provider, importance, timeline

E. MARKET
   - Demand level, trends (1 sentence), location notes

F. TOP EMPLOYERS (6-8 companies in 2-3 sectors)

G. STATS
   - Employment rate, starting salary, 3 common roles, source

JSON:
{{
  "career_pathways": {{
    "entry_level": {{
      "roles": [{{"title": "...", "salary_range": "...", "description": "...", "requirements": "...", "hiring_companies": ["..."]}}],
      "years_experience": "0-2 years"
    }},
    "mid_career": {{
      "roles": [{{"title": "...", "salary_range": "...", "description": "...", "requirements": "...", "hiring_companies": ["..."]}}],
      "years_experience": "3-7 years"
    }},
    "senior": {{
      "roles": [{{"title": "...", "salary_range": "...", "description": "...", "requirements": "...", "hiring_companies": ["..."]}}],
      "years_experience": "8+ years"
    }},
    "certifications": [{{"name": "...", "provider": "...", "importance": "Required/Highly Recommended/Optional", "timeline": "..."}}],
    "market_insights": {{
      "demand_level": "High/Medium/Growing/Stable",
      "trends": "1 sentence",
      "geographic_notes": "Location info"
    }},
    "top_employers": {{
      "by_sector": {{"Sector1": ["..."], "Sector2": ["..."]}}
    }},
    "employment_stats": {{
      "employment_rate": "X%",
      "median_starting_salary": "$X",
      "common_first_roles": ["...", "...", "..."],
      "source": "Source name"
    }}
  }}
}}

Return ONLY valid JSON. Start with {{ and end with }}.
"""
    
    print("[Stage 3: Career Pathways] Generating...")
    
    try:
        raw = ask_openai(prompt)
        
        raw_stripped = raw.strip()
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        json_only = raw_stripped[first_brace:last_brace + 1] if first_brace != -1 else raw_stripped
        
        result = parse_json_or_500(json_only)
        entry_roles = len(result.get('career_pathways', {}).get('entry_level', {}).get('roles', []))
        print(f"[Stage 3: Careers] ✓ Generated {entry_roles} entry-level roles + full pathway")
        return result
        
    except Exception as e:
        print(f"[Stage 3: Careers] ✗ Error: {e}")
        return {
            "career_pathways": {
                "entry_level": {"roles": [], "years_experience": "0-2 years"},
                "mid_career": {"roles": [], "years_experience": "3-7 years"},
                "senior": {"roles": [], "years_experience": "8+ years"},
                "certifications": [],
                "market_insights": {
                    "demand_level": "Data unavailable",
                    "trends": "Information temporarily unavailable",
                    "geographic_notes": "Information temporarily unavailable"
                },
                "top_employers": {"by_sector": {}},
                "employment_stats": {
                    "employment_rate": "Data not available",
                    "median_starting_salary": "Data not available",
                    "common_first_roles": [],
                    "source": "Information temporarily unavailable"
                }
            }
        }


# ========== MAIN COORDINATOR (RUNS ALL 3 IN PARALLEL) ==========
async def ai_enhance_industry_careers(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate enhanced industry and careers information using PARALLEL AI calls.
    
    THREE STAGES RUN SIMULTANEOUSLY:
    1. Societies & Community
    2. Industry Experience & Internships
    3. Career Pathways & Outcomes
    
    This is MUCH faster than sequential calls and reduces risk of any single large prompt failing.
    """
    
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")
    
    print(f"\n{'='*60}")
    print(f"ENHANCING INDUSTRY & CAREERS INFO (PARALLEL)")
    print(f"Program: {program_name}")
    print(f"Faculty: {faculty}")
    print(f"{'='*60}\n")
    
# ========== BACKGROUND TASK (separate threaded stages) ==========
import asyncio
import time
from app.utils.database import supabase


def _run_societies_thread(roadmap_id, roadmap_data):
    """Runs the societies stage in its own background thread."""
    start = time.time()
    print(f"[Societies Thread] Started for {roadmap_id}")

    try:
        context = {
            "program_name": roadmap_data.get("program_name"),
            "faculty": roadmap_data.get("payload", {}).get("faculty"),
        }
        result = asyncio.run(ai_generate_societies(context))

        payload = roadmap_data.get("payload", {})
        payload["industry_societies"] = result.get("societies", {})

        supabase.from_("unsw_roadmap").update({"payload": payload}).eq("id", roadmap_id).execute()
        print(f"[Societies Thread] ✓ Done in {time.time()-start:.1f}s")
    except Exception as e:
        print(f"[Societies Thread] ✗ ERROR for {roadmap_id}: {e}")


def _run_industry_thread(roadmap_id, roadmap_data):
    """Runs the industry experience stage in its own background thread."""
    start = time.time()
    print(f"[Industry Thread] Started for {roadmap_id}")

    try:
        context = {
            "program_name": roadmap_data.get("program_name"),
            "faculty": roadmap_data.get("payload", {}).get("faculty"),
        }
        result = asyncio.run(ai_generate_industry_experience(context))

        payload = roadmap_data.get("payload", {})
        payload["industry_experience"] = result.get("industry_experience", {})

        supabase.from_("unsw_roadmap").update({"payload": payload}).eq("id", roadmap_id).execute()
        print(f"[Industry Thread] ✓ Done in {time.time()-start:.1f}s")
    except Exception as e:
        print(f"[Industry Thread] ✗ ERROR for {roadmap_id}: {e}")


def _run_careers_thread(roadmap_id, roadmap_data):
    """Runs the career pathways stage in its own background thread."""
    start = time.time()
    print(f"[Careers Thread] Started for {roadmap_id}")

    try:
        context = {
            "program_name": roadmap_data.get("program_name"),
            "faculty": roadmap_data.get("payload", {}).get("faculty"),
        }
        result = asyncio.run(ai_generate_career_pathways(context))

        payload = roadmap_data.get("payload", {})
        payload["career_pathways"] = result.get("career_pathways", {})

        supabase.from_("unsw_roadmap").update({"payload": payload}).eq("id", roadmap_id).execute()
        print(f"[Careers Thread] ✓ Done in {time.time()-start:.1f}s")
    except Exception as e:
        print(f"[Careers Thread] ✗ ERROR for {roadmap_id}: {e}")


# ---------- Coordinator (launches all 3 threads) ----------
async def generate_and_update_industry_careers(roadmap_id: str, roadmap_data: dict):
    """
    Launches three fully independent background threads — one for each
    section (Societies, Industry, Careers). All run concurrently.
    """
    loop = asyncio.get_event_loop()

    # Launch each section in its own thread
    loop.run_in_executor(None, _run_societies_thread, roadmap_id, roadmap_data)
    loop.run_in_executor(None, _run_industry_thread, roadmap_id, roadmap_data)
    loop.run_in_executor(None, _run_careers_thread, roadmap_id, roadmap_data)

    print(f"[Coordinator] 🚀 Launched 3 independent threads for roadmap {roadmap_id}")
