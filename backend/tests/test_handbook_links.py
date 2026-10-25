"""Handbook publication checks, year fallback and safe legacy redirects."""
import json

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers.handbook import router
from app.services import handbook_links as links


def page(code, year, published="1"):
    content = {"code": code, "implementation_year": str(year)}
    if published is not None:
        content["published_in_handbook"] = {"value": published}
    data = {"props": {"pageProps": {"pageContent": content}}}
    return '<script id="__NEXT_DATA__" type="application/json">' + json.dumps(data) + '</script>'


@pytest.fixture(autouse=True)
def empty_cache():
    links.published_url.cache_clear()
    yield
    links.published_url.cache_clear()


def mock_handbook(monkeypatch, replies):
    calls = []

    class Client:
        def __init__(self, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, **kwargs):
            calls.append(url)
            reply = replies[len(calls) - 1]
            if isinstance(reply, Exception):
                raise reply
            status, body = reply
            return httpx.Response(status, text=body, request=httpx.Request("GET", url))

    monkeypatch.setattr(links.httpx, "Client", Client)
    return calls


def test_prefers_published_2027_and_caches_it(monkeypatch):
    calls = mock_handbook(monkeypatch, [(200, page("COMP1511", 2027))])
    for _ in range(2):
        assert links.published_url("courses", "COMP1511", "undergraduate", 1).endswith("/2027/COMP1511")
    assert len(calls) == 1


@pytest.mark.parametrize("missing", [(404, ""), (410, ""), (200, '<script id="__NEXT_DATA__">{"props":{"pageProps":{"pageContent":null}}}</script>'), (200, page("COMP1511", 2027, "0")), (200, page("COMP1511", 2026))])
def test_falls_back_to_2026_when_2027_is_not_published(monkeypatch, missing):
    calls = mock_handbook(monkeypatch, [missing, (200, page("COMP1511", 2026))])
    assert links.published_url("courses", "COMP1511", "undergraduate", 1).endswith("/2026/COMP1511")
    assert len(calls) == 2


def test_continues_to_earlier_years(monkeypatch):
    mock_handbook(monkeypatch, [(404, ""), (404, ""), (200, page("3778", 2025))])
    assert links.published_url("programs", "3778", "undergraduate", 1).endswith("/2025/3778")


def test_specialisations_can_omit_publication_flag(monkeypatch):
    mock_handbook(monkeypatch, [(200, page("COMPA1", 2027, None))])
    assert links.published_url("specialisations", "COMPA1", "undergraduate", 1).endswith("/2027/COMPA1")


def test_all_missing_uses_official_home(monkeypatch):
    calls = mock_handbook(monkeypatch, [(404, "")] * 9)
    assert links.published_url("courses", "ZZZZ9999", "undergraduate", 1) == links.HANDBOOK
    assert len(calls) == 9


@pytest.mark.parametrize("failure", [httpx.ConnectError("offline"), httpx.ReadTimeout("timeout"), (503, "busy"), (200, "blocked")])
def test_temporary_failures_do_not_silently_select_an_older_year(monkeypatch, failure):
    calls = mock_handbook(monkeypatch, [failure])
    with pytest.raises((httpx.HTTPError, ValueError)):
        links.published_url("courses", "COMP1511", "undergraduate", 1)
    assert len(calls) == 1
    assert links.published_url.cache_info().currsize == 0


def test_legacy_uuid_resolves_code_and_postgraduate_level(monkeypatch):
    filters = []

    class Query:
        def select(self, *args): return self
        def eq(self, field, value):
            filters.append((field, value))
            return self
        def limit(self, *args): return self
        def execute(self):
            return type("Result", (), {"data": [{"code": "COMP9021", "study_level": "Postgraduate"}]})()

    monkeypatch.setattr(links, "supabase", type("DB", (), {"from_": lambda self, table: Query()})())
    identifier = "a9a5a6c9-668d-40fb-8d04-268d583d3a18"
    assert links.entry_identity("courses", identifier, None) == ("COMP9021", "postgraduate")
    assert filters == [("id", identifier)]


def test_public_route_redirects_and_validates_path(monkeypatch):
    from app.routers import handbook
    app = FastAPI()
    app.include_router(router)
    destination = links.HANDBOOK + "/undergraduate/courses/2027/COMP1511"
    monkeypatch.setattr(handbook, "resolve_handbook_url", lambda *args: destination)
    with TestClient(app) as client:
        response = client.get("/handbook/courses/COMP1511", follow_redirects=False)
        assert response.status_code == 302
        assert response.headers["location"] == destination
        assert response.headers["cache-control"] == "no-store"
        assert client.get("/handbook/other/COMP1511").status_code == 422
        assert client.get("/handbook/courses/COMP1511?level=other").status_code == 422
        assert client.get("/handbook/courses/bad.code").status_code == 422


def test_public_route_failure_still_leaves_univise(monkeypatch):
    from app.routers import handbook
    app = FastAPI()
    app.include_router(router)
    def offline(*args): raise httpx.ConnectError("offline")
    monkeypatch.setattr(handbook, "resolve_handbook_url", offline)
    with TestClient(app) as client:
        response = client.get("/handbook/courses/COMP1511", follow_redirects=False)
        assert response.headers["location"] == links.HANDBOOK
