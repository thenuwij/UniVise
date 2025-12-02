# Generated the societies, industry and careers sections in roadmap university mode

import json
import re
import asyncio
import time
from typing import Any, Dict, List
from datetime import datetime
from app.utils.database import supabase
from app.utils.openai_client import ask_openai
from .roadmap_unsw_helpers import fetch_user_specialisation_context

# Json parse fixing
def sanitize_and_parse_json(raw_text: str) -> Dict[str, Any]:

    # Keep track of the last JSONDecodeError for debugging
    last_error: Exception | None = None

    # Start with trimmed text
    text = raw_text.strip()
    text = re.sub(r'"\{([^}]*)\}"', r'{\1}', text)

    # Try parsing as-is (after the stringified-object fix)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"[JSON] Initial parse failed: {e}")
        last_error = e
        
    try:
        cleaned = text

        # Remove comments (// and /* */)
        cleaned = re.sub(r'//.*?$', '', cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)

        # Fix trailing commas
        cleaned = re.sub(r',(\s*[}\]])', r'\1', cleaned)

        # Replace single quotes with double quotes (carefully)
        cleaned = re.sub(r"'([^']*?)'(\s*:)", r'"\1"\2', cleaned)  # Property names
        cleaned = re.sub(r":\s*'([^']*?)'", r': "\1"', cleaned)    # String values

        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"[JSON] Cleanup parse failed: {e}")
        last_error = e

    # Fix unquoted property names
    try:
        def quote_property_names(match):
            prop_name = match.group(1)
            return f'"{prop_name}":'

        fixed = re.sub(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:', quote_property_names, cleaned)
        return json.loads(fixed)
    except json.JSONDecodeError as e:
        print(f"[JSON] Property name fixing failed: {e}")
        last_error = e

    # Extract core JSON object/brackets
    try:
        start = cleaned.find('{')
        end = cleaned.rfind('}')

        if start != -1 and end != -1:
            json_only = cleaned[start:end + 1]
            json_only = re.sub(r',(\s*[}\]])', r'\1', json_only)
            json_only = re.sub(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'"\1":', json_only)
            return json.loads(json_only)
    except json.JSONDecodeError as e:
        print(f"[JSON] Extraction strategy failed: {e}")
        last_error = e

    # Fix specific known patterns
    try:
        patterns = [
            (r'\bname\s*:', '"name":'),
            (r'\bprovider\s*:', '"provider":'),
            (r'\btitle\s*:', '"title":'),
            (r'\bsource\s*:', '"source":'),
            (r'\bimportance\s*:', '"importance":'),
            (r'\btimeline\s*:', '"timeline":'),
            (r'\bnotes\s*:', '"notes":'),
            (r'\bdescription\s*:', '"description":'),
            (r'\brequirements\s*:', '"requirements":'),
        ]

        fixed_text = cleaned
        for pattern, replacement in patterns:
            fixed_text = re.sub(pattern, replacement, fixed_text)

        return json.loads(fixed_text)
    except json.JSONDecodeError as e:
        print(f"Pattern fixing failed: {e}")
        last_error = e

    # If all strategies failed
    print(f"All parsing strategies failed")
    # print(f"Raw text (first 500 chars):\n{raw_text[:500]}")

    raise ValueError(
        f"Could not parse JSON after multiple attempts. "
        f"Last error: {last_error}"
    )


# OpenAI call for generating societies
async def ai_generate_societies(context: Dict[str, Any]) -> Dict[str, Any]:
    
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")

    # Add specialisation context 
    selected_major = context.get("selected_major_name")
    selected_minor = context.get("selected_minor_name")
    selected_honours = context.get("selected_honours_name")

    specialisation_context = ""
    if any([selected_major, selected_minor, selected_honours]):
        specialisation_context = "\nThe student has chosen the following specialisations:\n"
        if selected_major:
            specialisation_context += f"- Major: {selected_major}\n"
        if selected_minor:
            specialisation_context += f"- Minor: {selected_minor}\n"
        if selected_honours:
            specialisation_context += f"- Honours: {selected_honours}\n"

    
    prompt = f"""You are a UNSW student engagement advisor with deep knowledge of Arc UNSW societies and campus life.

    Provide society and community information for {program_name} students in the Faculty of {faculty}.
    {specialisation_context}


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
        
    print("Societies generating...")
    
    try:
        raw = ask_openai(prompt)
        
        raw_stripped = raw.strip()
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        json_only = raw_stripped[first_brace:last_brace + 1] if first_brace != -1 else raw_stripped
        
        result = sanitize_and_parse_json(json_only)
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

# Generate industry experience section in parallel
async def ai_generate_industry_experience(context: Dict[str, Any]) -> Dict[str, Any]:
    
    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")

    # Add specialisation context
    selected_major = context.get("selected_major_name")
    selected_minor = context.get("selected_minor_name")
    selected_honours = context.get("selected_honours_name")

    specialisation_context = ""
    if any([selected_major, selected_minor, selected_honours]):
        specialisation_context = "\nThe student has chosen the following specialisations:\n"
        if selected_major:
            specialisation_context += f"- Major: {selected_major}\n"
        if selected_minor:
            specialisation_context += f"- Minor: {selected_minor}\n"
        if selected_honours:
            specialisation_context += f"- Honours: {selected_honours}\n"

    
    prompt = f"""You are a UNSW career advisor. Provide industry experience information for {program_name} ({faculty}).
    {specialisation_context}


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
            "competitiveness": "Brief note",
            "apply_url": "Direct URL to apply or company careers page (e.g., 'https://careers.pwc.com.au/students')"
          }}
        ],
        "top_recruiting_companies": ["Company 1", "Company 2", "...8-10 total"],
        "career_fairs": "Description of major fairs/events",
        "wil_opportunities": "WIL subjects or co-op info"
      }}
    }}

    Use REAL company and program names. Return ONLY valid JSON. Start with {{ and end with }}.
    """
        
    print("Industry Experience Generating...")
    
    try:
        raw = ask_openai(prompt)
        
        raw_stripped = raw.strip()
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        json_only = raw_stripped[first_brace:last_brace + 1] if first_brace != -1 else raw_stripped
        
        result = sanitize_and_parse_json(json_only)
        print(f"Industry generated {len(result.get('industry_experience', {}).get('internship_programs', []))} internship programs")
        return result
        
    except Exception as e:
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


# Generate career pathways section in parallel
async def ai_generate_career_pathways(context: Dict[str, Any]) -> Dict[str, Any]:

    program_name = context.get("program_name")
    faculty = context.get("faculty", "Not specified")

    # Add specialisation context 
    selected_major = context.get("selected_major_name")
    selected_minor = context.get("selected_minor_name")
    selected_honours = context.get("selected_honours_name")

    specialisation_context = ""
    if any([selected_major, selected_minor, selected_honours]):
        specialisation_context = "\nThe student has chosen the following specialisations:\n"
        if selected_major:
            specialisation_context += f"- Major: {selected_major}\n"
        if selected_minor:
            specialisation_context += f"- Minor: {selected_minor}\n"
        if selected_honours:
            specialisation_context += f"- Honours: {selected_honours}\n"

        
    prompt = f"""You are a UNSW career advisor with access to current job market data. Provide career info for {program_name} ({faculty}) graduates.
    {specialisation_context}

    IMPORTANT: Base your role information on REAL job listings currently posted on Australian job sites (Seek, Indeed, LinkedIn, GradConnection). Use actual job titles, realistic salary ranges from current listings, and provide direct URLs to example listings or search results.

    A. ENTRY ROLES (3 roles, 0-2yrs)
      - Title, salary AUD (based on current listings)
      - DETAILED description (3-4 sentences): What you'd do day-to-day, key responsibilities, how it uses skills from the degree, why it suits {program_name} graduates
      - Requirements, 2-3 hiring companies currently advertising, source URL to live job search

    B. MID ROLES (2 roles, 3-7yrs)
      - Title, salary AUD (based on current listings)
      - DETAILED description (3-4 sentences): Day-to-day work, leadership/specialist responsibilities, career progression from entry level, how advanced skills from {program_name} apply
      - Requirements, 2-3 hiring companies currently advertising, source URL to live job search

    C. SENIOR ROLES (2 roles, 8+yrs)
      - Title, salary AUD (based on current listings)
      - DETAILED description (3-4 sentences): Strategic responsibilities, team/department leadership, impact on business outcomes, how expertise from {program_name} background provides competitive advantage
      - Requirements, 2-3 hiring companies currently advertising, source URL to live job search

    D. CERTIFICATIONS (2-3 certs)
      - Name, provider, importance, timeline, notes (optional)

    E. MARKET
      - Demand level, trends (1-2 sentences), location notes

    F. TOP EMPLOYERS (6-8 companies in 2-3 sectors)

    G. STATS
      - Employment rate, starting salary, 3 common roles, source

    CRITICAL: ALL property names MUST have double quotes. Example:
    CORRECT: {{"name": "..."}}
    WRONG: {{name: "..."}}

    JSON STRUCTURE:
    {{
      "career_pathways": {{
        "entry_level": {{
          "roles": [
            {{
              "title": "Exact job title as seen on job boards (e.g., 'Graduate Accountant', 'Junior Data Analyst')",
              "salary_range": "$X - $Y AUD based on current listings",
              "description": "3-4 sentences: (1) Day-to-day responsibilities, (2) Key deliverables and skills used, (3) How {program_name} degree prepares you, (4) Why this suits graduates of this program",
              "requirements": "Key requirements from actual listings",
              "hiring_companies": ["Atlassian", "Canva", "Commonwealth Bank"],
              "source": "Seek/Indeed/LinkedIn/GradConnection",
              "source_url": "Direct URL to job search results (e.g., 'https://www.seek.com.au/graduate-accountant-jobs-in-sydney' or 'https://au.indeed.com/jobs?q=junior+data+analyst')"
            }}
          ],
          "years_experience": "0-2 years"
        }},
        "mid_career": {{
          "roles": [
            {{
              "title": "Exact job title as seen on job boards (e.g., 'Graduate Accountant', 'Junior Data Analyst')",
              "salary_range": "$X - $Y AUD based on current listings",
              "description": "3-4 sentences: (1) Day-to-day responsibilities, (2) Key deliverables and skills used, (3) How {program_name} degree prepares you, (4) Why this suits graduates of this program",
              "requirements": "Key requirements from actual listings",
              "hiring_companies": ["Atlassian", "Canva", "Commonwealth Bank"],
              "source": "Seek/Indeed/LinkedIn/GradConnection",
              "source_url": "Direct URL to job search results (e.g., 'https://www.seek.com.au/graduate-accountant-jobs-in-sydney' or 'https://au.indeed.com/jobs?q=junior+data+analyst')"
            }}
          ],
          "years_experience": "3-7 years"
        }},
        "senior": {{
          "roles": [
            {{
              "title": "Exact job title as seen on job boards (e.g., 'Graduate Accountant', 'Junior Data Analyst')",
              "salary_range": "$X - $Y AUD based on current listings",
              "description": "3-4 sentences: (1) Day-to-day responsibilities, (2) Key deliverables and skills used, (3) How {program_name} degree prepares you, (4) Why this suits graduates of this program",
              "requirements": "Key requirements from actual listings",
              "hiring_companies": ["Atlassian", "Canva", "Commonwealth Bank"],
              "source": "Seek/Indeed/LinkedIn/GradConnection",
              "source_url": "Direct URL to job search results (e.g., 'https://www.seek.com.au/graduate-accountant-jobs-in-sydney' or 'https://au.indeed.com/jobs?q=junior+data+analyst')"
            }}
          ],
          "years_experience": "8+ years"
        }},
        "certifications": [
          {{
            "name": "...",
            "provider": "...",
            "importance": "Required/Highly Recommended/Optional",
            "timeline": "...",
            "notes": "Optional brief note about benefits or requirements"
          }}
        ],
        "market_insights": {{
          "demand_level": "High/Medium/Growing/Stable",
          "trends": "1-2 sentences about industry trends and outlook",
          "geographic_notes": "Location info"
        }},
        "top_employers": {{
          "by_sector": {{
            "Sector1": ["...", "..."],
            "Sector2": ["...", "..."]
          }}
        }},
        "employment_stats": {{
          "employment_rate": "X%",
          "median_starting_salary": "$X",
          "common_first_roles": ["...", "...", "..."],
          "source": "Graduate Careers Australia/QILT/Industry Report"
        }}
      }}
    }}

    Return ONLY valid JSON. Start with {{ and end with }}.
    """

    print("Career Pathways Generating...")
    
    try:
        raw = ask_openai(prompt)
        raw_stripped = raw.strip()
        
        # Extract JSON
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        json_only = raw_stripped[first_brace:last_brace + 1] if first_brace != -1 else raw_stripped
        
        result = sanitize_and_parse_json(json_only)
        return result
                
    except Exception as e:
        print(f"Raw:\n{raw if 'raw' in locals() else 'N/A'}")
        
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


# Generate industry experience and career pathways ssections in one call
async def generate_and_update_industry_careers(roadmap_id: str, roadmap_data: dict):

    loop = asyncio.get_event_loop()

    base_context = {
        "program_name": roadmap_data.get("program_name"),
        "faculty": roadmap_data.get("payload", {}).get("faculty"),
    }

    user_id = roadmap_data.get("user_id")
    degree_code = roadmap_data.get("degree_code")
    if user_id and degree_code:
        try:
            spec = fetch_user_specialisation_context(user_id, degree_code)
            base_context.update(spec)
        except Exception as e:
            print("Failed to load specialisations:", str(e))

    # Run only 2 tasks in parallel (no societies)
    industry_future = loop.run_in_executor(
        None, lambda: asyncio.run(ai_generate_industry_experience(base_context))
    )
    careers_future = loop.run_in_executor(
        None, lambda: asyncio.run(ai_generate_career_pathways(base_context))
    )

    # print(f"Waiting for industry and careers for roadmap {roadmap_id}...")

    industry_result, careers_result = await asyncio.gather(
        industry_future, careers_future
    )

    print("Industry and careers finished. Merging payload...")

    latest = supabase.from_("unsw_roadmap").select("payload").eq("id", roadmap_id).single().execute()
    payload = latest.data.get("payload", {}) if latest.data else {}

    payload["industry_experience"] = industry_result.get("industry_experience", {})
    payload["career_pathways"] = careers_result.get("career_pathways", {})

    supabase.from_("unsw_roadmap").update({
        "payload": payload,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", roadmap_id).execute()

    print("Industry and careers saved.")


# Generate societies section in another call 
async def generate_and_update_societies(roadmap_id: str, roadmap_data: dict):

    start = time.time()

    base_context = {
        "program_name": roadmap_data.get("program_name"),
        "faculty": roadmap_data.get("payload", {}).get("faculty"),
    }

    user_id = roadmap_data.get("user_id")
    degree_code = roadmap_data.get("degree_code")
    if user_id and degree_code:
        try:
            spec = fetch_user_specialisation_context(user_id, degree_code)
            base_context.update(spec)
        except Exception as e:
            print(f"Failed to load specialisations: {e}")

    # Generate societies
    societies_result = await ai_generate_societies(base_context)

    # Load latest payload and merge
    latest = supabase.from_("unsw_roadmap").select("payload").eq("id", roadmap_id).single().execute()
    payload = latest.data.get("payload", {}) if latest.data else {}

    # Save to industry_societies for frontend polling
    payload["industry_societies"] = societies_result.get("societies", {})

    # Save immediately
    supabase.from_("unsw_roadmap").update({
        "payload": payload,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", roadmap_id).execute()

    print(f"Societies section completed in {time.time() - start:.1f}s")