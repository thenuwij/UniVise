"""Tests for the apply and certification link check.

HTTP is faked; these check that a link counts as dead when it fails, when the
server refuses it, or when it redirects to an error page that still answers OK.
"""
import asyncio

import httpx

from app.services.roadmap import industry


def check(monkeypatch, url, handler):
    transport = httpx.MockTransport(handler)
    real_client = httpx.AsyncClient
    monkeypatch.setattr(industry.httpx, "AsyncClient", lambda **kwargs: real_client(transport=transport, **kwargs))
    return asyncio.run(industry.validate_url(url))


def test_live_page_passes(monkeypatch):
    assert check(monkeypatch, "https://careers.example.com/interns", lambda request: httpx.Response(200))


def test_redirect_to_an_error_page_is_dead(monkeypatch):
    def handler(request):
        if request.url.path == "/interns":
            return httpx.Response(302, headers={"location": "https://careers.example.com/errorpage/?errortype=404"})
        return httpx.Response(200)

    assert not check(monkeypatch, "https://careers.example.com/interns", handler)


def test_not_found_is_dead(monkeypatch):
    assert not check(monkeypatch, "https://careers.example.com/missing", lambda request: httpx.Response(404))


def test_query_words_alone_do_not_count_as_an_error_page(monkeypatch):
    assert check(monkeypatch, "https://careers.example.com/interns?ref=404-campaign", lambda request: httpx.Response(200))


def test_non_web_link_is_dead():
    assert not asyncio.run(industry.validate_url("mailto:careers@example.com"))
