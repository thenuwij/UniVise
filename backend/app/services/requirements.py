import re

OPTION_KINDS = {"elective", "general_education", "free_elective"}
RULE = re.compile(r"minimum of (\d+)\s*UOC of Level (\d)", re.IGNORECASE)
TARGET_TEXT = re.compile(r"(\d+)\s*(?:UOC|units of credit)\s+of the following", re.IGNORECASE)
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


def _listed(section) -> int:
    return len([c for c in section.get("courses") or [] if _code(c)])


def tidy_sections(sections) -> list:
    items = [s for s in sections or [] if isinstance(s, dict) and s.get("title")]
    out = []
    i = 0
    while i < len(items):
        section = items[i]
        uoc = to_uoc(section.get("uoc"))
        kind = section.get("kind") or "core"
        if kind in ("elective", "core") and uoc > 0 and not _listed(section):
            j = i + 1
            children = []
            while j < len(items) and _listed(items[j]) and not to_uoc(items[j].get("uoc")) and (items[j].get("kind") or "core") == kind:
                children.append(items[j])
                j += 1
            if children:
                seen = set()
                courses = []
                for child in children:
                    for c in child["courses"]:
                        if _code(c) and _code(c) not in seen:
                            seen.add(_code(c))
                            courses.append({**c, "kind": "elective", "list": child["title"]})
                out.append({**section, "kind": "elective", "courses": courses})
                i = j
                continue
            out.append({**section, "kind": "elective" if kind == "elective" else "unlisted", "courses": []})
            i += 1
            continue
        if kind == "elective" and _listed(section) and not uoc:
            target = TARGET_TEXT.search(section.get("description") or "")
            out.append({**section, "uoc": int(target.group(1))} if target else section)
            i += 1
            continue
        out.append(section)
        i += 1
    return out


def _level(code: str) -> int:
    return int(code[4]) if len(code) > 4 and code[4].isdigit() else 0


def requirement_status(
    section_lists: list, completed: set, added: set | None = None, placed: list | None = None, completed_uoc: dict | None = None
) -> list:
    added = added or set()
    completed_uoc = completed_uoc or {}
    parts = []
    listed = {_code(c) for _, sections in section_lists for s in sections or [] if isinstance(s, dict) for c in s.get("courses") or []}
    for label, sections in section_lists:
        choices: dict = {}
        for section in tidy_sections(sections):
            title = (section.get("title") or "").strip()
            kind = section.get("kind") or "core"
            if not title or "overview" in title.lower() or kind == "info":
                continue
            name = f"{label}: {title}" if label else title
            uoc_needed = to_uoc(section.get("uoc"))
            if kind == "limit":
                match = RULE.search(f"{section.get('description') or ''} {section.get('notes') or ''}")
                if match:
                    need, level = int(match.group(1)), int(match.group(2))
                    have = sum(uoc for code, uoc in completed_uoc.items() if code in completed and _level(code) >= level)
                    parts.append({"type": "rule", "name": name, "need": need, "level": level, "have": have})
                continue
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
                if kind == "unlisted":
                    parts.append({"type": "unlisted", "name": name, "uoc": uoc_needed})
                elif kind == "elective" and uoc_needed:
                    parts.append({"type": "options", "name": name, "uoc": uoc_needed, "count": 0, "done": [], "done_uoc": 0, "planned": []})
                elif uoc_needed and kind != "choice":
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
    by_name = {p["name"]: p for p in parts if p["type"] == "options"}
    by_name.update({p["title"]: p for p in open_parts})
    for row in placed or []:
        if row["code"] in listed:
            continue
        part = by_name.get(row.get("section")) or (open_parts[0] if open_parts else None)
        if not part:
            continue
        key = "done" if row["code"] in completed else "planned"
        if row["code"] not in part[key]:
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
            if p["uoc"] and not p["count"]:
                line = f"- {p['name']}: {p['done_uoc']} of {p['uoc']} UOC done; the Handbook data lists no courses for this, so the student adds their own"
            elif p["uoc"]:
                line = f"- {p['name']}: {p['done_uoc']} of {p['uoc']} UOC done, choosing from {p['count']} listed courses"
            else:
                line = f"- {p['name']}: choose from {p['count']} listed courses"
            if p["done"]:
                line += f"; done: {_codes(p['done'])}"
            if p["planned"]:
                line += f"; planned: {_codes(p['planned'])}"
        elif p["type"] == "unlisted":
            line = f"- {p['name']}: {p['uoc']} UOC; the course list isn't in UniVise, so check the Handbook for which courses count"
        elif p["type"] == "rule":
            status = "rule met" if p["have"] >= p["need"] else f"{p['need'] - p['have']} UOC still needed"
            line = f"- {p['name']} (rule): {p['have']} of {p['need']} UOC at level {p['level']} or above, {status}"
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
