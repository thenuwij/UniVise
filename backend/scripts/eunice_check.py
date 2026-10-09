"""Check Eunice's answers against the UNSW Handbook data.

Run from the backend folder:
    python -m scripts.eunice_check [--user USER_ID] [--courses 8] [--out ../ai/eunice-check]

Builds Eunice's real prompt and tools for one student (by default the student
with the most ticked courses), asks a fixed set of questions plus a random
sample of course questions, and checks every reply for the facts the database
holds: terms, prerequisite codes, UOC totals, remaining courses and Handbook
links, and an honest "couldn't find" for a made-up course code.

It only reads the database, but it calls the AI model, so each run costs a
little. It prints a summary and writes a Markdown report with every reply.
"""
import argparse
import asyncio
import random
import re
from datetime import datetime
from pathlib import Path

from app.core.database import supabase
from app.llm.openai_client import ask_gpt_stream_with_tools
from app.services.chat import EUNICE_MAX_TOKENS, EUNICE_MODEL, EUNICE_TEMPERATURE, build_system_prompt
from app.services.chat_context import build_student_summary
from app.services.course_picks import load_inputs
from app.services.eunice_tools import TOOLS, course_url, run_tool
from app.services.requirements import requirement_status, to_uoc
from app.services.user_profile import get_student_type, get_user_info, get_user_recommendations

CODE = re.compile(r"\b[A-Z]{4}\d{4}\b")
FAKE_CODE = "ZZZZ9999"
OTHER_PROGRAM = "3778"
OTHER_SPECIALISATION = "COMPI1"


def busiest_student() -> str:
    rows = supabase.from_("user_completed_courses").select("user_id").eq("is_completed", True).execute().data or []
    counts: dict = {}
    for r in rows:
        counts[r["user_id"]] = counts.get(r["user_id"], 0) + 1
    enrolled = {r["user_id"] for r in supabase.from_("user_enrolled_program").select("user_id").execute().data or []}
    ranked = sorted((uid for uid in counts if uid in enrolled), key=lambda uid: -counts[uid])
    if not ranked:
        raise SystemExit("No student with a program and ticked courses.")
    return ranked[0]


def sample_courses(n: int) -> list:
    rows = (
        supabase.from_("unsw_courses")
        .select("code, uoc, offering_terms, conditions_for_enrolment, study_level")
        .ilike("conditions_for_enrolment", "%Prerequisite%")
        .limit(1000)
        .execute()
        .data
        or []
    )
    rows = [r for r in rows if r.get("offering_terms") and CODE.search(r.get("conditions_for_enrolment") or "")]
    return random.sample(rows, min(n, len(rows)))


def build_cases(inputs: dict, courses: list) -> list:
    cases = []
    for c in courses:
        expected = list(c["offering_terms"]) + sorted(set(CODE.findall(c["conditions_for_enrolment"])))
        cases.append({
            "question": f"When is {c['code']} offered and what do I need before I can take it?",
            "expect": expected,
            "expect_any": [course_url(c["code"], c.get("study_level"))],
        })

    cases.append({
        "question": f"What are the prerequisites for {FAKE_CODE}?",
        "expect": [],
        "expect_any": ["couldn't find", "could not find", "can't find", "cannot find", "not in the"],
    })

    if inputs:
        minimum = to_uoc(inputs.get("minimum_uoc"))
        if minimum:
            left = max(minimum - (inputs.get("completed_uoc") or 0), 0)
            cases.append({"question": "How many UOC do I have left to graduate?", "expect": [str(left)], "expect_any": []})
        parts = requirement_status(inputs["requirement_lists"], set(inputs["completed"]), set(inputs.get("added") or []), inputs.get("placed"))
        todo = next((p for p in parts if p["type"] == "required" and p["left"]), None)
        if todo:
            cases.append({"question": f"Which courses do I still need to do in {todo['name']}?", "expect": todo["left"], "expect_any": []})

    program = supabase.from_("unsw_degrees_final").select("program_name, minimum_uoc").eq("degree_code", OTHER_PROGRAM).limit(1).execute().data
    if program:
        cases.append({
            "question": f"How many UOC is program {OTHER_PROGRAM} ({program[0]['program_name']}) in total?",
            "expect": [str(to_uoc(program[0]["minimum_uoc"]))],
            "expect_any": [],
        })
    spec = supabase.from_("unsw_specialisations").select("major_name, uoc_required").eq("major_code", OTHER_SPECIALISATION).limit(1).execute().data
    if spec:
        cases.append({
            "question": f"How many UOC does the {spec[0]['major_name']} major require?",
            "expect": [str(to_uoc(spec[0]["uoc_required"]))],
            "expect_any": [],
        })
    return cases


def grade(reply: str, case: dict) -> list:
    text = reply.lower().replace("\u2019", "'")
    missing = [item for item in case["expect"] if item.lower() not in text]
    if case["expect_any"] and not any(item.lower() in text for item in case["expect_any"]):
        missing.append("one of: " + " | ".join(case["expect_any"]))
    return missing


async def ask(question: str, system: str, user_id: str) -> tuple[str, list]:
    used = []

    async def lookup(name: str, arguments: str) -> str:
        used.append(name)
        return await asyncio.to_thread(run_tool, name, arguments, user_id)

    stream = ask_gpt_stream_with_tools(
        [{"role": "user", "content": question}],
        system,
        TOOLS,
        lookup,
        temperature=EUNICE_TEMPERATURE,
        max_tokens=EUNICE_MAX_TOKENS,
        model=EUNICE_MODEL,
    )
    return "".join([token async for token in stream]), used


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--user", help="Student user id (default: the student with the most ticked courses)")
    parser.add_argument("--courses", type=int, default=8, help="How many random courses to ask about")
    parser.add_argument("--out", default="../ai/eunice-check", help="Folder for the Markdown report")
    args = parser.parse_args()

    user_id = args.user or busiest_student()
    user = type("User", (), {"id": user_id})()
    student_type = await get_student_type(user)
    system = build_system_prompt(
        student_type,
        await get_user_info(user, student_type),
        await get_user_recommendations(user, student_type),
        build_student_summary(user_id),
    )
    cases = build_cases(load_inputs(user_id), sample_courses(args.courses))

    lines = [f"# Eunice check, {datetime.now():%Y-%m-%d %H:%M}", "", f"Model {EUNICE_MODEL}, {len(cases)} questions.", ""]
    passed = 0
    for i, case in enumerate(cases, 1):
        reply, used = await ask(case["question"], system, user_id)
        missing = grade(reply, case)
        passed += not missing
        status = "PASS" if not missing else "FAIL"
        print(f"{status}  {case['question']}" + (f"\n      missing: {', '.join(missing)}" if missing else ""))
        lines += [f"## {i}. {status}: {case['question']}", "", f"Tools used: {', '.join(used) or 'none'}"]
        if missing:
            lines.append(f"Missing: {', '.join(missing)}")
        lines += ["", reply, ""]

    print(f"\n{passed} of {len(cases)} passed")
    lines.insert(3, f"**{passed} of {len(cases)} passed.**")
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"eunice-check-{datetime.now():%Y%m%d-%H%M}.md"
    path.write_text("\n".join(lines))
    print(f"Report: {path}")


if __name__ == "__main__":
    asyncio.run(main())
