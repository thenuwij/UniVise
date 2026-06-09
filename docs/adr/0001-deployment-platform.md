# ADR 0001 — Deployment Platform for UniVise

- **Status:** Accepted (with planned follow-up — see "Future")
- **Date:** 2026-06-09
- **Decider:** Thenuja Wijesuriya
- **Context tags:** hosting, cost, FastAPI backend, research/usability study

## Context

UniVise is an AI-powered academic advising platform for UNSW students — a single
FastAPI backend plus a React/Vite frontend, backed by Supabase. It is a research /
portfolio project (HD thesis, UNSW CSE Showcase) with an upcoming supervised
usability study (~80 students) a few months out. Traffic is **low and bursty**, not
sustained high volume.

The deployment platform needed to balance three goals that do not always point the
same way:

1. **Reliability for the usability study** — students must be able to test quickly,
   with no cold-start lag during sessions.
2. **Reasonable cost** — this is a self-funded student project, not a funded startup.
3. **Career / learning value** — demonstrate real cloud skills and the judgement to
   pick the right deployment for a project of this size.

## Decision

Host the frontend as a static build on **S3 + CloudFront**, and the backend as a
containerised FastAPI app on **ECS Fargate behind an Application Load Balancer (ALB)**,
with images in **ECR** and CI/CD via **GitHub Actions**. Secrets in AWS Secrets
Manager; HTTPS via ACM.

This is a deliberate, mainstream production choice — containers without managing
servers — chosen partly for the workload and partly as a genuine AWS learning
investment ahead of the study.

## Options considered

| Option | Idle cost | Cold start | Ops burden | Fit for UniVise |
|---|---|---|---|---|
| **Render free tier** | $0 | Yes (spins down) | None | Good, but cold starts hurt fast student testing |
| **Render Starter ($7/mo)** | ~$7 | No | None | Excellent product fit — cheapest always-on option |
| **ECS Fargate + ALB** (chosen) | ~$42/mo (after right-sizing) | No | Low | Solid; more than needed, but strong learning value |
| **Serverless (Lambda + API Gateway)** | ~$2–5/mo | Minor (first request) | Low | Arguably the best cost fit for bursty traffic |
| **Kubernetes (EKS)** | High | No | High | Overkill — wrong tool for a single small service |

## The journey (honest record)

1. **Render free tier** — worked, but cold starts made fast student testing unreliable.
2. **Render Starter ($7/mo, no spin-down)** — fixed the cold start; product-wise this was
   the correct, cheapest always-on choice.
3. **Migrated to AWS (Fargate)** — primarily to build hands-on AWS skills and prepare for
   scaling, ahead of the usability study. Lambda/serverless was **not** evaluated at this
   point — a gap in hindsight.
4. **Cost shock (~$100 USD/mo trajectory)** — driven by always-on Fargate compute + ALB
   hours + public IPv4 charges, none of which have a free tier.
5. **Cost optimisation** — traced the bill line-by-line and applied: single right-sized
   task (1 × 256/512), ALB trimmed from 3 AZs to 2. Result: ~48% reduction (~$80 → ~$42/mo).
6. **Evaluated serverless** — identified Lambda + API Gateway as the real structural saving
   (~$2–5/mo) but **deferred** it: re-architecting the backend mid-study trades away the
   reliability the study needs. Decision: right tool for the *current* stage, revisit later.

## Consequences

**Positive**
- Demonstrates container, load-balancing, IaC, and CI/CD fluency.
- Reliable, no cold starts for the usability study.
- Full cost model is now understood and documented; a budget alarm is in place.

**Negative / trade-offs**
- Higher cost than the workload strictly requires (~$42/mo vs ~$7 Render / ~$3 serverless).
- ALB + public IPv4 are ~70% of the remaining bill and are not addressable without an
  architecture change (serverless or removing the load balancer).

## Cost guardrail

An AWS Budget (`univise-monthly-cost`, $50 USD/month) now emails alerts at 60/80/100%
actual and 100% forecast — so a future cost surprise cannot go unnoticed.

## Future

- **Build a serverless (Lambda + API Gateway) variant on a branch** — even without cutting
  over, deploying the same app two ways demonstrates right-sizing judgement and gives a
  ~$3/mo option for low-traffic / post-study periods.
- **After the study:** downsize or decommission the always-on stack; keep the AWS IaC in the
  repo as a demonstration artifact. Decommissioning unneeded infra is itself a maturity signal.

## Lesson (for future ADRs)

Match the infrastructure to the project's *current* stage — not to what is impressive, and
not to scale you might need someday — then write down *why*. The documented reasoning is the
real engineering asset; the platform choice is secondary.
