import hashlib
import json
import logging
import re
from datetime import datetime, timezone

from app.core.database import supabase
from app.llm.openai_client import ask_gpt_structured
from app.models.course_picks import CoursePicks
from app.services.requirements import to_uoc
from app.services.roadmap.cache import PROMPT_VERSION as ROADMAP_PROMPT_VERSION
from app.services.roadmap.industry import replace_unlisted_codes
from app.services.roadmap.unsw_queries import COURSE_CODE, component_degree_codes, fetch_program_course_list, parse_sections_json

logger = logging.getLogger(__name__)

PROMPT_VERSION = 4
CODE_IN_TEXT = re.compile(r"\b[A-Z]{4}\d{4}\b|\bCLO\d+\b")
MAX_PICKS = 5
MAX_CANDIDATES = 60
MAX_OUTCOMES = 6
MAX_UNLOCKS = 4
MAX_CAREERS = 5
LEVEL_PREFIX = re.compile(r"^(graduate|junior|entry[- ]level)\s+", re.I)


def prereq_groups(edges: list) -> dict:
    by_course: dict = {}
    for e in edges or []:
        if e.get("edge_type") != "prereq":
            continue
        groups = by_course.setdefault(e["to_key"], {})
        key = e.get("group_id") or e["from_key"]
        group = groups.setdefault(key, {"logic": "and" if e.get("logic_type") == "and" else "or", "codes": []})
        if e["from_key"] not in group["codes"]:
            group["codes"].append(e["from_key"])
    return {code: list(groups.values()) for code, groups in by_course.items()}


def is_available(code: str, completed: set, groups: dict) -> bool:
    if code in completed:
        return False
    for g in groups.get(code, []):
        met = all(c in completed for c in g["codes"]) if g["logic"] == "and" else any(c in completed for c in g["codes"])
        if not met:
            return False
    return True


def not_needed_codes(section_lists: list, completed: set) -> set:
    groups: dict = {}
    for key, sections in section_lists:
        for section in sections:
            for course in (section.get("courses") or []) if isinstance(section, dict) else []:
                if isinstance(course, dict) and course.get("choice") and course.get("code"):
                    groups.setdefault(f"{key}:{course['choice']}", []).append(course["code"])
    skip = set()
    for codes in groups.values():
        if any(code in completed for code in codes):
            skip.update(code for code in codes if code not in completed)
    return skip


def _level(code: str) -> int:
    return int(code[4]) if len(code) > 4 and code[4].isdigit() else 9


def available_courses(courses: list, completed: set, groups: dict, preferred: set) -> list:
    open_courses = [c for c in courses if is_available(c["code"], completed, groups)]
    open_courses.sort(key=lambda c: (c["code"] not in preferred, _level(c["code"]), c["code"]))
    return open_courses


def _is_core_section(section: dict) -> bool:
    kind = section.get("kind")
    if kind:
        return kind == "core"
    title = (section.get("title") or "").lower()
    return "core" in title or "compulsory" in title


def core_codes(section_lists: list) -> set:
    codes = set()
    for _, sections in section_lists:
        for section in sections:
            if not isinstance(section, dict) or not _is_core_section(section):
                continue
            for course in section.get("courses") or []:
                if isinstance(course, dict) and course.get("code") and not course.get("choice"):
                    codes.add(course["code"].strip().upper())
    return codes


def unlocked_by(edges: list, names: dict, completed: set) -> dict:
    unlocks: dict = {}
    for e in edges or []:
        to = e.get("to_key")
        if e.get("edge_type") != "prereq" or to not in names or to in completed:
            continue
        found = unlocks.setdefault(e["from_key"], [])
        if all(u["code"] != to for u in found):
            found.append({"code": to, "name": names[to]})
    return {code: found[:MAX_UNLOCKS] for code, found in unlocks.items()}


def course_outcomes(codes: list) -> dict:
    if not codes:
        return {}
    rows = supabase.from_("unsw_courses").select("code, learning_outcomes").in_("code", codes).execute().data or []
    return {
        r["code"]: [o["description"] for o in r["learning_outcomes"][:MAX_OUTCOMES] if isinstance(o, dict) and o.get("description")]
        for r in rows
        if isinstance(r.get("learning_outcomes"), list)
    }


def _specialisations(user_id: str, degree_code: str, program_name: str) -> tuple[list, list, list, list]:
    rows = (
        supabase.from_("user_specialisation_selections")
        .select("major_id, minor_id, honours_id")
        .eq("user_id", user_id)
        .in_("degree_code", component_degree_codes(degree_code, program_name))
        .execute()
        .data
        or []
    )
    ids = [r[k] for r in rows for k in ("major_id", "minor_id", "honours_id") if r.get(k)]
    if not ids:
        return [], [], [], []
    specs = supabase.from_("unsw_specialisations").select("id, major_name, sections").in_("id", ids).execute().data or []
    codes = []
    for spec in specs:
        for section in parse_sections_json(spec.get("sections")):
            for course in (section.get("courses") or []) if isinstance(section, dict) else []:
                code = (course.get("code") or "").strip().upper() if isinstance(course, dict) else ""
                if COURSE_CODE.match(code) and code not in codes:
                    codes.append(code)
    section_lists = [(spec.get("major_name") or spec.get("id"), parse_sections_json(spec.get("sections"))) for spec in specs]
    return [s.get("major_name") for s in specs if s.get("major_name")], codes, section_lists, sorted(set(ids))


def career_roles(payload: dict | None) -> list:
    pathways = (payload or {}).get("career_pathways") or {}
    roles = []
    for level in ("mid_career", "entry_level"):
        for role in (pathways.get(level) or {}).get("roles") or []:
            title = LEVEL_PREFIX.sub("", (role.get("title") or "").strip()) if isinstance(role, dict) else ""
            if title and title.lower() not in {r.lower() for r in roles}:
                roles.append(title)
    return roles


def _roadmap_careers(user_id: str, degree_code: str, spec_ids: list) -> list:
    rows = (
        supabase.from_("unsw_roadmap")
        .select("payload")
        .eq("user_id", user_id)
        .eq("degree_code", degree_code)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
        .data
        or []
    )
    for row in rows:
        payload = row.get("payload") or {}
        if (payload.get("cache_key") or {}).get("prompt_version") == ROADMAP_PROMPT_VERSION and sorted(payload.get("specialisation_ids") or []) == spec_ids:
            return career_roles(payload)
    return []


def _missing_uoc(course) -> bool:
    return isinstance(course, dict) and bool(course.get("code")) and course.get("uoc") in (None, "")


def fill_course_uoc(section_lists: list) -> list:
    codes = {c["code"] for _, sections in section_lists for s in sections if isinstance(s, dict) for c in s.get("courses") or [] if _missing_uoc(c)}
    if not codes:
        return section_lists
    rows = supabase.from_("unsw_courses").select("code, uoc").in_("code", sorted(codes)).execute().data or []
    uocs = {r["code"]: r["uoc"] for r in rows}

    def fill(section):
        if not isinstance(section, dict):
            return section
        courses = [{**c, "uoc": uocs[c["code"]]} if _missing_uoc(c) and c["code"] in uocs else c for c in section.get("courses") or []]
        return {**section, "courses": courses}

    return [(label, [fill(s) for s in sections]) for label, sections in section_lists]


def load_inputs(user_id: str) -> dict | None:
    enrolled = (
        supabase.from_("user_enrolled_program")
        .select("degree_code, program_name")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
        .data
    )
    if not enrolled:
        return None
    degree_code = enrolled[0]["degree_code"]
    program_name = enrolled[0].get("program_name") or degree_code

    spec_names, spec_codes, spec_sections, spec_ids = _specialisations(user_id, degree_code, program_name)
    completed_rows = [
        r
        for r in supabase.from_("user_completed_courses").select("course_code, uoc, is_completed").eq("user_id", user_id).execute().data or []
        if r.get("is_completed")
    ]
    completed = {r["course_code"] for r in completed_rows}
    added_rows = [
        r
        for r in supabase.from_("user_custom_courses").select("course_code, uoc, section_name").eq("user_id", user_id).execute().data or []
        if r.get("course_code")
    ]
    added = {r["course_code"] for r in added_rows}
    program = supabase.from_("unsw_degrees_final").select("sections, minimum_uoc").eq("degree_code", degree_code).limit(1).execute().data
    program_sections = parse_sections_json(program[0].get("sections")) if program else []
    skip = not_needed_codes([(degree_code, program_sections), *spec_sections], completed)
    courses = [c for c in fetch_program_course_list(degree_code, spec_codes) if c["code"] not in skip]
    edges = []
    codes = [c["code"] for c in courses]
    if codes:
        edges = (
            supabase.from_("mindmesh_edges_global")
            .select("from_key, to_key, edge_type, logic_type, group_id")
            .eq("edge_type", "prereq")
            .in_("to_key", codes)
            .execute()
            .data
            or []
        )
    available = available_courses(courses, completed, prereq_groups(edges), set(spec_codes))
    candidates = available[:MAX_CANDIDATES]
    names = {c["code"]: c["name"] for c in courses}
    unlock_edges = []
    if candidates:
        unlock_edges = (
            supabase.from_("mindmesh_edges_global")
            .select("from_key, to_key, edge_type")
            .eq("edge_type", "prereq")
            .in_("from_key", [c["code"] for c in candidates])
            .execute()
            .data
            or []
        )
    core = core_codes([(None, program_sections), *spec_sections])
    survey = supabase.from_("student_uni_data").select("interest_areas").eq("user_id", user_id).limit(1).execute().data or []
    saved = (
        supabase.from_("user_saved_items")
        .select("item_name")
        .eq("user_id", user_id)
        .eq("item_type", "career_path")
        .execute()
        .data
        or []
    )
    interests = (survey[0].get("interest_areas") if survey else None) or []
    saved_careers = [s["item_name"] for s in saved if s.get("item_name")]
    careers = list(saved_careers)
    careers += [name for name in _roadmap_careers(user_id, degree_code, spec_ids) if name.lower() not in {c.lower() for c in careers}]
    careers = careers[:MAX_CAREERS]

    return {
        "degree_code": degree_code,
        "program_name": program_name,
        "specialisations": spec_names,
        "interests": [interests] if isinstance(interests, str) else list(interests),
        "careers": careers,
        "saved_careers": saved_careers,
        "completed": sorted(completed),
        "candidates": candidates,
        "available": [{"code": c["code"], "name": c["name"], "core": c["code"] in core} for c in available],
        "outcomes": course_outcomes([c["code"] for c in candidates]),
        "unlocks": unlocked_by(unlock_edges, names, completed),
        "core": sorted(core),
        "requirement_lists": fill_course_uoc([(None, program_sections), *spec_sections]),
        "minimum_uoc": program[0].get("minimum_uoc") if program else None,
        "completed_uoc": sum(to_uoc(r.get("uoc")) for r in completed_rows),
        "added": sorted(added),
        "placed": [{"code": r["course_code"], "section": r.get("section_name"), "uoc": r.get("uoc")} for r in added_rows],
        "completed_uoc_by_code": {r["course_code"]: to_uoc(r.get("uoc")) for r in completed_rows},
    }


def input_hash(inputs: dict) -> str:
    key = {k: inputs[k] for k in ("degree_code", "specialisations", "interests", "careers", "completed")}
    key["candidates"] = [c["code"] for c in inputs["candidates"]]
    key["version"] = PROMPT_VERSION
    return hashlib.sha256(json.dumps(key, sort_keys=True).encode()).hexdigest()


def read_cache(user_id: str) -> dict | None:
    try:
        rows = supabase.from_("user_course_picks").select("input_hash, picks").eq("user_id", user_id).limit(1).execute().data
        return rows[0] if rows else None
    except Exception as e:
        logger.warning(f"[course_picks] cache read failed: {e}")
        return None


def write_cache(user_id: str, hash_value: str, picks: list) -> None:
    try:
        supabase.from_("user_course_picks").upsert(
            {"user_id": user_id, "input_hash": hash_value, "picks": picks, "updated_at": datetime.now(timezone.utc).isoformat()}
        ).execute()
    except Exception as e:
        logger.warning(f"[course_picks] cache write failed: {e}")


def _listing(course: dict, outcomes: dict, core: set) -> str:
    line = f"- {course['code']}: {course['name']} ({course['section']}{', core: required for their degree' if course['code'] in core else ''})"
    learned = outcomes.get(course["code"])
    return line + "".join(f"\n    * {o}" for o in learned) if learned else line


def build_prompt(inputs: dict) -> str:
    outcomes = inputs.get("outcomes") or {}
    core = set(inputs.get("core") or [])
    listing = "\n".join(_listing(c, outcomes, core) for c in inputs["candidates"])
    return f"""Pick up to {MAX_PICKS} courses this UNSW student should consider taking next.

Student:
- Program: {inputs['program_name']}
- Chosen specialisations: {', '.join(inputs['specialisations']) or 'none chosen yet'}
- Interests: {', '.join(inputs['interests']) or 'not given'}
- Careers they are considering: {', '.join(inputs['careers']) or 'not given'}

Courses in their program they can take next (their prerequisites are done), with the course's published learning outcomes where known:
{listing}

Rules:
- Only pick course codes from the list above.
- Order the picks best first.
- Give each pick one plain sentence of at most 20 words saying why it suits this student, tied to their careers, interests or specialisation.
- Give each pick 2 or 3 skills it builds, each at most 4 plain words a first-year student would understand, such as "Training machine learning models". Base them only on that course's learning outcomes; if none are listed, use the course name. Never copy an outcome or name outcome codes.
- For careers, list only names from "Careers they are considering" that the course clearly helps, written exactly as given. Leave it empty if none fit.
- Set usefulness by career fit only: "high" if the course is central to one of their careers, "medium" if it helps, or "general" if it is not very relevant to their careers. Never judge whether a course is required; that is already marked.
- Courses marked core are required, so include the ones that are open and say plainly that they are required before saying how they help.
- Do not use em dashes, en dashes or double hyphens."""


async def get_course_picks(user_id: str, inputs: dict | None) -> dict:
    if not inputs:
        return {"program_code": None, "picks": [], "failed": False}
    result = {
        "program_code": inputs["degree_code"],
        "picks": [],
        "available": inputs.get("available") or [],
        "careers": inputs.get("careers") or [],
        "completed_count": len(inputs.get("completed") or []),
        "failed": False,
    }
    if not inputs["candidates"]:
        return result

    hash_value = input_hash(inputs)
    cached = read_cache(user_id)
    if cached and cached.get("input_hash") == hash_value:
        result["picks"] = cached.get("picks") or []
        return result

    try:
        generated = await ask_gpt_structured(build_prompt(inputs), CoursePicks, max_tokens=1500, model="gpt-5.4-mini")
    except Exception as e:
        logger.error(f"[course_picks] generation failed: {e}")
        result["failed"] = True
        return result

    names = {c["code"]: c["name"] for c in inputs["candidates"]}
    allowed = set(names) | set(inputs["completed"])
    careers = {c.lower(): c for c in inputs["careers"]}
    core = set(inputs.get("core") or [])
    unlocks = inputs.get("unlocks") or {}
    picks = []
    for pick in generated.picks:
        code = pick.code.strip().upper()
        if code in names and all(p["code"] != code for p in picks):
            picks.append({
                "code": code,
                "name": names[code],
                "reason": replace_unlisted_codes(pick.reason.strip(), allowed),
                "skills": [s.strip() for s in pick.skills if s.strip() and not CODE_IN_TEXT.search(s)],
                "careers": list(dict.fromkeys(careers[c.strip().lower()] for c in pick.careers if c.strip().lower() in careers)),
                "usefulness": pick.usefulness,
                "core": code in core,
                "unlocks": unlocks.get(code, []),
            })
    picks = picks[:MAX_PICKS]

    write_cache(user_id, hash_value, picks)
    result["picks"] = picks
    return result
