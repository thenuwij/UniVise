"""Tests for the personality traits description endpoint.

Supabase and the AI call are faked; these check the description is generated
with the chosen model and saved against the signed-in student only.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import traits

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")

RESULT_ROW = {
    "user_id": USER.id,
    "top_types": ["Investigative", "Artistic"],
    "trait_scores": {"Investigative": 12, "Artistic": 10},
    "result_summary": "investigative-artistic",
}


class PersonalityTable:
    def __init__(self, rows, writes):
        self.rows = rows
        self.writes = writes
        self.filters = []

    def select(self, *args):
        return self

    def update(self, values):
        self.writes.append(values)
        return self

    def eq(self, column, value):
        self.filters.append((column, value))
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: USER
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


def fake_supabase(monkeypatch, rows):
    writes, tables = [], []

    def table(name):
        tables.append(PersonalityTable(rows, writes))
        return tables[-1]

    monkeypatch.setattr(traits, "supabase", SimpleNamespace(table=table))
    return writes, tables


def test_generates_and_saves_description(client, monkeypatch):
    writes, tables = fake_supabase(monkeypatch, [RESULT_ROW])
    calls = []

    def reply(prompt, **kwargs):
        calls.append(kwargs)
        return "You blend curiosity with creativity."

    monkeypatch.setattr(traits, "ask_gpt", reply)

    response = client.get("/traits/results")

    assert response.status_code == 200
    assert response.json() == {"status": "success", "description": "You blend curiosity with creativity."}
    assert calls == [{"temperature": 0.5, "model": "gpt-5.4-mini"}]
    assert writes == [{"description": "You blend curiosity with creativity."}]
    assert all(table.filters == [("user_id", USER.id)] for table in tables)


def test_returns_404_without_quiz_results(client, monkeypatch):
    fake_supabase(monkeypatch, [])

    response = client.get("/traits/results")

    assert response.status_code == 404
