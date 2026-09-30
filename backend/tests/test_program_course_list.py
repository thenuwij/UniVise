"""Tests for the program course list given to the careers and industry prompts.

Supabase is faked; this checks every course in the program's sections is
listed once, and that specialisation courses outside them are added with
their titles.
"""
from types import SimpleNamespace

from app.services.roadmap import unsw_queries

SECTIONS = [
    {"title": "Overview", "courses": []},
    {"title": "Level 1 Core", "courses": [{"code": "COMP1511", "name": "Programming Fundamentals"}]},
    {"title": "Prescribed Electives", "courses": [{"code": "comp1531", "name": "Software Engineering Fundamentals"}, {"code": "COMP1511", "name": "Programming Fundamentals"}]},
    {"title": "Majors", "courses": [{"code": "COMPA1", "name": "Computer Science"}]},
]


class Query:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *args):
        return self

    def eq(self, *args):
        return self

    def in_(self, column, values):
        self.rows = [r for r in self.rows if r["code"] in values]
        return self

    def limit(self, *args):
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


def fake_supabase(tables):
    return SimpleNamespace(from_=lambda name: Query(list(tables[name])))


def test_lists_program_and_specialisation_courses(monkeypatch):
    monkeypatch.setattr(unsw_queries, "supabase", fake_supabase({
        "unsw_degrees_final": [{"sections": SECTIONS}],
        "unsw_courses": [{"code": "COMP3311", "title": "Database Systems"}],
    }))

    courses = unsw_queries.fetch_program_course_list("3778", ["COMP3311", "COMP1511", "COMPA1"])

    assert courses == [
        {"code": "COMP1511", "name": "Programming Fundamentals", "section": "Level 1 Core", "section_rule": ""},
        {"code": "COMP1531", "name": "Software Engineering Fundamentals", "section": "Prescribed Electives", "section_rule": ""},
        {"code": "COMP3311", "name": "Database Systems", "section": "Chosen specialisation", "section_rule": ""},
    ]


def test_program_without_sections_still_lists_specialisation_courses(monkeypatch):
    monkeypatch.setattr(unsw_queries, "supabase", fake_supabase({
        "unsw_degrees_final": [],
        "unsw_courses": [{"code": "COMP3311", "title": "Database Systems"}],
    }))

    assert unsw_queries.fetch_program_course_list("3778", ["COMP3311"]) == [
        {"code": "COMP3311", "name": "Database Systems", "section": "Chosen specialisation", "section_rule": ""},
    ]
