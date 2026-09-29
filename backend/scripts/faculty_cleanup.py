"""One-off clean-up of faculty names against the 2026 UNSW Handbook.

Every degree is checked against the owning faculty on its Handbook page (for
double degrees that is the primary owning faculty). Specialisations and
courses are checked only where their current value is not an official name.

Run from the backend folder:
    python -m scripts.faculty_cleanup report --out faculty_changes.csv
    python -m scripts.faculty_cleanup apply --changes faculty_changes.csv

`report` only reads. Review the CSV, delete any row that should not change,
then run `apply`, which updates only rows whose action is "change".
"""
import argparse
import csv
import json
import re
import sys
import time

import httpx

from app.core.database import supabase

HANDBOOK = "https://www.handbook.unsw.edu.au/undergraduate"
YEAR = "2026"
REQUEST_GAP_SECONDS = 1.0
PAGE_SIZE = 1000

OFFICIAL_FACULTIES = {
    "Faculty of Arts, Design and Architecture",
    "Faculty of Engineering",
    "Faculty of Law and Justice",
    "Faculty of Medicine and Health",
    "Faculty of Science",
    "UNSW Business School",
    "UNSW Canberra",
    "UNSW College",
    "DVC (Academic) Board of Studies",
}

FIELDS = ["table", "key", "name", "current", "handbook", "school", "components", "source_url", "action"]

NEXT_DATA = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)


def normalise(name: str) -> str:
    return name.replace(" & ", " and ").strip()


def fetch_rows(table: str, columns: str) -> list[dict]:
    rows, start = [], 0
    while True:
        page = supabase.table(table).select(columns).range(start, start + PAGE_SIZE - 1).execute().data
        rows += page
        if len(page) < PAGE_SIZE:
            return rows
        start += PAGE_SIZE


def handbook_org(client: httpx.Client, url: str) -> dict:
    response = client.get(url)
    response.raise_for_status()
    match = NEXT_DATA.search(response.text)
    if not match:
        raise ValueError("no page data found")
    content = json.loads(match.group(1))["props"]["pageProps"]["pageContent"]

    def value(field: str) -> str:
        item = content.get(field) or {}
        return item.get("value", "") if isinstance(item, dict) else ""

    components = content.get("component_parent_academic_orgs") or []
    return {
        "faculty": normalise(value("parent_academic_org")),
        "school": value("academic_org"),
        "components": "; ".join(sorted({normalise(c.get("value", "")) for c in components if isinstance(c, dict)} - {""})),
    }


def check(client: httpx.Client, table: str, key: str, name: str, current: str | None, url: str) -> dict:
    row = {"table": table, "key": key, "name": name, "current": current or "", "source_url": url}
    try:
        org = handbook_org(client, url)
    except (httpx.HTTPError, ValueError, KeyError) as error:
        return {**row, "handbook": "", "school": "", "components": "", "action": f"error: {error}"}
    finally:
        time.sleep(REQUEST_GAP_SECONDS)
    action = "same" if org["faculty"] == (current or "") else "change"
    if not org["faculty"]:
        action = "error: no faculty on page"
    elif org["faculty"] not in OFFICIAL_FACULTIES:
        action = f"review: unknown faculty {org['faculty']}"
    return {**row, "handbook": org["faculty"], "school": org["school"], "components": org["components"], "action": action}


def report(out_path: str) -> None:
    results = []
    with httpx.Client(headers={"User-Agent": "UniVise faculty check"}, follow_redirects=True, timeout=20) as client:
        for degree in fetch_rows("unsw_degrees_final", "degree_code, program_name, faculty, source_url"):
            url = degree["source_url"] or f"{HANDBOOK}/programs/{YEAR}/{degree['degree_code']}?year={YEAR}"
            results.append(check(client, "unsw_degrees_final", degree["degree_code"], degree["program_name"], degree["faculty"], url))
        for spec in fetch_rows("unsw_specialisations", "major_code, major_name, faculty, source_url"):
            if spec["faculty"] not in OFFICIAL_FACULTIES:
                results.append(check(client, "unsw_specialisations", spec["major_code"], spec["major_name"], spec["faculty"], spec["source_url"]))
        for course in fetch_rows("unsw_courses", "code, title, faculty"):
            if course["faculty"] not in OFFICIAL_FACULTIES:
                url = f"{HANDBOOK}/courses/{YEAR}/{course['code']}?year={YEAR}"
                results.append(check(client, "unsw_courses", course["code"], course["title"], course["faculty"], url))

    with open(out_path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(results)
    counts = {}
    for row in results:
        label = row["action"].split(":")[0]
        counts[label] = counts.get(label, 0) + 1
    print(f"Wrote {len(results)} rows to {out_path}: {counts}")


KEY_COLUMNS = {"unsw_degrees_final": "degree_code", "unsw_specialisations": "major_code", "unsw_courses": "code"}


def apply(changes_path: str) -> None:
    with open(changes_path, newline="") as handle:
        rows = [row for row in csv.DictReader(handle) if row["action"] == "change"]
    unknown = [row for row in rows if row["handbook"] not in OFFICIAL_FACULTIES]
    if unknown:
        sys.exit(f"Refusing to apply: {len(unknown)} rows name a faculty outside the official list")
    for row in rows:
        supabase.table(row["table"]).update({"faculty": row["handbook"]}).eq(KEY_COLUMNS[row["table"]], row["key"]).execute()
        if row["table"] == "unsw_courses":
            supabase.table("mindmesh_nodes_global").update({"faculty": row["handbook"]}).eq("key", row["key"]).execute()
        print(f"{row['table']} {row['key']}: {row['current'] or '(empty)'} -> {row['handbook']}")
    print(f"Applied {len(rows)} changes")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("report").add_argument("--out", required=True)
    commands.add_parser("apply").add_argument("--changes", required=True)
    args = parser.parse_args()
    if args.command == "report":
        report(args.out)
    else:
        apply(args.changes)


if __name__ == "__main__":
    main()
