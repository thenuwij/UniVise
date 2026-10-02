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


SPECIALISATIONS = [
    {"id": "b-major", "major_name": "Computer Science", "specialisation_type": "Major", "sections": [
        {"title": "Core Courses", "courses": [{"code": "COMP2521"}, {"code": "MATH1081"}]},
        {"title": "Prescribed Electives", "courses": [{"code": "COMP3311"}]},
    ]},
    {"id": "a-major", "major_name": "Accounting", "specialisation_type": "Major", "sections": [
        {"title": "Core Courses", "courses": [{"code": "ACCT1511"}, {"code": "MATH1081"}]},
    ]},
    {"id": "c-minor", "major_name": "Economics", "specialisation_type": "Minor", "sections": [
        {"title": "Core", "courses": [{"code": "ECON1101"}]},
    ]},
    {"id": "d-honours", "major_name": "Finance Honours", "specialisation_type": "Honours", "sections": []},
]


def test_context_joins_both_halves_and_groups_by_type(monkeypatch):
    monkeypatch.setattr(unsw_queries, "supabase", SimpleNamespace(from_=lambda name: Query(list(SPECIALISATIONS))))

    context = unsw_queries.fetch_specialisation_context(["a-major", "b-major", "c-minor", "d-honours"])

    assert context["selected_major_name"] == "Accounting and Computer Science"
    assert context["selected_major_courses"] == ["ACCT1511", "MATH1081", "COMP2521"]
    assert context["selected_minor_name"] == "Economics"
    assert context["selected_minor_courses"] == ["ECON1101"]
    assert context["selected_honours_name"] == "Finance Honours"
    assert context["selected_honours_courses"] == []


def test_no_ids_gives_an_empty_context_without_a_query(monkeypatch):
    monkeypatch.setattr(unsw_queries, "supabase", None)

    context = unsw_queries.fetch_specialisation_context([])

    assert context["selected_major_name"] is None
    assert context["selected_major_courses"] == []
    assert context["selected_honours_name"] is None
