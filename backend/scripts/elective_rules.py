"""Put the Handbook's elective rules back on program and specialisation sections.

The Handbook import kept only listed courses, so rules such as "any level 3
Computer Science course" were dropped and lists like Computing Electives looked
like a short fixed list. This reads every rule from the local official snapshot
and adds it to the owning section twice: as `rules` (a code prefix, or a
faculty or school with levels) for Compare, and as a sentence in the
description ("Also counts: any COMP3*** course.") for the Courses page.

Usage (from backend/):
    python -m scripts.elective_rules plan                writes ai/elective-rules/ and touches nothing
    python -m scripts.elective_rules apply [--dry-run]   pre-flight, backup of every touched row, then writes
    python -m scripts.elective_rules restore --backup ../ai/elective-rules/backup-<time>.json
"""
import argparse
import csv
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from app.core.database import supabase
from scripts.display_data_cleanup import fetch_rows
from scripts.handbook_import import container_kind, load_snapshot, ordered, to_int

OUT = Path(__file__).resolve().parents[2] / "ai" / "elective-rules"
YEAR = "2026"
LEVEL = "undergraduate"
BATCH = 10
PREFIX = re.compile(r"^[A-Z]{4}\d{0,3}$")
CODE = re.compile(r"^[A-Z]{4}\d{4}$")
SKIP_KINDS = {"free_elective", "general_education"}
MAJOR_AREA_SUBJECTS = 6
TABLES = {"programs": ("unsw_degrees_final", "degree_code"), "specialisations": ("unsw_specialisations", "major_code")}


def org_names(pages: dict) -> dict:
    names = {}
    for page in pages["courses"].values():
        content = page.get("content") or page
        for field in ("parent_academic_org", "academic_org"):
            value = content.get(field)
            if isinstance(value, dict) and value.get("cl_id") and value.get("value"):
                names[value["cl_id"]] = value["value"]
    return names


def read_rule(entry: dict, orgs: dict) -> dict | None:
    try:
        members = json.loads(entry.get("rule") or "{}").get("operator_group_members") or []
    except ValueError:
        return None
    rule = {"prefixes": [], "orgs": [], "levels": [], "except": []}
    for member in members:
        m = member.get("map") or {}
        field, op, value = m.get("field"), m.get("operator_value"), str(m.get("input_value") or "")
        if field in ("subclass", "study_level"):
            continue
        if field == "code" and op in ("STARTSWITH", "=") and PREFIX.match(value.upper()):
            rule["prefixes"].append(value.upper())
        elif field == "code" and op == "!=" and CODE.match(value.upper()):
            rule["except"].append(value.upper())
        elif field in ("parent_academic_org", "academic_org") and op in ("=", "IN"):
            rule["orgs"] += [orgs.get(v.strip(), v.strip()) for v in value.split(",") if v.strip()]
        elif field == "level" and op in ("=", "IN"):
            rule["levels"] += [int(v) for v in value.split(",") if v.strip().isdigit()]
        else:
            return None
    return rule if rule["prefixes"] or rule["orgs"] else None


def flatten(rules: list[dict]) -> list[dict]:
    out = []
    for rule in rules:
        extra = {"except": rule["except"]} if rule["except"] else {}
        if rule["prefixes"]:
            out += [{"prefix": p, **extra} for p in rule["prefixes"]]
        else:
            out.append({"orgs": rule["orgs"], **({"levels": sorted(set(rule["levels"]))} if rule["levels"] else {}), **extra})
    unique = []
    for rule in out:
        if rule not in unique:
            unique.append(rule)
    return unique


def is_major_area(rules: list[dict]) -> bool:
    return sum(1 for r in rules if len(r.get("prefix", "")) == 4) >= MAJOR_AREA_SUBJECTS


def is_rule_only(container: dict) -> bool:
    title = (container.get("title") or "").strip().lower()
    has_courses = any(isinstance(r, dict) and r.get("academic_item_code") for r in container.get("relationship") or [])
    return title.startswith("any ") and not has_courses


def section_rules(structure: dict, orgs: dict) -> list[dict]:
    """Walk containers exactly as the import does; rules on a rule-only child belong to the section above it."""
    sections = []

    def rules_of(container):
        entries = [r for r in container.get("relationship") or [] if isinstance(r, dict) and not r.get("academic_item_code") and r.get("rule")]
        entries += [r for r in container.get("dynamic_relationship") or [] if isinstance(r, dict) and r.get("rule")]
        return [rule for rule in (read_rule(e, orgs) for e in entries) if rule]

    def add(container, inherited, owner):
        kind = container_kind(container, inherited)
        index = len(sections)
        sections.append({"title": container.get("title"), "kind": kind, "rules": []})
        collect(container, kind, owner if owner is not None and is_rule_only(container) else index)

    def collect(container, kind, target):
        sections[target]["rules"] += rules_of(container)
        for child in ordered(container.get("container")):
            if to_int(child.get("credit_points")) is not None or container_kind(child) in ("info", "limit"):
                add(child, kind, target)
            else:
                collect(child, container_kind(child, kind), target)

    for top in ordered((structure or {}).get("container")):
        add(top, None, None)
    for section in sections:
        section["rules"] = flatten(section["rules"])
    return sections


def _joined(items: list[str]) -> str:
    return items[0] if len(items) == 1 else f"{', '.join(items[:-1])} or {items[-1]}"


def _levels(levels: list[int]) -> str:
    if not levels:
        return ""
    if len(levels) > 1 and levels == list(range(levels[0], levels[0] + len(levels))) and levels[-1] >= 6:
        return f"level {levels[0]} or higher "
    return f"level {_joined([str(x) for x in levels])} "


def rule_text(rules: list[dict]) -> str:
    prefixes = sorted(r["prefix"] for r in rules if "prefix" in r)
    excluded = list(dict.fromkeys(c for r in rules for c in r.get("except", [])))
    parts = []
    if prefixes:
        parts.append(f"any {_joined([p.ljust(8, '*') for p in prefixes])} course" + (f" (except {', '.join(excluded)})" if excluded else ""))
    parts += [f"any {_levels(r.get('levels', []))}course offered by {_joined(r['orgs'])}" for r in rules if "orgs" in r]
    return f"Also counts: {'; '.join(parts)}." if parts else ""


def find_section(db_sections: list, offset: int, index: int, title: str) -> int | None:
    at = index + offset
    if 0 <= at < len(db_sections) and (db_sections[at].get("title") or "").strip() == (title or "").strip():
        return at
    same = [i for i, s in enumerate(db_sections) if (s.get("title") or "").strip() == (title or "").strip()]
    return same[0] if len(same) == 1 else None


def as_sections(value) -> list:
    return value if isinstance(value, list) else json.loads(value or "[]")


def plan() -> None:
    _, pages = load_snapshot(LEVEL, YEAR)
    orgs = org_names(pages)
    rows_out, summary, skipped = [], defaultdict(int), []
    for kind, (table, key) in TABLES.items():
        db_rows = defaultdict(list)
        for row in fetch_rows(table, f"id, {key}, sections"):
            db_rows[row[key]].append(row)
        for code, page in sorted(pages[kind].items()):
            built = section_rules((page.get("content") or page).get("curriculumStructure"), orgs)
            for index, section in enumerate(built):
                if not section["rules"] or section["kind"] in SKIP_KINDS:
                    continue
                summary["sections with rules"] += 1
                if is_major_area(section["rules"]):
                    summary["skipped, list of major areas"] += 1
                    skipped.append(f"{code} · {section['title']}")
                    continue
                text, rules = rule_text(section["rules"]), json.dumps(section["rules"])
                base = {"table": table, "code": code, "title": section["title"], "added": text, "rules": rules}
                if not db_rows.get(code):
                    rows_out.append({**base, "id": "", "index": "", "status": "not in database", "current": ""})
                    summary["not in database"] += 1
                    continue
                for row in db_rows[code]:
                    db_sections = as_sections(row["sections"])
                    offset = 1 if db_sections and (db_sections[0].get("title") or "").lower() == "overview" else 0
                    at = find_section(db_sections, offset, index, section["title"])
                    current = (db_sections[at].get("description") or "") if at is not None else ""
                    status = "no matching section" if at is None else "already there" if db_sections[at].get("rules") == section["rules"] else "add"
                    summary[status] += 1
                    rows_out.append({**base, "id": row["id"], "index": "" if at is None else at, "status": status, "current": current})
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "plan.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["table", "code", "id", "index", "title", "status", "rules", "current", "added"])
        writer.writeheader()
        writer.writerows(rows_out)
    adds = [r for r in rows_out if r["status"] == "add"]
    lines = ["# Elective rules plan", "", f"Snapshot: {LEVEL} {YEAR}. Nothing has been written.", ""]
    lines += [f"- {name}: {count}" for name, count in sorted(summary.items())]
    lines += [f"- rows to change: {len({(r['table'], r['id']) for r in adds})}", ""]
    lines += ["## Additions", ""] + [f"- {r['code']} · {r['title'].strip()}: {r['added']}" for r in adds]
    problems = [r for r in rows_out if r["status"] in ("no matching section", "not in database")]
    lines += ["", "## Not matched", ""] + ([f"- {r['code']} · {r['title'].strip()}: {r['status']}" for r in problems] or ["- None"])
    lines += ["", "## Skipped, lists of major areas", ""] + ([f"- {s}" for s in skipped] or ["- None"])
    (OUT / "summary.md").write_text("\n".join(lines))
    print("\n".join(lines[:10]))
    print(f"Plan written to {OUT}")


def apply(dry_run: bool) -> None:
    with open(OUT / "plan.csv") as f:
        adds = [r for r in csv.DictReader(f) if r["status"] == "add"]
    by_row = defaultdict(list)
    for r in adds:
        by_row[(r["table"], r["id"])].append(r)
    live, problems = {}, []
    for (table, row_id), changes in by_row.items():
        sections = as_sections(supabase.table(table).select("sections").eq("id", row_id).single().execute().data["sections"])
        for change in changes:
            i = int(change["index"])
            if i >= len(sections) or (sections[i].get("title") or "").strip() != change["title"].strip():
                problems.append(f"{change['code']}: section {i} is no longer '{change['title']}'")
            elif (sections[i].get("description") or "") != change["current"] or sections[i].get("rules"):
                problems.append(f"{change['code']}: '{change['title']}' changed since the plan")
        live[(table, row_id)] = sections
    if problems:
        raise SystemExit("Pre-flight failed, nothing written:\n" + "\n".join(problems))
    print(f"Pre-flight passed: {len(adds)} sections in {len(live)} rows.")
    if dry_run:
        return
    backup = OUT / f"backup-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    backup.write_text(json.dumps([{"table": t, "id": i, "sections": s} for (t, i), s in live.items()], ensure_ascii=False))
    print(f"Backup written to {backup}")
    updated = {}
    for (table, row_id), sections in live.items():
        new = [dict(s) for s in sections]
        for change in by_row[(table, row_id)]:
            i = int(change["index"])
            new[i]["description"] = "\n".join(x for x in (change["current"].strip(), change["added"]) if x)
            new[i]["rules"] = json.loads(change["rules"])
        updated[(table, row_id)] = new
    items = list(updated.items())
    for start in range(0, len(items), BATCH):
        for (table, row_id), sections in items[start:start + BATCH]:
            supabase.table(table).update({"sections": sections}).eq("id", row_id).execute()
        print(f"Wrote {min(start + BATCH, len(items))} of {len(items)} rows")
    bad = [f"{t} {i}" for (t, i), s in updated.items() if as_sections(supabase.table(t).select("sections").eq("id", i).single().execute().data["sections"]) != s]
    if bad:
        raise SystemExit(f"Verify failed for {bad}. Restore with --backup {backup}")
    print("Verified every row.")


def restore(path: Path) -> None:
    for item in json.loads(path.read_text()):
        supabase.table(item["table"]).update({"sections": item["sections"]}).eq("id", item["id"]).execute()
    print(f"Restored {path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("plan")
    commands.add_parser("apply").add_argument("--dry-run", action="store_true")
    commands.add_parser("restore").add_argument("--backup", required=True)
    args = parser.parse_args()
    if args.command == "plan":
        plan()
    elif args.command == "apply":
        apply(args.dry_run)
    else:
        restore(Path(args.backup))


if __name__ == "__main__":
    main()
