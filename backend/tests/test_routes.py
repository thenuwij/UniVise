from fastapi.routing import APIRoute

from app.main import app

EXPECTED_ROUTES = {
    ("DELETE", "/roadmap/{mode}"),
    ("GET", "/auth/valid_token"),
    ("GET", "/health"),
    ("GET", "/recommendation/prompt"),
    ("GET", "/roadmap/{mode}"),
    ("GET", "/traits/results"),
    ("GET", "/user/student_type"),
    ("GET", "/user/user_info"),
    ("GET", "/user/user_recommendations"),
    ("POST", "/chat/conversations/{conv_id}/reply/stream"),
    ("POST", "/compare"),
    ("POST", "/final-degree-plan/"),
    ("POST", "/final-unsw-degrees/"),
    ("POST", "/recommendation/{rec_id}/explain"),
    ("POST", "/roadmap/school"),
    ("POST", "/roadmap/unsw"),
    ("POST", "/roadmap/unsw/{roadmap_id}/industry"),
    ("POST", "/smart-related/degrees-for-course"),
    ("POST", "/smart-summary/degree"),
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
