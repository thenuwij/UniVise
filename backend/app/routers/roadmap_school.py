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
            .select("id, user_id, degree_name, university_name, atar_requirement, suitability_score, est_completion_years, reason, sources, link, created_at")
            .eq("user_id", user_id).eq("id", req.recommendation_id).limit(1).execute()
        )
        rec = _first_or_none(res)

    if rec is None and req.degree_name:
        res = (
            supabase.from_("degree_recommendations")
            .select("id, user_id, degree_name, university_name, atar_requirement, suitability_score, est_completion_years, reason, sources, link, created_at")
            .eq("user_id", user_id).ilike("degree_name", f"%{req.degree_name}%")
            .order("created_at", desc=True).limit(1).execute()
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
You are an expert Australian academic & career advisor. 
Create a detailed HIGH-SCHOOL-to-UNIVERSITY ROADMAP for a student aiming for the degree below.

CONTEXT (factual; don't invent):
- Country: {context.get('country')}
- Target Degree: {context.get('degree_name')}
- University: {rec.get('university_name')}
- Indicative ATAR: {rec.get('atar_requirement')}
- Suitability Score: {rec.get('suitability_score')}
- Est. Completion: {rec.get('est_completion_years')}
- Reason: {rec.get('reason')}
- Source Link: {rec.get('link')}

TASK:
Return STRICT JSON (no markdown, no commentary) matching this schema. 
Every section must be detailed and tailored to an Australian high school student.

{{
  "summary": "2–3 engaging sentences…",
  "entry_requirements": {{
    "atar": {json.dumps(rec.get('atar_requirement'))},
    "selection_rank": "Provide a realistic estimate or null if unknown",
    "subjects": ["Mathematics Advanced","English Advanced","Add 2–3 relevant subjects"],
    "suggested_hsc_courses": [
      "Mathematics Advanced","English Advanced",
      "At least one Science (e.g., Physics, Chemistry, Biology)",
      "Relevant elective (e.g., Economics, IPT, D&T)"
    ],
    "notes": "Prereqs/assumed knowledge/portfolio/adjustments/tips"
  }},
  "program_structure": [
    {{"year":1,"overview":"Core foundations + gen ed + skills"}},
    {{"year":2,"overview":"Intermediate/core + minor/elective + WIL"}},
    {{"year":3,"overview":"Advanced + capstone + honours prep"}}
  ],
  "specialisations": ["List realistic majors with career notes"],
  "industry": {{
    "internships": ["List 3–5 realistic providers with notes"],
    "rolesHint": ["3–5 graduate roles with 5–10 word notes"]
  }},
  "enrichment": {{
    "clubs_and_societies": ["3–5 clubs/competitions with benefits"],
    "short_courses": ["3–5 MOOCs/certs with providers"]
  }},
  "source": {json.dumps(rec.get('link'))}
}}
"""
    raw = ask_openai(prompt)
    payload = parse_json_or_500(raw)
    assert_keys(payload, ["summary","entry_requirements","program_structure","specialisations","industry","enrichment"], "school")
    return payload
