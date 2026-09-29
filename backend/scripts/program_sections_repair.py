"""Fill missing program course lists from the 2026 UNSW Handbook.

Targets programs whose stored structure lists no known course but whose
Handbook structure does. Programs whose courses come only from their majors
(for example Computer Science) have nothing to fill and are skipped.

Run from the backend folder:
    python -m scripts.program_sections_repair report --out program_sections.json
    python -m scripts.program_sections_repair apply --changes program_sections.json

`report` only reads. Review the JSON, delete any program that should not
change, then run `apply`, which replaces the sections of the programs left.
"""
import argparse
import json
import re
import time

import httpx

from app.core.database import supabase
from app.services.roadmap.unsw_queries import parse_sections_json

HANDBOOK = "https://www.handbook.unsw.edu.au/undergraduate/programs"
YEAR = "2026"
REQUEST_GAP_SECONDS = 1.0
PAGE_SIZE = 1000

NEXT_DATA = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)
TAG = re.compile(r"<[^>]+>")


def fetch_rows(table: str, columns: str) -> list[dict]:
    rows, start = [], 0
    while True:
        page = supabase.table(table).select(columns).range(start, start + PAGE_SIZE - 1).execute().data
        rows += page
        if len(page) < PAGE_SIZE:
            return rows
        start += PAGE_SIZE


def listed_codes(sections: list) -> list[str]:
    return [
        course.get("code")
        for section in sections if isinstance(section, dict)
        for course in section.get("courses") or [] if isinstance(course, dict)
    ]


def to_int(value) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def plain_text(html: str | None) -> str:
    return re.sub(r"\s+", " ", TAG.sub(" ", html or "")).strip()


def flatten(container: dict) -> list[dict]:
    """One section per Handbook container, depth first, in the stored section format."""
    sections = []
    for child in container.get("container") or []:
        courses = [
            {
                "uoc": to_int(item.get("academic_item_credit_points")),
                "code": item.get("academic_item_code"),
                "name": item.get("academic_item_name"),
            }
            for item in child.get("relationship") or []
            if isinstance(item, dict) and item.get("academic_item_code")
        ]
        sections.append({
            "uoc": to_int(child.get("credit_points")),
            "notes": None,
            "title": child.get("title"),
            "courses": courses,
            "description": plain_text(child.get("description")),
        })
        sections += flatten(child)
    return sections


def handbook_sections(client: httpx.Client, url: str) -> list[dict]:
    response = client.get(url)
    response.raise_for_status()
    match = NEXT_DATA.search(response.text)
    if not match:
        raise ValueError("no page data found")
    content = json.loads(match.group(1))["props"]["pageProps"]["pageContent"]
    return flatten(content.get("curriculumStructure") or {})


def report(out_path: str) -> None:
    known_courses = {row["code"] for row in fetch_rows("unsw_courses", "code")}
    proposals, skipped = {}, []
    with httpx.Client(headers={"User-Agent": "UniVise course list check"}, follow_redirects=True, timeout=20) as client:
        for program in fetch_rows("unsw_degrees_final", "degree_code, program_name, sections, source_url"):
            current = parse_sections_json(program["sections"])
            if any(code in known_courses for code in listed_codes(current)):
                continue
            url = program["source_url"] or f"{HANDBOOK}/{YEAR}/{program['degree_code']}?year={YEAR}"
            try:
                rebuilt = handbook_sections(client, url)
            except (httpx.HTTPError, ValueError, KeyError) as error:
                skipped.append(f"{program['degree_code']}: {error}")
                continue
            finally:
                time.sleep(REQUEST_GAP_SECONDS)
            proposed_codes = listed_codes(rebuilt)
            found = [code for code in proposed_codes if code in known_courses]
            if not found:
                skipped.append(f"{program['degree_code']}: Handbook lists no courses at program level")
                continue
            overview = [s for s in current if isinstance(s, dict) and "overview" in (s.get("title") or "").lower()]
            proposals[program["degree_code"]] = {
                "program_name": program["program_name"],
                "source_url": url,
                "courses_found_in_course_table": len(set(found)),
                "codes_not_in_course_table": sorted(set(proposed_codes) - known_courses),
                "sections": overview + rebuilt,
            }

    with open(out_path, "w") as handle:
        json.dump(proposals, handle, indent=2)
    for code, proposal in proposals.items():
        print(f"{code} {proposal['program_name']}: {proposal['courses_found_in_course_table']} courses, "
              f"{len(proposal['codes_not_in_course_table'])} codes not in the course table")
    for line in skipped:
        print(f"skipped {line}")
    print(f"Wrote {len(proposals)} proposals to {out_path}")


def apply(changes_path: str) -> None:
    with open(changes_path) as handle:
        proposals = json.load(handle)
    for code, proposal in proposals.items():
        supabase.table("unsw_degrees_final").update({"sections": proposal["sections"]}).eq("degree_code", code).execute()
        print(f"{code} {proposal['program_name']}: {len(proposal['sections'])} sections written")
    print(f"Applied {len(proposals)} programs")


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
