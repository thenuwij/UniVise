OPTION_KINDS = {"elective", "general_education", "free_elective"}
OPEN_KINDS = {"free_elective", "general_education"}
STANDARD_COURSE_UOC = 6
MAX_CODES = 12


def _code(course) -> str:
    return (course.get("code") or "").strip().upper() if isinstance(course, dict) else ""


def to_uoc(value) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def requirement_status(section_lists: list, completed: set, added: set | None = None, placed: list | None = None) -> list:
    added = added or set()
    parts = []
    listed = {_code(c) for _, sections in section_lists for s in sections or [] if isinstance(s, dict) for c in s.get("courses") or []}
    for label, sections in section_lists:
        choices: dict = {}
        for section in sections or []:
            if not isinstance(section, dict):
                continue
            title = (section.get("title") or "").strip()
            kind = section.get("kind") or "core"
            if not title or "overview" in title.lower() or kind == "info":
                continue
            name = f"{label}: {title}" if label else title
            uoc_needed = to_uoc(section.get("uoc"))
            courses = [c for c in section.get("courses") or [] if _code(c)]

            for course in courses:
                if course.get("choice"):
                    key = course["choice"]
                    if key not in choices:
                        choices[key] = {"type": "choice", "name": label, "codes": []}
                        parts.append(choices[key])
                    if _code(course) not in choices[key]["codes"]:
                        choices[key]["codes"].append(_code(course))

            plain = [c for c in courses if not c.get("choice")]
            if not courses:
                if uoc_needed and kind != "choice":
                    parts.append({"type": "open", "name": name, "title": title, "uoc": uoc_needed, "kind": kind, "done": [], "planned": [], "done_uoc": 0})
                continue

            required = [_code(c) for c in plain if (c.get("kind") or kind) not in OPTION_KINDS]
            options = [c for c in plain if (c.get("kind") or kind) in OPTION_KINDS]
            if required:
                parts.append({
                    "type": "required",
                    "name": name,
                    "done": [c for c in required if c in completed],
                    "left": [c for c in required if c not in completed],
                })
            if options:
                done = [c for c in options if _code(c) in completed]
                parts.append({
                    "type": "options",
                    "name": name,
                    "uoc": uoc_needed,
                    "count": len(options),
                    "done": [_code(c) for c in done],
                    "done_uoc": sum(to_uoc(c.get("uoc")) for c in done),
                    "planned": [_code(c) for c in options if _code(c) in added and _code(c) not in completed],
                })

    for part in parts:
        if part["type"] == "choice":
            part["done"] = [c for c in part["codes"] if c in completed]

    open_parts = [p for p in parts if p["type"] == "open" and p.get("kind") in OPEN_KINDS]
    titles = [p["title"] for p in open_parts]
    for row in placed or []:
        if not titles or row["code"] in listed:
            continue
        title = row.get("section") if row.get("section") in titles else titles[0]
        part = open_parts[titles.index(title)]
        key = "done" if row["code"] in completed else "planned"
        part[key].append(row["code"])
        if key == "done":
            part["done_uoc"] += to_uoc(row.get("uoc"))
    return parts


def _codes(codes: list) -> str:
    shown = codes[:MAX_CODES]
    extra = f" and {len(codes) - len(shown)} more" if len(codes) > len(shown) else ""
    return ", ".join(shown) + extra


def format_requirements(parts: list, minimum_uoc, completed_uoc: int) -> str:
    lines = []
    minimum = to_uoc(minimum_uoc)
    if minimum:
        left = max(minimum - completed_uoc, 0)
        courses = -(-left // STANDARD_COURSE_UOC)
        lines.append(f"- UOC completed: {completed_uoc} of {minimum} ({left} UOC left to graduate, about {courses} courses at {STANDARD_COURSE_UOC} UOC each)")

    required_left = sum(len(p["left"]) for p in parts if p["type"] == "required")
    choices_left = sum(1 for p in parts if p["type"] == "choice" and not p["done"])
    lines.append(f"- Required courses still to do: {required_left + choices_left}")

    for p in parts:
        if p["type"] == "required":
            total = len(p["done"]) + len(p["left"])
            line = f"- {p['name']}: {len(p['done'])} of {total} done"
            if p["left"]:
                line += f"; still to do: {_codes(p['left'])}"
        elif p["type"] == "choice":
            prefix = f"{p['name']}: " if p["name"] else ""
            pick = f"one of {' or '.join(p['codes'])}"
            line = f"- {prefix}{pick}: " + (f"done ({', '.join(p['done'])})" if p["done"] else "not done yet")
        elif p["type"] == "options":
            if p["uoc"]:
                line = f"- {p['name']}: {p['done_uoc']} of {p['uoc']} UOC done, choosing from {p['count']} listed courses"
            else:
                line = f"- {p['name']}: choose from {p['count']} listed courses"
            if p["done"]:
                line += f"; done: {_codes(p['done'])}"
            if p["planned"]:
                line += f"; planned: {_codes(p['planned'])}"
        elif p.get("kind") == "specialisations":
            line = f"- {p['name']}: {p['uoc']} UOC, filled by choosing a minor or specialisation"
        else:
            line = f"- {p['name']}: {p['done_uoc']} of {p['uoc']} UOC done"
            if p["done"]:
                line += f" ({_codes(p['done'])})"
            if p["planned"]:
                line += f"; planned: {_codes(p['planned'])}"
            if not p["done"] and not p["planned"]:
                line += "; the student hasn't placed any courses here in UniVise yet"
        lines.append(line)
    return "\n".join(lines)
