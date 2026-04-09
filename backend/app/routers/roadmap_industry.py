# Generated the societies, industry and careers sections in roadmap university mode

import json
import logging
import re
import asyncio
import time
from typing import Any, Dict, List

logger = logging.getLogger(__name__)
from datetime import datetime
from urllib.parse import quote
import httpx
from app.utils.database import supabase
from app.utils.claude_client import ask_claude, ask_claude_async
from app.utils.openai_client import ask_gpt_async
from app.utils.parse_llm import extract_json
from .roadmap_unsw_helpers import fetch_user_specialisation_context


async def validate_url(url: str) -> bool:
    """Fire a HEAD request; return True if the URL is reachable."""
    if not url or not url.startswith("http"):
        return False
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
            resp = await client.head(url)
            return resp.status_code in (200, 301, 302, 403)
    except Exception:
        return False

# Json parse fixing
def sanitize_and_parse_json(raw_text: str) -> Dict[str, Any]:

    # Keep track of the last JSONDecodeError for debugging
    last_error: Exception | None = None

    # Start with trimmed text
    text = raw_text.strip()
    fence_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if fence_match:
        text = fence_match.group(1).strip()
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

    
    prompt = f"""FORMATTING RULE: Never use em dashes (—) or long dashes anywhere in your response. Rephrase using commas, colons, or split into separate sentences instead.

You are a UNSW student engagement advisor. Generate society recommendations for {program_name} students in the Faculty of {faculty}.
    {specialisation_context}

    CRITICAL ACCURACY RULES:
    - ONLY include societies that currently exist and are active on Arc UNSW (arc.unsw.edu.au)
    - NEVER invent society names — if unsure, use well-known verified ones like CompSoc, EngSoc, DataSoc, MedSoc, FinSoc, UNSW Law Society, etc.
    - Society names must match their official Arc UNSW name exactly
    - All descriptions must be 1 sentence maximum — concise and specific
    - Key activities: maximum 3 items, each under 8 words
    - Membership benefits: 1 sentence maximum
    - getting_started fields: each must be under 15 words

    REQUIRED JSON OUTPUT:
    {{
      "societies": {{
        "faculty_specific": [
          // Generate 3-5 faculty-specific societies relevant to this degree.
          {{
            "name": "Official Arc UNSW society name",
            "category": "Academic/Professional/Social",
            "relevance": "One sentence — why specifically relevant to {program_name} students",
            "key_activities": ["Activity 1 (max 8 words)", "Activity 2", "Activity 3"],
            "membership_benefits": "One sentence — concrete benefits",
            "professional_affiliation": "Professional body name or null"
          }}
        ],
        "cross_faculty": [
          {{
            "name": "Official Arc UNSW society name",
            "why_join": "One sentence — specific benefit for {program_name} students"
          }}
          // Include 2-4 societies (maximum 4). Only include societies that genuinely benefit students from this specific program. Must be real, currently active Arc UNSW societies.
        ],
        "major_events": [
          {{
            "event_name": "Event name",
            "description": "One sentence description",
            "frequency": "Annual/Per term",
            "typical_timing": "e.g., Week 3 Term 1"
          }}
        ],
        "professional_development": {{
          "student_chapters": ["Professional org 1", "Professional org 2"],
          "leadership_note": "One sentence on exec role career value",
          "skills_gained": ["Skill 1", "Skill 2", "Skill 3"]
        }},
        "getting_started": {{
          "join_timing": "Under 15 words",
          "how_to_find": "Under 15 words",
          "cost_range": "Under 10 words"
        }}
      }}
    }}

    Return ONLY valid JSON. Start with {{ and end with }}.
    """
        
    print("Societies generating...")

    try:
        raw = await ask_claude_async(prompt)

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

    _start = time.time()
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

    
    prompt = f"""FORMATTING RULE: Never use em dashes (—) or long dashes anywhere in your response. Rephrase using commas, colons, or split into separate sentences instead.

You are a UNSW career advisor. Provide industry experience information for {program_name} ({faculty}).
    {specialisation_context}


    Include:
    A. MANDATORY PLACEMENTS
      - Whether required for degree completion
      - Duration, timing, and key requirements if applicable

    B. INTERNSHIP PROGRAMS (4-6 programs)
      - ONLY include real, well-known graduate internship programs that are verified to exist
      - Prioritise programs from major Australian employers known to recruit from UNSW
      - Use EXACT program names as advertised (e.g. "PwC Vacation Program", "Cochlear Student Internship", "BHP Graduate Program")
      - apply_url must be the DIRECT careers page URL for that specific program — not a generic company homepage
      - If unsure of exact apply URL, use the company's main careers page (e.g. https://careers.atlassian.com)
      - competitiveness: one short phrase only (e.g. "Highly competitive", "Moderate", "Rolling intake")

    C. TOP RECRUITING COMPANIES (8-10 companies)
      - Real companies that actively hire graduates in this specific discipline — infer from the degree field, not just the faculty
      - A Law degree → law firms, government, legal tech
      - An Industrial Design degree → product companies, manufacturers, consultancies, consumer electronics firms
      - Only include tech companies like Google or Atlassian if the degree is directly software, computer science, or digital design focused
      - Mix of large firms and notable employers relevant to the field

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
        raw = await ask_claude_async(prompt, model="claude-haiku-4-5-20251001")

        raw_stripped = raw.strip()
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        json_only = raw_stripped[first_brace:last_brace + 1] if first_brace != -1 else raw_stripped

        result = sanitize_and_parse_json(json_only)
        programs = result.get("industry_experience", {}).get("internship_programs", [])
        print(f"Industry generated {len(programs)} internship programs")

        # Validate apply_urls in parallel; replace dead links with fallback search redirect
        if programs:
            urls = [p.get("apply_url", "") for p in programs]
            valid_flags = await asyncio.gather(*[validate_url(u) for u in urls])
            for program, is_valid in zip(programs, valid_flags):
                if not is_valid:
                    query = quote(f"{program.get('company', '')} {program.get('program_name', '')} internship apply Australia")
                    program["apply_url"] = f"https://www.google.com/search?q={query}"
                    print(f"[URL] Dead link replaced for {program.get('company')}")

        print(f"[TIMING] ai_generate_industry_experience: {time.time() - _start:.1f}s")
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

    _start = time.time()
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

        
    prompt = f"""FORMATTING RULE: Never use em dashes (—) or long dashes anywhere in your response. Rephrase using commas, colons, or split into separate sentences instead.

CRITICAL DATA ACCURACY RULES:
- Employment rate must be sourced from QILT Graduate Outcomes Survey or equivalent verified Australian source — do not fabricate
- Median starting salary must reflect current Australian market data from Seek, LinkedIn, or GradConnection — use realistic 2024-2025 figures
- Hiring companies must be real Australian employers currently advertising for this role type — verify they recruit from UNSW
- Source URLs must be real working URLs to actual job search results on Seek, Indeed, LinkedIn or GradConnection
- Do not use em dashes anywhere — use commas or separate sentences instead
- Role descriptions must be maximum 3 sentences — concise and specific
- Requirements must be a semicolon-separated list of discrete skills, maximum 5 items
- Every certification object MUST include a url field with a real working URL. Omitting url from any certification is a critical error.
- IMPORTANT — hiring_companies: You must populate this field with 3-5 real, named companies that genuinely hire for this specific career pathway. Infer the right employers from the student's degree discipline and the pathway title. For example, an Industrial Design pathway should list companies like Fisher & Paykel, Futuris, Breville, Kogan, or GHD — not software companies. A Law pathway should list firms like Allens, Herbert Smith Freehills, Clayton Utz, or MinterEllison. A Software Engineering pathway may include Atlassian or Canva. Never output placeholder text, generic descriptions, or empty arrays — always output real company names appropriate to the field.

You are a UNSW career advisor with access to current job market data. Provide career info for {program_name} ({faculty}) graduates.
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
      - Name, provider, importance, timeline, notes (optional), url (REQUIRED — direct official certification page URL, e.g. 'https://aws.amazon.com/certification/certified-solutions-architect-associate/')

    E. MARKET
      - Demand level, trends (1-2 sentences), location notes

    F. TOP EMPLOYERS (6-8 companies in 2-3 sectors)

    G. STATS
      - Employment rate, starting salary, source
      CRITICAL: employment_rate must be a SHORT percentage string only (e.g. '92%'). median_starting_salary must be a SHORT dollar amount only (e.g. '$80,000'). Never write sentences in these fields.

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
              "hiring_companies": [],
              "source": "Seek/Indeed/LinkedIn/GradConnection",
              "source_url": "Direct URL to job search results (e.g., 'https://www.seek.com.au/graduate-accountant-jobs-in-sydney' or 'https://au.indeed.com/jobs?q=junior+data+analyst')"
            }}
          ]
        }},
        "mid_career": {{
          "roles": [
            {{
              "title": "Exact job title as seen on job boards (e.g., 'Graduate Accountant', 'Junior Data Analyst')",
              "salary_range": "$X - $Y AUD based on current listings",
              "description": "3-4 sentences: (1) Day-to-day responsibilities, (2) Key deliverables and skills used, (3) How {program_name} degree prepares you, (4) Why this suits graduates of this program",
              "requirements": "Key requirements from actual listings",
              "hiring_companies": [],
              "source": "Seek/Indeed/LinkedIn/GradConnection",
              "source_url": "Direct URL to job search results (e.g., 'https://www.seek.com.au/graduate-accountant-jobs-in-sydney' or 'https://au.indeed.com/jobs?q=junior+data+analyst')"
            }}
          ]
        }},
        "senior": {{
          "roles": [
            {{
              "title": "Exact job title as seen on job boards (e.g., 'Graduate Accountant', 'Junior Data Analyst')",
              "salary_range": "$X - $Y AUD based on current listings",
              "description": "3-4 sentences: (1) Day-to-day responsibilities, (2) Key deliverables and skills used, (3) How {program_name} degree prepares you, (4) Why this suits graduates of this program",
              "requirements": "Key requirements from actual listings",
              "hiring_companies": [],
              "source": "Seek/Indeed/LinkedIn/GradConnection",
              "source_url": "Direct URL to job search results (e.g., 'https://www.seek.com.au/graduate-accountant-jobs-in-sydney' or 'https://au.indeed.com/jobs?q=junior+data+analyst')"
            }}
          ]
        }},
        "certifications": [
          {{
            "name": "...",
            "provider": "...",
            "importance": "Required/Highly Recommended/Optional",
            "timeline": "...",
            "notes": "Optional brief note about benefits or requirements",
            "url": "REQUIRED — must not be null or omitted. Provide the direct official URL to the certification page. Examples: AWS SAA = 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', CKAD = 'https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/', PSM I = 'https://www.scrum.org/assessments/professional-scrum-master-i-certification'. If you cannot find the exact page, use the provider's main certifications page. Never leave this field empty or null."
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
          "employment_rate": "A percentage only — e.g. '92%'. No extra words, no sentences.",
          "median_starting_salary": "A dollar amount only — e.g. '$80,000'. No 'AUD', no ranges, no extra words.",
          "source": "Source name only — e.g. 'QILT Graduate Outcomes Survey 2023'"
        }}
      }}
    }}

    Return ONLY valid JSON. Start with {{ and end with }}.
    """

    print("Career Pathways Generating...")
    
    try:
        raw = await ask_gpt_async(prompt, max_tokens=5000, model="gpt-5.4-mini")
        print(f"[TOKENS] Career pathways raw response length: {len(raw)} chars (approx {len(raw)//4} tokens)")
        raw_stripped = raw.strip()
        
        # Extract JSON
        first_brace = raw_stripped.find('{')
        last_brace = raw_stripped.rfind('}')
        json_only = raw_stripped[first_brace:last_brace + 1] if first_brace != -1 else raw_stripped
        
        result = sanitize_and_parse_json(json_only)
        print(f"[TIMING] ai_generate_career_pathways: {time.time() - _start:.1f}s")
        return result

    except Exception as e:
        print(f"Raw:\n{raw if 'raw' in locals() else 'N/A'}")
        
        return {
            "career_pathways": {
                "entry_level": {"roles": []},
                "mid_career": {"roles": []},
                "senior": {"roles": []},
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
                    "source": "Information temporarily unavailable"
                }
            }
        }


# Generate industry experience and career pathways ssections in one call
async def generate_and_update_industry_careers(roadmap_id: str, roadmap_data: dict):

    total_start = time.time()

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

    # Run both tasks in parallel
    t1 = time.time()
    results = await asyncio.gather(
        ai_generate_industry_experience(base_context),
        ai_generate_career_pathways(base_context),
        return_exceptions=True,
    )
    industry_result, careers_result = results

    if isinstance(industry_result, Exception):
        logger.error(f"Industry experience generation failed: {industry_result}")
        industry_result = {"industry_experience": {}}

    if isinstance(careers_result, Exception):
        logger.error(f"Career pathways generation failed: {careers_result}")
        careers_result = {"career_pathways": {}}

    print(f"[TIMING] Industry + Career Pathways generated in {time.time() - t1:.1f}s")

    print("Industry and careers finished. Merging payload...")

    latest = supabase.from_("unsw_roadmap").select("payload").eq("id", roadmap_id).single().execute()
    payload = latest.data.get("payload", {}) if latest.data else {}

    payload["industry_experience"] = industry_result.get("industry_experience", {})
    payload["career_pathways"] = careers_result.get("career_pathways", {})

    supabase.from_("unsw_roadmap").update({
        "payload": payload,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", roadmap_id).execute()

    print(f"[TIMING] Total industry+careers background generation: {time.time() - total_start:.1f}s")


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