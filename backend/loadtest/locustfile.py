"""A study session of students using UniVise at the same time.

Run from the backend folder after `python -m loadtest.accounts create --count N`:
    locust -f loadtest/locustfile.py --headless -u N -r 2 --run-time 10m \\
        --csv ../ai/loadtest/run-N --html ../ai/loadtest/run-N.html

Each simulated student signs in, completes the survey (saves the program and
major, starts the roadmap build and career recommendations), opens the
dashboard, the roadmap, CourseMesh with its course picks, and asks Eunice one
question, with reading time between steps. Then they keep browsing until the
run ends. Requests go to the live API and Supabase exactly as the app sends them.
"""
import json
import os
import uuid
from pathlib import Path

from dotenv import dotenv_values
from locust import HttpUser, between, events, task

ROOT = Path(__file__).resolve().parents[2]
FRONTEND_ENV = dotenv_values(ROOT / "frontend" / ".env")
SUPABASE_URL = os.environ.get("LOADTEST_SUPABASE_URL") or FRONTEND_ENV["VITE_SUPABASE_URL"]
ANON_KEY = os.environ.get("LOADTEST_SUPABASE_ANON_KEY") or FRONTEND_ENV["VITE_SUPABASE_ANON_KEY"]
API = os.environ.get("LOADTEST_API", "https://api.uni-vise.com")
ACCOUNTS = json.loads((ROOT / "ai" / "loadtest" / "accounts.json").read_text())
QUESTIONS = [
    "Which electives would suit a career in data?",
    "What should I take next term?",
    "How does my degree lead to a graduate job?",
]
NEXT_ACCOUNT = iter(range(len(ACCOUNTS)))


@events.test_start.add_listener
def check_accounts(environment, **_):
    if environment.runner and environment.parsed_options and environment.parsed_options.num_users > len(ACCOUNTS):
        raise SystemExit(f"Only {len(ACCOUNTS)} accounts exist; create more first.")


class Student(HttpUser):
    host = API
    wait_time = between(5, 15)

    def on_start(self):
        self.account = ACCOUNTS[next(NEXT_ACCOUNT)]
        self.user_id = self.account["user_id"]
        res = self.client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            json={"email": self.account["email"], "password": self.account["password"]},
            headers={"apikey": ANON_KEY},
            name="supabase: sign in",
        )
        self.token = res.json().get("access_token")
        self.surveyed = False
        self.chatted = False

    def db_headers(self, **extra):
        return {"apikey": ANON_KEY, "Authorization": f"Bearer {self.token}", **extra}

    def api_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    def db_get(self, table, query, name):
        return self.client.get(f"{SUPABASE_URL}/rest/v1/{table}?{query}", headers=self.db_headers(), name=f"supabase: {name}")

    def db_post(self, table, body, name, prefer="return=minimal", query=""):
        return self.client.post(
            f"{SUPABASE_URL}/rest/v1/{table}{query}", json=body, headers=self.db_headers(Prefer=prefer), name=f"supabase: {name}"
        )

    def survey(self):
        a = self.account
        self.db_post("user_enrolled_program", {
            "user_id": self.user_id, "degree_code": a["degree_code"], "program_name": a["program_name"],
            "specialisation_codes": [], "specialisation_names": [],
        }, "save program")
        if a["major_id"]:
            self.db_post(
                "user_specialisation_selections",
                {"user_id": self.user_id, "degree_code": a["degree_code"], "major_id": a["major_id"], "honours_id": None},
                "save major", prefer="resolution=merge-duplicates,return=minimal", query="?on_conflict=user_id,degree_code",
            )
        res = self.client.post("/roadmap/unsw", json={"degree_id": a["id"]}, headers=self.api_headers(), name="api: build roadmap")
        roadmap_id = res.json().get("id") if res.ok else None
        if roadmap_id:
            self.client.post(f"/roadmap/unsw/{roadmap_id}/industry", headers=self.api_headers(), name="api: roadmap careers, internships, societies")
        self.db_post("student_uni_data", {
            "user_id": self.user_id, "degree_stage": "Bachelor's Degree", "academic_year": "2nd year",
            "degree_field": a["program_name"], "interest_areas": ["Tech & Software"], "priorities": [], "work_style": [], "hobbies": [],
        }, "save survey")
        self.client.post("/recommendation/prompt", headers=self.api_headers(), name="api: career recommendations")
        self.surveyed = True

    def dashboard(self):
        self.db_get("user_enrolled_program", f"select=degree_code,program_name&user_id=eq.{self.user_id}", "enrolled program")
        self.db_get("career_recommendations", f"select=*&user_id=eq.{self.user_id}", "career recommendations")
        self.db_get("user_completed_courses", f"select=course_code,is_completed&user_id=eq.{self.user_id}", "completed courses")

    def roadmap(self):
        self.db_get("unsw_roadmap", f"select=id,created_at,payload&user_id=eq.{self.user_id}&order=created_at.desc&limit=5", "open roadmap")
        self.db_get("unsw_degrees_final", f"select=*&degree_code=eq.{self.account['degree_code']}", "degree")

    def coursemesh(self):
        res = self.db_get("unsw_degrees_final", f"select=sections&degree_code=eq.{self.account['degree_code']}", "program sections")
        sections = (res.json() or [{}])[0].get("sections") if res.ok else []
        codes = [c["code"] for s in sections or [] if isinstance(s, dict) for c in s.get("courses") or [] if isinstance(c, dict) and c.get("code")][:80]
        if codes:
            joined = ",".join(codes)
            self.db_get("mindmesh_edges_global", f"select=from_key,to_key,edge_type,logic_type,group_id&to_key=in.({joined})", "course links")
            self.db_get("mindmesh_nodes_global", f"select=key,label,uoc,faculty,school,level&key=in.({joined})", "course nodes")
        self.client.get("/course-picks", headers=self.api_headers(), name="api: course picks")

    def eunice(self):
        conversation = str(uuid.uuid4())
        self.db_post("conversations", {"id": conversation, "user_id": self.user_id, "title": "Load test"}, "new conversation")
        question = QUESTIONS[hash(self.user_id) % len(QUESTIONS)]
        self.db_post("conversation_messages", {"conversation_id": conversation, "sender": "user", "content": question}, "save message")
        with self.client.post(
            f"/chat/conversations/{conversation}/reply/stream", json={"content": question},
            headers=self.api_headers(), name="api: Eunice reply (first words)", stream=True, catch_response=True,
        ) as res:
            text = "".join(chunk.decode(errors="ignore") for chunk in res.iter_content(1024) if chunk)
            if not res.ok or "[STREAM_ERROR]" in text or not text.strip():
                res.failure(f"status {res.status_code}, {len(text)} characters")
        self.chatted = True

    @task
    def session(self):
        if not self.token:
            return
        if not self.surveyed:
            self.survey()
            return
        self.dashboard()
        self.roadmap()
        self.coursemesh()
        if not self.chatted:
            self.eunice()
