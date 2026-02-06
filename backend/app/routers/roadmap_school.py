from typing import Any, Dict
from app.utils.database import supabase
from app.utils.openai_client import ask_openai
from .roadmap_common import (
    _first_or_none, assert_keys
)
import json
from .roadmap_industry import sanitize_and_parse_json


async def gather_school_context(user_id: str, req) -> Dict[str, Any]:
    rec = None

    if req.recommendation_id:
        res = (
            supabase.from_("degree_recommendations")
            .select(
                "id, user_id, degree_name, university_name, atar_requirement, "
                "suitability_score, est_completion_years, reason, sources, link, created_at"
            )
            .eq("user_id", user_id)
            .eq("id", req.recommendation_id)
            .limit(1)
            .execute()
        )
        rec = _first_or_none(res)

    if rec is None and req.degree_name:
        res = (
            supabase.from_("degree_recommendations")
            .select(
                "id, user_id, degree_name, university_name, atar_requirement, "
                "suitability_score, est_completion_years, reason, sources, link, created_at"
            )
            .eq("user_id", user_id)
            .ilike("degree_name", f"%{req.degree_name}%")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        rec = _first_or_none(res)

    return {
        "user_id": user_id,
        "country": req.country,
        "selected_recommendation": rec,
        "degree_name": (rec["degree_name"] if rec else req.degree_name),
    }


# Core payload - includes industry_experience, returns faster
async def ai_generate_school_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    rec = context.get("selected_recommendation") or {}

    prompt = f"""
    You are an expert Australian academic & career advisor.

    CONTEXT:
    - Country: {context.get('country')}
    - Target Degree: {context.get('degree_name')}
    - University: {rec.get('university_name')}
    - Indicative ATAR: {rec.get('atar_requirement')}
    - Est. Completion: {rec.get('est_completion_years')} years
    - Source Link: {rec.get('link')}

    CRITICAL INSTRUCTIONS:
    1. Return ONLY valid JSON (no markdown, no code blocks).
    2. All information must be accurate and specific.
    3. No placeholders.
    4. selection_rank must be numeric only.

    JSON SCHEMA (match exactly):
    {{
      "summary": "3–4 sentence summary about this degree at {rec.get('university_name')}.",

      "entry_requirements": {{
        "atar": {json.dumps(rec.get('atar_requirement'))},
        "selection_rank": "Numeric value only",
        "subjects": ["2-3 real HSC subjects most relevant to the degree"],
        "suggested_hsc_courses": ["2-3 HSC courses that help prepare for the degree"],
        "notes": "3–5 specific entry notes"
      }},

      "program_structure": [
        {{"year": 1, "overview": "3-4 detailed sentences about first year: foundational subjects covered, key skills introduced, typical workload, and how it prepares students for later years."}},
        {{"year": 2, "overview": "3-4 detailed sentences about second year: intermediate subjects, specialisation options opening up, practical components, and skill progression."}},
        {{"year": 3, "overview": "3-4 detailed sentences about final year: advanced subjects, capstone projects or thesis, industry preparation, and professional readiness."}}
      ],

      "specialisations": ["6–10 real majors/minors/specialisations with 10–15 word notes"],

      "industry_experience": {{
        "mandatory_placements": {{
          "required": false,
          "details": "Placement requirements or 'No mandatory placements required.'"
        }},
        "internship_programs": [
          {{
            "program_name": "Internship program name",
            "company": "Company name",
            "duration": "10–12 weeks",
            "timing": "Summer/Winter",
            "paid": true,
            "application_period": "Dates",
            "competitiveness": "Short note",
            "source": "Seek/GradConnection/Company Website"
          }}
        ],
        "top_recruiting_companies": ["8–10 companies that hire in this field"],
        "career_fairs": "Relevant career fairs or employer events",
        "wil_opportunities": "WIL subjects or co-op-style opportunities"
      }},

      "source": {json.dumps(rec.get('link'))}
    }}

    QUALITY CHECKLIST:
    - All keys match schema.
    - All sections contain detailed, specific content.
    - No placeholders.
    - Output is valid JSON only.
    """

    raw = ask_openai(prompt)
    payload = sanitize_and_parse_json(raw)

    assert_keys(
        payload,
        ["summary", "entry_requirements", "program_structure", "specialisations", "industry_experience", "source"],
        "school_core",
    )

    return payload


# Background task - only career_pathways
async def ai_generate_school_careers(context: Dict[str, Any]) -> Dict[str, Any]:
    rec = context.get("selected_recommendation") or {}

    prompt = f"""
    You are an expert Australian career advisor.

    CONTEXT:
    - Target Degree: {context.get('degree_name')}
    - University: {rec.get('university_name')}

    CRITICAL INSTRUCTIONS:
    1. Return ONLY valid JSON (no markdown, no code blocks).
    2. Use real company names and data.
    3. Career stages: Entry Level (2–3 roles), Mid-Career (2–3 roles), Senior (1–2 roles).
    4. Role descriptions must be 2-4 sentences.

    JSON SCHEMA:
    {{
      "career_pathways": {{
        "entry_level": {{
          "roles": [
            {{
              "title": "Entry role name",
              "salary_range": "AUD salary",
              "description": "2–3 sentence description with concrete responsibilities.",
              "requirements": "Key entry-level requirements",
              "hiring_companies": ["Company1", "Company2", "Company3"],
              "source": "Seek/GradConnection/LinkedIn"
            }}
          ],
          "years_experience": "0–2 years"
        }},
        "mid_career": {{
          "roles": [
            {{
              "title": "Mid-career role",
              "salary_range": "AUD salary",
              "description": "2–3 sentence description.",
              "requirements": "Experience & skills",
              "hiring_companies": ["Company1", "Company2", "Company3"],
              "source": "LinkedIn"
            }}
          ],
          "years_experience": "3–7 years"
        }},
        "senior": {{
          "roles": [
            {{
              "title": "Senior leadership role",
              "salary_range": "AUD salary",
              "description": "2–3 sentence description of responsibilities and oversight.",
              "requirements": "Senior leadership requirements",
              "hiring_companies": ["Company1", "Company2"],
              "source": "Company Website / LinkedIn"
            }}
          ],
          "years_experience": "8+ years"
        }},
        "certifications": [
          {{
            "name": "Certification name",
            "provider": "Provider",
            "importance": "Required/Highly Recommended/Optional",
            "timeline": "Timeline",
            "notes": "Optional notes"
          }}
        ],
        "market_insights": {{
          "demand_level": "High/Medium/Growing/Stable",
          "trends": "1–2 sentences on industry trends",
          "geographic_notes": "Location-based demand notes"
        }},
        "top_employers": {{
          "by_sector": {{
            "Sector 1": ["Employer A", "Employer B"],
            "Sector 2": ["Employer C", "Employer D"]
          }}
        }},
        "employment_stats": {{
          "employment_rate": "e.g., '85%'",
          "median_starting_salary": "e.g., '$72,000'",
          "common_first_roles": ["Role1", "Role2"],
          "source": "QILT/Graduate Outcomes Survey"
        }}
      }}
    }}

    Return ONLY valid JSON.
    """

    raw = ask_openai(prompt)
    return sanitize_and_parse_json(raw)


# Background task to update DB with careers
async def generate_and_update_school_careers(roadmap_id: str, context: Dict[str, Any]):
    print(f"[School Background] Generating careers for {roadmap_id}...")
    
    try:
        careers_data = await ai_generate_school_careers(context)
        
        # Get current payload
        latest = supabase.from_("school_roadmap").select("payload").eq("id", roadmap_id).single().execute()
        payload = latest.data.get("payload", {}) if latest.data else {}
        
        # Merge careers data
        payload["career_pathways"] = careers_data.get("career_pathways", {})
        
        # Save
        supabase.from_("school_roadmap").update({
            "payload": payload
        }).eq("id", roadmap_id).execute()
        
        print(f"[School Background] Careers saved for {roadmap_id}")
        
    except Exception as e:
        print(f"[School Background] Failed: {e}")