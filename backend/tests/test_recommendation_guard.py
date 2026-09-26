"""Tests for the per-student guard on recommendation generation.

Only one generation may run per student at a time, and a failed generation
must still release the guard so the student can try again.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import recommendation

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: USER
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


@pytest.fixture
def released(monkeypatch):
    calls = []
    monkeypatch.setattr(recommendation, "release_recommendation_run", calls.append)
    return calls


def test_returns_in_progress_without_generating_when_run_already_claimed(client, released, monkeypatch):
    monkeypatch.setattr(recommendation, "claim_recommendation_run", lambda user_id: False)

    async def fail_if_called(*args, **kwargs):
        raise AssertionError("generation must not start")

    monkeypatch.setattr(recommendation, "get_student_type", fail_if_called)
    monkeypatch.setattr(recommendation, "ask_gpt_async", fail_if_called)

    response = client.post("/recommendation/prompt")

    assert response.status_code == 202
    assert response.json() == {"status": "in_progress"}
    assert released == []


def test_releases_run_when_generation_fails(client, released, monkeypatch):
    monkeypatch.setattr(recommendation, "claim_recommendation_run", lambda user_id: True)

    async def student_type(user):
        return "university"

    async def user_info(user, student_type):
        return {"degree_field": "Computer Science", "degree_stage": "Bachelor's", "academic_year": "2"}

    async def ai_down(*args, **kwargs):
        raise RuntimeError("AI provider unavailable")

    monkeypatch.setattr(recommendation, "get_student_type", student_type)
    monkeypatch.setattr(recommendation, "get_user_info", user_info)
    monkeypatch.setattr(recommendation, "ask_gpt_async", ai_down)

    response = client.post("/recommendation/prompt")

    assert response.status_code == 500
    assert released == [USER.id]
