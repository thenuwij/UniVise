"""Tests for recording which specialisations a roadmap was built for.

Supabase is faked; this checks every chosen major, minor and stream across
both halves of a double degree is collected once, in a stable order, so the
roadmap entry page can match a roadmap to the student's current choices.
"""
from types import SimpleNamespace

from app.services.roadmap import unsw_queries


class Query:
    def __init__(self, rows):
        self.rows = rows
        self.codes = None

    def select(self, *args):
        return self

    def eq(self, column, value):
        self.rows = [r for r in self.rows if r.get(column) == value]
        return self

    def in_(self, column, values):
        self.rows = [r for r in self.rows if r.get(column) in values]
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


ROWS = [
    {"user_id": "u1", "degree_code": "3778", "major_id": "b-major", "minor_id": None, "honours_id": None},
    {"user_id": "u1", "degree_code": "3970", "major_id": "a-major", "minor_id": "c-minor", "honours_id": None},
    {"user_id": "u1", "degree_code": "3502", "major_id": "other-program", "minor_id": None, "honours_id": None},
    {"user_id": "u2", "degree_code": "3778", "major_id": "someone-else", "minor_id": None, "honours_id": None},
]


def test_collects_choices_from_both_halves_in_order(monkeypatch):
    monkeypatch.setattr(unsw_queries, "supabase", SimpleNamespace(from_=lambda name: Query(list(ROWS))))
    monkeypatch.setattr(unsw_queries, "component_degree_codes", lambda code, name: [code, "3778", "3970"])

    ids = unsw_queries.fetch_specialisation_ids("u1", "3781", "Science / Computer Science")

    assert ids == ["a-major", "b-major", "c-minor"]


def test_no_choices_gives_an_empty_list(monkeypatch):
    monkeypatch.setattr(unsw_queries, "supabase", SimpleNamespace(from_=lambda name: Query(list(ROWS))))
    monkeypatch.setattr(unsw_queries, "component_degree_codes", lambda code, name: [code])

    assert unsw_queries.fetch_specialisation_ids("u1", "3707", "Bachelor of Engineering (Honours)") == []
