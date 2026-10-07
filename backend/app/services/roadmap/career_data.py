import logging
from typing import Any, Dict, List

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


AVIATION_PROGRAMS = ("3835", "3928", "3980", "3981")
PROGRAM_EXTRA_OCCUPATIONS = {code: ["2311"] for code in AVIATION_PROGRAMS}

OUTLOOK_COLUMNS = "study_area, full_time_employment_rate, median_salary, survey_year, source, source_url"
OCCUPATION_COLUMNS = "anzsco_code, title, median_weekly_earnings, shortage_nsw, data_period, source, source_url"


def occupation_for_role(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "code": row["anzsco_code"],
        "title": row["title"],
        "weekly_earnings": row.get("median_weekly_earnings"),
        "in_demand_nsw": row.get("shortage_nsw") == "S",
        "data_period": row.get("data_period"),
        "source": row.get("source"),
        "source_url": row.get("source_url"),
    }


def fetch_career_data(degree_code: str, major_codes: List[str]) -> Dict[str, list]:
    areas = fetch_study_areas(degree_code, major_codes)
    if not areas:
        logger.warning(f"No study area for {degree_code}, careers run without the occupation check")
        return {"occupations": [], "outlook": []}
    try:
        outlook = supabase.from_("career_study_area_outcomes").select(OUTLOOK_COLUMNS).in_("study_area", areas).execute().data or []
        links = supabase.from_("study_area_occupations").select("anzsco_code").in_("study_area", areas).execute().data or []
        codes = sorted({row["anzsco_code"] for row in links} | set(PROGRAM_EXTRA_OCCUPATIONS.get(degree_code, [])))
        rows = supabase.from_("career_occupations").select(OCCUPATION_COLUMNS).in_("anzsco_code", codes).execute().data or [] if codes else []
    except Exception as e:
        logger.error(f"fetch_career_data failed for {degree_code}: {e}")
        return {"occupations": [], "outlook": []}
    return {
        "occupations": sorted((occupation_for_role(r) for r in rows), key=lambda r: r["code"]),
        "outlook": sorted(outlook, key=lambda r: areas.index(r["study_area"])),
    }
