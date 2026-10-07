"""Create and delete the labelled accounts the load test signs in with.

Run from the backend folder:
    python -m loadtest.accounts create --count 25
    python -m loadtest.accounts list
    python -m loadtest.accounts delete

`create` makes accounts named loadtest-NN@uni-vise.com, marked
`loadtest: true` and already confirmed (no email is sent), and gives each one a
program and, for half of them, a major. The sign-in details go to
ai/loadtest/accounts.json (local, gitignored). It refuses to run while load-test
accounts still exist. `delete` removes only accounts that carry the mark and the
loadtest- address; deleting an account removes all of its rows.
"""
import argparse
import json
import random
import secrets
import sys
from pathlib import Path

from app.core.database import supabase

OUT = Path(__file__).resolve().parents[2] / "ai" / "loadtest" / "accounts.json"
EMAIL = "loadtest-{:02d}@uni-vise.com"
PAGE = 1000
SEED = 2026


def loadtest_users() -> list:
    users, page = [], 1
    while True:
        batch = supabase.auth.admin.list_users(page=page, per_page=PAGE)
        users += [u for u in batch if (u.user_metadata or {}).get("loadtest") is True]
        if len(batch) < PAGE:
            return users
        page += 1


def assignments(count: int) -> list:
    programs = (
        supabase.table("unsw_degrees_final").select("id, degree_code, program_name")
        .eq("is_offered", True).ilike("program_name", "Bachelor%").not_.like("program_name", "%/%").execute().data
    )
    majors = supabase.table("unsw_specialisations").select("id, major_code, sections_degrees").eq("specialisation_type", "Major").execute().data
    by_program = {}
    for major in majors:
        for degree in major.get("sections_degrees") or []:
            by_program.setdefault(degree.get("degree_code"), []).append(major)
    rng = random.Random(SEED)
    rng.shuffle(programs)
    with_majors = [p for p in programs if by_program.get(p["degree_code"])]
    picks = []
    for n in range(count):
        if n % 2 == 0:
            program = with_majors[(n // 2) % len(with_majors)]
            major = rng.choice(by_program[program["degree_code"]])
        else:
            program, major = programs[(n // 2) % len(programs)], None
        picks.append({**program, "major_id": major["id"] if major else None, "major_code": major["major_code"] if major else None})
    return picks


def create(count: int) -> None:
    existing = loadtest_users()
    if existing:
        sys.exit(f"{len(existing)} load-test accounts already exist; run delete first.")
    picks = assignments(count)
    problems = [p["degree_code"] for p in picks if not p.get("id")]
    if problems or len(picks) != count:
        sys.exit(f"Could not assign programs: {problems}")
    accounts = []
    for n, pick in enumerate(picks, 1):
        email, password = EMAIL.format(n), secrets.token_urlsafe(18)
        user = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"loadtest": True, "student_type": "university"},
        }).user
        accounts.append({"email": email, "password": password, "user_id": user.id, **pick})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(accounts, indent=1))
    with_major = sum(1 for a in accounts if a["major_id"])
    print(f"Created {len(accounts)} accounts ({with_major} with a major) in {OUT}")


def delete() -> None:
    users = loadtest_users()
    unexpected = [u.email for u in users if not (u.email or "").startswith("loadtest-")]
    if unexpected:
        sys.exit(f"Refusing: marked accounts with unexpected emails {unexpected}")
    for user in users:
        supabase.auth.admin.delete_user(user.id)
    if OUT.exists():
        OUT.unlink()
    print(f"Deleted {len(users)} load-test accounts")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("create").add_argument("--count", type=int, required=True)
    commands.add_parser("list")
    commands.add_parser("delete")
    args = parser.parse_args()
    if args.command == "create":
        create(args.count)
    elif args.command == "list":
        users = loadtest_users()
        print(f"{len(users)} load-test accounts: {', '.join(sorted(u.email for u in users))}")
    else:
        delete()


if __name__ == "__main__":
    main()
