"""Tests for the course page "Part of these programs" lookup.

Supabase is faked; these check the course is resolved to its code and the
programs come from the database lookup, with no AI call involved.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import smart_related

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")

PROGRAM = {
    "id": "11111111-1111-1111-1111-111111111111",
    "degree_code": "3778",
    "program_name": "Bachelor of Computer Science",
    "faculty": "Faculty of Engineering",
}


class CourseQuery:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *args):
        return self

    def eq(self, *args):
        return self

    def limit(self, *args):
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


@pytest.fixture
def client(monkeypatch):
    looked_up = []

    def programs_for_course(course_code):
        looked_up.append(course_code)
        return [PROGRAM]

    monkeypatch.setattr(smart_related, "programs_for_course", programs_for_course)
    monkeypatch.setattr(smart_related, "supabase", SimpleNamespace(table=lambda name: CourseQuery([{"code": "COMP1511"}])))
    app.dependency_overrides[get_current_user] = lambda: USER
    yield TestClient(app, raise_server_exceptions=False), looked_up
    app.dependency_overrides.clear()


EXPECTED = [{
    "id": PROGRAM["id"],
    "program_code": "3778",
    "program_name": "Bachelor of Computer Science",
    "faculty": "Faculty of Engineering",
}]


def test_lists_programs_for_a_course_code(client):
    test_client, looked_up = client

    response = test_client.post("/smart-related/degrees-for-course", json={"course_code": "COMP1511"})

    assert response.status_code == 200
    assert response.json() == EXPECTED
    assert looked_up == ["COMP1511"]


def test_resolves_course_id_to_its_code(client):
    test_client, looked_up = client

    response = test_client.post("/smart-related/degrees-for-course", json={"course_id": "course-1"})

    assert response.json() == EXPECTED
    assert looked_up == ["COMP1511"]


def test_requires_a_course(client):
    test_client, _ = client

    response = test_client.post("/smart-related/degrees-for-course", json={})

    assert response.status_code == 400


def test_unknown_course_id_returns_404(client, monkeypatch):
    test_client, _ = client
    monkeypatch.setattr(smart_related, "supabase", SimpleNamespace(table=lambda name: CourseQuery([])))

    response = test_client.post("/smart-related/degrees-for-course", json={"course_id": "missing"})

    assert response.status_code == 404
