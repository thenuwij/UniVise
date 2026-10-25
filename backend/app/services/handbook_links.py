"""Resolve published official Handbook entries, newest supported year first."""
import json
import logging
import re
import time
from functools import lru_cache
from uuid import UUID

import httpx

from app.core.database import supabase

HANDBOOK = "https://www.handbook.unsw.edu.au"
PREFERRED_YEAR = 2027
EARLIEST_YEAR = 2019  # Earlier Handbooks use a different URL structure.
TABLES = {
    "courses": ("unsw_courses", "code"),
    "programs": ("unsw_degrees_final", "degree_code"),
    "specialisations": ("unsw_specialisations", "major_code"),
}
NEXT_DATA = re.compile(r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)
logger = logging.getLogger(__name__)


def entry_identity(kind: str, identifier: str, level: str | None) -> tuple[str, str]:
    """Old bookmarks contain database UUIDs; current links can use Handbook codes."""
    table, field = TABLES[kind]
    try:
        UUID(identifier)
        is_uuid = True
    except ValueError:
        is_uuid = False
    # Look up metadata for codes too: a course code alone doesn't identify its study level.
    fields = f"{field},source_url" + (",study_level" if kind == "courses" else "")
    try:
        row = supabase.from_(table).select(fields).eq(
            "id" if is_uuid else field, identifier if is_uuid else identifier.upper()
        ).limit(1).execute().data
    except Exception:
        if is_uuid:
            raise
        logger.warning("Handbook metadata unavailable for %s/%s", kind, identifier)
        row = []
    row = row[0] if row else {}
    code = str(row.get(field) or ("" if is_uuid else identifier)).upper()
    source = row.get("source_url") or ""
    if not level:
        level = "postgraduate" if "/postgraduate/" in source or row.get("study_level") == "Postgraduate" else "undergraduate"
    return code, level


@lru_cache(maxsize=2048)
def published_url(kind: str, code: str, level: str, cache_period: int) -> str:
    # Only a fixed official host and validated path components are ever requested.
    deadline = time.monotonic() + 12
    with httpx.Client(timeout=4, follow_redirects=False) as client:
        for year in range(PREFERRED_YEAR, EARLIEST_YEAR - 1, -1):
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError("Handbook lookup exceeded its time budget")
            url = f"{HANDBOOK}/{level}/{kind}/{year}/{code}"
            response = client.get(url, timeout=min(4, remaining))
            if response.status_code in (404, 410):
                continue
            response.raise_for_status()
            match = NEXT_DATA.search(response.text)
            if not match:
                raise ValueError("Handbook returned an unrecognised page")
            props = json.loads(match.group(1))["props"]["pageProps"]
            content = props.get("pageContent") or {}
            if not content:
                continue
            published = content.get("published_in_handbook") or {}
            if (str(content.get("code", "")).upper() == code
                    and str(content.get("implementation_year")) == str(year)
                    # Specialisation pages omit this flag. Explicitly hidden entries don't count.
                    and str(published.get("value", "1")) != "0"):
                return url
    return HANDBOOK


def resolve_handbook_url(kind: str, identifier: str, level: str | None = None) -> str:
    code, level = entry_identity(kind, identifier, level)
    if not re.fullmatch(r"[A-Z0-9]{4,16}", code):
        return HANDBOOK
    # Recheck publication every six hours; errors aren't cached by lru_cache.
    return published_url(kind, code, level, int(time.time() // 21600))
