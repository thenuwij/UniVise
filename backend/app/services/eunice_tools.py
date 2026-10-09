import json
import logging
import re

from app.core.database import supabase
from app.services.course_picks import prereq_groups
from app.services.roadmap.unsw_queries import COURSE_CODE, parse_sections_json

logger = logging.getLogger(__name__)

HANDBOOK = "https://www.handbook.unsw.edu.au"
YEAR = 2026
MAX_RESULTS = 10
MAX_MATCHES = 3
MAX_SECTION_CODES = 25
OVERVIEW_CHARS = 700

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_course",
            "description": "Look up one UNSW course in the 2026 Handbook: title, UOC, terms offered, enrolment rules (prerequisites), overview and Handbook link.",
            "parameters": {
                "type": "object",
                "properties": {"code": {"type": "string", "description": "Course code, for example COMP3231"}},
                "required": ["code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_courses",
            "description": "Find UNSW courses by topic, name or code prefix, for example 'machine learning' or 'COMP3'. Returns up to 10 matches.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_prerequisites",
            "description": "Check whether this student has met a course's prerequisites, using the courses they ticked as completed.",
            "parameters": {
                "type": "object",
                "properties": {"code": {"type": "string", "description": "Course code"}},
                "required": ["code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_program",
            "description": "Look up a UNSW degree program's structure in the 2026 Handbook by program code (for example 3778) or name.",
            "parameters": {
                "type": "object",
                "properties": {"program": {"type": "string"}},
                "required": ["program"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_specialisation",
            "description": "Look up a UNSW major, minor or honours specialisation's structure in the 2026 Handbook by name or code.",
            "parameters": {
                "type": "object",
                "properties": {"name": {"type": "string"}},
                "required": ["name"],
            },
        },
    },
]


def _search_term(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^A-Za-z0-9 &+\-]", " ", text or "")).strip()[:60]


def _match_words(query, column: str, term: str):
    for word in term.split():
        if len(word) > 1:
            query = query.ilike(column, f"%{word}%")
    return query


def _course_code(text: str) -> str:
    code = re.sub(r"\s+", "", text or "").upper()
    return code if COURSE_CODE.match(code) else ""


def course_url(code: str, study_level: str | None) -> str:
    level = "postgraduate" if study_level == "Postgraduate" else "undergraduate"
    return f"{HANDBOOK}/{level}/courses/{YEAR}/{code}"


def summarise_sections(sections) -> list:
    out = []
    for section in parse_sections_json(sections):
        if not isinstance(section, dict) or not section.get("title") or "overview" in section["title"].lower():
            continue
        codes = [c.get("code") for c in section.get("courses") or [] if isinstance(c, dict) and c.get("code")]
        out.append({
            "title": section["title"],
            "kind": section.get("kind"),
            "uoc": section.get("uoc"),
            "courses": codes[:MAX_SECTION_CODES],
            "more_courses": max(len(codes) - MAX_SECTION_CODES, 0),
        })
    return out


def get_course(code: str) -> dict:
    code = _course_code(code)
    if not code:
        return {"found": False, "note": "That is not a UNSW course code (four letters and four digits)."}
    rows = (
        supabase.from_("unsw_courses")
        .select("code, title, uoc, offering_terms, conditions_for_enrolment, overview, study_level, faculty, school")
        .eq("code", code)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        return {"found": False, "code": code, "note": "Not in the 2026 UNSW Handbook data."}
    c = rows[0]
    overview = c.get("overview") or ""
    return {
        "found": True,
        "code": c["code"],
        "title": c.get("title"),
        "uoc": c.get("uoc"),
        "terms": c.get("offering_terms"),
        "enrolment_rules": c.get("conditions_for_enrolment") or "None listed",
        "faculty": c.get("faculty"),
        "school": c.get("school"),
        "overview": overview[:OVERVIEW_CHARS] + ("..." if len(overview) > OVERVIEW_CHARS else ""),
        "handbook_url": course_url(c["code"], c.get("study_level")),
    }


def search_courses(query: str) -> dict:
    term = _search_term(query)
    if len(term) < 2:
        return {"results": [], "note": "Search needs at least 2 letters."}
    fields = "code, title, uoc"
    by_name = (
        supabase.from_("unsw_courses").select(fields).or_(f"code.ilike.%{term}%,title.ilike.%{term}%").order("code").limit(MAX_RESULTS).execute().data
        or []
    )
    results = list(by_name)
    if len(results) < MAX_RESULTS:
        seen = {r["code"] for r in results}
        by_topic = (
            supabase.from_("unsw_courses").select(fields).ilike("overview", f"%{term}%").order("code").limit(MAX_RESULTS * 2).execute().data
            or []
        )
        results += [r for r in by_topic if r["code"] not in seen][: MAX_RESULTS - len(results)]
    return {"query": term, "results": results}


def check_prerequisites(code: str, completed: set) -> dict:
    course = get_course(code)
    if not course.get("found"):
        return course
    edges = (
        supabase.from_("mindmesh_edges_global")
        .select("from_key, to_key, edge_type, logic_type, group_id")
        .eq("edge_type", "prereq")
        .eq("to_key", course["code"])
        .execute()
        .data
        or []
    )
    groups = prereq_groups(edges).get(course["code"], [])
    checked = []
    for g in groups:
        done = [c for c in g["codes"] if c in completed]
        met = len(done) == len(g["codes"]) if g["logic"] == "and" else bool(done)
        checked.append({"needs": ("all of " if g["logic"] == "and" and len(g["codes"]) > 1 else "one of " if len(g["codes"]) > 1 else "") + ", ".join(g["codes"]), "met": met, "done": done})
    return {
        "code": course["code"],
        "title": course["title"],
        "already_completed": course["code"] in completed,
        "prerequisites_met": all(g["met"] for g in checked),
        "groups": checked,
        "enrolment_rules": course["enrolment_rules"],
        "note": "groups are checked against the courses the student ticked. enrolment_rules is the official Handbook rule: if it differs from groups (for example an extra alternative course, a UOC minimum or a program limit), follow enrolment_rules.",
        "handbook_url": course["handbook_url"],
    }


def get_program(program: str) -> dict:
    term = _search_term(program)
    if not term:
        return {"found": False}
    query = supabase.from_("unsw_degrees_final").select("degree_code, program_name, minimum_uoc, duration, faculty, sections, special_notes, source_url")
    rows = (query.eq("degree_code", term) if term.isdigit() else _match_words(query, "program_name", term)).limit(MAX_MATCHES).execute().data or []
    if not rows:
        return {"found": False, "note": f"No 2026 UNSW program matches '{term}'."}
    return {
        "found": True,
        "programs": [
            {
                "code": r["degree_code"],
                "name": r["program_name"],
                "minimum_uoc": r.get("minimum_uoc"),
                "duration": r.get("duration"),
                "faculty": r.get("faculty"),
                "structure": summarise_sections(r.get("sections")),
                "notes": (r.get("special_notes") or "")[:OVERVIEW_CHARS],
                "handbook_url": r.get("source_url"),
            }
            for r in rows
        ],
    }


def get_specialisation(name: str) -> dict:
    term = _search_term(name)
    if not term:
        return {"found": False}
    fields = "major_name, major_code, specialisation_type, uoc_required, faculty, sections, source_url"
    rows = []
    if " " not in term:
        rows = supabase.from_("unsw_specialisations").select(fields).ilike("major_code", term).limit(MAX_MATCHES).execute().data or []
    if not rows:
        rows = _match_words(supabase.from_("unsw_specialisations").select(fields), "major_name", term).limit(MAX_MATCHES).execute().data or []
    if not rows:
        return {"found": False, "note": f"No 2026 UNSW specialisation matches '{term}'."}
    return {
        "found": True,
        "specialisations": [
            {
                "name": r["major_name"],
                "code": r.get("major_code"),
                "type": r.get("specialisation_type"),
                "uoc_required": r.get("uoc_required"),
                "faculty": r.get("faculty"),
                "structure": summarise_sections(r.get("sections")),
                "handbook_url": r.get("source_url"),
            }
            for r in rows
        ],
    }


def completed_codes(user_id: str) -> set:
    rows = supabase.from_("user_completed_courses").select("course_code, is_completed").eq("user_id", user_id).execute().data or []
    return {r["course_code"] for r in rows if r.get("is_completed")}


def run_tool(name: str, arguments: str, user_id: str) -> str:
    try:
        args = json.loads(arguments or "{}")
        if name == "get_course":
            result = get_course(args.get("code", ""))
        elif name == "search_courses":
            result = search_courses(args.get("query", ""))
        elif name == "check_prerequisites":
            result = check_prerequisites(args.get("code", ""), completed_codes(user_id))
        elif name == "get_program":
            result = get_program(args.get("program", ""))
        elif name == "get_specialisation":
            result = get_specialisation(args.get("name", ""))
        else:
            result = {"error": f"Unknown tool {name}"}
    except Exception as e:
        logger.warning(f"[eunice] tool {name} failed: {type(e).__name__}")
        result = {"error": "The lookup failed. Tell the student you couldn't check this right now."}
    return json.dumps(result, default=str)
