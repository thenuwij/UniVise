"""Tests for Eunice's UNSW Handbook tools.

Supabase is faked per table; these check course lookups, the prerequisite
check against ticked courses, bad codes, and that a failing lookup returns
a safe message instead of raising.
"""
import json

import pytest

from app.services import eunice_tools

COURSE = {
    "code": "COMP3231",
    "title": "Operating Systems",
    "uoc": 6,
    "offering_terms": ["Term 2"],
    "conditions_for_enrolment": "Prerequisite: COMP1521 and COMP2521",
    "overview": "x" * 900,
    "study_level": "Undergraduate",
    "faculty": "Faculty of Engineering",
    "school": "School of Computer Science and Engineering",
}

EDGES = [
    {"from_key": "COMP2521", "to_key": "COMP3231", "edge_type": "prereq", "logic_type": "and", "group_id": None},
    {"from_key": "COMP1521", "to_key": "COMP3231", "edge_type": "prereq", "logic_type": "or", "group_id": "g1"},
    {"from_key": "DPST1092", "to_key": "COMP3231", "edge_type": "prereq", "logic_type": "or", "group_id": "g1"},
]


class Query:
    def __init__(self, rows):
        self.rows = rows

    def __getattr__(self, name):
        return lambda *args, **kwargs: self

    def execute(self):
        return type("Result", (), {"data": self.rows})()


@pytest.fixture
def db(monkeypatch):
    tables = {"unsw_courses": [COURSE], "mindmesh_edges_global": EDGES}

    class Client:
        def from_(self, name):
            return Query(tables.get(name, []))

    monkeypatch.setattr(eunice_tools, "supabase", Client())
    return tables


def test_course_lookup_returns_handbook_facts_and_link(db):
    course = eunice_tools.get_course("comp 3231")

    assert course["found"] is True
    assert course["terms"] == ["Term 2"]
    assert course["enrolment_rules"] == "Prerequisite: COMP1521 and COMP2521"
    assert course["handbook_url"] == "https://www.handbook.unsw.edu.au/undergraduate/courses/2026/COMP3231"
    assert len(course["overview"]) == eunice_tools.OVERVIEW_CHARS + 3


def test_bad_code_is_rejected_without_a_query(db):
    assert eunice_tools.get_course("operating systems")["found"] is False


def test_unknown_code_says_not_in_handbook(db):
    db["unsw_courses"] = []
    result = eunice_tools.get_course("ABCD1234")
    assert result["found"] is False
    assert "2026 UNSW Handbook" in result["note"]


def test_prerequisites_met_when_every_group_is_met(db):
    result = eunice_tools.check_prerequisites("COMP3231", {"COMP2521", "DPST1092"})

    assert result["prerequisites_met"] is True
    assert {"needs": "one of COMP1521, DPST1092", "met": True, "done": ["DPST1092"]} in result["groups"]


def test_prerequisites_not_met_names_the_missing_group(db):
    result = eunice_tools.check_prerequisites("COMP3231", {"COMP1521"})

    assert result["prerequisites_met"] is False
    assert {"needs": "COMP2521", "met": False, "done": []} in result["groups"]


def test_failing_lookup_returns_a_safe_message(db, monkeypatch):
    def broken(code):
        raise ConnectionError("db down")

    monkeypatch.setattr(eunice_tools, "get_course", broken)
    result = json.loads(eunice_tools.run_tool("get_course", '{"code": "COMP3231"}', "user-1"))
    assert "couldn't check" in result["error"]


def test_unknown_tool_is_reported(db):
    assert json.loads(eunice_tools.run_tool("delete_everything", "{}", "user-1")) == {"error": "Unknown tool delete_everything"}


def test_specialisation_name_with_brackets_matches_word_by_word(monkeypatch):
    filters = []

    class Query:
        def select(self, *args):
            return self

        def ilike(self, column, value):
            filters.append((column, value))
            return self

        def limit(self, *args):
            return self

        def execute(self):
            return type("Result", (), {"data": []})()

    monkeypatch.setattr(eunice_tools, "supabase", type("Client", (), {"from_": lambda self, name: Query()})())
    eunice_tools.get_specialisation("Computer Science (Artificial Intelligence)")

    assert filters == [
        ("major_name", "%Computer%"),
        ("major_name", "%Science%"),
        ("major_name", "%Artificial%"),
        ("major_name", "%Intelligence%"),
    ]
