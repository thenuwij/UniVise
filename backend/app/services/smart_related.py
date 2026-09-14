from typing import List, Dict, Any

from app.llm.json_parsing import extract_json

SYSTEM_PROMPT = """
You are selecting the most relevant university degrees for ONE course.

You MUST:
- Pick ONLY from the provided DEGREE_CANDIDATES list.
- Return STRICT JSON with this exact structure:

{
  "choices": [
    {
      "degree_id": "string",
      "score": float,   // between 0 and 1
      "reason": "string"
    }
  ]
}

Rules:
1. You MUST return EXACTLY top_k choices. Never more, never fewer.
2. If fewer than top_k valid degrees exist, repeat the BEST ones with slightly lower scores.
3. Scores MUST be unique and between 0.0 and 1.0.
4. Reasons MUST be short, factual, and tied to curriculum overlap.

Ranking logic (most to least important):
- Curriculum alignment: does the degree normally include or rely on this course?
- Faculty match: same faculty is preferred unless obviously incorrect.
- Pipeline relevance: does the course feed into core study areas of the degree?
- Course level: foundational courses fit generalist degrees; advanced courses fit specialized degrees.

Penalize strongly:
- Degrees from unrelated faculties.
- Degrees that cannot include this course in any program structure.
- Degrees without clear academic linkage.

Output ONLY the JSON object above. No explanations, no prose, no markdown.
"""

# Parse AI response JSON, with fallback for incorret output
def safe_json_choices(text: str) -> List[Dict[str, Any]]:
    try:
        obj = extract_json(text)
        if isinstance(obj, dict) and isinstance(obj.get("choices"), list):
            return obj["choices"]
    except Exception:
        pass
    return []
