"""Display-data audit: checks every program, specialisation and course field
that pages show, and reports values that would display badly.

Run from the backend folder (read-only):
    python -m scripts.display_data_audit

Rules marked "must fix" exit with status 1 so an import can stop on them.
"Advisory" rules are handled by the frontend formatter and are only reported.
Run it after every data import and before launch.
"""
import json
import re
import sys
from collections import defaultdict

from scripts.display_data_cleanup import RANGE, fetch_rows, is_placeholder

MUST_FIX = "must fix"
ADVISORY = "advisory"
LONG_TEXT_CHARS = 600
RUN_ON_COMMAS = 12
MOJIBAKE = re.compile(r"Â|â€|Ã©|�")
HTML_TAG = re.compile(r"</?[a-z]+[ >]", re.I)
ENTITY = re.compile(r"&(amp|nbsp|quot|lt|gt|#\d+);")

TEXT_FIELDS = {
    "unsw_degrees_final": ("degree_code", ["program_name", "faculty", "overview_description", "program_structure", "special_notes", "assumed_knowledge"]),
    "unsw_specialisations": ("major_code", ["major_name", "faculty", "overview_description", "special_notes"]),
    "unsw_courses": ("code", ["title", "overview", "faculty", "school", "conditions_for_enrolment"]),
}
SECTION_TABLES = {"unsw_degrees_final": "degree_code", "unsw_specialisations": "major_code"}


def text_problems(value):
    if not isinstance(value, str):
        return []
    problems = []
    if not value.strip():
        problems.append((MUST_FIX, "empty text instead of null"))
    elif is_placeholder(value):
        problems.append((MUST_FIX, "placeholder text instead of null"))
    if MOJIBAKE.search(value):
        problems.append((MUST_FIX, "broken characters"))
    if HTML_TAG.search(value) or ENTITY.search(value):
        problems.append((MUST_FIX, "raw HTML"))
    if len(value) > LONG_TEXT_CHARS and "\n" not in value:
        problems.append((ADVISORY, f"over {LONG_TEXT_CHARS} characters with no line breaks"))
    if value.count(",") >= RUN_ON_COMMAS and "\n" not in value:
        problems.append((ADVISORY, f"{RUN_ON_COMMAS}+ commas in one block (likely a run-on list)"))
    return problems


def duration_problems(duration, duration_years):
    if duration_years is not None:
        return []
    if isinstance(duration, str) and duration.strip() and not RANGE.search(duration):
        return [(MUST_FIX, "duration text without duration_years")]
    return []


def section_problems(raw):
    sections = json.loads(raw) if isinstance(raw, str) else raw
    if not isinstance(sections, list):
        return [(MUST_FIX, "sections is not a list")] if sections else []
    problems = []
    for section in sections:
        if not isinstance(section, dict):
            problems.append((MUST_FIX, "section is not an object"))
            continue
        for field in ("description", "notes"):
            problems += [(level, f"section {field}: {kind}") for level, kind in text_problems(section.get(field))]
        if section.get("uoc") is not None and not isinstance(section["uoc"], (int, float)):
            problems.append((MUST_FIX, "section UOC stored as text"))
        for course in section.get("courses") or []:
            if not isinstance(course, dict) or not course.get("code"):
                problems.append((MUST_FIX, "course entry without a code"))
            elif not course.get("name"):
                problems.append((ADVISORY, "course listed without a name"))
    return problems


def audit():
    findings = defaultdict(list)
    for table, (key, fields) in TEXT_FIELDS.items():
        extra = ", duration, duration_years" if table == "unsw_degrees_final" else ""
        for row in fetch_rows(table, ", ".join([key, *fields]) + extra):
            for field in fields:
                for level, kind in text_problems(row[field]):
                    findings[(level, table, field, kind)].append(row[key])
            if extra:
                for level, kind in duration_problems(row["duration"], row["duration_years"]):
                    findings[(level, table, "duration", kind)].append(row[key])
    for table, key in SECTION_TABLES.items():
        for row in fetch_rows(table, f"{key}, sections"):
            for level, kind in section_problems(row["sections"]):
                findings[(level, table, "sections", kind)].append(row[key])
    return findings


def main():
    findings = audit()
    must_fix = 0
    for (level, table, field, kind), keys in sorted(findings.items(), key=lambda kv: (kv[0][0] != MUST_FIX, -len(kv[1]))):
        if level == MUST_FIX:
            must_fix += len(keys)
        sample = ", ".join(str(k) for k in keys[:3])
        print(f"{level:9s} {len(keys):5d}  {table}.{field}: {kind}  (e.g. {sample})")
    print(f"\n{must_fix} must-fix values" if must_fix else "\nNo must-fix values.")
    return 1 if must_fix else 0


if __name__ == "__main__":
    sys.exit(main())
