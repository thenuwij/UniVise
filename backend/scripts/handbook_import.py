"""Import the UNSW Handbook into the program, specialisation and course tables.

Run from the backend folder:
    python -m scripts.handbook_import fetch [--limit N]
    python -m scripts.handbook_import plan

`fetch` reads the Handbook sitemap and saves the data of every undergraduate
program, specialisation and course page for the year into a local snapshot
folder, one page a second. It skips pages already saved, so it can resume.
`--limit N` saves only N pages of each kind, spread across the list, for a trial.

`plan` only reads. It compares the snapshot with the database and writes a
summary, one CSV of field changes per table and `links.csv`. Nothing is
written to the database.

    python -m scripts.handbook_import apply [--dry-run] [--only CODE,CODE] [--fields a,b]
    python -m scripts.handbook_import restore --backup ../ai/phase-10-backup/<time>

`apply` writes the reviewed CSVs: every row except "flag" (list it under
"accept" in `ai/phase-10-plan/decisions.json`, or change it to "accept", to write it), "kept", "handbook empty" and "missing". Delete a row to
skip it. It backs up the three tables and the CourseMesh nodes and links
first, stamps every row found in the Handbook, adds new programs hidden
(`is_offered = false`), rebuilds links only for the courses in `links.csv`,
and runs the display-data audit last. `restore` puts a backup back.
"""
import argparse
import csv
import html
import json
import re
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import httpx

from app.core.database import supabase
from scripts import display_data_audit
from scripts.display_data_cleanup import fetch_rows, is_placeholder, parse_years
from scripts.faculty_cleanup import OFFICIAL_FACULTIES
from scripts.faculty_cleanup import normalise as normalise_faculty
from scripts.requisites import requisite_edges

HANDBOOK = "https://www.handbook.unsw.edu.au"
SITEMAP = f"{HANDBOOK}/sitemap.xml"
REQUEST_GAP_SECONDS = 1.0
AI_DIR = Path(__file__).resolve().parents[2] / "ai"
KINDS = ("programs", "specialisations", "courses")
COURSE_CODE = re.compile(r"^[A-Z]{4}\d{4}$")
NEXT_DATA = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)
SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
CODE_IN_TEXT = re.compile(r"\b[A-Z]{4}\d{4}\b")
NOT_ALLOWED = re.compile(r"(?i)exclu|cannot|can not|may not|not permitted|not count")
SYDNEY = ("Sydney", "Paddington")
CRICOS = re.compile(r"^\d{6}[A-Z]$")
BOILERPLATE = re.compile(r"(?i)^(this handbook entry is for students commencing|please refer to (the )?previous editions)")
EXAMPLES = 3
EXAMPLE_CHARS = 160

TABLES = {
    "programs": ("unsw_degrees_final", "degree_code"),
    "specialisations": ("unsw_specialisations", "major_code"),
    "courses": ("unsw_courses", "code"),
}
FLAGGED = {
    "programs": {"faculty", "uac_code"},
    "specialisations": {"faculty"},
    "courses": {"faculty"},
}
TEXT_FIELDS = {
    "program_name", "major_name", "title", "overview_description", "program_structure",
    "special_notes", "overview", "conditions_for_enrolment",
}
SECTION_KINDS = {
    "CC": "core",
    "one_of_the_following": "choice",
    "PE": "elective",
    "RC": "elective",
    "GE": "general_education",
    "FE": "free_elective",
    "IR": "info",
    "LR": "limit",
    "undergrad_major": "specialisations",
    "undergrad_minor": "specialisations",
    "honours": "specialisations",
    "any_spec": "specialisations",
    "postgrad_spec": "specialisations",
}
KEEP_CURRENT = {"special_notes", "program_structure", "program_name"}
ABBREVIATION = re.compile(r"\s+-\s+\S+")
CSV_FIELDS = ["table", "key", "name", "field", "action", "current", "proposed"]


def snapshot_dir(level: str, year: str) -> Path:
    return AI_DIR / f"handbook-{year}" / level


def html_to_text(value) -> str | None:
    if not isinstance(value, str):
        return None
    text = re.sub(r"(?is)<ol[^>]*>(.*?)</ol>", lambda m: _numbered(m.group(1)), value)
    text = re.sub(r"(?is)<li[^>]*>", "\n• ", text)
    text = re.sub(r"(?i)<br\s*/?>|</p>|</li>|</div>|</h\d>", "\n", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text).replace("\u00a0", " ")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    text = "\n".join(" ".join(s for s in SENTENCE_SPLIT.split(line) if not BOILERPLATE.match(s)) for line in lines if line)
    text = "\n".join(line for line in text.split("\n") if line.strip())
    return None if not text or is_placeholder(text) else text


def _numbered(body: str) -> str:
    items = re.findall(r"(?is)<li[^>]*>(.*?)</li>", body)
    return "".join(f"\n{i}. {item}\n" for i, item in enumerate(items, 1))


def words(value) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", str(value or "").lower()))


def to_int(value) -> int | None:
    try:
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return None


def org_name(value) -> str | None:
    if isinstance(value, dict):
        value = value.get("value")
    return value.strip() if isinstance(value, str) and value.strip() else None


def is_active(content: dict) -> bool:
    published = content.get("published_in_handbook")
    status = content.get("status")
    if isinstance(published, dict) and published.get("value") == "0":
        return False
    if isinstance(status, dict) and status.get("value") not in (None, "", "Active"):
        return False
    return content.get("active") != "false"


def ordered(containers) -> list[dict]:
    return sorted((c for c in containers or [] if isinstance(c, dict)), key=lambda c: to_int(c.get("order")) or 0)


def container_kind(container: dict, inherited: str | None = None) -> str | None:
    grouping = container.get("vertical_grouping")
    value = grouping.get("value") if isinstance(grouping, dict) else None
    return SECTION_KINDS.get(value, inherited)


def container_courses(container: dict, kind: str | None, choice: str | None) -> list[dict]:
    courses = []
    for item in container.get("relationship") or []:
        code = item.get("academic_item_code") if isinstance(item, dict) else None
        if code and COURSE_CODE.match(code):
            course = {
                "uoc": to_int(item.get("academic_item_credit_points")),
                "code": code,
                "name": item.get("academic_item_name"),
                "kind": kind or "core",
            }
            if choice:
                course["choice"] = choice
            courses.append(course)
    return courses


def build_sections(structure: dict) -> list[dict]:
    """One section per top-level container; nested groups with their own UOC, and nested rules, become their own section.

    Every section and course carries its Handbook type, and courses from a
    "one of the following" group share a choice key so taking one satisfies the group.
    """
    sections = []
    choices = Counter()

    def add(container: dict, inherited: str | None) -> None:
        kind = container_kind(container, inherited)
        section = {
            "uoc": to_int(container.get("credit_points")),
            "title": container.get("title"),
            "kind": kind,
            "courses": [],
        }
        description = html_to_text(container.get("description"))
        if description:
            section["description"] = description
        sections.append(section)
        collect(container, section, kind, None)

    def collect(container: dict, section: dict, kind: str | None, choice: str | None) -> None:
        if kind == "choice" and choice is None:
            choices[section["title"]] += 1
            choice = f"{section['title']} {choices[section['title']]}"
        section["courses"] += container_courses(container, kind, choice)
        for child in ordered(container.get("container")):
            if to_int(child.get("credit_points")) is not None or container_kind(child) in ("info", "limit"):
                add(child, kind)
            else:
                collect(child, section, container_kind(child, kind), choice)

    for top in ordered((structure or {}).get("container")):
        add(top, None)
    for section in sections:
        seen = set()
        section["courses"] = [c for c in section["courses"] if not (c["code"] in seen or seen.add(c["code"]))]
        if not section["kind"]:
            section["kind"] = "core" if section["courses"] else "info"
        listed_in_text = CODE_IN_TEXT.findall(section.get("description") or "")
        if not section["courses"] and listed_in_text and not NOT_ALLOWED.search(f"{section['title']} {section.get('description')}"):
            section["courses"] = [{"uoc": None, "code": code, "name": None, "kind": "elective"} for code in dict.fromkeys(listed_in_text)]
    return sections


def campus(content: dict) -> str:
    value = content.get("campus") or content.get("location") or ""
    if isinstance(value, dict):
        value = value.get("value") or value.get("label") or ""
    if isinstance(value, list):
        value = ", ".join(str(v.get("value") or v.get("label") or "") if isinstance(v, dict) else str(v) for v in value)
    return str(value)


def with_course_names(sections: list[dict], titles: dict) -> list[dict]:
    for section in sections:
        for course in section.get("courses") or []:
            if not course.get("name") and course.get("code") in titles:
                course["name"] = titles[course["code"]]
    return sections


def is_overview(section) -> bool:
    return isinstance(section, dict) and "overview" in (section.get("title") or "").lower()


def overview_section(content: dict) -> list[dict]:
    text = html_to_text(content.get("structure_summary")) or html_to_text(content.get("description"))
    return [{"uoc": None, "title": "Overview", "kind": "info", "courses": [], "description": text}] if text else []


def with_current_overview(current, proposed: list[dict]) -> list[dict]:
    kept = [s for s in as_list(current) or [] if is_overview(s)]
    return kept + [s for s in proposed if not is_overview(s)] if kept else proposed


def award_name(content: dict) -> str | None:
    text = html_to_text(content.get("award_title_single"))
    if not text:
        return None
    return " / ".join(re.sub(r"\s+-\s+[^/]*$", "", line).strip() for line in text.split("\n"))


def cricos(value) -> str | None:
    text = html_to_text(value)
    return text if text and CRICOS.match(text) else None


def program_row(content: dict) -> dict:
    duration = (content.get("full_time_duration") or "").strip() or None
    return {
        "program_name": award_name(content) or content.get("title"),
        "faculty": normalise_faculty(org_name(content.get("parent_academic_org")) or "") or None,
        "uac_code": html_to_text(content.get("uac_code_single")) or html_to_text(content.get("uac_code")),
        "overview_description": html_to_text(content.get("description")),
        "program_structure": html_to_text(content.get("structure_summary")),
        "special_notes": html_to_text(content.get("additional_progression_requirements_restrictions")),
        "duration": duration,
        "duration_years": parse_years(duration),
        "minimum_uoc": to_int(content.get("credit_points")),
        "cricos_code": cricos(content.get("cricos_code")),
        "sections": overview_section(content) + build_sections(content.get("curriculumStructure")),
    }


def specialisation_row(content: dict) -> dict:
    subclass = content.get("subclass") or {}
    programs = []
    for item in content.get("available_in_programs2021plus") or content.get("available_in_programs") or []:
        code = (item.get("assoc_url") or "").rstrip("/").split("/")[-1]
        if code:
            programs.append({"degree_code": code, "program_name": html_to_text(item.get("assoc_award_title")) or item.get("assoc_title")})
    return {
        "major_name": content.get("title"),
        "specialisation_type": subclass.get("label") if isinstance(subclass, dict) else None,
        "faculty": normalise_faculty(org_name(content.get("parent_academic_org")) or "") or None,
        "uoc_required": to_int(content.get("credit_points")),
        "overview_description": html_to_text(content.get("description")),
        "special_notes": html_to_text(content.get("additional_notes")),
        "sections": overview_section(content) + build_sections(content.get("curriculumStructure")),
        "sections_degrees": programs,
    }


def course_school(content: dict) -> str | None:
    school = org_name(content.get("academic_org"))
    faculty = org_name(content.get("parent_academic_org"))
    if not school or school == faculty or normalise_faculty(school) in OFFICIAL_FACULTIES:
        return None
    return school


def course_row(content: dict) -> dict:
    rules = [html_to_text(rule.get("description")) for rule in content.get("enrolment_rules") or [] if isinstance(rule, dict)]
    terms = ((content.get("offering_detail") or {}).get("offering_terms") or "").split(",")
    level = content.get("study_level_single") or {}
    return {
        "title": content.get("title"),
        "overview": html_to_text(content.get("description")) or html_to_text(content.get("overview")),
        "faculty": normalise_faculty(org_name(content.get("parent_academic_org")) or "") or None,
        "school": course_school(content),
        "uoc": to_int(content.get("credit_points")),
        "study_level": level.get("label") if isinstance(level, dict) else None,
        "field_of_education": org_name(content.get("asced_detailed")),
        "conditions_for_enrolment": "\n".join(r for r in rules if r) or None,
        "offering_terms": [t.strip() for t in terms if t.strip()] or None,
    }


ROW_BUILDERS = {"programs": program_row, "specialisations": specialisation_row, "courses": course_row}
NAME_FIELDS = {"programs": "program_name", "specialisations": "major_name", "courses": "title"}


def sitemap_codes(client: httpx.Client, level: str, year: str) -> dict[str, list[str]]:
    index = client.get(SITEMAP).text
    pattern = re.compile(rf"{re.escape(HANDBOOK)}/{level}/({'|'.join(KINDS)})/{year}/([A-Z0-9]+)")
    codes = defaultdict(set)
    for part in re.findall(r"<loc>(.*?)</loc>", index):
        for kind, code in pattern.findall(client.get(part).text):
            codes[kind].add(code)
        time.sleep(REQUEST_GAP_SECONDS / 2)
    return {kind: sorted(codes[kind]) for kind in KINDS}


def spread(codes: list[str], limit: int | None) -> list[str]:
    if not limit or limit >= len(codes):
        return codes
    step = len(codes) / limit
    return [codes[int(i * step)] for i in range(limit)]


def fetch(level: str, year: str, limit: int | None) -> None:
    folder = snapshot_dir(level, year)
    headers = {"User-Agent": "UniVise Handbook import (UNSW research project)"}
    with httpx.Client(headers=headers, follow_redirects=True, timeout=30) as client:
        listed = sitemap_codes(client, level, year)
        manifest = {"level": level, "year": year, "listed": listed, "limit": limit}
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "manifest.json").write_text(json.dumps(manifest, indent=1))
        failures = []
        for kind in KINDS:
            (folder / kind).mkdir(exist_ok=True)
            todo = [c for c in spread(listed[kind], limit) if not (folder / kind / f"{c}.json").exists()]
            print(f"{kind}: {len(listed[kind])} listed, {len(todo)} to download")
            for i, code in enumerate(todo, 1):
                url = f"{HANDBOOK}/{level}/{kind}/{year}/{code}?year={year}"
                try:
                    response = client.get(url)
                    response.raise_for_status()
                    content = json.loads(NEXT_DATA.search(response.text).group(1))["props"]["pageProps"]["pageContent"]
                    record = {"url": url, "fetched_at": datetime.now(timezone.utc).isoformat(), "content": content}
                    (folder / kind / f"{code}.json").write_text(json.dumps(record))
                except (httpx.HTTPError, AttributeError, KeyError, ValueError) as error:
                    failures.append(f"{kind}/{code}: {error}")
                time.sleep(REQUEST_GAP_SECONDS)
                if i % 100 == 0:
                    print(f"  {kind}: {i} of {len(todo)}")
    for line in failures:
        print(f"failed {line}")
    print(f"Done, {len(failures)} failures. Snapshot in {folder}")


def load_snapshot(level: str, year: str) -> tuple[dict, dict]:
    folder = snapshot_dir(level, year)
    manifest = json.loads((folder / "manifest.json").read_text())
    pages = {kind: {} for kind in KINDS}
    for kind in KINDS:
        for path in sorted((folder / kind).glob("*.json")):
            pages[kind][path.stem] = json.loads(path.read_text())
    return manifest, pages


def as_list(value):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except ValueError:
            return None
    return value


def course_codes(sections) -> set:
    return {
        c.get("code") for s in as_list(sections) or [] if isinstance(s, dict)
        for c in s.get("courses") or [] if isinstance(c, dict) and COURSE_CODE.match(c.get("code") or "")
    }


def compare(kind: str, field: str, current, proposed) -> str:
    if proposed in (None, "", []):
        return "same" if current in (None, "", []) else "handbook empty"
    if field == "sections":
        if course_codes(current) != course_codes(proposed):
            return "content"
        return "same" if as_list(current) == proposed else "layout"
    if field == "sections_degrees":
        codes = lambda v: sorted(d.get("degree_code") for d in as_list(v) or [] if isinstance(d, dict))
        return "same" if codes(current) == codes(proposed) else "content"
    if field == "duration":
        return "same" if parse_years(current) == parse_years(proposed) else "content"
    if field == "duration_years":
        return "same" if current is not None and float(current) == float(proposed) else "content"
    if field == "offering_terms":
        return "same" if current == proposed else "content"
    if isinstance(proposed, str):
        if isinstance(current, str) and current.strip() == proposed.strip():
            return "same"
        if field in KEEP_CURRENT and current not in (None, ""):
            return "kept"
        if field in TEXT_FIELDS and words(html_to_text(current) if isinstance(current, str) else current) == words(proposed):
            return "format"
        if field == "program_name" and words(ABBREVIATION.sub("", current or "")) == words(ABBREVIATION.sub("", proposed)):
            return "same"
    elif current == proposed:
        return "same"
    return "flag" if field in FLAGGED[kind] else "content"


def short(value) -> str:
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    text = (text or "").replace("\n", " / ")
    return text if len(text) <= EXAMPLE_CHARS else text[:EXAMPLE_CHARS] + "..."


def link_groups(edges: list[dict]) -> set:
    groups = defaultdict(set)
    for e in edges:
        key = (e["edge_type"], e["from_key"]) if e.get("logic_type") == "and" else (e["edge_type"], e.get("group_id") or e["from_key"])
        groups[key].add(e["from_key"])
    return {(key[0], frozenset(codes)) for key, codes in groups.items()}


def link_changes(course_pages: dict, out: Path, added_courses: set) -> list[str]:
    """Compare CourseMesh links rebuilt from the snapshot's rules with the stored links,
    for the courses that will be stored after the import."""
    known = {row["code"] for row in fetch_rows("unsw_courses", "code")} | added_courses
    current = defaultdict(list)
    for edge in fetch_rows("mindmesh_edges_global", "from_key, to_key, edge_type, logic_type, group_id"):
        current[edge["to_key"]].append(edge)
    counts, rows, total = Counter(), [], 0
    for code, page in sorted(course_pages.items()):
        if not is_active(page["content"]) or code not in known:
            continue
        edges = requisite_edges(code, course_row(page["content"])["conditions_for_enrolment"] or "", known)
        total += len(edges)
        before, after = link_groups(current.get(code, [])), link_groups(edges)
        if before == after:
            counts["same"] += 1
            continue
        change = "added" if after > before else "removed" if after < before else "changed"
        counts[change] += 1
        describe = lambda groups: "; ".join(f"{k}: {' or '.join(sorted(v))}" for k, v in sorted(groups, key=lambda g: (g[0], sorted(g[1]))))
        rows.append({"code": code, "change": change, "rule": course_row(page["content"])["conditions_for_enrolment"] or "", "current": describe(before), "proposed": describe(after)})
    with open(out / "links.csv", "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["code", "change", "rule", "current", "proposed"])
        writer.writeheader()
        writer.writerows(rows)
    return [
        "## CourseMesh links (`mindmesh_edges_global`)",
        "",
        f"Rebuilt from the {year_note(course_pages)} rules for {sum(counts.values())} courses: {counts['same']} unchanged, "
        f"{counts['added']} gain links, {counts['removed']} lose links, {counts['changed']} change. {total} links in all. "
        "Every change is in `links.csv`. Courses missing from the Handbook keep their links.",
        "",
    ]


def year_note(course_pages: dict) -> str:
    years = {page["content"].get("implementation_year") for page in course_pages.values()}
    return "/".join(sorted(y for y in years if y)) or "Handbook"


def proposed_row(kind: str, page: dict, titles: dict, program_names: dict | None = None) -> dict:
    row = ROW_BUILDERS[kind](page["content"])
    if kind == "courses":
        return row
    if kind == "specialisations" and program_names:
        row["sections_degrees"] = [{**d, "program_name": program_names.get(d["degree_code"], d["program_name"])} for d in row["sections_degrees"]]
    return {**row, "sections": with_course_names(row["sections"], titles), "source_url": page["url"]}


def new_row_reason(kind: str, page: dict, proposed: dict, kept_programs: set, used_courses: set) -> str | None:
    """Why a page that is not in the database should not be added, or None to add it."""
    if kind == "programs" and not any(place in campus(page["content"]) for place in SYDNEY):
        return f"other campus ({campus(page['content']) or 'unknown'})"
    if kind == "specialisations" and not {d.get("degree_code") for d in proposed.get("sections_degrees") or []} & kept_programs:
        return "not offered in a stored program"
    if kind == "courses" and page["content"].get("code") not in used_courses:
        return "not used by a stored program or major"
    return None


def plan(level: str, year: str) -> None:
    manifest, pages = load_snapshot(level, year)
    out = AI_DIR / "phase-10-plan"
    out.mkdir(parents=True, exist_ok=True)
    unfetched = sum(len(set(manifest["listed"][kind]) - set(pages[kind])) for kind in KINDS)
    partial = bool(manifest.get("limit")) or unfetched > 0
    lines = [
        f"# Handbook {year} {level} import plan",
        "",
        f"Generated {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC from the snapshot in `ai/handbook-{year}/{level}`. Nothing was written to the database.",
        "",
    ]
    if partial:
        lines += [f"**Partial snapshot** ({unfetched} listed pages not downloaded yet), so missing rows are not counted.", ""]
    decisions_file = out / "decisions.json"
    accepted = {tuple(item) for item in json.loads(decisions_file.read_text()).get("accept", [])} if decisions_file.exists() else set()
    titles = {row["code"]: row["title"] for row in fetch_rows("unsw_courses", "code, title")}
    titles.update({code: page["content"].get("title") for code, page in pages["courses"].items() if code not in titles})
    kept_programs, used_courses, program_names = set(), set(), {}
    for kind in KINDS:
        table, key = TABLES[kind]
        db_rows = {row[key]: row for row in fetch_rows(table, "*")}
        active = {code: page for code, page in pages[kind].items() if is_active(page["content"])}
        inactive = sorted(set(pages[kind]) - set(active))
        new = sorted(set(active) - set(db_rows))
        missing = [] if partial else sorted(set(db_rows) - set(active))
        counts = defaultdict(Counter)
        examples = defaultdict(list)
        changes = []
        for code in sorted(set(active) & set(db_rows)):
            proposed = proposed_row(kind, active[code], titles, program_names)
            current = db_rows[code]
            for field, value in proposed.items():
                if field == "sections":
                    value = with_current_overview(current.get(field), value)
                action = compare(kind, field, current.get(field), value)
                if ((kind, code, field) in accepted or (kind, "*", field) in accepted) and action != "same":
                    action = "accept"
                counts[field][action] += 1
                if action == "same":
                    continue
                changes.append({
                    "table": table, "key": code, "name": current.get(NAME_FIELDS[kind]), "field": field, "action": action,
                    "current": json.dumps(current.get(field), ensure_ascii=False), "proposed": json.dumps(value, ensure_ascii=False),
                })
                if action in ("content", "flag") and len(examples[field]) < EXAMPLES:
                    examples[field].append((code, current.get(field), value))
        if kind == "programs":
            kept_programs |= set(db_rows)
            program_names = {code: row["program_name"] for code, row in db_rows.items()}
            program_names.update({c["key"]: json.loads(c["proposed"])["program_name"] for c in changes if c["action"] == "new"})
        if kind != "courses":
            for code in sorted(set(active) & set(db_rows)):
                used_courses |= course_codes(proposed_row(kind, active[code], titles)["sections"]) | course_codes(db_rows[code].get("sections"))
        skipped = Counter()
        for code in new:
            proposed = proposed_row(kind, active[code], titles, program_names)
            reason = new_row_reason(kind, active[code], proposed, kept_programs, used_courses)
            if reason:
                skipped[reason.split(" (")[0]] += 1
            elif kind == "programs":
                kept_programs.add(code)
            if not reason and kind != "courses":
                used_courses |= course_codes(proposed["sections"])
            changes.append({
                "table": table, "key": code, "name": active[code]["content"].get("title"), "field": reason or "*",
                "action": "skipped" if reason else "new", "current": "", "proposed": json.dumps(proposed, ensure_ascii=False),
            })
        for code in missing:
            changes.append({"table": table, "key": code, "name": db_rows[code].get(NAME_FIELDS[kind]), "field": "*", "action": "missing", "current": "", "proposed": ""})
        with open(out / f"{kind}.csv", "w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS)
            writer.writeheader()
            writer.writerows(changes)

        compared = len(set(active) & set(db_rows))
        lines += [
            f"## {kind.capitalize()} (`{table}`)",
            "",
            f"Snapshot {len(pages[kind])} pages ({len(inactive)} inactive), database {len(db_rows)} rows, compared {compared}, "
            f"new {len(new)}, missing {'not counted' if partial else len(missing)}.",
            "",
            "Applied: format, content and layout. Flag: your decision. Layout: same courses, new grouping and types. "
            "Kept: assembled text left as it is. Handbook empty: current value kept.",
            "",
            "| Field | Same | Format only | Content | Flagged | Layout only | Kept | Handbook empty |",
            "|---|---|---|---|---|---|---|---|",
        ]
        for field, c in counts.items():
            accepted_note = f" (+{c['accept']} accepted)" if c["accept"] else ""
            lines.append(f"| {field} | {c['same']} | {c['format']} | {c['content']}{accepted_note} | {c['flag']} | {c['layout']} | {c['kept']} | {c['handbook empty']} |")
        lines.append("")
        for field, items in examples.items():
            lines.append(f"**{field}** examples:")
            for code, current, proposed in items:
                lines.append(f"- {code}: now `{short(current)}`, Handbook `{short(proposed)}`")
            lines.append("")
        added = [c["key"] for c in changes if c["action"] == "new"]
        if added:
            lines += [f"New, to add ({len(added)}): {', '.join(added[:30])}{' ...' if len(added) > 30 else ''}", ""]
        if skipped:
            lines += ["Not added: " + ", ".join(f"{n} {reason}" for reason, n in skipped.items()) + " (listed in the CSV as skipped).", ""]
        if missing:
            lines += [f"Missing from the Handbook: {', '.join(missing[:20])}{' ...' if len(missing) > 20 else ''}", ""]
        if inactive:
            lines += [f"Inactive pages: {', '.join(inactive[:20])}", ""]
    with open(out / "courses.csv", newline="") as handle:
        added_courses = {row["key"] for row in csv.DictReader(handle) if row["action"] == "new"}
    lines += link_changes(pages["courses"], out, added_courses)
    (out / "summary.md").write_text("\n".join(lines))
    print(f"Wrote {out / 'summary.md'} and one CSV per table")


WRITTEN = {"format", "content", "layout", "accept"}
BACKUP_TABLES = [
    ("unsw_degrees_final", "degree_code"),
    ("unsw_specialisations", "major_code"),
    ("unsw_courses", "code"),
    ("mindmesh_nodes_global", "key"),
    ("mindmesh_edges_global", "id"),
]
BATCH = 200


def chunks(items: list, size: int = BATCH):
    for start in range(0, len(items), size):
        yield items[start:start + size]


def node_row(code: str, course: dict) -> dict:
    return {
        "key": code, "label": course.get("title") or code, "uoc": course.get("uoc"),
        "faculty": course.get("faculty"), "school": course.get("school"), "level": code[4] if len(code) > 4 else None,
    }


def reviewed_changes(out: Path, kind: str, only: set | None, fields: set | None) -> tuple[dict, list]:
    updates, inserts = defaultdict(dict), []
    with open(out / f"{kind}.csv", newline="") as handle:
        for row in csv.DictReader(handle):
            if only and row["key"] not in only:
                continue
            if row["action"] == "new" and not fields:
                inserts.append((row["key"], json.loads(row["proposed"])))
            elif row["action"] in WRITTEN and (not fields or row["field"] in fields):
                updates[row["key"]][row["field"]] = json.loads(row["proposed"])
    return updates, inserts


REQUIRED = {
    "unsw_courses": ["code", "title"],
    "unsw_specialisations": ["major_code", "major_name", "specialisation_type"],
    "unsw_degrees_final": ["degree_code", "program_name"],
    "mindmesh_nodes_global": ["key", "label"],
    "mindmesh_edges_global": ["from_key", "to_key", "edge_type"],
}
INTEGER_FIELDS = {"uoc", "minimum_uoc", "uoc_required", "handbook_year"}
LIST_FIELDS = {"sections", "sections_degrees", "offering_terms"}
LINK_BATCH = 50


def prepare_table(kind: str, updates: dict, inserts: list, stamps: dict, level: str) -> tuple[dict, list]:
    key = TABLES[kind][1]
    payloads = {code: {**stamps.get(code, {}), **fields} for code, fields in updates.items()}
    for code, stamp in stamps.items():
        payloads.setdefault(code, dict(stamp))
    new_rows = []
    for code, row in inserts:
        extra = {"level": level.capitalize(), "is_offered": False} if kind == "programs" else {}
        new_rows.append({key: code, **row, **extra, **stamps.get(code, {})})
    return payloads, new_rows


def preflight(plan_rows: dict, nodes: list, edges: list, course_codes_after: set, node_keys_after: set) -> list[str]:
    """Problems that would make a write fail or store bad data; empty when everything can be written."""
    problems = []
    for table, (payloads, new_rows) in plan_rows.items():
        columns = set(supabase.table(table).select("*").limit(1).execute().data[0])
        key = next(k for t, k in BACKUP_TABLES if t == table)
        rows = [{key: code, **payload} for code, payload in payloads.items()] + new_rows
        for row in rows:
            unknown = set(row) - columns
            if unknown:
                problems.append(f"{table} {row.get(key)}: unknown columns {sorted(unknown)}")
            for field in INTEGER_FIELDS & set(row):
                if row[field] is not None and not isinstance(row[field], int):
                    problems.append(f"{table} {row.get(key)}: {field} is not a whole number ({row[field]!r})")
            for field in LIST_FIELDS & set(row):
                if row[field] is not None and not isinstance(row[field], list):
                    problems.append(f"{table} {row.get(key)}: {field} is not a list")
        for row in new_rows:
            for field in REQUIRED[table]:
                if row.get(field) in (None, ""):
                    problems.append(f"{table} {row.get(key)}: new row has no {field}")
        new_keys = [row[key] for row in new_rows]
        if len(new_keys) != len(set(new_keys)):
            problems.append(f"{table}: duplicate new keys")
    for node in nodes:
        if node["key"] not in course_codes_after:
            problems.append(f"mindmesh_nodes_global {node['key']}: no such course")
        if not node.get("label"):
            problems.append(f"mindmesh_nodes_global {node['key']}: no label")
    pairs = Counter((e["from_key"], e["to_key"], e["edge_type"]) for e in edges)
    problems += [f"mindmesh_edges_global: duplicate link {pair}" for pair, n in pairs.items() if n > 1]
    for edge in edges:
        if edge["from_key"] == edge["to_key"]:
            problems.append(f"mindmesh_edges_global {edge['to_key']}: links to itself")
        for end in ("from_key", "to_key"):
            if edge[end] not in node_keys_after:
                problems.append(f"mindmesh_edges_global {edge['from_key']}->{edge['to_key']}: {edge[end]} has no node")
    return problems


def write_rows(table: str, key: str, payloads: dict, new_rows: list) -> None:
    for batch in chunks(new_rows):
        supabase.table(table).upsert(batch, on_conflict=key).execute()
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda item: supabase.table(table).update(item[1]).eq(key, item[0]).execute(), payloads.items()))


def apply(level: str, year: str, dry_run: bool, only: set | None, fields: set | None) -> None:
    manifest, pages = load_snapshot(level, year)
    missing = sum(len(set(manifest["listed"][kind]) - set(pages[kind])) for kind in KINDS)
    if (missing or manifest.get("limit")) and not only:
        raise SystemExit(f"The snapshot is incomplete ({missing} pages missing). Run fetch first.")
    out = AI_DIR / "phase-10-plan"

    def stamps_for(kind: str) -> dict:
        if fields:
            return {}
        return {
            code: {"handbook_year": int(year), "scraped_at": page["fetched_at"]}
            for code, page in pages[kind].items() if is_active(page["content"]) and (not only or code in only)
        }

    plan_rows, counts = {}, {}
    for kind in KINDS:
        updates, inserts = reviewed_changes(out, kind, only, fields)
        plan_rows[TABLES[kind][0]] = prepare_table(kind, updates, inserts, stamps_for(kind), level)
        counts[kind] = (len(updates), inserts)

    stored = {row["code"]: row for row in fetch_rows("unsw_courses", "code, title, uoc, faculty, school")}
    course_payloads, course_new = plan_rows["unsw_courses"]
    course_updates = reviewed_changes(out, "courses", only, fields)[0]
    course_codes_after = set(stored) | {row["code"] for row in course_new}
    node_fields = {"title", "uoc", "faculty", "school"}
    nodes = [node_row(row["code"], row) for row in course_new]
    nodes += [node_row(code, {**stored[code], **f}) for code, f in course_updates.items() if code in stored and node_fields & set(f)]
    node_keys_after = {row["key"] for row in fetch_rows("mindmesh_nodes_global", "key")} | {n["key"] for n in nodes}

    link_codes = []
    if not fields or "links" in fields:
        with open(out / "links.csv", newline="") as handle:
            link_codes = [row["code"] for row in csv.DictReader(handle) if not only or row["code"] in only]
    link_codes = [code for code in link_codes if code in course_codes_after]
    edges_by_course = {
        code: requisite_edges(code, course_row(pages["courses"][code]["content"])["conditions_for_enrolment"] or "", course_codes_after)
        for code in link_codes
    }
    edges = [edge for code in link_codes for edge in edges_by_course[code]]

    for kind in KINDS:
        table = TABLES[kind][0]
        changed, inserts = counts[kind]
        print(f"{table}: {changed} rows with field changes, {len(plan_rows[table][0])} rows updated in all (stamps included), {len(inserts)} new")
    print(f"mindmesh_nodes_global: {len(nodes)} nodes added or refreshed")
    print(f"mindmesh_edges_global: links rebuilt for {len(link_codes)} courses ({len(edges)} links)")

    problems = preflight(plan_rows, nodes, edges, course_codes_after, node_keys_after)
    if problems:
        for problem in problems[:40]:
            print(f"  problem: {problem}")
        raise SystemExit(f"Pre-flight check failed with {len(problems)} problems. Nothing was written.")
    print("Pre-flight check passed: every row can be written.")
    if dry_run:
        print("Dry run: nothing was written.")
        return

    backup = AI_DIR / "phase-10-backup" / datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup.mkdir(parents=True)
    for table, _ in BACKUP_TABLES:
        (backup / f"{table}.json").write_text(json.dumps(fetch_rows(table, "*"), ensure_ascii=False))
    print(f"Backup written to {backup}")

    write_rows("unsw_courses", "code", course_payloads, course_new)
    for batch in chunks(nodes):
        supabase.table("mindmesh_nodes_global").upsert(batch, on_conflict="key").execute()
    for batch in chunks(link_codes, LINK_BATCH):
        supabase.table("mindmesh_edges_global").delete().in_("to_key", batch).execute()
        rows = [edge for code in batch for edge in edges_by_course[code]]
        if rows:
            supabase.table("mindmesh_edges_global").insert(rows).execute()
    for kind in ("specialisations", "programs"):
        table, key = TABLES[kind]
        write_rows(table, key, *plan_rows[table])
    print("All rows written.")

    findings = display_data_audit.audit()
    must_fix = sum(len(keys) for (level_name, *_), keys in findings.items() if level_name == display_data_audit.MUST_FIX)
    print(f"Display-data audit: {must_fix} must-fix values")
    if must_fix:
        raise SystemExit("The audit found must-fix values. Review them, or restore the backup.")


def restore(backup: Path) -> None:
    for table, key in BACKUP_TABLES:
        saved = json.loads((backup / f"{table}.json").read_text())
        keep = {row[key] for row in saved}
        extra = [row[key] for row in fetch_rows(table, key) if row[key] not in keep]
        for batch in chunks(extra):
            supabase.table(table).delete().in_(key, batch).execute()
        conflict = "id" if table == "mindmesh_edges_global" else key
        for batch in chunks(saved):
            supabase.table(table).upsert(batch, on_conflict=conflict).execute()
        print(f"{table}: {len(saved)} rows restored, {len(extra)} added rows removed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--level", default="undergraduate")
    parser.add_argument("--year", default="2026")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("fetch").add_argument("--limit", type=int)
    commands.add_parser("plan")
    apply_command = commands.add_parser("apply")
    apply_command.add_argument("--dry-run", action="store_true")
    apply_command.add_argument("--only", help="comma-separated codes")
    apply_command.add_argument("--fields", help="comma-separated fields, e.g. sections")
    commands.add_parser("restore").add_argument("--backup", required=True)
    args = parser.parse_args()
    if args.command == "fetch":
        fetch(args.level, args.year, args.limit)
    elif args.command == "plan":
        plan(args.level, args.year)
    elif args.command == "apply":
        split = lambda value: set(value.split(",")) if value else None
        apply(args.level, args.year, args.dry_run, split(args.only), split(args.fields))
    else:
        restore(Path(args.backup))


if __name__ == "__main__":
    main()
