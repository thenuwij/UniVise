from typing import Any, Dict, List
from app.utils.database import supabase
from app.utils.openai_client import ask_openai
from .roadmap_common import (
    TERMS, COURSES_TABLE, _uoc_to_int, _parse_offerings, _year_term_grid,
    _place_verified_course, _count_year_courses, _first_or_none,
    parse_json_or_500, assert_keys
)
import re, json

# ---------- Shared fetchers ----------
async def _fetch_courses_for_faculty_raw(faculty: str | None, limit: int = 2000) -> List[Dict[str, Any]]:
    """Fetch raw course rows for a faculty (or all faculties)."""
    q = supabase.from_(COURSES_TABLE).select(
        "code,title,uoc,offering_terms,school,faculty,overview,conditions_for_enrolment"
    )
    if faculty:
        q = q.eq("faculty", faculty)
    res = q.limit(limit).execute()
    return res.data or []

async def _fetch_courses_for_schools(schools: List[str], limit: int = 2000) -> List[Dict[str, Any]]:
    """Fetch raw course rows filtered by one or more schools."""
    if not schools:
        return []
    schools_clean = list({(s or "").strip() for s in schools if (s or "").strip()})
    if not schools_clean:
        return []
    q = (supabase.from_(COURSES_TABLE)
         .select("code,title,uoc,offering_terms,school,faculty,overview,conditions_for_enrolment")
         .in_("school", schools_clean))
    res = q.limit(limit).execute()
    return res.data or []

# ---------- Course indexers ----------
async def _index_courses_by_code(codes: List[str]) -> Dict[str, Dict[str, Any]]:
    if not codes:
        return {}
    codes = list(set([c.strip().upper() for c in codes if c]))
    if not codes:
        return {}
    res = (
        supabase.from_(COURSES_TABLE)
        .select("code,title,uoc,offering_terms,school,faculty,overview,conditions_for_enrolment")
        .in_("code", codes).execute()
    )
    idx: Dict[str, Dict[str, Any]] = {}
    if res and getattr(res, "data", None):
        for r in res.data:
            c = r.get("code")
            if not c:
                continue
            offers = _parse_offerings(r.get("offering_terms")) or list(TERMS)
            idx[c] = {
                "code": c,
                "title": r.get("title"),
                "uoc": _uoc_to_int(r.get("uoc")) or 6,
                "offerings": offers,
                "school": r.get("school"),
                "faculty": r.get("faculty"),
                "overview": r.get("overview"),
                "prereqs_text": r.get("conditions_for_enrolment"),
            }
    return idx

async def _index_all_courses_for_faculty(faculty: str | None) -> Dict[str, Dict[str, Any]]:
    rows = await _fetch_courses_for_faculty_raw(faculty, limit=2000)
    idx: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        c = r.get("code")
        if not c:
            continue
        offers = _parse_offerings(r.get("offering_terms")) or list(TERMS)
        idx[c] = {
            "code": c,
            "title": r.get("title"),
            "uoc": _uoc_to_int(r.get("uoc")) or 6,
            "offerings": offers,
            "school": r.get("school"),
            "faculty": r.get("faculty"),
            "overview": r.get("overview"),
            "prereqs_text": r.get("conditions_for_enrolment"),
        }
    return idx

# ---------- Context gathering ----------
async def gather_unsw_context(user_id: str, req) -> Dict[str, Any]:
    print("GATHER CALLED", req)
    # 1) Degree lookup
    degree = None
    if req.degree_id:
        degree = _first_or_none(
            supabase.from_("unsw_degrees").select("*").eq("id", req.degree_id).limit(1).execute()
        )
    if degree is None and req.uac_code:
        degree = _first_or_none(
            supabase.from_("unsw_degrees").select("*").eq("uac_code", req.uac_code).limit(1).execute()
        )
    if degree is None and req.program_name:
        degree = _first_or_none(
            supabase.from_("unsw_degrees").select("*").ilike("program_name", f"%{req.program_name}%").limit(1).execute()
        )

    if degree is None:
        degree = {  # minimal stub
            "id": req.degree_id,
            "program_name": req.program_name,
            "uac_code": req.uac_code,
            "faculty": None,
            "duration_years": None,
            "lowest_selection_rank": None,
            "lowest_atar": None,
            "portfolio_available": None,
            "description": None,
            "career_outcomes": None,
            "assumed_knowledge": None,
            "handbook_url": None,
            "school": None,
            "other_school": None,
        }

    degree_id = degree.get("id")
    faculty = degree.get("faculty")

    majors: List[str] = []
    minors: List[str] = []
    doubles: List[str] = []
    if degree_id:
        res_maj = supabase.from_("degree_majors").select("major_name").eq("degree_id", degree_id).execute()
        if res_maj and getattr(res_maj, "data", None):
            majors = [r["major_name"] for r in res_maj.data if r.get("major_name")]

        try:
            res_min = supabase.from_("degree_minors").select("minor_name").eq("degree_id", degree_id).execute()
            if res_min and getattr(res_min, "data", None):
                minors = [r["minor_name"] for r in res_min.data if r.get("minor_name")]
        except Exception:
            minors = []

        try:
            res_dbl = supabase.from_("degree_double_degrees").select("program_name").eq("degree_id", degree_id).execute()
            if res_dbl and getattr(res_dbl, "data", None):
                doubles = [r["program_name"] for r in res_dbl.data if r.get("program_name")]
        except Exception:
            doubles = []

    # 2) bounded course catalogue (prefer school(s) → then faculty → then global)
    catalogue: List[Dict[str, Any]] = []
    school = (degree.get("school") or "").strip() if isinstance(degree, dict) else None
    other_school = (degree.get("other_school") or "").strip() if isinstance(degree, dict) else None
    schools_filter = [s for s in [school, other_school] if s]

    try:
        if schools_filter:
            raw = await _fetch_courses_for_schools(schools_filter, limit=600)
        elif faculty:
            raw = await _fetch_courses_for_faculty_raw(faculty, limit=600)
        else:
            raw = await _fetch_courses_for_faculty_raw(None, limit=600)

        def tag_level(row: Dict[str, Any]) -> str:
            t = (row.get("title") or "").lower()
            o = (row.get("overview") or "").lower()
            text = f"{t} {o}"
            if any(k in text for k in ["capstone", "thesis", "project"]) or re.search(r"\b(400|level\s*4)\b", text):
                return "advanced"
            if any(k in text for k in ["fundamentals", "introduction", "intro"]) or re.search(r"\b(100|level\s*1|1a|1b)\b", text):
                return "foundation"
            return "intermediate"

        buckets = {"foundation": [], "intermediate": [], "advanced": []}
        for row in raw:
            buckets[tag_level(row)].append(row)

        def normalize_row(r: Dict[str, Any]) -> Dict[str, Any]:
            return {
                "code": r.get("code"),
                "title": r.get("title"),
                "uoc": _uoc_to_int(r.get("uoc")) or 6,
                "offering_terms": r.get("offering_terms"),
                "school": r.get("school"),
                "faculty": r.get("faculty"),
            }

        for key in ["foundation", "intermediate", "advanced"]:
            catalogue.extend([normalize_row(r) for r in buckets[key][:25]])
    except Exception:
        catalogue = []

    return {
        "user_id": user_id,
        "degree_id": degree_id,
        "uac_code": degree.get("uac_code"),
        "program_name": degree.get("program_name") or req.program_name,
        "specialisation": req.specialisation,
        "faculty": faculty,
        "school": school or None,
        "other_school": other_school or None,
        "duration_years": degree.get("duration_years"),
        "lowest_selection_rank": degree.get("lowest_selection_rank"),
        "lowest_atar": degree.get("lowest_atar"),
        "portfolio_available": degree.get("portfolio_available"),
        "description": degree.get("description"),
        "career_outcomes": degree.get("career_outcomes"),
        "assumed_knowledge": degree.get("assumed_knowledge"),
        "handbook_url": degree.get("handbook_url"),
        "majors": majors,
        "minors": minors,
        "double_degrees": doubles,
        "course_catalogue": catalogue,
    }

# ---------- AI synthesis ----------
async def ai_generate_unsw_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    program_name = context.get("program_name")
    uac_code = context.get("uac_code")
    faculty = context.get("faculty")
    duration_years = context.get("duration_years") or 3
    lowest_sel_rank = context.get("lowest_selection_rank")
    lowest_atar = context.get("lowest_atar")
    majors = context.get("majors") or []

    school = (context.get("school") or "").strip() or None
    other_school = (context.get("other_school") or "").strip() or None
    schools_filter = [s for s in [school, other_school] if s]

    prompt = f"""
You are a UNSW academic advisor. Using ONLY official sources like the UNSW Handbook,
faculty progression plans, and course outlines, propose a term-by-term plan for {program_name} ({uac_code}).
UNSW runs three terms per year (T1/T2/T3). Prefer compulsory/core courses and realistic terming.

Return STRICT JSON only:

{{
  "summary": "2–3 sentences…",
  "entry_requirements": {{
    "atar": {json.dumps(lowest_atar) if lowest_atar is not None else "null"},
    "selectionRank": {json.dumps(lowest_sel_rank) if lowest_sel_rank is not None else "null"},
    "subjects": ["List assumed/recommended prep subjects"],
    "notes": "Adjustment factors, portfolio (if any), and practical tips."
  }},
  "program_structure_raw": [
    {{
      "year": 1,
      "terms": [
        {{"term":"T1","courses":[{{"code":"COMP1511","title":"Programming Fundamentals"}}]}},
        {{"term":"T2","courses":[{{}}]}},
        {{"term":"T3","courses":[{{}}]}}
      ]
    }}
    // Repeat up to year {duration_years}
  ],
  "capstone": {{"courses": [], "highlights": ""}},
  "honours": {{"classes": [], "requirements": "", "wamRestrictions": ""}},
  "flexibility": {{"options": []}},
  "industry": {{"trainingInfo": "", "societies": [], "rolesHint": ""}},
  "source": "Primary Handbook/progression-plan URL you used"
}}
"""
    raw = ask_openai(prompt)
    draft = parse_json_or_500(raw)
    assert_keys(
        draft,
        ["summary", "entry_requirements", "program_structure_raw", "capstone", "honours", "flexibility", "industry", "source"],
        "unsw",
    )

    # ---- VERIFY & RESHAPE (DB-trusted) ----
    # Collect proposed codes from the model
    proposed_codes: List[str] = []
    for yr in (draft.get("program_structure_raw") or []):
        for term in (yr.get("terms") or []):
            for c in (term.get("courses") or []):
                if isinstance(c, dict) and c.get("code"):
                    proposed_codes.append(c["code"].strip().upper())
                elif isinstance(c, str):
                    m = re.match(r"[A-Z]{4}\d{4}", c.strip().upper())
                    if m:
                        proposed_codes.append(m.group(0))

    proposed_idx = await _index_courses_by_code(proposed_codes)

    # Build the allowed course pool: schools → faculty → global
    if schools_filter:
        pool_rows = await _fetch_courses_for_schools(schools_filter, limit=1200)
    elif faculty:
        pool_rows = await _fetch_courses_for_faculty_raw(faculty, limit=1200)
    else:
        pool_rows = await _fetch_courses_for_faculty_raw(None, limit=1200)

    # Index the pool
    pool_idx: Dict[str, Dict[str, Any]] = {}
    for r in (pool_rows or []):
        code = (r.get("code") or "").strip().upper()
        if not code:
            continue
        offers = _parse_offerings(r.get("offering_terms")) or list(TERMS)
        pool_idx[code] = {
            "code": code,
            "title": r.get("title"),
            "uoc": _uoc_to_int(r.get("uoc")) or 6,
            "offerings": offers,
            "school": r.get("school"),
            "faculty": r.get("faculty"),
            "overview": r.get("overview"),
            "prereqs_text": r.get("conditions_for_enrolment"),
        }

    grid = _year_term_grid(duration_years)

    # Pass 1: place proposed courses that exist in DB and are in the allowed pool (if pool present)
    for yr in (draft.get("program_structure_raw") or []):
        y = int(yr.get("year") or 0)
        if y < 1 or y > len(grid):
            continue
        yidx = y - 1
        for term in (yr.get("terms") or []):
            tname = str(term.get("term") or "").upper()
            if tname not in TERMS:
                continue
            for c in (term.get("courses") or []):
                code = (c.get("code") if isinstance(c, dict) else None) or ""
                code = code.strip().upper()
                if not code or code not in proposed_idx:
                    continue
                # must be in pool if pool is non-empty
                if pool_idx and code not in pool_idx:
                    continue
                row = proposed_idx[code] if code in proposed_idx else pool_idx.get(code)
                if not row:
                    continue
                course_obj = {
                    "code": row["code"],
                    "title": row["title"],
                    "uoc": row["uoc"],
                    "offerings": row["offerings"],
                    "verified": True,
                    "type": "Core/Elective",
                }
                if tname in row["offerings"]:
                    _place_verified_course(grid, yidx, tname, course_obj)
                else:
                    for alt in row["offerings"]:
                        if _place_verified_course(grid, yidx, alt, course_obj):
                            break

    # Optional: enforce a known capstone for CSE programs
    is_cse = (school or "").lower() == "school of computer science and engineering".lower() \
             or (other_school or "").lower() == "school of computer science and engineering".lower()
    if is_cse:
        # If capstone not provided or wrong, force COMP3900 into the last available term it runs
        comp3900 = pool_idx.get("COMP3900")
        if comp3900:
            last_yidx = len(grid) - 1
            placed = any(c["code"] == "COMP3900" for t in grid[last_yidx]["terms"] for c in t["courses"])
            if not placed:
                cap_obj = {
                    "code": comp3900["code"],
                    "title": comp3900["title"],
                    "uoc": comp3900["uoc"],
                    "offerings": comp3900["offerings"],
                    "verified": True,
                    "type": "Core/Elective",
                }
                # try to place in an offered term in final year
                placed_cap = False
                for term_name in comp3900["offerings"]:
                    if term_name in TERMS:
                        placed_cap = _place_verified_course(grid, last_yidx, term_name, cap_obj) or placed_cap
                        if placed_cap:
                            break
                # if still not placed, try any final-year term
                if not placed_cap:
                    for t in TERMS:
                        if _place_verified_course(grid, last_yidx, t, cap_obj):
                            break

        # also nudge the outgoing capstone field if model left it empty
        cap = draft.get("capstone") or {}
        cap_courses = cap.get("courses") or []
        if not any((isinstance(x, dict) and (x.get("code") or "").upper() == "COMP3900") or (isinstance(x, str) and x.upper().startswith("COMP3900")) for x in cap_courses):
            cap.setdefault("courses", []).append({"code": "COMP3900", "title": comp3900["title"] if comp3900 else "Computer Science Project"})
            cap["highlights"] = cap.get("highlights") or "Team-based real-world software project (CSE capstone)."
            draft["capstone"] = cap

    # Pass 2: fill to min 2 per term, then up to 3 per term (~9/year) from the allowed pool
    for yidx in range(len(grid)):
        used = {c["code"] for t in grid[yidx]["terms"] for c in t["courses"]}
        # ensure min 2 per term
        for t in grid[yidx]["terms"]:
            while len(t["courses"]) < 2:
                pick = next(
                    (row for code, row in pool_idx.items() if code not in used and t["term"] in row["offerings"]),
                    None,
                )
                if not pick:
                    break
                t["courses"].append(
                    {
                        "code": pick["code"],
                        "title": pick["title"],
                        "uoc": pick["uoc"],
                        "offerings": pick["offerings"],
                        "verified": True,
                        "type": "Elective",
                    }
                )
                used.add(pick["code"])
        # then top-up with year cap
        for t in grid[yidx]["terms"]:
            while len(t["courses"]) < 3 and _count_year_courses(grid, yidx) < 9:
                pick = next(
                    (row for code, row in pool_idx.items() if code not in used and t["term"] in row["offerings"]),
                    None,
                )
                if not pick:
                    break
                t["courses"].append(
                    {
                        "code": pick["code"],
                        "title": pick["title"],
                        "uoc": pick["uoc"],
                        "offerings": pick["offerings"],
                        "verified": True,
                        "type": "Elective",
                    }
                )
                used.add(pick["code"])

    payload = {
        "summary": draft.get("summary"),
        "entry_requirements": draft.get("entry_requirements"),
        "program_structure": {"years": grid, "suggested_specialisations": majors[:6]},
        "capstone": draft.get("capstone"),
        "honours": draft.get("honours"),
        "flexibility": draft.get("flexibility"),
        "industry": draft.get("industry"),
        "source": draft.get("source"),
        "program_name": program_name,
        "uac_code": uac_code,
    }
    assert_keys(
        payload,
        ["summary", "entry_requirements", "program_structure", "capstone", "honours", "flexibility", "industry", "source"],
        "unsw",
    )
    return payload 