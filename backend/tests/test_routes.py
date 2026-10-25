from fastapi.routing import APIRoute

from app.main import app

EXPECTED_ROUTES = {
    ("DELETE", "/user/me"),
    ("GET", "/careers/certifications"),
    ("GET", "/careers/feed"),
    ("GET", "/course-picks"),
    ("GET", "/health"),
    ("GET", "/handbook/{kind}/{identifier}"),
    ("GET", "/traits/results"),
    ("GET", "/user/me/export"),
    ("POST", "/careers/refresh"),
    ("POST", "/chat/conversations/{conv_id}/reply/stream"),
    ("POST", "/compare"),
    ("POST", "/recommendation/prompt"),
    ("POST", "/recommendation/{rec_id}/explain"),
    ("POST", "/roadmap/unsw"),
    ("POST", "/roadmap/unsw/{roadmap_id}/industry"),
    ("POST", "/switch-advisor"),
}


def test_route_table_matches_snapshot():
    routes = {
        (method, route.path)
        for route in app.routes
        if isinstance(route, APIRoute)
        for method in route.methods
    }
    assert routes == EXPECTED_ROUTES
