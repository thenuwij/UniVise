from typing import Any, Dict
from app.utils.openai_client import ask_openai
from .roadmap_common import parse_json_or_500, assert_keys
import json

async def gather_transcript_context(user_id: str, req) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "current_degree": req.current_degree,
        "current_specialisation": req.current_specialisation,
        "current_wam": req.current_wam,
        "uoc_completed": req.uoc_completed,
    }

async def ai_generate_transcript_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    prompt = f"""
Return STRICT JSON for a transcript-based roadmap using only this context:
{json.dumps(context, ensure_ascii=False)}

Output minimally:
{{
  "info_to_confirm": ["Confirm electives group if applicable"],
  "progress_board": {{
    "current_wam": {json.dumps(context.get('current_wam'))},
    "uoc_completed": {json.dumps(context.get('uoc_completed'))},
    "remaining_uoc": null,
    "est_completion": null,
    "progress_bar": 0.0
  }},
  "program_structure": [],
  "honours": {{"requirements": "See Handbook", "wam_restrictions": "See Handbook", "classes_if_honours": []}},
  "program_flexibility": {{"year_plan": [], "current_specialisation": {json.dumps(context.get('current_specialisation'))}, "capstone_highlights": ""}},
  "alternate_pathways": {{"suggested_switch_options": []}},
  "industry": {{"industrial_training_info": "", "unsw_societies": []}},
  "careers": {{"live_api_hint": "backend, embedded, data"}}
}}
"""
    raw = ask_openai(prompt)
    payload = parse_json_or_500(raw)
    assert_keys(payload, [
        "info_to_confirm", "progress_board", "program_structure", "honours",
        "program_flexibility", "alternate_pathways", "industry", "careers"
    ], "transcript")
    return payload
