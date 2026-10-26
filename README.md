# UniVise

[![Live Demo](https://img.shields.io/badge/Live%20Demo-uni--vise.com-2563EB?style=flat-square&labelColor=0D1117&logo=googlechrome&logoColor=white)](https://uni-vise.com)
![React](https://img.shields.io/badge/React-19-8B949E?style=flat-square&labelColor=0D1117&logo=react&logoColor=8B949E)
![FastAPI](https://img.shields.io/badge/FastAPI-8B949E?style=flat-square&labelColor=0D1117&logo=fastapi&logoColor=8B949E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8B949E?style=flat-square&labelColor=0D1117&logo=postgresql&logoColor=8B949E)
![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-8B949E?style=flat-square&labelColor=0D1117&logo=awslambda&logoColor=8B949E)

UniVise is an independent AI-powered academic and career planning platform for UNSW students, not an official UNSW service. Plans and changes in UniVise have no effect on official UNSW enrolment or study plans. Pick your degree and it shows what you need to graduate, which courses to take next and which careers your degree leads to. Built as an Honours research thesis at UNSW Sydney on AI systems for aligning university courses, majors, and career choice.

---

## Supported programs

Personal planning requires an enrolled degree from UniVise's supported undergraduate list; a free-text or missing degree cannot be used to complete setup. Accounts without a supported degree can still manage/export/delete their account data.

## Key Features

### Home

Home brings together two main areas: **My Program** for your degree and **My Career** for opportunities after and during study. The program panel shows your degree, selected specialisations and completed units of credit (UOC), with an edit menu for changing your program or specialisation.

### My Program

Your degree guide opens on **My courses**. A persistent section menu on desktop, and a section bar on mobile, lets you move between four sections:

| Section | What you get |
|---|---|
| **My courses** | A continuous checklist of core courses, discipline electives, free electives and general education, grouped by the requirements of your degree and specialisation |
| **Next courses** | Courses you can take now, with the skills and careers each one builds, and a one-click Add to My courses (shown for your own program) |
| **CourseMesh** | An interactive prerequisite map showing how your courses connect and what you can take next |
| **Societies** | Student societies related to your field, plus links to Rubric and the Arc club directory |

In **My courses**, tick completed courses, add courses to elective groups and track progress against each group's requirements. The first incomplete group opens automatically; expand individual groups or the whole checklist. Optional minors can be selected where the program offers them, and level-specific UOC rules appear alongside the relevant course group. Until a specialisation is selected, the checklist heading uses the degree name.

Change your program or specialisation to view its course lists. You can also explore other programs before making one your own.

### My Career

My Career opens on **Jobs**, with the same section navigation as My Program. It brings together opportunities and career information for your degree:

| Section | What you get |
|---|---|
| **Jobs** | Graduate and junior job ads, with top picks from SEEK or Adzuna and the latest Adzuna listings; filter by career role and save ads to your shortlist |
| **Internships** | Ads open now, annual internship programs and their application periods where available, plus placements built into your degree |
| **Networking** | Upcoming career fairs, industry nights and other events in Sydney or online, with links to organisations' event calendars and professional bodies for your field |
| **Certifications** | Relevant industry certifications, their providers and how long they take |
| **Career outlook** | Entry-level, mid-career and senior roles, salary information with source labels, QILT graduate full-time employment and starting salary figures where available, and UNSW career resources |

Jobs, internship ads and networking events are shown for your own program. When exploring another degree, you can view its certifications and career outlook. Loading feedback, source refresh controls and retry actions help you return to the feed when a search fails.

### CourseMesh

Inside My Program, CourseMesh lets you explore your degree as a prerequisite map. It uses your completed courses and chosen electives, with courses coloured **Completed**, **Can take next**, **Not yet**, or **Not needed**.

- Click a course to see what it needs and what it unlocks. Double-click to expand its connections.
- Add courses, arrange the map by course level, fit it to the screen, freeze its movement, and undo or reset view changes.
- **Suggested next** recommends courses that fit your career goals, each with a short reason.
- A guided tour introduces the controls on your first visit and can be reopened from the help button.

### My shortlist

Everything you save is grouped into sections, each tracked the way it needs: jobs and internships move through Saved, Applied, Interview, Offer and Not successful (with the date you applied); certifications through Interested, Studying, Exam booked and Earned, with an exam date; events can be marked Going and societies Joined; saved courses show whether they are completed, already in My courses, or can be added with one click. Careers and programs are plain bookmarks, and saved careers shape your certification suggestions. Each section has filters and notes, and closed ads and past events are marked.

### Official UNSW Handbook links

Course, program and specialisation details open in the official UNSW Handbook. Links prefer a published 2027 entry, then try 2026 and earlier years down to 2019. If the Handbook cannot be checked or no entry is found, the link opens the official Handbook home. The internal Handbook search and static detail pages are retired; old bookmarks redirect externally. **Explore other programs** still lets you choose a degree and explore its courses and careers within UniVise, with an official Handbook link for full details.

### Ask Eunice

An AI academic and career adviser available through the floating chat button, Ask Eunice in the main navigation or the full chat page. Eunice uses your program, specialisations, completed courses, degree progress, available next courses and shortlisted careers to answer in context. It can look up UNSW courses, programs and specialisations, check prerequisites and link to the Handbook sources it uses. Conversations are saved so you can return to them.

---

## Built With

React 19, Vite, Tailwind CSS, FastAPI and PostgreSQL (Supabase), with OpenAI and Anthropic Claude for AI features. The frontend is served through Amazon S3 and CloudFront, and the backend runs on AWS Lambda. Live at [uni-vise.com](https://uni-vise.com).

---

## Project Structure

```
UniVise/
├── frontend/             React app
│   └── src/
│       ├── app/          sign-in state, route guards and Handbook redirects
│       ├── shared/       layout, shared UI and API clients
│       └── features/     home, program (with CourseMesh), career, eunice,
│                         shortlist, account, onboarding and auth
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

This project was developed as Honours research at UNSW Sydney. It is live and still under active research. It is not licensed for reuse or redistribution.
