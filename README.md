# UniVise

[![Live Demo](https://img.shields.io/badge/Live%20Demo-uni--vise.com-2563EB?style=flat-square&labelColor=0D1117&logo=googlechrome&logoColor=white)](https://uni-vise.com)
![React](https://img.shields.io/badge/React-19-8B949E?style=flat-square&labelColor=0D1117&logo=react&logoColor=8B949E)
![FastAPI](https://img.shields.io/badge/FastAPI-8B949E?style=flat-square&labelColor=0D1117&logo=fastapi&logoColor=8B949E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8B949E?style=flat-square&labelColor=0D1117&logo=postgresql&logoColor=8B949E)
![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-8B949E?style=flat-square&labelColor=0D1117&logo=awslambda&logoColor=8B949E)

UniVise is an AI-powered academic and career planning platform for UNSW students. Based on your program and career interests, it recommends which courses to take next and helps you find relevant jobs, internships and networking opportunities in Sydney.

Built as an Honours research thesis at UNSW Sydney on how AI can connect university courses, majors and career choices.

The system only supports current UNSW programs.

## Key Features

### My Program

Plan your studies around your degree and specialisations.

- **My courses:** track completed courses, choose electives and follow your degree requirements.
- **Next courses:** get suggestions based on prerequisites, interests and career goals.
- **CourseMesh:** explore an interactive map of course prerequisites and see what each course unlocks.
- **Societies:** discover student societies related to your field.

You can also explore other programs, with links to the official UNSW Handbook for course and program details.

### My Career

Explore opportunities and career paths connected to your degree.

- **Jobs and internships:** browse graduate and junior roles, internship ads, recurring programs and degree placements.
- **Networking:** find career fairs, industry events and professional communities.
- **Certifications:** discover relevant industry qualifications.
- **Career outlook:** explore roles, salary information and graduate outcomes where available.

### My Shortlist

Save courses, careers and opportunities in one place. Add personal notes, track job applications and certification progress, mark events you plan to attend and keep track of communities you have joined.

### Ask Eunice

Ask questions about your studies and career options. Eunice uses your program, interests, completed courses and saved careers to provide personalised guidance. It can look up course and program information from the Handbook catalogue and check prerequisites. Conversations are saved for you to revisit.

---

## Built With

React 19, Vite, Tailwind CSS, FastAPI and Supabase (PostgreSQL and authentication), with OpenAI and Anthropic Claude for AI features. The frontend is served through Amazon S3 and CloudFront, and the backend runs on AWS Lambda. GitHub Actions handles checks, deployment and manual maintenance workflows. Live at [uni-vise.com](https://uni-vise.com).

---

## Project Structure

```text
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
└── .github/workflows/    CI, deployment and maintenance workflows
```

---

## Licence

This project was developed as Honours research at UNSW Sydney. It is live and still under active research. It is not licensed for reuse or redistribution.
