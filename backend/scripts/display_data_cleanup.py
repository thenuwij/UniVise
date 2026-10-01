"""One-off clean-up of display data that is wrong in the database itself.

Fixes three clear-cut problems found by the display-data audit:
  * degrees: fills the numeric duration_years from the free-text duration
    ("4 Year(s)", "5 years full-time", "4 Years" all become 4, 5, 4)
  * placeholder text ("Not specified", "N/A") stored as content becomes null
  * empty section descriptions and notes are removed from degree and specialisation sections

Run from the backend folder:
    python -m scripts.display_data_cleanup plan --out display_changes.csv
    python -m scripts.display_data_cleanup apply --changes display_changes.csv

`plan` only reads. Review the CSV, delete any row that should not change,
then run `apply`, which writes only the rows left in the file.
"""
import argparse
import csv
import json
import re
import sys

from app.core.database import supabase

PAGE_SIZE = 1000
PLACEHOLDER = re.compile(r"^\s*(not specified|n/?a|none|null|tbc|-)\s*$", re.I)
YEARS = re.compile(r"(\d+(?:\.\d+)?)\s*years?(?:\(s\))?", re.I)
RANGE = re.compile(r"\d\s*-\s*\d")

TEXT_FIELDS = {
    "unsw_degrees_final": ("degree_code", ["overview_description", "program_structure", "special_notes", "assumed_knowledge"]),
    "unsw_specialisations": ("id", ["overview_description", "special_notes"]),
    "unsw_courses": ("code", ["overview", "school", "conditions_for_enrolment"]),
}
SECTION_TABLES = {"unsw_degrees_final": "degree_code", "unsw_specialisations": "id"}
FIELDS = ["table", "key", "field", "current", "new"]


def parse_years(text):
    if not isinstance(text, str) or RANGE.search(text):
        return None
    match = YEARS.search(text)
    return float(match.group(1)) if match else None


def is_placeholder(value):
    return isinstance(value, str) and bool(PLACEHOLDER.match(value))


def without_empty_section_text(raw):
    sections = json.loads(raw) if isinstance(raw, str) else raw
    if not isinstance(sections, list):
        return raw, False
    changed = False
    for section in sections:
        if not isinstance(section, dict):
            continue
        for field in ("description", "notes"):
            if isinstance(section.get(field), str) and not section[field].strip():
                del section[field]
                changed = True
    if not changed:
        return raw, False
    return (json.dumps(sections, ensure_ascii=False) if isinstance(raw, str) else sections), True


def fetch_rows(table, columns):
    rows, start = [], 0
    while True:
        page = supabase.table(table).select(columns).range(start, start + PAGE_SIZE - 1).execute().data
        rows += page
        if len(page) < PAGE_SIZE:
            return rows
        start += PAGE_SIZE


def plan_changes():
    changes = []
    for row in fetch_rows("unsw_degrees_final", "degree_code, duration, duration_years"):
        years = parse_years(row["duration"])
        if years is not None and row.get("duration_years") != years:
            changes.append({"table": "unsw_degrees_final", "key": row["degree_code"], "field": "duration_years", "current": row["duration"], "new": json.dumps(years)})
    for table, (key, fields) in TEXT_FIELDS.items():
        for row in fetch_rows(table, ", ".join([key, *fields])):
            for field in fields:
                if is_placeholder(row[field]):
                    changes.append({"table": table, "key": row[key], "field": field, "current": row[field], "new": "null"})
    for table, key in SECTION_TABLES.items():
        for row in fetch_rows(table, f"{key}, sections"):
            cleaned, changed = without_empty_section_text(row["sections"])
            if changed:
                changes.append({"table": table, "key": row[key], "field": "sections", "current": "empty section text", "new": json.dumps(cleaned, ensure_ascii=False)})
    return changes


def plan(out_path):
    changes = plan_changes()
    with open(out_path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(changes)
    counts = {}
    for change in changes:
        counts[(change["table"], change["field"])] = counts.get((change["table"], change["field"]), 0) + 1
    for (table, field), count in sorted(counts.items()):
        print(f"{count:5d}  {table}.{field}")
    print(f"{len(changes)} changes written to {out_path}")


def apply(changes_path):
    key_columns = {table: key for table, (key, _) in TEXT_FIELDS.items()}
    with open(changes_path, newline="") as handle:
        rows = list(csv.DictReader(handle))
    for row in rows:
        value = json.loads(row["new"])
        supabase.table(row["table"]).update({row["field"]: value}).eq(key_columns[row["table"]], row["key"]).execute()
    print(f"applied {len(rows)} changes")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    plan_cmd = sub.add_parser("plan")
    plan_cmd.add_argument("--out", required=True)
    apply_cmd = sub.add_parser("apply")
    apply_cmd.add_argument("--changes", required=True)
    args = parser.parse_args()
    if args.command == "plan":
        plan(args.out)
    else:
        apply(args.changes)


if __name__ == "__main__":
    sys.exit(main())
