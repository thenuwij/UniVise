import json
import re


def extract_json(response_text: str):
    text = response_text.strip()

    # 1) Raw JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2) Markdown code fences
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 3) First { or [ to last } or ]
    start = min(
        (text.find(c) for c in "{[" if text.find(c) != -1),
        default=-1,
    )
    if start != -1:
        opener = text[start]
        closer = "}" if opener == "{" else "]"
        end = text.rfind(closer)
        if end != -1:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass

    raise ValueError(f"Could not extract JSON from LLM response: {text[:300]}")
