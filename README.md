# UniVise

[![Live Demo](https://img.shields.io/badge/Live%20Demo-uni--vise.com-2563EB?style=flat-square&labelColor=0D1117&logo=googlechrome&logoColor=white)](https://uni-vise.com)
![React](https://img.shields.io/badge/React-19-8B949E?style=flat-square&labelColor=0D1117&logo=react&logoColor=8B949E)
![FastAPI](https://img.shields.io/badge/FastAPI-8B949E?style=flat-square&labelColor=0D1117&logo=fastapi&logoColor=8B949E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8B949E?style=flat-square&labelColor=0D1117&logo=postgresql&logoColor=8B949E)
![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-8B949E?style=flat-square&labelColor=0D1117&logo=awslambda&logoColor=8B949E)

UniVise is an AI-powered academic and career planning platform for UNSW students. It takes thousands of scattered handbook rules, prerequisites, and specialisation requirements and turns them into a clear picture of where a degree leads, which courses to take next, what switching programs would actually cost, and which careers it opens up. Built as an Honours research thesis at UNSW Sydney on AI systems for aligning university courses, majors, and career choice.

---

## Key Features

### Roadmap

A five-step guide to your degree, built in the background after onboarding. You pick your major or stream (and an optional minor) first, and every step follows that choice.

| Step | What you get |
|---|---|
| **Overview** | What the program covers, entry criteria, requirements and progression rules, WAM and honours calculation, awards and further study |
| **Courses** | Every Handbook requirement group with UOC progress. Tick completed courses, add any UNSW course, open one in CourseMesh |
| **Careers** | Entry, mid-career and senior roles with official salaries and employment rates, plus live "Hiring now" job ads |
| **Internships** | Ads open right now, programs that open each year and when, required placements, UNSW career resources |
| **Societies** | Matched student societies, professional bodies, leadership opportunities, and the full Arc club directory |

### CourseMesh

Your courses as an interactive prerequisite graph, coloured **Completed**, **Can take next**, **Not yet**, or **Not needed**.

- Click a course to see what it needs and unlocks. Double-click to go one level deeper.
- Add planned electives, arrange by level, fit to screen, undo, or reset.
- **Suggested next** recommends courses that fit your career goals, each with a reason.
- A guided tour teaches the controls on first visit.

### Compare programs

See how your completed courses would count in another program or specialisation.

- **Stat cards:** courses that count, UOC carried over, extra study, estimated finish.
- **Course breakdown:** what counts, what fills free electives, what would not count, and what is left.
- **AI advisor:** reasons to switch, reasons to stay, and next steps, based only on the computed numbers.

### Ask Eunice

An AI academic and career adviser, available from a floating button on every page.

- Knows your program, completed courses, courses you can take now, and shortlisted careers.
- Looks up courses, programs and prerequisites live, so answers follow real UNSW rules.
- Saved chats on the full chat page.

---

## How It Works

**Stack:** React 19 + Vite, FastAPI (Python 3.12), PostgreSQL on Supabase with row level security, Google OAuth.

**AI grounding:** the backend computes structured facts from Handbook data first (requirements left, prerequisite chains, transfer credit), then calls Anthropic Claude and OpenAI models in parallel with schema-constrained output. Any course code a model returns is checked against the student's real program, so advice stays grounded in real rules.

**Deployment (AWS):** S3 + CloudFront for the frontend, an arm64 container on Lambda (with the Lambda Web Adapter for streaming) behind CloudFront for the API, Secrets Manager, CloudWatch alarms, and GitHub Actions CI/CD over OIDC.

```
frontend/src/   app/, shared/, features/ (one folder per product area)
backend/app/    routers/, services/, llm/, models/, core/
backend/tests/  route contract and core logic tests
supabase/       schema and RLS migrations
```

---

## Licence

This project was developed as Honours research at UNSW Sydney and is currently in production under research. It is not licensed for reuse or redistribution.
