"""Lists the occupations a graduate of each QILT study area can be shown.

The Careers step only accepts a role whose occupation group is allowed for the
program's study area, so a social science degree can't be given an engineering
role. Only areas used by at least one program or major are listed.

Run from the backend folder:
    python -m scripts.study_area_occupations plan --out ../ai/phase-8-area-occupations.csv
    python -m scripts.study_area_occupations apply --mapping data/career/study_area_occupations.csv

`plan` only reads: the AI drafts each area's list from the bachelor-level
occupation groups in career_occupations. Review the file, add or delete rows,
then `apply` replaces study_area_occupations with it.
"""
import argparse
import asyncio
import csv
import sys
from typing import Literal

from pydantic import BaseModel, Field

from app.core.database import supabase
from app.llm.openai_client import ask_gpt_structured

FIELDS = ["study_area", "anzsco_code", "title"]


def used_study_areas():
    programs = supabase.table("program_study_areas").select("study_area").range(0, 999).execute().data
    majors = supabase.table("specialisation_study_areas").select("study_area").range(0, 999).execute().data
    return sorted({row["study_area"] for row in programs + majors})


def occupation_schema(codes):
    Code = Literal[tuple(codes)]

    class AreaOccupations(BaseModel):
        anzsco_codes: list[Code] = Field(min_length=5, max_length=40)

    return AreaOccupations


def area_prompt(area, occupations):
    lines = "\n".join(f"{row['anzsco_code']} {row['title']}" for row in occupations)
    return (
        f"Australian university graduates from the QILT study area \"{area}\" are about to be shown career roles.\n"
        "From the occupation groups below, choose every group these graduates commonly work in, at entry level or later in their careers "
        "(including management groups they typically progress into). Include generalist groups only when graduates of this area often take them. "
        "Leave out groups that need a different degree, such as a registered profession from another field.\n\n"
        f"Occupation groups (ANZSCO code and title):\n{lines}\n\n"
        "Return the chosen ANZSCO codes."
    )


async def draft(areas, occupations):
    schema = occupation_schema([row["anzsco_code"] for row in occupations])
    titles = {row["anzsco_code"]: row["title"] for row in occupations}
    rows = []
    for area in areas:
        result = await ask_gpt_structured(area_prompt(area, occupations), schema, max_tokens=2000, temperature=0.2, model="gpt-5.4-mini")
        for code in sorted(set(result.anzsco_codes)):
            rows.append({"study_area": area, "anzsco_code": code, "title": titles[code]})
    return rows


def plan(out_path):
    occupations = supabase.table("career_occupations").select("anzsco_code, title").order("anzsco_code").execute().data
    rows = asyncio.run(draft(used_study_areas(), occupations))
    with open(out_path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    counts = {}
    for row in rows:
        counts[row["study_area"]] = counts.get(row["study_area"], 0) + 1
    for area, count in counts.items():
        print(f"{count:4d}  {area}")
    print(f"{len(rows)} rows written to {out_path}")


def read_mapping(path, known_codes, known_areas):
    with open(path, newline="") as handle:
        rows = [{"study_area": row["study_area"].strip(), "anzsco_code": row["anzsco_code"].strip()} for row in csv.DictReader(handle)]
    for row in rows:
        if row["study_area"] not in known_areas or row["anzsco_code"] not in known_codes:
            raise ValueError(f"unknown study area or occupation: {row}")
    pairs = {(row["study_area"], row["anzsco_code"]) for row in rows}
    if len(pairs) != len(rows):
        raise ValueError("duplicate study area and occupation pairs")
    return rows


def apply(path):
    known_codes = {row["anzsco_code"] for row in supabase.table("career_occupations").select("anzsco_code").execute().data}
    known_areas = {row["study_area"] for row in supabase.table("career_study_area_outcomes").select("study_area").execute().data}
    rows = read_mapping(path, known_codes, known_areas)
    supabase.table("study_area_occupations").delete().neq("study_area", "").execute()
    supabase.table("study_area_occupations").insert(rows).execute()
    print(f"wrote {len(rows)} rows for {len({row['study_area'] for row in rows})} study areas")


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
