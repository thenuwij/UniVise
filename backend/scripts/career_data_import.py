"""Loads the official career figures shown on the Careers step.

Two sources, each stored with where it came from:
  * QILT Graduate Outcomes Survey 2025: undergraduate outcomes for the 21 study
    areas (national report, Table 5), into career_study_area_outcomes
  * Jobs and Skills Australia: bachelor-level occupation groups with employment,
    median full-time weekly earnings, growth and 2025 shortage ratings, into
    career_occupations

Run from the backend folder:
    python -m scripts.career_data_import plan --out ../ai/phase-8-career-plan.csv
    python -m scripts.career_data_import apply

`plan` only reads: it checks both files and lists every row that would be
added or changed. `apply` writes the same files, so run it after reviewing
the plan.
"""
import argparse
import csv
import re
import sys

from app.core.database import supabase

QILT_PATH = "../ai/phase-8-qilt-gos-2025.csv"
JSA_PATH = "data/career/jsa_occupations.csv"

QILT_SOURCE = "QILT Graduate Outcomes Survey 2025, national report Table 5 (domestic undergraduates)"
QILT_URL = "https://www.qilt.edu.au/docs/default-source/default-document-library/2025-gos-national-report.pdf"
QILT_YEAR = 2025
JSA_SOURCE = "Jobs and Skills Australia, occupation profiles (February 2026) and 2025 Unit Group Shortage List"
JSA_URL = "https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles"
JSA_PERIOD = "Earnings May 2025, employment February 2026, shortage ratings 2025"

QILT_RATES = [
    "full_time_employment_rate",
    "overall_employment_rate",
    "labour_force_participation_rate",
    "further_study_rate",
    "professional_occupation_rate",
]
JSA_NUMBERS = ["employed", "median_weekly_earnings", "annual_employment_growth"]
RATINGS = {"S", "NS", "R", "M"}
ANZSCO_CODE = re.compile(r"^\d{4}$")
FIELDS = ["table", "key", "action", "changes"]


def optional_int(value):
    return int(value) if value not in ("", None) else None


def read_csv(path):
    with open(path, newline="") as handle:
        return list(csv.DictReader(handle))


def qilt_record(row):
    record = {"study_area": row["study_area"].strip()}
    for field in QILT_RATES:
        rate = float(row[field])
        if not 0 <= rate <= 100:
            raise ValueError(f"{record['study_area']}: {field} {rate} is not a percentage")
        record[field] = rate
    record["median_salary"] = int(row["median_salary"])
    if record["median_salary"] <= 0:
        raise ValueError(f"{record['study_area']}: median salary must be positive")
    record.update({"survey_year": QILT_YEAR, "source": QILT_SOURCE, "source_url": QILT_URL})
    return record


def jsa_record(row):
    code = row["anzsco_code"].strip()
    if not ANZSCO_CODE.match(code):
        raise ValueError(f"{code}: not a 4-digit ANZSCO code")
    record = {"anzsco_code": code, "title": row["title"].strip(), "skill_level": int(row["skill_level"])}
    for field in JSA_NUMBERS:
        record[field] = optional_int(row[field])
    if record["median_weekly_earnings"] is not None and record["median_weekly_earnings"] <= 0:
        raise ValueError(f"{code}: earnings must be positive")
    for field in ("shortage_national", "shortage_nsw"):
        rating = row[field].strip()
        if rating not in RATINGS:
            raise ValueError(f"{code}: unknown shortage rating {rating!r}")
        record[field] = rating
    record.update({"data_period": JSA_PERIOD, "source": JSA_SOURCE, "source_url": JSA_URL})
    return record


def load_records(qilt_path, jsa_path):
    qilt = [qilt_record(row) for row in read_csv(qilt_path)]
    jsa = [jsa_record(row) for row in read_csv(jsa_path)]
    for name, records, key in (("QILT", qilt, "study_area"), ("JSA", jsa, "anzsco_code")):
        keys = [record[key] for record in records]
        if len(keys) != len(set(keys)):
            raise ValueError(f"{name}: duplicate {key} values")
    return {"career_study_area_outcomes": ("study_area", qilt), "career_occupations": ("anzsco_code", jsa)}


def diff(record, current):
    if current is None:
        return "add", ""
    changed = [field for field, value in record.items() if current.get(field) != value]
    return ("change", ", ".join(changed)) if changed else ("same", "")


def plan_changes(tables):
    changes = []
    for table, (key, records) in tables.items():
        current = {row[key]: row for row in supabase.table(table).select("*").execute().data}
        for record in records:
            action, fields = diff(record, current.get(record[key]))
            changes.append({"table": table, "key": record[key], "action": action, "changes": fields})
    return changes


def plan(qilt_path, jsa_path, out_path):
    changes = plan_changes(load_records(qilt_path, jsa_path))
    with open(out_path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(changes)
    counts = {}
    for change in changes:
        counts[(change["table"], change["action"])] = counts.get((change["table"], change["action"]), 0) + 1
    for (table, action), count in sorted(counts.items()):
        print(f"{count:5d}  {table} {action}")
    print(f"{len(changes)} rows written to {out_path}")


def apply(qilt_path, jsa_path):
    for table, (key, records) in load_records(qilt_path, jsa_path).items():
        supabase.table(table).upsert(records, on_conflict=key).execute()
        print(f"upserted {len(records)} rows into {table}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("plan", "apply"):
        command = sub.add_parser(name)
        command.add_argument("--qilt", default=QILT_PATH)
        command.add_argument("--jsa", default=JSA_PATH)
        if name == "plan":
            command.add_argument("--out", required=True)
    args = parser.parse_args()
    if args.command == "plan":
        plan(args.qilt, args.jsa, args.out)
    else:
        apply(args.qilt, args.jsa)


if __name__ == "__main__":
    sys.exit(main())
