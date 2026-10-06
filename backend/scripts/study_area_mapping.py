"""Matches every offered program and every major to its QILT study area.

The study area decides which graduate outcomes the Careers step shows and
which occupations its roles may use. Single degrees and majors get one area,
double degrees one per degree.

Run from the backend folder:
    python -m scripts.study_area_mapping plan --out ../ai/phase-8-study-areas.csv
    python -m scripts.study_area_mapping apply --mapping ../ai/phase-8-study-areas.csv

`plan` only reads the catalogue. It proposes areas from name rules, then from
the two halves of a double degree, then asks the AI for anything left (limited
to the 21 areas). Rows marked check=yes need a person's decision. `apply`
replaces both mapping tables with the reviewed file.
"""
import argparse
import asyncio
import csv
import re
import sys
from typing import Literal

from pydantic import BaseModel, Field

from app.core.database import supabase
from app.llm.openai_client import ask_gpt_structured
from app.services.roadmap.unsw_queries import normalise_program_name

STUDY_AREAS = [
    "Agriculture and environmental studies",
    "Architecture and built environment",
    "Business and management",
    "Communications",
    "Computing and information systems",
    "Creative arts",
    "Dentistry",
    "Engineering",
    "Health services and support",
    "Humanities, culture and social sciences",
    "Law and paralegal studies",
    "Medicine",
    "Nursing",
    "Pharmacy",
    "Psychology",
    "Rehabilitation",
    "Science and mathematics",
    "Social work",
    "Teacher education",
    "Tourism, hospitality, personal services, sport and recreation",
    "Veterinary science",
]

RULES = [
    (r"social work", "Social work", False),
    (r"psycholog", "Psychology", False),
    (r"\blaws?\b|juris", "Law and paralegal studies", False),
    (r"\bmedicine\b|medical studies", "Medicine", False),
    (r"pharmac(?!olog)", "Pharmacy", False),
    (r"exercise|physiotherap|occupational therap|speech path", "Rehabilitation", True),
    (r"optometr|vision science|optical", "Health services and support", True),
    (r"\bteach|\beducation\b", "Teacher education", False),
    (r"construction|architect|planning|landscape|property|built environment|interior", "Architecture and built environment", False),
    (r"software engineering", "Engineering", True),
    (r"engineer", "Engineering", False),
    (r"computer science|computing|information systems|information technology|data science|cyber|artificial intelligence", "Computing and information systems", False),
    (r"environment", "Science and mathematics", True),
    (r"actuar|commerce|business|econom|accounting|finance|marketing|taxation|management|human resource", "Business and management", False),
    (r"\bmedia\b|communication|journalism|public relations", "Communications", True),
    (r"\bdesign\b", "Creative arts", True),
    (r"fine arts|music|film|theatre|performance|dance|creative|art theory|art history|visual", "Creative arts", False),
    (r"medical science|biomedical science", "Science and mathematics", True),
    (r"public health|health|nutrition|nursing|midwif", "Health services and support", True),
    (r"social science|criminolog|politic|international|language|histor|philosoph|sociolog|indigenous|gender|asian|linguist|english|literature|french|chinese|japanese|korean|spanish|german|italian|indonesian|european|global|human rights|development studies|anthropolog|\barts\b", "Humanities, culture and social sciences", False),
    (r"science|biolog|chemi|physics|mathemat|statistic|geo|biotech|genetic|neuro|marine|ecolog|anatom|patholog|physiolog|pharmacolog|microbio|immunol|astro|climate|quantum|food|materials", "Science and mathematics", False),
]

FIELDS = ["type", "code", "name", "faculty", "areas", "how", "check"]
BATCH_SIZE = 40
PAGE_SIZE = 1000

StudyArea = Literal[tuple(STUDY_AREAS)]


class Assignment(BaseModel):
    code: str
    areas: list[StudyArea] = Field(min_length=1, max_length=2)


class Assignments(BaseModel):
    items: list[Assignment]


def rule_area(name):
    lowered = (name or "").lower()
    for pattern, area, check in RULES:
        if re.search(pattern, lowered):
            return area, check
    return None, True


def is_double_degree(name):
    lowered = (name or "").lower()
    return "/" in lowered or lowered.count("bachelor") > 1


def fetch_rows(table, columns, **filters):
    rows, start = [], 0
    while True:
        query = supabase.table(table).select(columns)
        for column, value in filters.items():
            query = query.eq(column, value)
        page = query.range(start, start + PAGE_SIZE - 1).execute().data
        rows += page
        if len(page) < PAGE_SIZE:
            return rows
        start += PAGE_SIZE


def propose_singles(rows, kind, code_key, name_key):
    proposals, leftover = [], []
    for row in rows:
        area, check = rule_area(row[name_key])
        entry = {"type": kind, "code": row[code_key], "name": row[name_key], "faculty": row.get("faculty") or ""}
        if area:
            proposals.append({**entry, "areas": [area], "how": "rule", "check": check})
        else:
            leftover.append(entry)
    return proposals, leftover


def propose_from_halves(doubles, singles_by_name):
    proposals, leftover = [], []
    for row in doubles:
        entry = {"type": "program", "code": row["degree_code"], "name": row["program_name"], "faculty": row.get("faculty") or ""}
        halves = [singles_by_name.get(normalise_program_name(part)) for part in row["program_name"].split("/")] if "/" in row["program_name"] else []
        if len(halves) == 2 and all(halves):
            areas = list(dict.fromkeys(area for half in halves for area in half["areas"]))
            proposals.append({**entry, "areas": areas, "how": "halves", "check": any(half["check"] for half in halves)})
        else:
            leftover.append(entry)
    return proposals, leftover


def ai_prompt(batch):
    lines = "\n".join(f"- {item['code']} | {item['type']} | {item['name']} | {item['faculty']}" for item in batch)
    return (
        "Assign each UNSW program or major below to the QILT Graduate Outcomes Survey study area its graduates are counted in.\n"
        "A single degree or a major gets exactly one area. A double degree gets one area per degree, so two areas, or one if both degrees fall in the same area.\n"
        "Use only these areas, spelled exactly: " + "; ".join(STUDY_AREAS) + "\n\n"
        "Items (code | type | name | faculty):\n" + lines + "\n\n"
        "Return one item per code, using the codes exactly as given."
    )


async def propose_with_ai(leftover):
    proposals = []
    for start in range(0, len(leftover), BATCH_SIZE):
        batch = leftover[start:start + BATCH_SIZE]
        result = await ask_gpt_structured(ai_prompt(batch), Assignments, max_tokens=4000, temperature=0.2, model="gpt-5.4-mini")
        by_code = {item.code: item.areas for item in result.items}
        for entry in batch:
            areas = by_code.get(entry["code"]) or []
            proposals.append({**entry, "areas": list(dict.fromkeys(areas)), "how": "AI" if areas else "none", "check": True})
    return proposals


def plan_mapping():
    programs = [row for row in fetch_rows("unsw_degrees_final", "degree_code, program_name, faculty, is_offered") if row.get("is_offered")]
    majors = fetch_rows("unsw_specialisations", "major_code, major_name, faculty", specialisation_type="Major")
    singles = [row for row in programs if not is_double_degree(row["program_name"])]
    doubles = [row for row in programs if is_double_degree(row["program_name"])]

    single_proposals, leftover = propose_singles(singles, "program", "degree_code", "program_name")
    major_proposals, major_leftover = propose_singles(majors, "major", "major_code", "major_name")
    singles_by_name = {normalise_program_name(p["name"]): p for p in single_proposals}
    double_proposals, double_leftover = propose_from_halves(doubles, singles_by_name)

    ai_proposals = asyncio.run(propose_with_ai(leftover + double_leftover + major_leftover))
    proposals = single_proposals + double_proposals + major_proposals + ai_proposals
    return sorted(proposals, key=lambda p: (p["type"] != "program", not p["check"], p["name"]))


def plan(out_path):
    proposals = plan_mapping()
    with open(out_path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for proposal in proposals:
            writer.writerow({**proposal, "areas": "; ".join(proposal["areas"]), "check": "yes" if proposal["check"] else ""})
    counts = {}
    for proposal in proposals:
        key = (proposal["type"], proposal["how"], proposal["check"])
        counts[key] = counts.get(key, 0) + 1
    for (kind, how, check), count in sorted(counts.items()):
        print(f"{count:5d}  {kind:8s} {how:7s} {'check' if check else ''}")
    print(f"{len(proposals)} rows written to {out_path}")


def read_mapping(path):
    with open(path, newline="") as handle:
        rows = list(csv.DictReader(handle))
    program_rows, major_rows = [], []
    for row in rows:
        areas = [area.strip() for area in row["areas"].split(";") if area.strip()]
        unknown = [area for area in areas if area not in STUDY_AREAS]
        if not areas or unknown:
            raise ValueError(f"{row['code']}: needs one or two of the 21 study areas, got {row['areas']!r}")
        for area in areas:
            if row["type"] == "program":
                program_rows.append({"degree_code": row["code"], "study_area": area})
            elif row["type"] == "major":
                major_rows.append({"major_code": row["code"], "study_area": area})
            else:
                raise ValueError(f"{row['code']}: unknown type {row['type']!r}")
    return program_rows, major_rows


def apply(path):
    program_rows, major_rows = read_mapping(path)
    supabase.table("program_study_areas").delete().neq("degree_code", "").execute()
    supabase.table("specialisation_study_areas").delete().neq("major_code", "").execute()
    supabase.table("program_study_areas").insert(program_rows).execute()
    supabase.table("specialisation_study_areas").insert(major_rows).execute()
    print(f"wrote {len(program_rows)} program rows and {len(major_rows)} major rows")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    plan_cmd = sub.add_parser("plan")
    plan_cmd.add_argument("--out", required=True)
    apply_cmd = sub.add_parser("apply")
    apply_cmd.add_argument("--mapping", required=True)
    args = parser.parse_args()
    if args.command == "plan":
        plan(args.out)
    else:
        apply(args.mapping)


if __name__ == "__main__":
    sys.exit(main())
