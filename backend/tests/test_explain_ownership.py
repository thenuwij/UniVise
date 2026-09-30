"""Tests for the ownership check on the leftover explain step.

Supabase and the AI call are faked; this checks the recommendation is only
looked up among the caller's own rows, so another student's recommendation
is never explained.
"""
import asyncio
from types import SimpleNamespace

from app.services import recommendation

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001", user_metadata={"student_type": "university"})
OTHER_USER = "00000000-0000-0000-0000-000000000002"
REC = {"id": "rec-1", "user_id": OTHER_USER, "career_title": "Data Analyst"}


class Query:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *args):
        return self

    def eq(self, column, value):
        self.rows = [r for r in self.rows if r.get(column) == value]
        return self

    def maybe_single(self):
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows[0] if self.rows else None)


def test_does_not_explain_another_students_recommendation(monkeypatch):
    tables = {"career_rec_details": [], "career_recommendations": [REC]}
    ai_calls = []

    async def user_info(user, student_type):
        return {"degree_field": "Bachelor of Computer Science"}

    async def ai(*args, **kwargs):
        ai_calls.append(args)
        return "{}"

    monkeypatch.setattr(recommendation, "supabase", SimpleNamespace(table=lambda name: Query(list(tables[name]))))
    monkeypatch.setattr(recommendation, "get_user_info", user_info)
    monkeypatch.setattr(recommendation, "ask_gpt_async", ai)

    asyncio.run(recommendation.explain_recommendation("rec-1", USER))

    assert ai_calls == []
