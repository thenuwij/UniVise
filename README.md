# UniVise

[![Live Demo](https://img.shields.io/badge/Live%20Demo-uni--vise.com-2563EB?style=flat-square&labelColor=0D1117&logo=googlechrome&logoColor=white)](https://uni-vise.com)
![React](https://img.shields.io/badge/React-19-8B949E?style=flat-square&labelColor=0D1117&logo=react&logoColor=8B949E)
![FastAPI](https://img.shields.io/badge/FastAPI-8B949E?style=flat-square&labelColor=0D1117&logo=fastapi&logoColor=8B949E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8B949E?style=flat-square&labelColor=0D1117&logo=postgresql&logoColor=8B949E)
![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-8B949E?style=flat-square&labelColor=0D1117&logo=awslambda&logoColor=8B949E)

UniVise is an AI-powered academic and career planning platform for UNSW students. It takes thousands of scattered handbook rules, prerequisites, and specialisation requirements and turns them into a clear picture of where a degree leads, which courses to take next, what switching programs would actually cost, and which careers it opens up. Built as an Honours research thesis at UNSW Sydney on AI systems for aligning university courses, majors, and career choice.

---

## Key Features

- **Dashboard.** The home page after sign-in. A program card shows your UOC completed, specialisation and how many courses you can take next, with one main button to tick courses and see what comes next. Shortcuts jump to each roadmap step, your top career matches show with salary ranges, and a short first-visit guide explains the page. You can change your saved program here, or explore any UNSW program's roadmap before choosing one.
- **Roadmap.** A five-step guide to a degree, built in the background once you finish onboarding and cached per program so it usually opens instantly. You pick your major or stream (and an optional minor) first, and every step follows that choice.
  - **Overview:** what the program is about and your chosen specialisation, with tabs for entry criteria, program requirements and progression rules, WAM and honours calculation with the classes of honours, and awards plus career and further study paths.
  - **Courses:** every Handbook requirement group (core, prescribed electives, free electives, gen ed) with its UOC target and progress. Choose a minor if your program has one, tick the courses you have done, add any other UNSW course, and open any course in CourseMesh. Elective rules such as "any level 3 COMP course" are checked so the counts stay accurate.
  - **Careers:** roles split into entry level, mid-career and senior, with official starting salaries, employment rates and their data source, live job ads marked "Hiring now" on entry-level roles, and specialisations worth considering.
  - **Internships:** ads open right now, programs that open at set times each year with the months they usually open, any required placement, and UNSW career resources.
  - **Societies:** student societies matched to the program with their benefits and activities, relevant professional bodies, leadership opportunities and skills you will build, plus a link to every club in the Arc UNSW directory.
- **CourseMesh.** Your courses as an interactive prerequisite graph, coloured Completed, Can take next, Not yet, or Not needed (when you chose another option in a "one of" rule).
  - Click a course to see what it needs, what it unlocks and its Handbook rule. Double-click to open its prerequisites one level deeper.
  - Add the electives you plan to take, arrange courses by level (1 to 4), fit everything on screen, undo, or reset the view.
  - A Suggested next panel recommends courses you can take that fit your career goals, each with a short reason.
  - A hands-on guided tour teaches the controls on first visit.
- **Compare programs.** Shows how your ticked courses would count in another UNSW program or a different specialisation of your own. Search for any program or pick one from your faculty, and choose its major.
  - Stat cards show courses that count, UOC carried over, extra study and estimated finish.
  - Courses are sorted into what counts (from course lists and Handbook elective rules), what fills free electives, what would not count, and what is still left.
  - An AI advisor gives reasons to switch, reasons to stay and next steps, reading only those computed numbers.
- **Ask Eunice.** An AI academic and career adviser, opened from a floating button on every page or as a full chat page with saved chats. Eunice knows your program, specialisation, completed courses, courses you can take now, shortlisted careers and the page you are on. It can look up courses, programs and specialisations and check prerequisites live, so answers are specific to UNSW rules.

---

## How It Works

React 19 + Vite frontend, FastAPI (Python 3.12) backend, PostgreSQL on Supabase with row level security, and Google OAuth. The backend computes structured facts from Handbook data first (requirements left, prerequisite chains, transfer credit), then calls Anthropic Claude and OpenAI models in parallel with schema-constrained output. Any course code a model returns is checked against the student's real program, so advice stays grounded in real rules.

Deployed on AWS: S3 + CloudFront for the frontend, an arm64 container on Lambda (with the Lambda Web Adapter for streaming) behind CloudFront for the API, Secrets Manager, CloudWatch alarms, and GitHub Actions CI/CD over OIDC.

```
frontend/src/   app/, shared/, features/ (one folder per product area)
backend/app/    routers/, services/, llm/, models/, core/
backend/tests/  route contract and core logic tests
supabase/       schema and RLS migrations
```

---

## Licence

This project was developed as Honours research at UNSW Sydney and is currently in production under research. It is not licensed for reuse or redistribution.
