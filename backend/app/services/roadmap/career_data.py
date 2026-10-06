import logging
from typing import Dict, List

from app.core.database import supabase

logger = logging.getLogger(__name__)


def choose_study_areas(program_areas: List[str], major_areas: List[str]) -> List[str]:
    if len(program_areas) > 1:
        return list(dict.fromkeys(major_areas + program_areas))
    return list(dict.fromkeys(major_areas or program_areas))


def fetch_study_areas(degree_code: str, major_codes: List[str]) -> List[str]:
    try:
        program_rows = (
            supabase.from_("program_study_areas").select("study_area").eq("degree_code", degree_code).execute().data or []
        ) if degree_code else []
        major_rows = (
            supabase.from_("specialisation_study_areas").select("study_area").in_("major_code", major_codes).execute().data or []
        ) if major_codes else []
    except Exception as e:
        logger.error(f"fetch_study_areas failed for {degree_code}: {e}")
        return []
    return choose_study_areas([r["study_area"] for r in program_rows], [r["study_area"] for r in major_rows])


def fetch_career_occupations(degree_code: str, major_codes: List[str]) -> List[Dict[str, str]]:
    areas = fetch_study_areas(degree_code, major_codes)
    if not areas:
        logger.warning(f"No study area for {degree_code}, careers run without the occupation check")
        return []
    try:
        links = supabase.from_("study_area_occupations").select("anzsco_code").in_("study_area", areas).execute().data or []
        codes = sorted({row["anzsco_code"] for row in links})
        if not codes:
            return []
        rows = supabase.from_("career_occupations").select("anzsco_code, title").in_("anzsco_code", codes).execute().data or []
    except Exception as e:
        logger.error(f"fetch_career_occupations failed for {degree_code}: {e}")
        return []
    return sorted(({"code": r["anzsco_code"], "title": r["title"]} for r in rows), key=lambda r: r["code"])
