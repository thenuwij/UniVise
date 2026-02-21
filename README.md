# UniVise — Academic Planning and Program Transfer Advisor

[![Live Demo](https://img.shields.io/badge/Live%20Demo-uni--vise--nu.vercel.app-blue?style=for-the-badge)](https://uni-vise-nu.vercel.app)

---

## Description

UniVise is an AI-powered academic advising and planning platform designed to help university students understand how their degree structure, specialisations, prerequisites, and career outcomes fit together.

UniVise was developed as part of an Honours research thesis investigating AI-driven academic advising systems at UNSW Sydney. The project received a **High Distinction** and was **selected among the top 22 projects for the UNSW Honours Thesis Showcase 2025**.

The broader platform was built in collaboration with a parallel Honours thesis by [David Choi](https://github.com/dchoi03), which focused on AI-powered university guidance for high school students. Together, the system supports both prospective and current university students through separate advisory pathways.

The platform consolidates fragmented university information — program handbooks, course rules, specialisation requirements, and industry signals — into a single decision-support experience. Students can explore structured roadmaps, visualise prerequisite constraints, compare programs, and receive recommendations for program transfers based on completed coursework.

UniVise is built as a full-stack system with a modern React frontend, a FastAPI backend, and a Supabase (PostgreSQL) database. It integrates an LLM reasoning layer to generate structured guidance and explanations, and optionally integrates live job market listings via SerpAPI to connect academic planning with real-world role demand.

The platform is **deployed to production** on Vercel (frontend) and Render (backend), with continuous deployment triggered on every Git push.

---

## Problems This System Solves

University planning is difficult for several key reasons:

### Information Fragmentation and Rule Complexity

Degree rules, specialisation requirements, prerequisites, and progression constraints are spread across multiple pages and formats, making it hard for students to reason about their pathway end-to-end.

### Lack of Decision Support for Switching Programs or Specialisations

Students considering a transfer often do not have a clear picture of what will carry over, what will not, and how switching affects time-to-graduation and future course options.

### Poor Visibility into Prerequisite Bottlenecks

Students frequently discover prerequisite chains too late, which can delay progression and limit specialisation choices.

### Weak Alignment Between Academic Choices and Career Outcomes

Students want to know how their program choices map to real job markets, skills, and employer demand, but this linkage is usually indirect and scattered.

UniVise addresses these issues by combining structured program data, rule-aware comparisons, prerequisite graph visualisation, and AI-generated advisory outputs.

---

## Key Features

### Log In and User Context

Users log into the platform via **Google OAuth** and operate within an account context that supports saving preferences, planning artifacts, and personalised results. UniVise is designed to operate with authenticated sessions and a persistent database-backed profile.

### Roadmap Generation

The roadmap feature generates a structured view of a student's program pathway. It presents a coherent sequence of recommended courses and highlights how program requirements are satisfied over time, based on rules and chosen specialisations.

This feature is designed to reduce the cognitive overhead of manually interpreting handbook requirements and planning around prerequisites. AI roadmap generation has been **optimised to run in under 30 seconds** through parallelised LLM API calls and structured course data caching — down from an initial generation time exceeding 50 seconds.

### Program Comparison and Transfer Analysis (Switch Advisor)

The transfer advisor enables a student to compare their current program against a target program and understand:

- Which completed courses are likely transferable
- Which are not transferable (and why)
- What remains to complete in the target program
- The overall impact on progression and workload

In addition to the structured comparison output, UniVise generates a recommendation narrative that explains the transfer tradeoffs and suggests a strategy for completing remaining requirements.

### Specialisation Selection Support

UniVise supports program structures with multiple specialisations. Users can select specialisations (for both current and target programs where applicable) and view how that selection changes requirements and transfer outcomes.

### Prerequisite Visualisation (MindMesh)

MindMesh is a prerequisite graph view that represents course dependencies as a force-directed graph. It enables students to:

- Identify prerequisite chains early
- Detect bottleneck courses that gate many downstream options
- Understand which courses unlock particular specialisations or electives

This improves planning quality and reduces late-stage surprises in progression.

### Career and Job Market Integration

UniVise integrates live job listings using SerpAPI (Google Jobs) to provide career-relevant information such as:

- Role distribution for a given query
- Employer trends
- Market signals that inform pathway decisions

This component can be enabled or disabled depending on API availability and cost.

---

## System Overview

### Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, TailwindCSS, React Router |
| Backend | FastAPI, Python |
| Database | Supabase (PostgreSQL) |
| AI Layer | OpenAI API, prompt-orchestrated LLM reasoning |
| Auth | Google OAuth |
| Deployment | Vercel (frontend), Render (backend), continuous deployment via Git |
| Job Data | SerpAPI (Google Jobs) — optional |

### High-Level Architecture

```
User
 └── React + TypeScript Frontend (Vercel)
       └── FastAPI Backend (Render)
             ├── Supabase PostgreSQL Database
             ├── LLM Reasoning Layer (OpenAI API)
             │     └── Parallelised prompt orchestration
             └── SerpAPI Integration (optional)
```

The backend coordinates rule parsing, transfer logic, prerequisite graph generation, and AI-driven advisory outputs.

### Technical Highlights

- **~40% reduction in AI generation time** via parallelised LLM API calls and structured data caching (50s → under 30s)
- Custom transfer-matching engine for cross-program comparison
- Dynamic prerequisite graph construction with force-directed layout (MindMesh)
- Google OAuth authentication with persistent, database-backed user profiles
- Production deployment with continuous delivery on every Git push
- Modular frontend architecture with clear separation between UI, business logic, and AI orchestration
- Designed for scalable institutional deployment

---

## Data Engineering

A significant portion of the UniVise engineering effort involved sourcing, cleaning, and structuring the large-scale real-world data that powers the platform's advisory outputs.

### Data Sources

- **UNSW Handbook** — The entire UNSW program and course handbook was scraped to extract degree rules, course descriptions, prerequisites, specialisation requirements, and progression constraints across thousands of courses and program structures
- **Job Market Listings** — Live job listing data integrated via SerpAPI (Google Jobs) to surface employer trends and role demand relevant to each program pathway
- **Society and Extracurricular Information** — Additional university data points scraped and structured to enrich the student-facing advisory context

### Data Cleaning and Processing

Raw scraped data contained significant noise, inconsistencies, and structural anomalies across different handbook formats and course entry styles. A dedicated cleaning and normalisation pipeline was developed to resolve these issues before ingestion into the database, ensuring advisory outputs were grounded in accurate, well-structured data.

### Database Design

The cleaned data was modelled into a relational PostgreSQL schema on Supabase, with multiple linked tables representing programs, courses, specialisations, prerequisites, and their interdependencies. The schema was designed to support efficient querying for roadmap generation, transfer matching, and prerequisite graph construction across thousands of data points.

**Row Level Security (RLS)** policies were implemented across all tables to enforce access control at the database level, ensuring users can only read and write data appropriate to their authenticated session.

### Automated Update Pipeline

Python scripts were developed to automate re-ingestion and synchronisation of university data, allowing the backend database to be updated quickly in response to changes in the UNSW handbook or program structures — without requiring manual data entry or schema migration.

---

## Usability Evaluation

UniVise was evaluated with **UNSW students** as part of the Honours research process. Participants completed structured tasks across the roadmap, transfer advisor, and MindMesh features, with feedback collected on system clarity, recommendation quality, and overall usefulness. Findings informed iterative improvements to the AI reasoning pipeline and UI design.

---

## User Guide

1. Log in to the platform using your Google account.
2. Navigate to the **Roadmap** page to generate and view a structured pathway for a selected program. Open **MindMesh** within the Roadmap to inspect prerequisites and identify bottleneck courses early.
3. Use the **Switch Advisor** to select:
   - Current program and specialisation
   - Target program and specialisation
4. Review the transfer summary:
   - Transferable courses
   - Non-transferable courses
   - Remaining requirements
   - Recommendation narrative
