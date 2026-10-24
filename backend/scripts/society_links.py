"""Store official links for the verified Arc UNSW societies.

Reads ../ai/society-links/links.json, a list of
{"id", "name", "website_url", "rubric_url"} gathered by a web search and a
Rubric directory read, each website checked to load and name the society.

Run from the backend folder:
    python -m scripts.society_links plan
    python -m scripts.society_links apply [--dry-run]
    python -m scripts.society_links restore --backup ../ai/society-links/backup-<time>.json

`plan` writes summary.md and links.csv next to the input and touches nothing.
`apply` checks every row against the table, backs up the current values, then writes.
"""
import argparse
import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from app.core.database import supabase

FOLDER = Path(__file__).resolve().parents[2] / "ai" / "society-links"
FIELDS = ("website_url", "rubric_url")
BATCH = 50


def load_links() -> list[dict]:
    return json.loads((FOLDER / "links.json").read_text())


def current_rows() -> dict:
    rows = supabase.table("unsw_societies").select("*").execute().data or []
    return {row["id"]: row for row in rows}


def changes(links: list[dict], stored: dict) -> list[dict]:
    out = []
    for link in links:
        row = stored.get(link["id"], {})
        for field in FIELDS:
            before, after = row.get(field), link.get(field)
            if after and before != after:
                out.append({"id": link["id"], "name": link["name"], "field": field, "current": before or "", "proposed": after})
    return out


def plan() -> None:
    links = load_links()
    stored = current_rows()
    found = changes(links, stored)
    unknown = [link["id"] for link in links if link["id"] not in stored]
    shown = Counter("website" if link.get("website_url") else "rubric" if link.get("rubric_url") else "none" for link in links)
    with open(FOLDER / "links.csv", "w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["id", "name", "category", "website_url", "rubric_url", "evidence"])
        for link in sorted(links, key=lambda x: x["name"].lower()):
            writer.writerow([link["id"], link["name"], stored.get(link["id"], {}).get("arc_category", ""), link.get("website_url") or "", link.get("rubric_url") or "", link.get("evidence") or ""])
    lines = [
        "# Society links plan",
        "",
        f"Generated {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC. Nothing was written to the database.",
        "",
        f"Societies in the table: {len(stored)}. In the links file: {len(links)}. Unknown ids: {len(unknown)}.",
        "",
        "| Students will see | Societies |",
        "|---|---|",
        f"| Official website | {shown['website']} |",
        f"| Rubric page (no website) | {shown['rubric']} |",
        f"| No link | {shown['none']} |",
        "",
        f"Field writes: {Counter(c['field'] for c in found)['website_url']} website_url, {Counter(c['field'] for c in found)['rubric_url']} rubric_url.",
        "",
        "Every society with its links and evidence is in `links.csv`.",
    ]
    (FOLDER / "summary.md").write_text("\n".join(lines))
    print(f"Wrote {FOLDER / 'summary.md'} and links.csv")


def preflight(links: list[dict], stored: dict) -> list[str]:
    problems = []
    sample = next(iter(stored.values()), {})
    missing = [f for f in (*FIELDS, "links_checked_at") if f not in sample]
    if missing:
        problems.append(f"unsw_societies is missing columns {missing}; apply the migration first")
    for link in links:
        if link["id"] not in stored:
            problems.append(f"{link['name']}: id {link['id']} is not in unsw_societies")
        for field in FIELDS:
            value = link.get(field)
            if value and not value.startswith("https://") and not value.startswith("http://"):
                problems.append(f"{link['name']}: {field} is not a URL: {value}")
    return problems


def apply(dry_run: bool) -> None:
    links = load_links()
    stored = current_rows()
    problems = preflight(links, stored)
    if problems:
        raise SystemExit("Pre-flight check failed:\n" + "\n".join(problems[:30]))
    found = changes(links, stored)
    ids = sorted({c["id"] for c in found})
    print(f"Pre-flight check passed: {len(ids)} societies to update ({len(found)} field changes).")
    if dry_run:
        print("Dry run: nothing was written.")
        return
    backup = FOLDER / f"backup-{datetime.now():%Y%m%d-%H%M%S}.json"
    backup.write_text(json.dumps([{k: stored[i].get(k) for k in ("id", *FIELDS, "links_checked_at")} for i in ids], indent=1))
    print(f"Backup written to {backup}")
    checked = datetime.now(timezone.utc).isoformat()
    by_id = {link["id"]: link for link in links}
    for start in range(0, len(ids), BATCH):
        for society_id in ids[start:start + BATCH]:
            link = by_id[society_id]
            payload = {f: link.get(f) for f in FIELDS if link.get(f)}
            payload["links_checked_at"] = checked
            supabase.table("unsw_societies").update(payload).eq("id", society_id).execute()
    print("All rows written.")


def restore(path: Path) -> None:
    rows = json.loads(path.read_text())
    for row in rows:
        supabase.table("unsw_societies").update({k: row.get(k) for k in (*FIELDS, "links_checked_at")}).eq("id", row["id"]).execute()
    print(f"Restored {len(rows)} societies from {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
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
