"""Read Handbook enrolment rules into CourseMesh prerequisite links.

A rule such as "Prerequisite: ACCT2511 AND (COMM1180 or ECON1102)" becomes a
list of groups that must all be met; each group is met by any one of its
courses. Parts that a course cannot meet (a WAM, a program, a major, UOC
completed) make their group impossible to check, so that group is dropped
rather than locking the course. Exclusions and equivalents are ignored.
"""
import re
from collections import defaultdict
from itertools import product

COURSE = re.compile(r"\b[A-Z]{4}\d{4}\b")
CLAUSE = re.compile(
    r"(?i)\b(pre-?\s?requisites?(?:\s+or\s+co-?\s?requisites?)?|co-?\s?(?:re)?requisites?|exclu\w*|equivalen\w*)\s*:?"
)
TOKEN = re.compile(r"(?i)\(|\)|,|;|/|\band\b|\bor\b|&|\b[A-Z]{4}\d{4}\b|[^(),;&/\s]+")
ONE_OF = re.compile(r"(?i)\b(?:at\s+least\s+)?(?:one|any|either)\s+of(?:\s+the\s+following)?(?:\s+courses?)?\s*:?")
ONE_OF_MARK = "@oneof@"
ADVICE = re.compile(r"(?i)recommend|advis|encourag|strongly")
SENTENCE = re.compile(r"(?<=[.!?])\s+")
MAX_GROUPS = 12
OTHER = "?"


def clauses(text: str) -> list[tuple[str, str]]:
    """Split rule text into (kind, body) parts; text before any heading counts as a prerequisite."""
    text = " ".join(sentence for sentence in SENTENCE.split(text or "") if not ADVICE.search(sentence))
    parts, kind, start = [], "prereq", 0
    for match in CLAUSE.finditer(text):
        parts.append((kind, text[start:match.start()]))
        word = match.group(1).lower()
        kind = "coreq" if re.search(r"co-?\s?(?:re)?requisite", word) else "prereq" if "requisite" in word else "ignore"
        start = match.end()
    parts.append((kind, text[start:]))
    return [(k, body) for k, body in parts if k != "ignore" and body.strip()]


def tokens(body: str) -> list[str]:
    out = []
    for raw in TOKEN.findall(ONE_OF.sub(f" {ONE_OF_MARK} ", body)):
        word = raw.lower()
        if raw == ONE_OF_MARK:
            out.append(ONE_OF_MARK)
        elif raw in ("(", ")", ","):
            out.append(raw)
        elif raw in (";", "&") or word == "and":
            out.append("and")
        elif word == "or" or raw == "/":
            out.append("or")
        elif COURSE.fullmatch(raw):
            out.append(raw)
        else:
            out.append(OTHER)
    return merge_phrases(out)


def merge_phrases(items: list[str]) -> list[str]:
    """Tidy tokens: join non-course phrases ("program 3805 or 3856"), drop lead-ins before a comma,
    and read the commas after "one of the following" as "or"."""
    joined = []
    for i, item in enumerate(items):
        following = items[i + 1] if i + 1 < len(items) else None
        if item in ("and", "or", ",") and joined and joined[-1] == OTHER and following == OTHER:
            continue
        if item == OTHER and joined and joined[-1] == OTHER:
            continue
        joined.append(item)
    out, choosing = [], False
    for i, item in enumerate(joined):
        following = joined[i + 1] if i + 1 < len(joined) else None
        if item == OTHER and following in (",", ONE_OF_MARK) and (not out or out[-1] in ("and", "or", "(", ",")):
            continue
        if item == ONE_OF_MARK:
            choosing = True
            continue
        if item == "and" or item == ")":
            choosing = False
        if item == "," and choosing:
            item = "or"
        if item == "," and (not out or out[-1] in ("and", "or", "(")):
            continue
        out.append(item)
    return out


def parse(items: list[str]):
    """Split on a top-level ", or" first ("A and B, or C" means (A and B) or C), then parse each part.

    A ", or" that ends a comma list ("A, B, or C") is only a list separator.
    """
    parts, current, depth, commas = [], [], 0, 0
    for i, item in enumerate(items):
        depth += item == "("
        depth -= item == ")"
        if depth == 0 and item == "," and i + 1 < len(items) and items[i + 1] == "or":
            if commas == 0:
                parts.append(current)
                current = []
                continue
        elif depth == 0 and item == ",":
            commas += 1
        elif depth == 0 and item == "and":
            commas = 0
        if depth == 0 and item == "or" and not current and parts:
            continue
        current.append(item)
    parts.append(current)
    trees = [t for t in (parse_part(p) for p in parts) if t is not None]
    if not trees:
        return None
    return trees[0] if len(trees) == 1 else ("or", trees)


def parse_part(items: list[str]):
    """Parse tokens into a tree of ("and" | "or", children), course codes and OTHER.

    Handbook rules group "or" more tightly than "and": "A or B and C or D" means
    (A or B) and (C or D). Brackets are respected.
    """
    position = 0

    def operand():
        nonlocal position
        atoms = []
        while position < len(items) and items[position] not in (")", "and", "or", ","):
            if items[position] == "(":
                position += 1
                atoms.append(expression())
                if position < len(items) and items[position] == ")":
                    position += 1
            else:
                atoms.append(items[position])
                position += 1
        courses = [a for a in atoms if a not in (OTHER, None)]
        if not courses:
            return OTHER if atoms else None
        return courses[0] if len(courses) == 1 else ("and", courses)

    def expression():
        nonlocal position
        operands, operators = [operand()], []
        while position < len(items) and items[position] in ("and", "or", ","):
            operators.append(items[position])
            position += 1
            operands.append(operand())
        for i, op in enumerate(operators):
            if op == ",":
                following = next((o for o in operators[i + 1:] if o != ","), "and")
                operators[i] = following
        terms, current = [], [operands[0]]
        for op, nxt in zip(operators, operands[1:]):
            if op == "or":
                current.append(nxt)
            else:
                terms.append(current)
                current = [nxt]
        terms.append(current)
        terms = [[x for x in t if x is not None] for t in terms]
        ors = [t[0] if len(t) == 1 else ("or", t) for t in terms if t]
        if not ors:
            return None
        return ors[0] if len(ors) == 1 else ("and", ors)

    return expression() if items else None


def cnf(node) -> list[frozenset] | None:
    """Groups that must all be met, each met by any of its members; None when too large to expand."""
    if node is None:
        return []
    if isinstance(node, str):
        return [frozenset([node])]
    op, children = node
    parts = [cnf(child) for child in children]
    if any(p is None for p in parts):
        return None
    if op == "and":
        return [group for part in parts for group in part]
    parts = [p for p in parts if p]
    if len(parts) < len(children):
        return []
    size = 1
    for p in parts:
        size *= len(p)
    if size > MAX_GROUPS:
        return None
    return [frozenset().union(*combo) for combo in product(*parts)]


def requisite_groups(text: str, known: set[str]) -> list[tuple[str, frozenset]]:
    """(edge type, courses) pairs for a rule, keeping only groups made entirely of known courses."""
    out = []
    for kind, body in clauses(text):
        groups = cnf(parse(tokens(body))) or []
        for group in groups:
            if OTHER in group:
                continue
            members = frozenset(code for code in group if code in known)
            if members and (kind, members) not in out:
                out.append((kind, members))
    return one_link_per_pair(out)


def one_link_per_pair(groups: list[tuple[str, frozenset]]) -> list[tuple[str, frozenset]]:
    """The links table holds one link per course pair, so a course may sit in only one group.

    Groups that contain a smaller group are implied by it and dropped. If a course is
    still in two groups, the later, larger group is dropped, which can only relax the rule.
    """
    kept = [g for g in groups if not any(o[0] == g[0] and o[1] < g[1] for o in groups)]
    out, used = [], defaultdict(set)
    for kind, members in sorted(kept, key=lambda g: (g[0], len(g[1]), sorted(g[1]))):
        if members & used[kind]:
            continue
        out.append((kind, members))
        used[kind] |= members
    return out


def requisite_edges(code: str, text: str, known: set[str]) -> list[dict]:
    """Rows for mindmesh_edges_global in the existing format."""
    edges, n = [], 0
    for kind, members in requisite_groups(text, known - {code}):
        if len(members) == 1:
            edges.append({"from_key": next(iter(members)), "to_key": code, "edge_type": kind, "logic_type": "and", "group_id": None, "confidence": 1.0})
            continue
        n += 1
        for member in sorted(members):
            edges.append({"from_key": member, "to_key": code, "edge_type": kind, "logic_type": "or", "group_id": f"{code}_g{n}", "confidence": 1.0})
    return edges
