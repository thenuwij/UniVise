# UniVise

[![Live Demo](https://img.shields.io/badge/Live%20Demo-uni--vise.com-2563EB?style=flat-square&labelColor=0D1117&logo=googlechrome&logoColor=white)](https://uni-vise.com)
![React](https://img.shields.io/badge/React-19-8B949E?style=flat-square&labelColor=0D1117&logo=react&logoColor=8B949E)
![FastAPI](https://img.shields.io/badge/FastAPI-8B949E?style=flat-square&labelColor=0D1117&logo=fastapi&logoColor=8B949E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8B949E?style=flat-square&labelColor=0D1117&logo=postgresql&logoColor=8B949E)
![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-8B949E?style=flat-square&labelColor=0D1117&logo=awslambda&logoColor=8B949E)

UniVise is an AI-powered academic and career planning platform for UNSW students. Pick your degree and it shows what you need to graduate, which courses to take next, what switching programs would cost you, and which careers your degree leads to. Built as an Honours research thesis at UNSW Sydney on AI systems for aligning university courses, majors, and career choice.

---

## Key Features

### Roadmap

A personal guide to your degree, tailored to the UNSW program and major (or stream) you choose. Change your program or major and the whole roadmap changes with it: the requirements, the careers, the internships and the societies all come from that specific degree.

It is split into five steps:

| Step | What you get |
|---|---|
| **Overview** | What your program covers, entry criteria, requirements and progression rules, WAM and honours calculation, awards and further study |
| **Courses** | Every UNSW Handbook requirement group for your program, with progress in units of credit (UOC). Tick the courses you have completed and add any other UNSW course |
| **Careers** | Entry, mid-career and senior roles your degree leads to, with official salaries and employment rates, plus live "Hiring now" job ads |
| **Internships** | Ads open right now, programs that open each year and when, required placements, UNSW career resources |
| **Societies** | Student societies and professional bodies matched to your field, leadership opportunities, and the full Arc club directory |

### CourseMesh

Your courses drawn as an interactive prerequisite map, built from the courses you tick in your Roadmap. Each course is coloured **Completed**, **Can take next**, **Not yet**, or **Not needed**, so you can see at a glance what is open to you and what is holding you back.

- Click a course to see what it needs and what it unlocks. Double-click to go one level deeper.
- Add the electives you plan to take, arrange courses by year level, and undo or reset at any time.
- **Suggested next** recommends courses that fit your career goals, each with a short reason.
- A guided tour teaches the controls on your first visit.

### Compare programs

Thinking of switching degrees? See how the courses you have already completed would count in another program or specialisation.

- **Summary:** courses that count, UOC carried over, extra study needed, and estimated finish.
- **Breakdown:** which courses count, which fill free electives, which would not count, and what is left to do.
- **Advisor:** reasons to switch, reasons to stay, and suggested next steps.

### Ask Eunice

An AI academic and career adviser, available from a button on every page. Eunice knows your program, the courses you have completed, what you can take next, and your shortlisted careers, and can look up any UNSW course or program to answer specifically. Your chats are saved.

---

## Built With

React, Vite, FastAPI, PostgreSQL (Supabase), Anthropic Claude, deployed on AWS. Live at [uni-vise.com](https://uni-vise.com).

---

## Project Structure

```
UniVise/
├── frontend/             React app
│   └── src/
│       ├── app/          sign-in state and route guard
│       ├── shared/       layout, shared UI and API clients
│       └── features/     roadmap, mindmesh (CourseMesh), transfer (Compare programs),
│                         chat (Eunice), dashboard, onboarding and more
├── backend/              FastAPI app
│   ├── app/              routers, services, llm, models, core
│   ├── scripts/          UNSW Handbook import and data maintenance
│   └── tests/
├── supabase/migrations/  database schema and access rules
├── .github/workflows/    CI, deployment and scheduled jobs
└── docs/                 project notes
```

---

## Licence

This project was developed as Honours research at UNSW Sydney and is currently in production under research. It is not licensed for reuse or redistribution.
