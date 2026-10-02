# UniVise

[![Live Demo](https://img.shields.io/badge/Live%20Demo-uni--vise.com-2563EB?style=flat-square&labelColor=0D1117&logo=googlechrome&logoColor=white)](https://uni-vise.com)
![React](https://img.shields.io/badge/React-19-8B949E?style=flat-square&labelColor=0D1117&logo=react&logoColor=8B949E)
![FastAPI](https://img.shields.io/badge/FastAPI-8B949E?style=flat-square&labelColor=0D1117&logo=fastapi&logoColor=8B949E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8B949E?style=flat-square&labelColor=0D1117&logo=postgresql&logoColor=8B949E)
![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-8B949E?style=flat-square&labelColor=0D1117&logo=awslambda&logoColor=8B949E)

UniVise is an AI-powered academic and career planning platform for UNSW students. It takes thousands of scattered handbook rules, prerequisites, and specialisation requirements and turns them into a clear picture of where a degree leads, which courses to take next, what switching programs would actually cost, and which careers it opens up. Built as an Honours research thesis at UNSW Sydney on AI systems for aligning university courses, majors, and career choice.

---

## Motivation

Degree planning at UNSW is spread across handbook pages, program rules, and specialisation requirements that rarely line up. Four gaps follow from that.

1. **Rules are fragmented.** Prerequisites, progression constraints, and specialisation requirements live in different places and formats, so reasoning about a pathway end to end is hard.

2. **Switching programs is a guess.** Students considering a transfer have no clear view of what carries over, what does not, or what it costs in extra terms.

3. **Prerequisite chains surface too late.** Bottleneck courses are usually discovered after they have already delayed progression or closed off a specialisation.

4. **Career links are indirect.** Students want to know how program choices map to real roles and employers, but that connection is scattered at best.

UniVise pulls these into one place: structured program data from the UNSW Handbook, rule-aware program comparison, a prerequisite graph of the student's own courses, and AI-generated advice grounded in that data.

---

## Key Features

### Dashboard

The starting point after sign-in. It shows the student's journey through their roadmap with one suggested next step, their progress at a glance (units of credit completed, specialisation, and how many courses they can take next), and the careers that fit them.

### Roadmap

A five-step view of the student's own degree: Overview, Structure, Societies, Careers, and Internships. The specialisation is chosen first, and the roadmap starts building in the background as soon as the student finishes onboarding. Structure lists the program and specialisation courses with completion ticks and AI course suggestions. Careers shows how the degree leads to specific roles, naming real courses from the student's program.

### CourseMesh

The student's courses as a prerequisite graph, coloured Completed, Can take next, or Not yet. It exposes prerequisite chains and bottleneck courses, and highlights AI-recommended courses the student can take now, each with a one-line reason linked to their career goals.

### Handbook

One search across every UNSW degree, major, minor, honours plan, and course, with results grouped by type. Each detail page links to the official UNSW Handbook and to the matching roadmap.

### Switch Degree

Compares the student's current program with a target program: what transfers, what does not, what is left, and what it costs in extra terms. An AI advisor weighs those facts to reach a recommendation, and can summarise how the target degree fits the student's interests and goals.

### Ask Eunice

An AI chat adviser that knows the student's program, specialisation, completed courses, the courses they can take now, and their shortlisted careers, so it answers specifically before pointing to official sources.

---

## System Overview

A React frontend, a FastAPI backend, and a PostgreSQL database, with an LLM layer that spans Anthropic and OpenAI and picks a model per task for quality and cost.

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS 4 with design tokens for light and dark mode, React Router 7 |
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL with row level security policies on every table, managed on Supabase |
| AI Layer | OpenAI GPT-5.4-mini and Anthropic Claude (Sonnet 5, Haiku 4.5), selected per task, with structured JSON output |
| Graphs | react-force-graph, graphology |
| Auth | Google OAuth with JWT bearer tokens, validated on every protected endpoint |
| Quality | pytest, Vitest, ESLint, and knip, run in GitHub Actions on every pull request |

### How It Works

A request hits CloudFront, then FastAPI on Lambda. Program rules, course data, and prerequisites come from Postgres, and the backend computes the structured facts first: transfer rates, prerequisite chains, remaining requirements, courses available next, extra terms. Only then does it call the LLM layer, with independent prompts running in parallel and responses constrained to a schema.

The models reason over facts the backend has already computed, not over raw handbook text, and any course code a model returns is checked against the student's real program. That keeps advice grounded in real program rules rather than in whatever the model recalls about UNSW.

Handbook data is cleaned before it is displayed. Placeholder values are stored as empty rather than as text, durations are stored as numbers, and one shared formatter turns long handbook text into paragraphs and real lists. A read-only audit script checks every displayed field after each data import.

### Deployment

| Component | Service |
|---|---|
| Frontend | S3 serving the Vite build, delivered by CloudFront with SPA fallback and HTTPS via ACM |
| Backend | Lambda running an arm64 container, with the Lambda Web Adapter running FastAPI as a real uvicorn server so streaming works |
| API delivery | CloudFront at `api.uni-vise.com`, caching disabled for personalised responses |
| Images | ECR, tagged by commit SHA |
| Secrets | AWS Secrets Manager, loaded at runtime |
| CI/CD | GitHub Actions on push to `main`, authenticated by OIDC with no stored AWS keys |
| Monitoring | CloudWatch alarms on errors, throttles, and p95 duration, notified through SNS |

### Repository Structure

```
frontend/src/
  app/          auth context and route guard
  shared/       Supabase and API clients, display formatting, layout (page header, navigation), shared UI
  features/     one folder per product area (dashboard, roadmap, mindmesh, explore, transfer, chat, ...),
                each with its own pages/, plus components/, hooks/ or utils/ where needed
backend/app/
  routers/      FastAPI endpoints
  services/     business logic: roadmap generation, course picks, program comparison, advisors, chat context
  llm/          OpenAI and Claude clients, structured output and parsing of model output
  models/       Pydantic request and response schemas
  core/         configuration, database client, JWT auth
backend/scripts/  one-off data maintenance: handbook data clean-up, display-data audit, faculty and course-list repairs
backend/tests/    API route contract and core logic tests
supabase/migrations/  database schema and row level security policies as SQL migrations
```

---

## Using It

1. Sign in with Google and complete the short onboarding survey, including your UNSW program and, optionally, your major or stream.
2. Open your dashboard. Your roadmap is already being built, and the dashboard suggests your next step.
3. Tick the courses you have completed in the roadmap's Structure step, then open CourseMesh to see what you can take next and why.
4. Use **Handbook** to look up any degree, major, or course, and **Switch Degree** to compare your program with another.
5. Ask Eunice anything about your courses or career plans.

---

## Licence

This project was developed as Honours research at UNSW Sydney and is currently in production under research. It is not licensed for reuse or redistribution.
