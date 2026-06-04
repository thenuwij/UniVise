# UniVise Rollback & Incident Runbook

Purpose: a step-by-step guide for recovering the AWS production deployment when
something breaks. Designed to be followed under pressure without re-deriving
context. Supabase (PostgreSQL/Auth/RLS) is unchanged by the AWS migration, so no
rollback here involves a database migration.

Region: `ap-southeast-2` · AWS account: `280793168491`

## 0. Key facts / where things live

```text
Frontend (prod):  https://uni-vise.com  (S3 univise-frontend-staging-280793168491 + CloudFront EX1BBJSKO1XLS)
Backend  (prod):  https://api.uni-vise.com  (ALB HTTPS:443 -> ECS Fargate)
Backend health:   https://api.uni-vise.com/health  -> {"ok": true}
ECS cluster:      univise-staging-cluster
ECS service:      univise-backend-staging-service
Target group:     univise-backend-tg-staging
ALB:              univise-backend-alb-staging
Alarms topic:     univise-prod-alarms (email jwthenu@gmail.com)
Legacy fallback:  Vercel (frontend) https://uni-vise-nu.vercel.app, Render (backend) https://univise-ehfj.onrender.com
DNS:              Cloudflare (uni-vise.com), DNS-only / unproxied records
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

## 2. Backend rollback (bad deploy or unhealthy tasks)

The service has a deployment circuit breaker with automatic rollback, so a failed
deploy usually reverts itself. To roll back manually to a known-good revision:

```bash
# List recent task definition revisions
aws ecs list-task-definitions --family-prefix univise-backend-staging \
  --region ap-southeast-2 --sort DESC --max-items 10

# Point the service at a known-good revision (replace N)
aws ecs update-service \
  --cluster univise-staging-cluster \
  --service univise-backend-staging-service \
  --task-definition univise-backend-staging:N \
  --region ap-southeast-2

# Watch until steady (one deployment, COMPLETED)
aws ecs describe-services --cluster univise-staging-cluster \
  --services univise-backend-staging-service --region ap-southeast-2 \
  --query 'services[0].{running:runningCount,desired:desiredCount,rollout:deployments[0].rolloutState}' --output json
```

Then re-check `curl https://api.uni-vise.com/health`.

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

## 4. Full fallback to the legacy Vercel/Render stack

Use this when the AWS stack is broken and can't be fixed quickly. The old stack is
kept warm for exactly this reason. Supabase is shared and unchanged, so no data
migration is involved.

```text
1. In Cloudflare DNS, repoint the user-facing records away from AWS:
   - uni-vise.com / www.uni-vise.com  -> the Vercel deployment
   - api.uni-vise.com                 -> the Render backend (or update the
     frontend's VITE_API_URL to the Render URL and redeploy on Vercel)
2. Keep TTL low (Auto/60s) so the change propagates fast.
3. Confirm:
   - Vercel frontend loads and login works
   - Render backend health: curl https://univise-ehfj.onrender.com/health
4. Once AWS is fixed, repoint DNS back to AWS (reverse of the above).
```

Note: the API CloudFront HTTPS workaround was deleted, so it is NOT a fallback
option. Fallback is the Vercel/Render stack.

## 5. After any rollback

```text
- Confirm /health and a real logged-in flow (generate a roadmap) work.
- Check the CloudWatch alarms returned to OK (you'll get an email).
- Write down what happened in Notion (incident milestone) so it's diagnosable next time.
```
