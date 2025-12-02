from typing import Any, Dict
from app.utils.database import supabase
from app.utils.openai_client import ask_openai
from .roadmap_common import (
    _first_or_none, parse_json_or_500, assert_keys
)
import json


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


async def ai_generate_school_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    rec = context.get("selected_recommendation") or {}

    prompt = f"""
    You are an expert Australian academic & career advisor creating a comprehensive high school to university transition roadmap.

    CONTEXT:
    - Country: {context.get('country')}
    - Target Degree: {context.get('degree_name')}
    - University: {rec.get('university_name')}
    - Indicative ATAR: {rec.get('atar_requirement')}
    - Suitability Score: {rec.get('suitability_score')}
    - Est. Completion: {rec.get('est_completion_years')} years
    - Reason: {rec.get('reason')}
    - Source Link: {rec.get('link')}

    CRITICAL INSTRUCTIONS:
    1. Return ONLY valid JSON (no markdown, no code blocks).
    2. All information must be accurate and specific.
    3. No placeholders.
    4. selection_rank must be numeric only.
    5. Arrays must have 5–8 items.
    6. Use real course names, companies, and clubs.
    7. Career stages must include:
      - Entry Level: 2–3 roles
      - Mid-Career: 2–3 roles
      - Senior: 1–2 roles
    8. Role descriptions must be 4-6 sentences.
    9. Every role must include a real `source`.

    JSON SCHEMA (match exactly):
    {{
      "summary": "3–4 sentence summary about this degree at {rec.get('university_name')}.",

      "entry_requirements": {{
        "atar": {json.dumps(rec.get('atar_requirement'))},
        "selection_rank": "Numeric value only",
        "subjects": [
          "2-3 real HSC subjects most relevant to the degree"
        ],
        "suggested_hsc_courses": [
          "2-3 HSC courses that help prepare for the degree"
        ],
        "notes": "3–5 specific entry notes"
      }},

      "program_structure": [
        {{
          "year": 1,
          "overview": "Year 1 overview including core skills & subjects"
        }},
        {{
          "year": 2,
          "overview": "Year 2 overview including intermediate subjects & options"
        }},
        {{
          "year": 3,
          "overview": "Year 3 overview including capstone/advanced subjects"
        }}
      ],

      "specialisations": [
        "6–10 real majors/minors/specialisations with 10–15 word notes"
      ],

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
        "top_recruiting_companies": [
          "8–10 companies that hire in this field"
        ],
        "career_fairs": "Relevant career fairs or employer events",
        "wil_opportunities": "WIL subjects or co-op-style opportunities"
      }},

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
            }},
            {{
              "title": "Second entry role",
              "salary_range": "AUD salary",
              "description": "Another 2–3 sentence detailed description.",
              "requirements": "Requirements",
              "hiring_companies": ["CompanyA", "CompanyB"],
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
            }},
            {{
              "title": "Second mid-career role",
              "salary_range": "AUD salary",
              "description": "Another 2–3 sentence description.",
              "requirements": "Experience & skills",
              "hiring_companies": ["CompanyA", "CompanyB"],
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
    payload = parse_json_or_500(raw)

    assert_keys(
        payload,
        [
            "summary",
            "entry_requirements",
            "program_structure",
            "specialisations",
            "industry_experience",
            "career_pathways",
            "source",
        ],
        "school",
    )

    return payload
