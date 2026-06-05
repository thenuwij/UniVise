# UniVise AWS Deployment Notes - Phase 1

## Purpose

This phase moves UniVise frontend and backend hosting to AWS while keeping Supabase PostgreSQL/Auth/RLS unchanged.

## Current production baseline before AWS

Frontend:

- Previous host: Vercel
- Previous URL: https://uni-vise-nu.vercel.app
- Current canonical URL: https://uni-vise.com

Backend:

- Previous host: Render
- Previous URL: https://univise-ehfj.onrender.com
- Current canonical API URL: https://api.uni-vise.com

Database/Auth:

- Current provider: Supabase
- Current project URL: https://ryelnuplhudpuwfruzhl.supabase.co
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

## Repository AWS readiness

Backend container files:

- `backend/Dockerfile`
- `backend/.dockerignore`

Local backend image build:

```bash
cd backend
docker build -t univise-backend:local .
```

Local backend container run:

```bash
cd backend
docker run --env-file .env -p 8000:8000 univise-backend:local
```

Health check:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"ok": true}
```

The backend currently listens on container port `8000`. ECS, the target group, and the ALB health check should use port `8000` and path `/health`.

## Environment configuration

Real `.env` files are local/deployment-specific and must not be committed. Example files document the required variables without exposing secrets:

- `backend/.env.example`
- `backend/.env.staging.example`
- `frontend/.env.example`
- `frontend/.env.staging.example`

Backend runtime variables:

- `BACKEND_CORS_ORIGINS`: comma-separated allowed frontend origins
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: backend-only Supabase service role key
- `OPENAI_API_KEY`: backend-only OpenAI API key
- `ANTHROPIC_API_KEY`: backend-only Anthropic API key

Frontend build variables:

- `VITE_API_URL`: public backend API base URL
- `VITE_SUPABASE_URL`: public Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: public Supabase anon key

`BACKEND_CORS_ORIGINS` is not a secret. In ECS it should be configured as a plain task-definition environment variable. Backend-only keys should be provided through AWS Secrets Manager and referenced from the ECS task definition.

Current staging CORS origins:

- `https://uni-vise.com`
- `https://www.uni-vise.com`
- `https://d1pyscw0to902k.cloudfront.net`
- `https://uni-vise-nu.vercel.app`

## ECS staging task definition

The staging task definition template lives at:

- `infra/ecs-task-definition-staging.json`

This file describes how ECS Fargate should run the backend container:

- Fargate network mode: `awsvpc`
- CPU: `512`
- Memory: `1024`
- Container port: `8000`
- CloudWatch log group: `/ecs/univise-backend-staging`
- AWS region: `ap-southeast-2`
- Plain env vars: `BACKEND_CORS_ORIGINS`, `SUPABASE_URL`
- Secret env vars: Supabase service-role key, OpenAI key, Anthropic key

The task definition now uses real staging values for account ID, Supabase URL, backend secrets, and CORS origins. The image value in this file is a safe template value; GitHub Actions replaces it with the newly built immutable git-SHA image during deployment.

## Backend staging CI/CD

The backend staging deployment workflow lives at:

- `.github/workflows/deploy-backend-staging.yml`

On pushes to `infra/aws-phase-1` or `staging`, when backend deployment files change, the workflow:

1. Assumes the GitHub AWS deploy role through OIDC.
2. Logs in to Amazon ECR.
3. Builds the backend Docker image from `backend/` for `linux/amd64`.
4. Tags the image with the Git commit SHA.
5. Pushes the image to the `univise-backend` ECR repository.
6. Renders `infra/ecs-task-definition-staging.json` with the new image URI.
7. Updates the `univise-backend-staging-service` ECS service.

Required GitHub secret:

- `AWS_DEPLOY_ROLE_ARN`

Required AWS resources before the workflow can succeed:

- ECR repository: `univise-backend`
- ECS cluster: `univise-staging-cluster`
- ECS service: `univise-backend-staging-service`
- IAM OIDC deploy role referenced by `AWS_DEPLOY_ROLE_ARN`
- ECS task execution role and task role referenced in the task definition
- Secrets Manager secrets referenced in the task definition
- CloudWatch log group: `/ecs/univise-backend-staging`

## Secrets Manager staging secrets

Required backend secrets created in AWS Secrets Manager:

- `univise/staging/supabase-service-role-key`
- `univise/staging/openai-api-key`
- `univise/staging/anthropic-api-key`

These are injected into ECS as environment variables through the task definition.

Not required for the current active code:

- `SERPAPI_API_KEY`
- Gemini/Google GenAI API key

`backend/app/utils/serpapi_client.py` exists, but the current active backend routes do not import or call it. Google GenAI packages are installed, but no active backend code reads a Gemini/Google API key. Add these secrets later only if those features are wired into active routes.

## ECS IAM roles

IAM roles created for the staging backend:

- ECS task execution role: `arn:aws:iam::280793168491:role/univise-ecs-task-execution-role-staging`
- ECS task role: `arn:aws:iam::280793168491:role/univise-ecs-task-role-staging`

Execution role purpose:

- Used by ECS while starting the container.
- Allows ECS to pull the backend image from ECR.
- Allows ECS to write container logs to CloudWatch.
- Allows ECS to read the required backend secrets from Secrets Manager.

Execution role policies:

- Attached AWS-managed policy: `AmazonECSTaskExecutionRolePolicy`
- Inline project policy: `univise-staging-read-backend-secrets`

Task role purpose:

- Used by the FastAPI app while it is running.
- Currently has no extra permissions because the app does not call AWS APIs directly.
- Add permissions later only if the app needs AWS services such as S3, SQS, DynamoDB, or custom CloudWatch metrics.

## ECS backend staging service

The staging backend is running on ECS Fargate behind an Application Load Balancer.

Cluster:

- `univise-staging-cluster`

Task definition:

- Family: `univise-backend-staging`
- Active revision: `6` (first CI-built image; see CI deploy notes)
- Image: `280793168491.dkr.ecr.ap-southeast-2.amazonaws.com/univise-backend:<git-sha>` (e.g. `90888ee...`)

Service:

- Name: `univise-backend-staging-service`
- ARN: `arn:aws:ecs:ap-southeast-2:280793168491:service/univise-staging-cluster/univise-backend-staging-service`
- Desired count: `2` (two tasks for availability; spread across `ap-southeast-2a` and `ap-southeast-2b`)
- Launch type: `FARGATE`
- Health check grace period: `60s` (new tasks get 60s to boot before ALB health checks count)
- Deployment circuit breaker: enabled with automatic rollback (a failed deploy rolls back to the last working revision)

Networking:

- VPC: `vpc-0c42a3b5a0c755d56`
- Public subnets:
  - `subnet-0029d0b068925d49f` (`ap-southeast-2a`)
  - `subnet-0e5cc340a48c168f0` (`ap-southeast-2b`)
  - `subnet-021885c2f8466ee43` (`ap-southeast-2c`)

Security groups:

- ALB security group: `sg-0e09c6fe70c747901`
  - Allows inbound HTTP `80` from `0.0.0.0/0`
- Backend task security group: `sg-0b6e168d87978bc29`
  - Allows inbound TCP `8000` only from the ALB security group

Load balancer:

- Name: `univise-backend-alb-staging`
- ARN: `arn:aws:elasticloadbalancing:ap-southeast-2:280793168491:loadbalancer/app/univise-backend-alb-staging/66d7b20bec0a5357`
- DNS: `univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com`

Target group:

- Name: `univise-backend-tg-staging`
- ARN: `arn:aws:elasticloadbalancing:ap-southeast-2:280793168491:targetgroup/univise-backend-tg-staging/c787a32145961a8a`
- Port: `8000`
- Target type: `ip`
- Health check path: `/health`
- Health status: `healthy`

Listener:

- ALB listener HTTP `80`
- Forwards to `univise-backend-tg-staging`

Public health check:

```bash
curl http://univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com/health
```

Expected response:

```json
{"ok": true}
```

Revision 3 update:

- Updated `BACKEND_CORS_ORIGINS` to include the real CloudFront staging frontend URL.
- ECS service updated to `univise-backend-staging:3`.
- Backend health check still returns `{"ok": true}`.

Revision 5 update:

- Updated `BACKEND_CORS_ORIGINS` to add the custom domains `https://uni-vise.com` and `https://www.uni-vise.com` alongside the CloudFront and Vercel origins.
- Registered `univise-backend-staging:5` and updated the ECS service to it (rolling deploy, reached steady state).
- Verified backend health through `https://api.uni-vise.com/health` returns `{"ok": true}`.
- Verified CORS preflight from `Origin: https://uni-vise.com` returns `access-control-allow-origin: https://uni-vise.com`.

Deployment issue fixed:

- Initial ECS task failed because the local image was built on Apple Silicon as ARM64.
- Fargate defaulted to `linux/amd64`, so ECS could not pull the ARM-only image.
- Fixed by building and pushing an AMD64 image:

```bash
docker buildx build \
  --platform linux/amd64 \
  -t 280793168491.dkr.ecr.ap-southeast-2.amazonaws.com/univise-backend:local-test-amd64 \
  --push .
```

## ECR backend repository

The backend ECR repository has been created in AWS:

- Region: `ap-southeast-2`
- AWS account ID: `280793168491`
- Repository name: `univise-backend`
- Repository URI: `280793168491.dkr.ecr.ap-southeast-2.amazonaws.com/univise-backend`
- Image scanning on push: enabled

Local test image pushed:

- Image tag: `local-test`
- Image URI: `280793168491.dkr.ecr.ap-southeast-2.amazonaws.com/univise-backend:local-test`

Commands used:

```bash
aws ecr create-repository \
  --repository-name univise-backend \
  --region ap-southeast-2

aws ecr put-image-scanning-configuration \
  --repository-name univise-backend \
  --image-scanning-configuration scanOnPush=true \
  --region ap-southeast-2

aws ecr get-login-password --region ap-southeast-2 \
  | docker login --username AWS --password-stdin 280793168491.dkr.ecr.ap-southeast-2.amazonaws.com

docker tag univise-backend:local \
  280793168491.dkr.ecr.ap-southeast-2.amazonaws.com/univise-backend:local-test

docker push \
  280793168491.dkr.ecr.ap-southeast-2.amazonaws.com/univise-backend:local-test
```

Verification commands:

```bash
aws ecr describe-repositories \
  --repository-names univise-backend \
  --region ap-southeast-2

aws ecr list-images \
  --repository-name univise-backend \
  --region ap-southeast-2
```

Confirmed image tag:

```text
local-test
```

## Scaling and caching notes

Phase 1 improves UniVise hosting reliability, deployment control, and observability without changing the product logic.

Frontend scaling:

- React/Vite build output is static and should be served through CloudFront.
- CloudFront caches static assets so normal page loads do not repeatedly hit the origin.
- S3 stores the built frontend files; CloudFront handles global delivery and cache invalidation after deploys.

Backend scaling:

- ECS Fargate can run multiple backend tasks behind an Application Load Balancer.
- Staging can start with one task.
- Production should start with at least two backend tasks for availability.
- Autoscaling can later increase task count based on CPU, memory, or request metrics.

Application-level caching:

- Program/course catalog data and prerequisite graph data are good candidates for caching.
- External job-market responses can be cached for a short time window if a live job API is wired in later.
- User-specific LLM outputs should generally be stored and reused by user/request/version instead of regenerated unnecessarily.
- Chat responses are usually user/session-specific and are not good global cache candidates.

Known Phase 1 limit:

- If many users trigger expensive roadmap or AI workflows at the same time, ECS can add backend capacity, but direct LLM calls can still hit latency, cost, or provider rate-limit constraints.

Future Phase 2 direction:

- Move long-running AI generation into an SQS-backed worker flow.
- The API should create a job, return quickly, and let workers generate/store results asynchronously.
- The frontend can poll job status or subscribe to result updates.

## Frontend staging CI/CD

The frontend staging deployment workflow lives at:

- `.github/workflows/deploy-frontend-staging.yml`

On pushes to `infra/aws-phase-1` or `staging`, when frontend deployment files change, the workflow:

1. Assumes the GitHub AWS deploy role through OIDC.
2. Installs frontend dependencies with `npm ci`.
3. Builds the Vite app using staging `VITE_*` variables.
4. Syncs `frontend/dist/` to the `univise-frontend-staging-280793168491` S3 bucket.
5. Invalidates the staging CloudFront distribution.

Required GitHub secrets:

- `AWS_DEPLOY_ROLE_ARN`
- `STAGING_VITE_API_URL`
- `STAGING_VITE_SUPABASE_URL`
- `STAGING_VITE_SUPABASE_ANON_KEY`
- `CLOUDFRONT_STAGING_DISTRIBUTION_ID`

Required AWS resources before the workflow can succeed:

- S3 bucket: `univise-frontend-staging-280793168491`
- CloudFront distribution pointing to the staging frontend bucket
- IAM OIDC deploy role referenced by `AWS_DEPLOY_ROLE_ARN`

## Frontend staging S3 bucket

The staging frontend S3 bucket has been created:

- Bucket name: `univise-frontend-staging-280793168491`
- Bucket ARN: `arn:aws:s3:::univise-frontend-staging-280793168491`
- Region: `ap-southeast-2`
- Public access block: enabled

What this bucket is for:

- Stores the static React/Vite build output from `frontend/dist/`.
- It should not be directly public.
- CloudFront will sit in front of this bucket and serve the site to users.

Commands used:

```bash
aws s3api create-bucket \
  --bucket univise-frontend-staging-280793168491 \
  --region ap-southeast-2 \
  --create-bucket-configuration LocationConstraint=ap-southeast-2

aws s3api put-public-access-block \
  --bucket univise-frontend-staging-280793168491 \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api get-public-access-block \
  --bucket univise-frontend-staging-280793168491
```

## Frontend staging CloudFront distribution

The staging frontend CloudFront distribution has been created:

- Distribution ID: `EX1BBJSKO1XLS`
- Domain: `d1pyscw0to902k.cloudfront.net`
- ARN: `arn:aws:cloudfront::280793168491:distribution/EX1BBJSKO1XLS`
- Origin Access Control ID: `E4LJBU4WSEJEG`
- Origin bucket: `univise-frontend-staging-280793168491`
- Default root object: `index.html`
- SPA fallback: 403 and 404 return `/index.html`

What this is for:

- CloudFront is the public HTTPS entry point for the staging frontend.
- S3 stores the static files, but direct public S3 access remains blocked.
- CloudFront is allowed to read from S3 through Origin Access Control.

Frontend staging URL:

```text
https://d1pyscw0to902k.cloudfront.net
```

Custom frontend URLs:

```text
https://uni-vise.com
https://www.uni-vise.com
```

Frontend build variables used for the first staging upload:

```bash
VITE_API_URL=http://univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com
VITE_SUPABASE_URL=https://ryelnuplhudpuwfruzhl.supabase.co
VITE_SUPABASE_ANON_KEY=<from frontend/.env>
```

Build and upload commands:

```bash
cd frontend

VITE_API_URL=http://univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com \
VITE_SUPABASE_URL=https://ryelnuplhudpuwfruzhl.supabase.co \
VITE_SUPABASE_ANON_KEY="$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2-)" \
npm run build

aws s3 sync dist/ s3://univise-frontend-staging-280793168491 --delete

aws cloudfront create-invalidation \
  --distribution-id EX1BBJSKO1XLS \
  --paths "/*"
```

Supabase auth update:

- Added the CloudFront staging URL to Supabase Auth redirect configuration.
- Google login now reaches the CloudFront dashboard route.

Backend HTTPS (resolved 2026-06-04):

- The backend ALB now terminates HTTPS directly on port `443`.
- The API CloudFront HTTP workaround is no longer in the request path (kept temporarily as rollback only).
- `api.uni-vise.com` DNS points directly at the ALB.
- See "Backend ALB HTTPS (direct)" section below for details.

Workflow correction:

- `.github/workflows/deploy-frontend-staging.yml` now uses the real S3 bucket:
  - `univise-frontend-staging-280793168491`

## Backend ALB HTTPS (direct)

The backend ALB now serves HTTPS directly, replacing the API CloudFront workaround in the request path.

ACM certificate (ALB region):

- Region: `ap-southeast-2` (ALB region; separate from the `us-east-1` CloudFront cert)
- Domain: `api.uni-vise.com`
- ARN: `arn:aws:acm:ap-southeast-2:280793168491:certificate/c7c4c5e1-8517-43b7-9643-945ff1cc0253`
- Status: `ISSUED`
- Validated via the existing Cloudflare DNS CNAME (ACM validation records are per-domain, so the record added for the `us-east-1` cert also validates this one).

ALB listeners:

- HTTPS `443`: forwards to `univise-backend-tg-staging`, SSL policy `ELBSecurityPolicy-TLS13-1-2-2021-06`, cert above.
- HTTP `80`: now redirects to HTTPS `443` (`HTTP_301`).

ALB security group `sg-0e09c6fe70c747901`:

- Inbound `80` from `0.0.0.0/0`
- Inbound `443` from `0.0.0.0/0`

DNS:

- `api.uni-vise.com` CNAME -> `univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com` (Cloudflare, DNS only / unproxied).
- Previously pointed at API CloudFront `d1esobith2xwt7.cloudfront.net`.

Request path now:

```text
Browser -> ALB HTTPS 443 (TLS terminates here) -> ECS Fargate backend :8000
```

Verification (real DNS, 2026-06-04):

```bash
curl https://api.uni-vise.com/health         # {"ok": true}, HTTP/2, cert CN=api.uni-vise.com
curl -i http://api.uni-vise.com/health        # 301 -> https://api.uni-vise.com:443/health
```

CORS preflight from `Origin: https://uni-vise.com` returns `access-control-allow-origin: https://uni-vise.com`.

Rollback:

- The API CloudFront workaround (`E3TO5AR81C7MHK`) has been deleted, so rolling
  back via CloudFront is no longer an option.
- To roll back the direct-HTTPS change now, fall back to the existing
  Vercel/Render production stack (Supabase unchanged, so no data migration to
  reverse). Repoint the user-facing DNS to the Vercel/Render origins.
- The ALB HTTPS:443 path is the supported production design going forward.

## API staging CloudFront distribution (DELETED)

> Deleted 2026-06-04. This was a temporary HTTPS workaround while the ALB was
> HTTP-only. The backend now terminates HTTPS directly at the ALB (see
> "Backend ALB HTTPS (direct)" above), so the distribution was disabled and then
> deleted. Kept here for historical reference only.

The staging API CloudFront distribution was created as a workaround:

- Distribution ID: `E3TO5AR81C7MHK`
- Domain: `d1esobith2xwt7.cloudfront.net`
- ARN: `arn:aws:cloudfront::280793168491:distribution/E3TO5AR81C7MHK`
- Origin: `univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com`
- Origin protocol policy: `http-only`
- Viewer protocol policy: `redirect-to-https`

What this was for (historical):

- The frontend CloudFront site is HTTPS.
- The backend ALB was originally HTTP only.
- Browsers can block HTTPS frontend pages from calling HTTP API URLs.
- API CloudFront provided a temporary HTTPS API URL for staging.

Staging API URL:

```text
https://d1esobith2xwt7.cloudfront.net
```

Custom API URL:

```text
https://api.uni-vise.com
```

API health check:

```bash
curl https://d1esobith2xwt7.cloudfront.net/health
```

Expected response:

```json
{"ok": true}
```

Frontend was rebuilt with:

```bash
VITE_API_URL=https://api.uni-vise.com
VITE_SUPABASE_URL=https://ryelnuplhudpuwfruzhl.supabase.co
VITE_SUPABASE_ANON_KEY=<from frontend/.env>
```

Then uploaded to S3 and invalidated through frontend CloudFront.

## AWS production smoke test result

AWS production-domain smoke test passed on 2026-06-04.

AWS URLs:

- Frontend: `https://uni-vise.com`
- Frontend CloudFront: `https://d1pyscw0to902k.cloudfront.net`
- Backend API: `https://api.uni-vise.com`
- Backend health: `https://api.uni-vise.com/health`

Confirmed working:

- Google login
- Dashboard load and refresh
- Direct dashboard URL
- UNSW roadmap flow
- Roadmap generated sections
- Completed roadmap reload
- MindMesh visualisation
- Progress tracking
- Transfer analysis
- Eunice chat
- Saved item add/remove
- Backend health through `api.uni-vise.com` direct ALB HTTPS

No blocking staging issues were recorded.

## GitHub Actions staging deploy role

GitHub Actions OIDC deployment role has been created:

- Role name: `univise-github-actions-deploy-role-staging`
- Role ARN: `arn:aws:iam::280793168491:role/univise-github-actions-deploy-role-staging`
- Inline policy: `univise-github-actions-staging-deploy`

What this role is for:

- Lets GitHub Actions deploy to AWS without storing long-lived AWS access keys.
- GitHub receives a short-lived OIDC token.
- AWS verifies the token and allows the workflow to assume this role.

Trust policy scope:

- Repository: `thenuwij/UniVise`
- Branches:
  - `infra/aws-phase-1`
  - `staging`

Deployment permissions include:

- Push backend images to ECR.
- Register ECS task definitions.
- Update the staging ECS service.
- Pass the ECS task execution role and task role.
- Sync frontend files to the staging S3 bucket.
- Invalidate the frontend CloudFront distribution.

Required GitHub Actions secrets:

- `AWS_DEPLOY_ROLE_ARN`: `arn:aws:iam::280793168491:role/univise-github-actions-deploy-role-staging`
- `STAGING_VITE_API_URL`: `https://api.uni-vise.com`
- `STAGING_VITE_SUPABASE_URL`: `https://ryelnuplhudpuwfruzhl.supabase.co`
- `STAGING_VITE_SUPABASE_ANON_KEY`: value from `frontend/.env`
- `CLOUDFRONT_STAGING_DISTRIBUTION_ID`: `EX1BBJSKO1XLS`

## Custom domain setup

Domain purchased through Cloudflare Registrar:

- `uni-vise.com`

ACM certificate:

- Region: `us-east-1`
- ARN: `arn:aws:acm:us-east-1:280793168491:certificate/840785c4-7707-407c-b763-6e616baeadad`
- Status: `ISSUED`
- Domains covered:
  - `uni-vise.com`
  - `www.uni-vise.com`
  - `api.uni-vise.com`

Cloudflare DNS records:

- `uni-vise.com` -> frontend CloudFront `d1pyscw0to902k.cloudfront.net`
- `www.uni-vise.com` -> frontend CloudFront `d1pyscw0to902k.cloudfront.net`
- `api.uni-vise.com` -> ALB `univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com`

CloudFront aliases and API DNS:

- Frontend distribution `EX1BBJSKO1XLS`:
  - `uni-vise.com`
  - `www.uni-vise.com`
- API distribution `E3TO5AR81C7MHK` was deleted; `api.uni-vise.com` now points directly to the ALB HTTPS listener.

Verification:

```bash
curl -I https://uni-vise.com
curl https://api.uni-vise.com/health
```

Expected API response:

```json
{"ok": true}
```

GitHub Actions verification:

- `Deploy Backend Staging`: passed
- `Deploy Frontend Staging`: passed
- Website rechecked after workflow deployment

## Monitoring and alarms

CloudWatch alarms notify via an SNS topic.

SNS topic:

- Name: `univise-prod-alarms`
- ARN: `arn:aws:sns:ap-southeast-2:280793168491:univise-prod-alarms`
- Subscription: email `jwthenu@gmail.com` (must be confirmed via the AWS email link before notifications deliver)

Alarms (all wired to the SNS topic for both ALARM and OK transitions):

- `univise-prod-alb-unhealthy-hosts`: `UnHealthyHostCount` >= 1 (Maximum, 60s x2). Fires if a backend target fails ALB health checks.
- `univise-prod-alb-target-5xx`: `HTTPCode_Target_5XX_Count` > 5 (Sum, 300s). Fires if the backend returns server errors.
- `univise-prod-alb-high-latency`: `TargetResponseTime` > 3s (Average, 300s x2). Fires on slow backend responses.
- `univise-prod-ecs-cpu-high`: ECS service `CPUUtilization` > 80% (Average, 300s x2).
- `univise-prod-ecs-memory-high`: ECS service `MemoryUtilization` > 80% (Average, 300s x2).

All alarms use `treat-missing-data = notBreaching`, so low-traffic gaps do not cause false alarms (state may show `INSUFFICIENT_DATA` until the metric has data).

Verify:

```bash
aws cloudwatch describe-alarms --region ap-southeast-2 \
  --alarm-name-prefix univise-prod- \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue}' --output table
```

## ECS autoscaling

The backend ECS service scales its task count automatically based on CPU.

Scalable target (Application Auto Scaling):

- Resource: `service/univise-staging-cluster/univise-backend-staging-service`
- Dimension: `ecs:service:DesiredCount`
- Min capacity: `2` (keeps two-AZ redundancy as the floor)
- Max capacity: `6` (cost ceiling)

Target-tracking policy `univise-prod-cpu-target-60`:

- Metric: `ECSServiceAverageCPUUtilization`
- Target: `60%`
- Scale-out cooldown: `60s` (add capacity quickly under load)
- Scale-in cooldown: `300s` (remove capacity slowly to avoid flapping)

The policy auto-creates two CloudWatch alarms (`TargetTracking-...-AlarmHigh`
and `-AlarmLow`) that drive scale-out/scale-in. These are managed by the policy;
do not edit them directly.

Limitation: scaling tasks helps with API/CPU-bound load. The heavy roadmap/chat
paths are LLM-bound (OpenAI/Anthropic), so more tasks can hit provider rate
limits or cost before ECS CPU saturates. The Phase 2 SQS-worker design addresses
this.

Verify:

```bash
aws application-autoscaling describe-scaling-policies --region ap-southeast-2 \
  --service-namespace ecs \
  --resource-id service/univise-staging-cluster/univise-backend-staging-service \
  --query 'ScalingPolicies[].PolicyName' --output text
```

## Load test (2026-06-04)

Tool: ApacheBench (`ab`). Target: `https://api.uni-vise.com/health` (direct ALB
HTTPS). The `/health` endpoint was chosen deliberately: it exercises the full
infra path (DNS -> ALB HTTPS -> ECS task) without calling OpenAI/Anthropic or the
database, so the test cannot incur LLM cost or hit provider rate limits.

Command:

```bash
ab -t 60 -c 50 -k -q https://api.uni-vise.com/health
```

Result (60s sustained, concurrency 50):

- Complete requests: `10938`, Failed: `0`
- Throughput: ~`182 req/s` (client/geo-limited, not server-limited)
- Latency p50/p95/p99: `181ms` / `321ms` / `2061ms` (p50 is mostly the Sydney
  round-trip from the test client; p99 is occasional TLS cold-connect)
- ECS CPU during load: ~`11%` avg, `28%` peak -> well under the 60% scale-out
  target, so autoscaling correctly did not trigger and task count stayed at 2.

Interpretation: the platform layer absorbs sustained concurrency with zero errors
and large headroom. This does NOT exercise the LLM-bound roadmap/chat paths, which
are cost/rate-limit-bound rather than CPU-bound (a Phase 2 concern). Real
autoscaling events will come from genuine production CPU load, not from `/health`.

## Incident: stale STAGING_VITE_API_URL broke backend calls (2026-06-04)

Symptom:

- Google login worked, but every backend call from `https://uni-vise.com`
  failed (roadmap, chat stream, degrees, etc.).
- Browser console showed `Preflight response is not successful. Status code: 301`
  for `https://d1esobith2xwt7.cloudfront.net/...` (the old API CloudFront URL).

Root cause (two compounding issues):

1. The GitHub Actions secret `STAGING_VITE_API_URL` still held the old API
   CloudFront URL, not `https://api.uni-vise.com`. Pushing a frontend change
   re-ran `deploy-frontend-staging.yml`, which rebuilt the bundle with the stale
   URL and overwrote the good build in S3.
2. That old CloudFront path was already broken: its origin uses ALB `:80`,
   which now `301`-redirects to `:443`, failing CORS preflight.

Why login still worked:

- Login goes directly to Supabase Auth, not through the backend, so it is
  unaffected by the backend API URL or CORS. "Login works, all backend calls
  fail" is a frontend-config / CORS signature, not a backend outage.

Diagnosis (check the live bundle's baked URL first):

```bash
ASSET=$(curl -s https://uni-vise.com/ | grep -o '/assets/index-[A-Za-z0-9_-]*\.js' | head -1)
curl -s "https://uni-vise.com$ASSET" | grep -o "api.uni-vise.com"
curl -s "https://uni-vise.com$ASSET" | grep -o "d1esobith2xwt7.cloudfront.net"
```

Fix:

1. Set GitHub secret `STAGING_VITE_API_URL` = `https://api.uni-vise.com`.
2. Rebuild + redeploy the frontend (CI re-run preferred, or manual
   `npm run build` + `aws s3 sync` + CloudFront invalidation).

Verified after fix: live bundle references `api.uni-vise.com`, and a CORS
preflight for `POST /roadmap/unsw` from `Origin: https://uni-vise.com` returns
`200` with the correct allow-origin/allow-headers.

Lesson: when changing a backend URL or scheme, audit every place the old value
lives (GitHub secrets, `.env` files, hardcoded constants), not just the docs.
Docs are not reality; CI deploys whatever the secret actually holds.

## Non-goals

- Do not migrate Supabase to RDS
- Do not replace Supabase Auth
- Do not regenerate Supabase JWT secret
- Do not rewrite roadmap, MindMesh, transfer analysis, or Eunice logic
- Do not split backend into microservices in this phase

## Rollback plan

For full step-by-step recovery procedures (diagnosis, backend revision rollback,
frontend rebuild, and full fallback to Vercel/Render), see the dedicated runbook:

- `infra/rollback-runbook.md`

Quick summary:

If AWS frontend fails:

- Rebuild/redeploy the frontend, or fall back to the existing Vercel frontend.

If AWS backend fails:

- Roll the ECS service back to a known-good task definition revision (the
  deployment circuit breaker also auto-rolls-back failed deploys), or fall back to
  the existing Render backend.

If CORS or auth redirect fails:

- Keep old Vercel and Render origins active while AWS origins are fixed.

Because Supabase is not migrated, rollback does not require reversing a database migration.
