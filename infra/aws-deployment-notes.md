# UniVise AWS Deployment Notes - Phase 1

## Purpose

This phase moves UniVise frontend and backend hosting to AWS while keeping Supabase PostgreSQL/Auth/RLS unchanged.

## Current production baseline

Frontend:

- Current host: Vercel
- Current URL: https://uni-vise-nu.vercel.app

Backend:

- Current host: Render
- Current URL: https://univise-ehfj.onrender.com

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

The task definition now uses real staging values for account ID, image, Supabase URL, backend secrets, and CORS origins.

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
- Active revision: `3`
- Image: `280793168491.dkr.ecr.ap-southeast-2.amazonaws.com/univise-backend:local-test-amd64`

Service:

- Name: `univise-backend-staging-service`
- ARN: `arn:aws:ecs:ap-southeast-2:280793168491:service/univise-staging-cluster/univise-backend-staging-service`
- Desired count: `1`
- Launch type: `FARGATE`

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

Known staging limitation:

- The backend ALB is still HTTP only.
- A staging API CloudFront distribution now provides an HTTPS API URL in front of the HTTP ALB.
- The production-quality fix is still to add a custom backend domain and ACM certificate, then expose the ALB through HTTPS directly.

Workflow correction:

- `.github/workflows/deploy-frontend-staging.yml` now uses the real S3 bucket:
  - `univise-frontend-staging-280793168491`

## API staging CloudFront distribution

The staging API CloudFront distribution has been created:

- Distribution ID: `E3TO5AR81C7MHK`
- Domain: `d1esobith2xwt7.cloudfront.net`
- ARN: `arn:aws:cloudfront::280793168491:distribution/E3TO5AR81C7MHK`
- Origin: `univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com`
- Origin protocol policy: `http-only`
- Viewer protocol policy: `redirect-to-https`

What this is for:

- The frontend CloudFront site is HTTPS.
- The backend ALB is currently HTTP.
- Browsers can block HTTPS frontend pages from calling HTTP API URLs.
- API CloudFront provides a temporary HTTPS API URL for staging.

Staging API URL:

```text
https://d1esobith2xwt7.cloudfront.net
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
VITE_API_URL=https://d1esobith2xwt7.cloudfront.net
VITE_SUPABASE_URL=https://ryelnuplhudpuwfruzhl.supabase.co
VITE_SUPABASE_ANON_KEY=<from frontend/.env>
```

Then uploaded to S3 and invalidated through frontend CloudFront.

## AWS staging smoke test result

AWS staging smoke test passed on 2026-06-04.

Staging URLs:

- Frontend: `https://d1pyscw0to902k.cloudfront.net`
- Backend API: `https://d1esobith2xwt7.cloudfront.net`
- Backend health: `https://d1esobith2xwt7.cloudfront.net/health`

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
- Backend health through API CloudFront

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
- Invalidate the frontend/API CloudFront distributions.

Required GitHub Actions secrets:

- `AWS_DEPLOY_ROLE_ARN`: `arn:aws:iam::280793168491:role/univise-github-actions-deploy-role-staging`
- `STAGING_VITE_API_URL`: `https://d1esobith2xwt7.cloudfront.net`
- `STAGING_VITE_SUPABASE_URL`: `https://ryelnuplhudpuwfruzhl.supabase.co`
- `STAGING_VITE_SUPABASE_ANON_KEY`: value from `frontend/.env`
- `CLOUDFRONT_STAGING_DISTRIBUTION_ID`: `EX1BBJSKO1XLS`

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
