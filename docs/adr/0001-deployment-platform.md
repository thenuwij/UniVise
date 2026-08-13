# ADR 0001 — Deployment Platform for UniVise

- **Status:** Accepted
- **Date:** 2026-06-09
- **Decider:** Thenuja Wijesuriya
- **Tags:** hosting, cost, FastAPI backend, usability study

## Context

UniVise is an AI-powered academic advising platform for UNSW students: one FastAPI
backend, a React/Vite frontend, and Supabase for the database and auth. It is an
Honours thesis project, with a supervised usability study of around 80 students a few
months out. Traffic is low and bursty, not sustained.

Three things mattered when picking where to host it:

1. Reliability during the study. Students need to test quickly, without waiting on a
   cold start.
2. Cost. This is a self-funded student project.
3. Learning. I wanted hands-on experience with a real cloud deployment.

## Decision

Host the frontend as a static build on S3, served through CloudFront. Host the backend
as a containerised FastAPI app on ECS Fargate behind an Application Load Balancer, with
images in ECR and CI/CD through GitHub Actions. Secrets live in AWS Secrets Manager and
HTTPS is handled by ACM.

## Options considered

| Option | Idle cost | Cold start | Ops burden | Notes |
|---|---|---|---|---|
| Render free tier | $0 | Yes, spins down | None | Cold starts made student testing slow |
| Render Starter | ~$7/mo | No | None | Cheapest always-on option |
| ECS Fargate + ALB (chosen) | ~$42/mo after right-sizing | No | Low | More than this workload needs |
| Lambda + API Gateway | ~$2–5/mo | Minor, first request | Low | Best cost fit for bursty traffic |
| Kubernetes (EKS) | High | No | High | Too much for a single small service |

## How I got here

1. Started on the Render free tier. It worked, but the service spun down and cold
   starts made testing unreliable.
2. Moved to Render Starter ($7/mo, no spin-down). That fixed the cold starts and was
   the cheapest always-on option.
3. Migrated to AWS Fargate to get hands-on AWS experience before the study. I did not
   evaluate Lambda at this point, which was a gap.
4. The bill was heading for roughly $100/mo. Fargate compute, ALB hours and public IPv4
   charges all run continuously, and none of them have a free tier.
5. Cut it back to one right-sized task (256 CPU / 512 memory) and trimmed the ALB from
   three availability zones to two. That took the bill from about $80 to about $42/mo,
   a reduction of roughly 48%.
6. Looked at Lambda + API Gateway and found it would cost about $2–5/mo, but deferred
   it. Re-architecting the backend mid-study would risk the reliability the study needs.

## Consequences

Good:

- No cold starts during the usability study.
- Hands-on experience with containers, load balancing and CI/CD on AWS.
- The cost breakdown is understood and documented, with a budget alarm in place.

Trade-offs:

- Costs more than the workload requires: ~$42/mo against ~$7 on Render or ~$3 on
  serverless.
- The ALB and public IPv4 charges are around 70% of the remaining bill, and neither can
  be reduced without changing the architecture.

## Cost guardrail

An AWS Budget (`univise-monthly-cost`, $50 USD/month) emails alerts at 60%, 80% and
100% of actual spend, and at 100% of forecast spend.

## Future

- Build a Lambda + API Gateway variant on a branch. Deploying the same app two ways
  gives a ~$3/mo option for quiet periods without cutting over now.
- After the study, downsize or shut down the always-on stack and keep the AWS
  infrastructure code in the repo.
