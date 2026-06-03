# UniVise AWS Deployment Notes - Phase 1

## Purpose

This phase moves UniVise frontend and backend hosting to AWS while keeping Supabase PostgreSQL/Auth/RLS unchanged.

## Current production baseline

Frontend:

- Current host: Vercel
- Current URL:

Backend:

- Current host: Render
- Current URL:

Database/Auth:

- Current provider: Supabase
- Supabase PostgreSQL remains unchanged
- Supabase Auth remains unchanged
- Supabase RLS remains unchanged
- JWT secret must not be regenerated during this phase

## Target Phase 1 architecture

Frontend:

- React/Vite build hosted on S3
- Served through CloudFront

Backend:

- FastAPI backend packaged using Docker
- Docker image stored in ECR
- Runtime hosted on ECS Fargate
- Public API traffic routed through an Application Load Balancer

Secrets:

- Backend-only secrets moved to AWS Secrets Manager later
- Frontend only receives public VITE\_\* variables

## Non-goals

- Do not migrate Supabase to RDS
- Do not replace Supabase Auth
- Do not regenerate Supabase JWT secret
- Do not rewrite roadmap, MindMesh, transfer analysis, or Eunice logic
- Do not split backend into microservices in this phase

## Rollback plan

If AWS frontend fails:

- Keep using the existing Vercel frontend.

If AWS backend fails:

- Keep using the existing Render backend.

If CORS or auth redirect fails:

- Keep old Vercel and Render origins active while AWS origins are fixed.

Because Supabase is not migrated, rollback does not require reversing a database migration.
