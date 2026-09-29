"""Tests for the degree page smart summary endpoint.

Supabase, the user context and the AI call are faked; this checks the
summary comes from the async AI client, so the call never blocks the server.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import ai_advisor

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")

DEGREE = {
    "program_name": "Bachelor of Commerce",
    "overview_description": "A flexible business degree.",
    "career_outcomes": "Accountant, Analyst",
}


class DegreeQuery:
    def select(self, *args):
        return self

    def eq(self, *args):
        return self

    def single(self):
        return self

    def execute(self):
        return SimpleNamespace(data=DEGREE)


@pytest.fixture
def client(monkeypatch):
    async def user_context(user_id):
        return {"personality": {}, "highschool": {}, "university": {"degree_field": "Commerce"}}

    monkeypatch.setattr(ai_advisor, "supabase", SimpleNamespace(from_=lambda name: DegreeQuery()))
    monkeypatch.setattr(ai_advisor, "get_user_context", user_context)
    app.dependency_overrides[get_current_user] = lambda: USER
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


def test_returns_summary_from_async_ai_call(client, monkeypatch):
    calls = []

    async def reply(prompt, **kwargs):
        calls.append(kwargs)
        return "Fit Score: 82"

    monkeypatch.setattr(ai_advisor, "ask_gpt_async", reply)

    response = client.post("/smart-summary/degree", json={"degree_id": "degree-1"})

    assert response.status_code == 200
    assert response.json() == {"summary": "Fit Score: 82"}
    assert calls == [{"temperature": 0.3, "model": "gpt-5.4-mini"}]


def test_rejects_request_without_degree_id(client):
    response = client.post("/smart-summary/degree", json={})

    assert response.status_code == 400
