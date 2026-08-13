# UniVise Rollback & Incident Runbook

Purpose: a step-by-step guide for recovering the AWS production deployment when
something breaks. Designed to be followed under pressure without re-deriving
context. Supabase (PostgreSQL/Auth/RLS) is unchanged by the AWS migration, so no
rollback here involves a database migration.

Region: `ap-southeast-2` · AWS account: `280793168491`

## 0. Key facts / where things live

```text
Frontend (prod):  https://uni-vise.com  (S3 univise-frontend-staging-280793168491 + CloudFront EX1BBJSKO1XLS)
Backend  (prod):  https://api.uni-vise.com  (CloudFront E2R4S2V4U19NWK -> Lambda function URL)
Backend health:   https://api.uni-vise.com/health  -> {"ok": true}
Lambda function:  univise-backend-lambda (arm64 container image, Lambda Web Adapter)
Lambda image repo: ECR univise-backend-lambda, tagged by git SHA
Alarms topic:     univise-prod-alarms (email jwthenu@gmail.com)
DNS:              Cloudflare (uni-vise.com), DNS-only / unproxied records

Standby (not serving traffic, scaled to zero):
ECS cluster:      univise-staging-cluster
ECS service:      univise-backend-staging-service (desiredCount 0)
Target group:     univise-backend-tg-staging
ALB:              univise-backend-alb-staging
```

## 1. Diagnose first (don't roll back blindly)

Find which layer is broken before acting.

```bash
# Is the backend itself up?
curl https://api.uni-vise.com/health        # expect {"ok": true}

# Are the ECS tasks healthy in the ALB?
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-southeast-2:280793168491:targetgroup/univise-backend-tg-staging/c787a32145961a8a \
  --region ap-southeast-2 \
  --query 'TargetHealthDescriptions[].{AZ:Target.AvailabilityZone,State:TargetHealth.State}' --output table

# Recent ECS service events (deploy failures, task stops)
aws ecs describe-services --cluster univise-staging-cluster \
  --services univise-backend-staging-service --region ap-southeast-2 \
  --query 'services[0].events[:10].message' --output table

# What image/revision is live?
LIVE_TD=$(aws ecs describe-services --cluster univise-staging-cluster \
  --services univise-backend-staging-service --region ap-southeast-2 \
  --query 'services[0].taskDefinition' --output text)
aws ecs describe-task-definition --task-definition "$LIVE_TD" --region ap-southeast-2 \
  --query 'taskDefinition.containerDefinitions[0].image' --output text
```

Symptom guide:

```text
Login works but all backend calls fail (CORS / 301 / "access control checks")
  -> FRONTEND CONFIG problem, not backend. Check the live bundle's baked API URL:
     ASSET=$(curl -s https://uni-vise.com/ | grep -o '/assets/index-[A-Za-z0-9_-]*\.js' | head -1)
     curl -s "https://uni-vise.com$ASSET" | grep -o "api.uni-vise.com"   # should match
  -> See section 3 (frontend rollback). Also check GitHub secret STAGING_VITE_API_URL.

/health fails or returns 5xx
  -> BACKEND problem. See section 2 (backend rollback) and check CloudWatch logs.

Targets unhealthy in target group
  -> Backend tasks crashing/slow to boot. Check CloudWatch logs /ecs/univise-backend-staging.

Everything down / can't fix fast
  -> See section 4 (full fallback to Vercel/Render).
```

## 2. Backend rollback (bad deploy)

The backend runs on Lambda from a container image in ECR, tagged by git SHA. Rolling
back means pointing the function at the previous image.

```bash
# List recent image tags, newest first
aws ecr describe-images --repository-name univise-backend-lambda \
  --region ap-southeast-2 \
  --query 'sort_by(imageDetails,&imagePushedAt)[-10:].{tag:imageTags[0],pushed:imagePushedAt}' --output table

# Point the function at a known-good tag (replace SHA)
aws lambda update-function-code \
  --function-name univise-backend-lambda \
  --image-uri 280793168491.dkr.ecr.ap-southeast-2.amazonaws.com/univise-backend-lambda:SHA \
  --region ap-southeast-2

# Wait for the update to finish
aws lambda wait function-updated \
  --function-name univise-backend-lambda --region ap-southeast-2
```

Then re-check `curl https://api.uni-vise.com/health`.

If the bad code is already on `main`, revert the commit and push — that redeploys
through GitHub Actions and is usually cleaner than pinning an old image by hand.

## 3. Frontend rollback (bad build / wrong API URL)

Cause is usually a bad bundle in S3 (e.g. wrong `VITE_API_URL` baked in).

```bash
# Rebuild with correct values and redeploy
cd frontend
VITE_API_URL=https://api.uni-vise.com \
VITE_SUPABASE_URL=https://ryelnuplhudpuwfruzhl.supabase.co \
VITE_SUPABASE_ANON_KEY="$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2-)" \
npm run build
aws s3 sync dist/ s3://univise-frontend-staging-280793168491 --delete
aws cloudfront create-invalidation --distribution-id EX1BBJSKO1XLS --paths "/*"
```

If the cause was CI (a frontend push rebuilt with a stale secret), also fix the
GitHub secret `STAGING_VITE_API_URL = https://api.uni-vise.com` so the next CI run
doesn't reintroduce the bug. (See the secret incident in `aws-deployment-notes.md`.)

Verify after invalidation:

```bash
ASSET=$(curl -s https://uni-vise.com/ | grep -o '/assets/index-[A-Za-z0-9_-]*\.js' | head -1)
curl -s "https://uni-vise.com$ASSET" | grep -o "api.uni-vise.com"   # should match
```

## 4. Full fallback: bring the ECS stack back

There is no longer a legacy fallback. The Render backend is gone, so the Vercel
frontend has no API to talk to. Supabase is shared and unchanged, so no fallback
here involves a data migration.

The remaining fallback is the ECS stack, which is still defined but scaled to zero:

```text
1. Scale the service back up:
   aws ecs update-service --cluster univise-staging-cluster \
     --service univise-backend-staging-service --desired-count 1 \
     --region ap-southeast-2
2. Wait for a healthy target in univise-backend-tg-staging.
3. In Cloudflare DNS, point api.uni-vise.com at the ALB
   (univise-backend-alb-staging-182000404.ap-southeast-2.elb.amazonaws.com)
   instead of the Lambda CloudFront distribution. Keep TTL low (Auto/60s).
4. Confirm: curl https://api.uni-vise.com/health
5. Once Lambda is fixed, reverse the DNS change and scale ECS back to zero.
```

This path only works while the ALB and target group still exist. If they have been
deleted to save cost, recreating them is a rebuild, not a rollback — in that case fix
forward on Lambda instead.

## 5. After any rollback

```text
- Confirm /health and a real logged-in flow (generate a roadmap) work.
- Check the CloudWatch alarms returned to OK (you'll get an email).
- Write down what happened in Notion (incident milestone) so it's diagnosable next time.
```
