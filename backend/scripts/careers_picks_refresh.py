"""Refresh the Careers page's top picks for every program students have saved.

Top picks (jobs and internships read from SEEK by Claude Haiku and chosen by
Claude Opus) are made once when a student first opens Careers for their own
program, then only refreshed when this script runs. It finds each saved
program and specialisation combination through the student's latest roadmap
and refreshes it once, however many students share it.

Run from the backend folder:
    python -m scripts.careers_picks_refresh plan
    python -m scripts.careers_picks_refresh apply

`plan` lists the combinations without calling Claude. `apply` refreshes jobs
and internships for each one, which costs about 8 cents per combination.
"""
import argparse
import asyncio

from app.services.careers.feed import MANUAL_SOURCES, degree_key, degree_label, saved_program_roadmaps
from app.services.careers.refresh import force_refresh


async def refresh_all(roadmaps: list) -> None:
    for roadmap in roadmaps:
        states = await asyncio.gather(*(force_refresh(roadmap, source) for source in MANUAL_SOURCES))
        summary = ", ".join(f"{state['source']}: {state['status']} ({len(state['items'])})" for state in states)
        print(f"- {degree_key(roadmap)}: {summary}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=["plan", "apply"])
    args = parser.parse_args()

    roadmaps = saved_program_roadmaps()
    print(f"{len(roadmaps)} saved program combinations")
    for roadmap in roadmaps:
        print(f"- {degree_key(roadmap)}: {degree_label(roadmap)}")
    if args.command == "apply":
        asyncio.run(refresh_all(roadmaps))


if __name__ == "__main__":
    main()
