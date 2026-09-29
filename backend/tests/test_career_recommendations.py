"""Tests for university career recommendation generation.

The AI reply is validated before anything is stored, and old recommendations
are swapped for new ones in a single database call.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.auth import get_current_user
from app.main import app
from app.models.recommendation import CareerRecommendations
from app.routers import recommendation as recommendation_router
from app.services import recommendation as recommendation_service

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")


def career(**overrides):
    return {
        "career_title": "Data Scientist",
        "industry": "Technology",
        "suitability_score": 88,
        "reason": "Matches your interest in statistics.",
        "avg_salary_range": "$95,000 - $140,000",
        "education_required": "Bachelor's degree in a quantitative field",
        "skills_needed": ["Python", "Statistics"],
        "link": "https://www.seek.com.au",
        "source": "SEEK",
        **overrides,
    }


def test_accepts_four_valid_careers():
    result = CareerRecommendations(recommendations=[career() for _ in range(4)])

    assert len(result.recommendations) == 4


@pytest.mark.parametrize(
    "recommendations",
    [
        [career() for _ in range(3)],
        [career() for _ in range(5)],
        [career(suitability_score=120)] + [career() for _ in range(3)],
        [career(avg_salary_range="$80k - $120k")] + [career() for _ in range(3)],
        [career(avg_salary_range="$90,000+")] + [career() for _ in range(3)],
    ],
    ids=["too-few", "too-many", "score-out-of-range", "salary-shorthand", "salary-open-ended"],
)
def test_rejects_invalid_careers(recommendations):
    with pytest.raises(ValidationError):
        CareerRecommendations(recommendations=recommendations)


def test_replace_sends_all_rows_in_one_rpc_call(monkeypatch):
    calls = []

    class FakeSupabase:
        def rpc(self, name, params):
            calls.append((name, params))
            return SimpleNamespace(execute=lambda: SimpleNamespace(data=params["p_rows"]))

    monkeypatch.setattr(recommendation_service, "supabase", FakeSupabase())
    generated = CareerRecommendations(recommendations=[career() for _ in range(4)])

    rows = recommendation_service.replace_career_recommendations(USER.id, generated.recommendations)

    assert len(calls) == 1
    name, params = calls[0]
    assert name == "replace_career_recommendations"
    assert params["p_user_id"] == USER.id
    assert params["p_rows"] == [career() for _ in range(4)]
    assert rows == params["p_rows"]


@pytest.fixture
def client(monkeypatch):
    async def student_type(user):
        return "university"

    async def user_info(user, student_type):
        return {"degree_field": "Computer Science", "degree_stage": "Bachelor's", "academic_year": "2"}

    monkeypatch.setattr(recommendation_router, "claim_recommendation_run", lambda user_id: True)
    monkeypatch.setattr(recommendation_router, "release_recommendation_run", lambda user_id: None)
    monkeypatch.setattr(recommendation_router, "get_student_type", student_type)
    monkeypatch.setattr(recommendation_router, "get_user_info", user_info)
    app.dependency_overrides[get_current_user] = lambda: USER
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


def test_invalid_ai_reply_keeps_existing_recommendations(client, monkeypatch):
    async def invalid_reply(*args, **kwargs):
        return CareerRecommendations.model_validate({"recommendations": [career()] * 3})

    replaced = []
    monkeypatch.setattr(recommendation_router, "ask_gpt_structured", invalid_reply)
    monkeypatch.setattr(recommendation_router, "replace_career_recommendations", lambda *args: replaced.append(args))

    response = client.post("/recommendation/prompt")

    assert response.status_code == 500
    assert replaced == []


def test_valid_ai_reply_replaces_recommendations(client, monkeypatch):
    generated = CareerRecommendations(recommendations=[career() for _ in range(4)])

    async def valid_reply(*args, **kwargs):
        return generated

    replaced = []

    def replace(user_id, recommendations):
        replaced.append((user_id, recommendations))
        return [{"id": "row"}]

    monkeypatch.setattr(recommendation_router, "ask_gpt_structured", valid_reply)
    monkeypatch.setattr(recommendation_router, "replace_career_recommendations", replace)

    response = client.post("/recommendation/prompt")

    assert response.status_code == 200
    assert response.json() == {"status": "success", "recommendations": [{"id": "row"}]}
    assert replaced == [(USER.id, generated.recommendations)]
