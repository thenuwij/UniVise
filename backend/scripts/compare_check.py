"""Run fixed student scenarios through the Compare programs logic and write a report.

Read-only: loads real program and specialisation data from Supabase, never writes
to it, and makes no AI calls. Each scenario is a made-up student (a list of
completed courses) comparing their program with another. The report lists what
counts, what could fill free electives, what won't count and what's left, and
checks that the numbers add up.

Usage: python scripts/compare_check.py   (writes ai/compare-check/report.md)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import supabase  # noqa: E402
from app.services.course_picks import fill_course_uoc  # noqa: E402
from app.services.program_comparison import courses_left, credit_completed_courses, still_to_do, time_impact  # noqa: E402
from app.services.requirements import to_uoc  # noqa: E402
from app.services.roadmap.unsw_queries import parse_sections_json  # noqa: E402

OUT = Path(__file__).resolve().parents[2] / "ai" / "compare-check" / "report.md"

CS_FIRST_YEAR = ["COMP1511", "COMP1521", "COMP1531", "COMP2521", "MATH1131", "MATH1231", "MATH1081", "COMP2511"]
CS_SECOND_YEAR = CS_FIRST_YEAR + ["COMP2041", "COMP3311", "COMP3331", "COMP3121", "COMP6080", "COMP9517", "COMP3511"]
ENG_FIRST_YEAR = ["COMP1511", "MATH1131", "MATH1231", "PHYS1121", "PHYS1221", "ENGG1000", "ELEC1111", "DESN1000"]
COMMERCE_FIRST_YEAR = ["COMM1100", "COMM1110", "COMM1120", "COMM1140", "COMM1150", "COMM1170", "COMM1180", "COMM1190"]

SCENARIOS = [
    ("CS student, 2nd year, to Computer Engineering (Hons)", "3778", CS_SECOND_YEAR, "3707", ["COMPBH"]),
    ("CS student, 2nd year, to Electrical Engineering (Hons)", "3778", CS_SECOND_YEAR, "3707", ["ELECAH"]),
    ("CS student, 2nd year, to Software Engineering (Hons)", "3778", CS_SECOND_YEAR, "3707", ["SENGAH"]),
    ("Engineering 1st year, Electrical to Software Engineering (same program)", "3707", ENG_FIRST_YEAR, "3707", ["SENGAH"]),
    ("Engineering 1st year to Engineering with no major chosen", "3707", ENG_FIRST_YEAR, "3707", []),
    ("CS 1st year to Commerce, Accounting major", "3778", CS_FIRST_YEAR, "3502", ["ACCTA1"]),
    ("Commerce 1st year to Computer Science", "3502", COMMERCE_FIRST_YEAR, "3778", []),
    ("Commerce 1st year to Arts, Psychology major", "3502", COMMERCE_FIRST_YEAR, "3409", ["PSYCD1"]),
    ("No courses ticked, CS to Commerce", "3778", [], "3502", ["ACCTA1"]),
]


def load_program(code):
    return supabase.table("unsw_degrees_final").select("degree_code, program_name, minimum_uoc, sections").eq("degree_code", code).maybe_single().execute().data


def load_completed(codes):
    if not codes:
        return []
    rows = supabase.table("unsw_courses").select("code, title, uoc").in_("code", codes).execute().data or []
    found = {r["code"]: r for r in rows}
    return [{"course_code": c, "course_name": (found.get(c) or {}).get("title") or "", "uoc": (found.get(c) or {}).get("uoc", 6), "is_completed": True} for c in codes]


def run(base_code, completed_codes, target_code, spec_codes):
    base, target = load_program(base_code), load_program(target_code)
    specs = supabase.table("unsw_specialisations").select("major_code, major_name, sections").in_("major_code", spec_codes).execute().data if spec_codes else []
    completed = load_completed(completed_codes)
    completed_uoc = sum(to_uoc(c.get("uoc")) for c in completed)
    lists = fill_course_uoc([(None, parse_sections_json(target.get("sections")))] + [(s["major_name"], parse_sections_json(s["sections"])) for s in specs])
    credit = credit_completed_courses(lists, completed)
    todo = still_to_do(lists, credit)
    timing = time_impact(to_uoc(target.get("minimum_uoc")) or 144, credit["credited_uoc"], to_uoc(base.get("minimum_uoc")) or 144, completed_uoc)
    return base, target, specs, completed, completed_uoc, credit, todo, timing


def checks(completed, completed_uoc, credit, timing, target_total):
    pool = credit["free_pool"]
    credited_codes = [c["code"] for c in credit["credited"]]
    pool_codes = [c["code"] for c in pool["candidates"]]
    lost_codes = [c["code"] for c in credit["lost"]]
    listed_uoc = sum(c["uoc"] for c in credit["credited"])
    candidates_uoc = sum(c["uoc"] for c in pool["candidates"])
    lost_uoc = sum(c["uoc"] for c in credit["lost"])
    results = [
        ("Every course is in exactly one place", sorted(credited_codes + pool_codes + lost_codes) == sorted(c["course_code"] for c in completed)),
        ("Counted + could fill + won't count = UOC done", listed_uoc + candidates_uoc + lost_uoc == completed_uoc),
        ("Free electives never over their room", pool["used_uoc"] <= pool["uoc"]),
        ("UOC carried never more than UOC done", credit["credited_uoc"] <= completed_uoc),
        ("UOC left = program total - carried", timing["uoc_needed"] == max(target_total - credit["credited_uoc"], 0)),
        ("Extra UOC = left if switching - left if staying", timing["extra_uoc"] == timing["uoc_needed"] - timing["base_uoc_left"]),
    ]
    return results


def todo_line(item):
    if item["type"] == "core":
        parts = [f"{len(item['left'])} left: {', '.join(item['left'])}"] if item["left"] else []
        parts += [f"one of {' / '.join(group)}" for group in item["choices"]]
        return f"{item['title']}: {'; '.join(parts)}"
    if item["type"] == "elective":
        return f"{item['title']}: {item['uoc_left']} UOC from {item['options']} listed courses" + (f" or {item['also']}" if item.get("also") else "")
    return f"{item['title']}: {item['uoc_left']} UOC of {item['note']}"


def main():
    lines = ["# Compare programs check", "", "Made-up students on real program data. Read-only, no AI.", ""]
    failures = 0
    for title, base_code, completed_codes, target_code, spec_codes in SCENARIOS:
        base, target, specs, completed, completed_uoc, credit, todo, timing = run(base_code, completed_codes, target_code, spec_codes)
        target_total = to_uoc(target.get("minimum_uoc")) or 144
        pool = credit["free_pool"]
        lines += [
            f"## {title}",
            "",
            f"- From {base['program_name']} ({base_code}) to {target['program_name']} ({target_code})"
            + (f", {', '.join(s['major_name'] for s in specs)}" if specs else ", no major"),
            f"- Done: {len(completed)} courses, {completed_uoc} UOC",
            f"- Counts: {credit['counted_courses']} of {len(completed)} courses, {credit['credited_uoc']} UOC carried",
            f"- Left: {timing['uoc_needed']} UOC if switching vs {timing['base_uoc_left']} UOC if staying, extra {timing['extra_uoc']:+d} UOC, "
            f"{timing['estimated_terms']} vs {timing['base_terms_remaining']} terms ({timing['extra_terms']:+d})",
            f"- About {courses_left(todo)} courses still to do",
            "",
            "**In its course lists**",
            "",
        ]
        lines += [f"- {c['code']} {c['name']} ({c['uoc']} UOC) · {c['section']} · {c['match_type']}" for c in credit["credited"]] or ["- None"]
        lines += ["", f"**Could fill free electives** ({pool['uoc']} UOC of room, {pool['fits_count']} of {len(pool['candidates'])} fit)", ""]
        lines += [f"- {c['code']} {c['name']} ({c['uoc']} UOC)" for c in pool["candidates"]] or ["- None"]
        lines += ["", "**Won't count**", ""]
        lines += [f"- {c['code']} {c['name']} ({c['uoc']} UOC)" for c in credit["lost"]] or ["- None"]
        lines += ["", "**Still to do**", ""]
        lines += [f"- {todo_line(item)}" for item in todo] or ["- Nothing listed"]
        lines += ["", "**Checks**", ""]
        for name, ok in checks(completed, completed_uoc, credit, timing, target_total):
            failures += not ok
            lines.append(f"- {'PASS' if ok else 'FAIL'}: {name}")
        lines.append("")
    lines.insert(3, f"**{failures} check(s) failed across {len(SCENARIOS)} scenarios.**\n")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines))
    print(f"{failures} failed checks, report at {OUT}")


if __name__ == "__main__":
    main()
