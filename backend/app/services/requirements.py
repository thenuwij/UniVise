import re

OPTION_KINDS = {"elective", "general_education", "free_elective"}
RULE = re.compile(r"minimum of (\d+)\s*UOC of Level (\d)", re.IGNORECASE)
TARGET_TEXT = re.compile(r"(\d+)\s*(?:UOC|units of credit)\s+(?:of|from) the following", re.IGNORECASE)
LOOSE_TARGET = re.compile(r"(?:at least|either|take|complete)\s+(\d+)\s*(?:UOC|units of credit)", re.IGNORECASE)


def _read_target(text) -> int:
    match = TARGET_TEXT.search(text or "") or LOOSE_TARGET.search(text or "")
    return int(match.group(1)) if match else 0


def _as_elective(courses: list) -> list:
    return [{**{k: v for k, v in c.items() if k != "choice"}, "kind": "elective"} for c in courses]


def _has_text(section: dict) -> bool:
    return bool((section.get("description") or "").strip())


def _base_title(title: str) -> str:
    full = (title or "").strip()
    return (re.sub(r"\s*(?:core\s+)?courses?\s*$", "", full, flags=re.IGNORECASE) or full).lower()


def _is_continuation(previous, section) -> bool:
    if not previous or not _listed(section) or _has_text(section) or to_uoc(section.get("uoc")):
        return False
    kind = section.get("kind") or "core"
    if kind == "choice" or (previous.get("kind") or "core") != kind:
        return False
    base = _base_title(previous.get("title"))
    return bool(base) and _base_title(section.get("title")).startswith(base)


def _merge_continuations(items: list) -> list:
    out = []
    for section in items:
        previous = out[-1] if out else None
        if _is_continuation(previous, section):
            seen = {_code(c) for c in previous.get("courses") or []}
            extra = [c for c in section["courses"] if _code(c) and _code(c) not in seen]
            out[-1] = {**previous, "courses": [*(previous.get("courses") or []), *extra]}
        else:
            out.append(section)
    return out


def _tidy_core(section: dict, next_is_choice: bool = False) -> dict:
    courses = [c for c in section.get("courses") or [] if _code(c)]
    if not courses:
        return section
    plain = [c for c in courses if not c.get("choice")]
    target = to_uoc(section.get("uoc")) or _read_target(section.get("description"))
    if not target:
        zero = str(section.get("uoc")) == "0"
        if zero and len(plain) > 1 and not (section.get("description") or "").strip() and re.search(r"\bcourse$", section["title"].strip(), re.IGNORECASE):
            key = f"{section['title']}: one of"
            return {**section, "pick_one": key, "courses": [c if c.get("choice") else {**c, "choice": key} for c in courses]}
        return section
    with_target = {**section, "uoc": target}
    if any(c.get("uoc") in (None, "") for c in plain):
        return with_target
    groups: dict = {}
    for c in courses:
        if c.get("choice"):
            groups.setdefault(c["choice"], to_uoc(c.get("uoc")))
    listed = sum(to_uoc(c.get("uoc")) for c in plain) + sum(groups.values())
    if listed == target or (listed < target and next_is_choice):
        return with_target
    return {**with_target, "kind": "elective", "courses": _as_elective(courses)}
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
    items = _merge_continuations([s for s in sections or [] if isinstance(s, dict) and s.get("title")])
    out = []
    i = 0
    while i < len(items):
        section = items[i]
        uoc = to_uoc(section.get("uoc"))
        kind = section.get("kind") or "core"
        if kind in ("elective", "core") and uoc > 0 and not _listed(section):
            j = i + 1
            children = []
            while j < len(items) and not to_uoc(items[j].get("uoc")) and (items[j].get("kind") or "core") == kind:
                children.append(items[j])
                j += 1
            if children:
                seen = set()
                courses = []
                for child in children:
                    for c in child.get("courses") or []:
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
            target = _read_target(section.get("description"))
            out.append({**section, "uoc": target} if target else section)
            i += 1
            continue
        following = items[i + 1] if i + 1 < len(items) else None
        tidied = _tidy_core(section, bool(following) and following.get("kind") == "choice") if kind == "core" else section
        previous = out[-1] if out else None
        if tidied.get("pick_one") and previous and previous.get("pick_one"):
            key = previous["pick_one"]
            tidied = {**tidied, "pick_one": key, "courses": [{**c, "choice": key} if c.get("choice") == tidied["pick_one"] else c for c in tidied["courses"]]}
        out.append(tidied)
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
