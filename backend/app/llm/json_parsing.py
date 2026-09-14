import json
import logging
import re
from typing import Any, Dict

logger = logging.getLogger(__name__)


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
        logger.error(f"[JSON] Initial parse failed: {e}")
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
        logger.error(f"[JSON] Cleanup parse failed: {e}")
        last_error = e

    # Fix unquoted property names
    try:
        def quote_property_names(match):
            prop_name = match.group(1)
            return f'"{prop_name}":'

        fixed = re.sub(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:', quote_property_names, cleaned)
        return json.loads(fixed)
    except json.JSONDecodeError as e:
        logger.error(f"[JSON] Property name fixing failed: {e}")
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
        logger.error(f"[JSON] Extraction strategy failed: {e}")
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
        logger.error(f"Pattern fixing failed: {e}")
        last_error = e

    # If all strategies failed
    logger.error("All parsing strategies failed")

    raise ValueError(
        f"Could not parse JSON after multiple attempts. "
        f"Last error: {last_error}"
    )


def clean_openai_response(raw):
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```json|^```|```$", "", cleaned, flags=re.MULTILINE).strip()
    return cleaned
