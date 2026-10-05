"""Tests for deleting and downloading a student's own account data.

Supabase is faked; these check that only the signed-in user is deleted or
exported, that the export lists every table, and that a failure returns a
short message.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import user as user_router
from app.services import user_data_export

USER = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: USER
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


def fake_admin(monkeypatch, delete_user):
    admin = SimpleNamespace(delete_user=delete_user)
    monkeypatch.setattr(user_router, "supabase", SimpleNamespace(auth=SimpleNamespace(admin=admin)))


def test_deletes_only_the_signed_in_user(client, monkeypatch):
    deleted = []
    fake_admin(monkeypatch, lambda user_id: deleted.append(user_id))

    response = client.delete("/user/me")

    assert response.status_code == 200
    assert response.json() == {"deleted": True}
    assert deleted == [USER.id]


def test_failed_delete_returns_a_short_message(client, monkeypatch):
    def fail(user_id):
        raise RuntimeError("auth admin unavailable: connection refused")

    fake_admin(monkeypatch, fail)

    response = client.delete("/user/me")

    assert response.status_code == 500
    assert response.json() == {"detail": "Could not delete your account. Please try again."}


class Query:
    def __init__(self, name, rows):
        self.name = name
        self.rows = rows

    def select(self, *args):
        return self

    def in_(self, column, values):
        self.rows = [r for r in self.rows if r.get(column) in values]
        return self

    def range(self, start, end):
        self.rows = self.rows[start:end + 1]
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


ROWS = {
    "student_uni_data": [{"user_id": USER.id, "degree_field": "Computer Science"}, {"user_id": "someone-else"}],
    "conversations": [{"id": "conv-1", "user_id": USER.id}, {"id": "conv-2", "user_id": "someone-else"}],
    "conversation_messages": [
        {"id": "m1", "conversation_id": "conv-1", "content": "Hi"},
        {"id": "m2", "conversation_id": "conv-2", "content": "Not yours"},
    ],
}


def test_export_holds_only_the_students_rows_and_every_table(client, monkeypatch):
    account = SimpleNamespace(
        id=USER.id, email="student@example.com", app_metadata={"provider": "google"},
        created_at="2026-10-01T00:00:00Z", last_sign_in_at="2026-10-06T00:00:00Z", user_metadata={"full_name": "Sam"},
    )
    admin = SimpleNamespace(get_user_by_id=lambda user_id: SimpleNamespace(user=account))
    fake = SimpleNamespace(table=lambda name: Query(name, list(ROWS.get(name, []))), auth=SimpleNamespace(admin=admin))
    monkeypatch.setattr(user_data_export, "supabase", fake)

    response = client.get("/user/me/export")

    assert response.status_code == 200
    assert response.headers["content-disposition"].startswith('attachment; filename="univise-my-data-')
    body = response.json()
    assert body["account"]["email"] == "student@example.com"
    assert body["account"]["sign_in_provider"] == "google"
    assert len(body["tables"]) == 24
    assert body["tables"]["student_uni_data"] == [ROWS["student_uni_data"][0]]
    assert body["tables"]["conversation_messages"] == [ROWS["conversation_messages"][0]]
    assert body["tables"]["mindmeshes"] == []
