import re
from typing import Any, Dict
from urllib.parse import urlsplit

import httpx

COURSE_CODE = re.compile(r"\b[A-Z]{4}\d{4}\b")
ERROR_PAGE = re.compile(r"error|404|not-?found", re.I)


def chosen_specialisations(context: Dict[str, Any]) -> str:
    chosen = [(label, context.get(f"selected_{key}_name")) for label, key in (("Major", "major"), ("Minor", "minor"), ("Honours", "honours"))]
    lines = [f"- {label}: {name}\n" for label, name in chosen if name]
    return "\nThe student has chosen the following specialisations:\n" + "".join(lines) if lines else ""


def course_list_for_prompt(courses: list) -> str:
    if not courses:
        return "The program's course list is not available, so do not name any course codes."
    sections: Dict[str, list] = {}
    for c in courses:
        sections.setdefault((c.get("section") or "Other", c.get("section_rule") or ""), []).append(c)
    blocks = []
    for (title, rule), items in sections.items():
        header = f"{title}: {rule}" if rule else title
        blocks.append(header + "\n" + "\n".join(f"- {c['code']}: {c['name']}" for c in items))
    listing = "\n\n".join(blocks)
    return f"The program's real courses, grouped by the Handbook section and its rule. Only ever name course codes from this list, never invent one:\n{listing}"


def keep_listed_codes(codes: list, allowed: set, limit: int) -> list:
    kept = []
    for code in codes or []:
        code = (code or "").strip().upper()
        if code in allowed and code not in kept:
            kept.append(code)
    return kept[:limit]


def replace_unlisted_codes(text: str, allowed: set) -> str:
    return COURSE_CODE.sub(lambda m: m.group(0) if m.group(0) in allowed else "(course not listed)", text or "")


async def validate_url(url: str) -> bool:
    """Fire a HEAD request; return True if the URL is reachable."""
    if not url or not url.startswith("http"):
        return False
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
            resp = await client.head(url)
            if ERROR_PAGE.search(urlsplit(str(resp.url)).path):
                return False
            return resp.status_code in (200, 301, 302, 403)
    except Exception:
        return False
