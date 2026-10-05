"""Tests for deleting a student's own account.

The Supabase admin API is faked; these check that only the signed-in user is
deleted and that a failure returns a short message.
"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import user as user_router

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
