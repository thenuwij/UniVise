"""Tests for the Handbook import rules.

No network or database is touched; these check how Handbook HTML becomes
display text, how course sections, types and choice groups are built, and
which differences count as changes.
"""
from scripts.handbook_import import (
    build_sections,
    compare,
    course_row,
    html_to_text,
    is_active,
    new_row_reason,
    with_course_names,
    with_current_overview,
)


def group(title, value, credit_points="", courses=(), children=(), order="0", description=""):
    return {
        "title": title,
        "order": order,
        "credit_points": credit_points,
        "description": description,
        "vertical_grouping": {"value": value},
        "relationship": [{"academic_item_code": code, "academic_item_name": code, "academic_item_credit_points": "6"} for code in courses],
        "container": list(children),
    }


def test_html_keeps_paragraphs_and_lists_as_lines():
    text = html_to_text("<p>Students must complete 144 UOC.</p><ol><li>A 96 UOC major</li><li>36 UOC of electives</li></ol><ul><li>One</li></ul>")

    assert text == "Students must complete 144 UOC.\n1. A 96 UOC major\n2. 36 UOC of electives\n• One"


def test_html_entities_spaces_and_placeholders():
    assert html_to_text("Law&nbsp;&amp; Justice<br/>") == "Law & Justice"
    assert html_to_text("<p>Not specified</p>") is None
    assert html_to_text("") is None
    assert html_to_text(None) is None


def test_sections_follow_handbook_order_and_types():
    structure = {"container": [
        group("General Education", "GE", "12", order="200"),
        group("Core Courses", "CC", "66", courses=["COMP1511"], order="0", description="<p>Take all of these.</p>"),
        group("Electives", "PE", "30", courses=["COMP3311"], order="100"),
        group("Maximum Level 1 UOC", "LR", order="300"),
    ]}

    sections = build_sections(structure)

    assert [(s["title"], s["kind"]) for s in sections] == [
        ("Core Courses", "core"), ("Electives", "elective"), ("General Education", "general_education"), ("Maximum Level 1 UOC", "limit"),
    ]
    assert sections[0]["description"] == "Take all of these."
    assert sections[1]["courses"][0] == {"uoc": 6, "code": "COMP3311", "name": "COMP3311", "kind": "elective"}


def test_one_of_groups_share_a_choice_key_inside_their_section():
    structure = {"container": [group("Core Courses", "CC", "24", children=[
        group("Core", "CC", courses=["COMP1511"]),
        group("One of the following:", "one_of_the_following", courses=["MATH1131", "MATH1141"], order="100"),
        group("One of the following:", "one_of_the_following", courses=["MATH1231", "MATH1241"], order="200"),
    ])]}

    courses = build_sections(structure)[0]["courses"]

    assert [(c["code"], c["kind"], c.get("choice")) for c in courses] == [
        ("COMP1511", "core", None),
        ("MATH1131", "choice", "Core Courses 1"), ("MATH1141", "choice", "Core Courses 1"),
        ("MATH1231", "choice", "Core Courses 2"), ("MATH1241", "choice", "Core Courses 2"),
    ]


def test_nested_groups_with_their_own_uoc_become_sections_and_majors_are_not_courses():
    structure = {"container": [group("Disciplinary Component", None, "168", children=[
        group("Majors", "undergrad_major", "0", courses=["COMPA1"]),
        group("Industrial Training", "CC", "0", courses=["ENGG4999"], order="100"),
    ])]}

    sections = build_sections(structure)

    assert [(s["title"], s["kind"], [c["code"] for c in s["courses"]]) for s in sections] == [
        ("Disciplinary Component", "info", []), ("Majors", "specialisations", []), ("Industrial Training", "core", ["ENGG4999"]),
    ]


def test_stored_overview_section_is_kept_first():
    current = [{"title": "Overview", "description": "Stored summary"}, {"title": "Old", "courses": []}]
    proposed = [{"title": "Overview", "description": "Handbook summary"}, {"title": "Core Courses", "courses": []}]

    assert [s.get("description") or s["title"] for s in with_current_overview(current, proposed)] == ["Stored summary", "Core Courses"]
    assert with_current_overview(None, proposed) == proposed


def test_course_row_reads_rules_and_terms():
    content = {
        "title": "Data Structures and Algorithms",
        "description": "<p>Think like a computer scientist.</p>",
        "credit_points": "6",
        "parent_academic_org": {"value": "Faculty of Engineering"},
        "academic_org": {"value": "School of Computer Science and Engineering"},
        "study_level_single": {"label": "Undergraduate"},
        "asced_detailed": {"value": "020103 Programming"},
        "enrolment_rules": [{"description": "Prerequisite: COMP1511 or DPST1091<br/><br/>"}],
        "offering_detail": {"offering_terms": "Summer Term, Term 1, Term 2"},
    }

    row = course_row(content)

    assert row["conditions_for_enrolment"] == "Prerequisite: COMP1511 or DPST1091"
    assert row["offering_terms"] == ["Summer Term", "Term 1", "Term 2"]
    assert row["uoc"] == 6
    assert row["school"] == "School of Computer Science and Engineering"


def test_inactive_pages_are_recognised():
    assert is_active({"published_in_handbook": {"value": "1"}, "status": {"value": "Active"}, "active": "true"})
    assert not is_active({"published_in_handbook": {"value": "0"}})
    assert not is_active({"status": {"value": "Inactive"}})
    assert not is_active({"active": "false"})


def test_compare_separates_format_content_flags_and_kept_values():
    assert compare("courses", "overview", "Line one. Line two.", "Line one.\nLine two.") == "format"
    assert compare("courses", "overview", "Old text", "New text") == "content"
    assert compare("courses", "overview", "Old text", None) == "handbook empty"
    assert compare("programs", "faculty", "Faculty of Science", "Faculty of Engineering") == "flag"
    assert compare("programs", "special_notes", "Assembled notes", "Handbook notes") == "kept"
    assert compare("programs", "special_notes", None, "Handbook notes") == "content"
    assert compare("programs", "program_name", "Bachelor of Computer Science", "Bachelor of Science - BSc") == "kept"
    assert compare("programs", "duration", "4 years full-time", "4 Year(s)") == "same"


def test_compare_sections_by_course_codes():
    current = [{"title": "Core", "courses": [{"code": "COMP1511"}, {"code": "COMPA1"}]}]
    regrouped = [{"title": "Core Courses", "kind": "core", "courses": [{"code": "COMP1511", "kind": "core"}]}]
    added = [{"title": "Core", "kind": "core", "courses": [{"code": "COMP1511"}, {"code": "COMP1521"}]}]

    assert compare("programs", "sections", current, regrouped) == "layout"
    assert compare("programs", "sections", current, added) == "content"
    assert compare("programs", "sections", regrouped, regrouped) == "same"


def test_apply_writes_reviewed_rows_but_not_flags_or_kept_values(tmp_path):
    import csv
    import json

    from scripts.handbook_import import CSV_FIELDS, node_row, reviewed_changes

    rows = [
        {"key": "3707", "field": "sections", "action": "layout", "proposed": json.dumps([{"title": "Core"}])},
        {"key": "3707", "field": "faculty", "action": "flag", "proposed": json.dumps("Faculty of Science")},
        {"key": "3707", "field": "uac_code", "action": "accept", "proposed": json.dumps("423600")},
        {"key": "3707", "field": "special_notes", "action": "kept", "proposed": json.dumps("Handbook notes")},
        {"key": "4427", "field": "*", "action": "new", "proposed": json.dumps({"program_name": "New program"})},
        {"key": "3881", "field": "*", "action": "missing", "proposed": ""},
    ]
    with open(tmp_path / "programs.csv", "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows([{"table": "unsw_degrees_final", "name": "", "current": "", **row} for row in rows])

    updates, inserts = reviewed_changes(tmp_path, "programs", None, None)
    assert updates == {"3707": {"sections": [{"title": "Core"}], "uac_code": "423600"}}
    assert inserts == [("4427", {"program_name": "New program"})]

    updates, inserts = reviewed_changes(tmp_path, "programs", {"3707"}, {"sections"})
    assert updates == {"3707": {"sections": [{"title": "Core"}]}}
    assert inserts == []

    assert node_row("COMP2521", {"title": "Data Structures", "uoc": 6, "faculty": "Faculty of Engineering", "school": None}) == {
        "key": "COMP2521", "label": "Data Structures", "uoc": 6, "faculty": "Faculty of Engineering", "school": None, "level": "2",
    }


def test_courses_listed_only_in_rule_text_become_electives_unless_excluded():
    structure = {"container": [
        group("Recommended Electives", "IR", description="<p>We recommend MATH3041 and MATH3121.</p>"),
        group("Excluded General Education Courses", "IR", description="<p>Students may not take COMP1511.</p>"),
        group("Disciplinary Component", None, "96", order="100", children=[
            group("International-labelled Course Requirement", "LR", description="<p>At least 24 UOC from ACCT3601 or ECON2111.</p>"),
        ]),
    ]}

    sections = build_sections(structure)

    assert [(c["code"], c["kind"]) for c in sections[0]["courses"]] == [("MATH3041", "elective"), ("MATH3121", "elective")]
    assert sections[1]["courses"] == []
    assert [(s["title"], [c["code"] for c in s["courses"]]) for s in sections[2:]] == [
        ("Disciplinary Component", []), ("International-labelled Course Requirement", ["ACCT3601", "ECON2111"]),
    ]
    assert with_course_names(sections, {"MATH3041": "Mathematical Modelling"})[0]["courses"][0]["name"] == "Mathematical Modelling"


def test_new_rows_are_added_only_for_sydney_and_when_used():
    sydney = {"content": {"campus": "Sydney", "code": "4072"}}
    canberra = {"content": {"campus": "UNSW Canberra", "code": "4471"}}

    assert new_row_reason("programs", sydney, {}, set(), set()) is None
    assert new_row_reason("programs", canberra, {}, set(), set()).startswith("other campus")
    assert new_row_reason("specialisations", {"content": {}}, {"sections_degrees": [{"degree_code": "3778"}]}, {"3778"}, set()) is None
    assert new_row_reason("specialisations", {"content": {}}, {"sections_degrees": [{"degree_code": "4471"}]}, {"3778"}, set())
    assert new_row_reason("courses", {"content": {"code": "COMP9999"}}, {}, set(), {"COMP1511"})
    assert new_row_reason("courses", {"content": {"code": "COMP1511"}}, {}, set(), {"COMP1511"}) is None


def test_a_faculty_in_the_school_field_is_not_stored_as_a_school():
    base = {"parent_academic_org": {"value": "Faculty of Medicine and Health"}}

    assert course_row({**base, "academic_org": {"value": "Faculty of Medicine and Health"}})["school"] is None
    assert course_row({"parent_academic_org": {"value": ""}, "academic_org": {"value": "UNSW Business School"}})["school"] is None
    assert course_row({**base, "academic_org": {"value": "School of Population Health"}})["school"] == "School of Population Health"


def test_recommended_courses_are_electives_not_core():
    structure = {"container": [group("Core Courses", "CC", "24", children=[
        group("Core", "CC", courses=["PHSL3111"]),
        group("Level 3 Recommended Elective", "RC", courses=["BIOC3261"], order="100"),
    ])]}

    assert [(c["code"], c["kind"]) for c in build_sections(structure)[0]["courses"]] == [("PHSL3111", "core"), ("BIOC3261", "elective")]
