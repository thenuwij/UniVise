# UniVise Smoke Test Checklist

## Baseline production smoke test

Date: 2026-06-04
Tester: Thenuja Wijesuriya

## Legacy production URLs before AWS cutover

Frontend: https://uni-vise-nu.vercel.app
Backend: https://univise-ehfj.onrender.com
Supabase project: https://ryelnuplhudpuwfruzhl.supabase.co

## Checks before AWS changes

- [x] Frontend homepage loads
- [x] User can log in
- [x] User session persists after refresh
- [x] UNSW roadmap page loads
- [x] Roadmap generation starts successfully
- [x] Roadmap generated sections appear
- [x] Completed roadmap reloads from URL/id
- [x] MindMesh visualisation loads nodes and edges
- [x] Progress tracking updates Supabase rows
- [x] Transfer analysis flow completes
- [x] Eunice chat sends and receives a response
- [x] Saved items can be added and removed
- [x] Backend health endpoint responds

## Existing issues before AWS migration

No known baseline issues recorded before starting AWS deployment.

## Notes

This checklist compares the original Vercel/Render deployment against the AWS deployment. Supabase remains unchanged in both paths.

## AWS production-domain smoke test

Date: 2026-06-04
Tester: Thenuja Wijesuriya

## AWS production URLs

Frontend: https://uni-vise.com
Frontend CloudFront fallback: https://d1pyscw0to902k.cloudfront.net
Backend API: https://api.uni-vise.com
Backend health: https://api.uni-vise.com/health

## Checks after AWS deployment

- [x] Frontend homepage loads
- [x] User can log in with Google
- [x] User session persists after refresh
- [x] Dashboard loads
- [x] Direct dashboard URL opens
- [x] UNSW roadmap page loads
- [x] Roadmap generation starts successfully
- [x] Roadmap generated sections appear
- [x] Completed roadmap reloads from URL/id
- [x] MindMesh visualisation loads nodes and edges
- [x] Progress tracking updates Supabase rows
- [x] Transfer analysis flow completes
- [x] Eunice chat sends and receives a response
- [x] Saved items can be added and removed
- [x] Backend health endpoint responds through `api.uni-vise.com`
- [x] Live frontend bundle uses `https://api.uni-vise.com`
- [x] GitHub Actions backend deployment passed
- [x] GitHub Actions frontend deployment passed

## AWS deployment issues

No blocking issues recorded after the custom-domain smoke test. All tested product flows worked through `https://uni-vise.com`.

Resolved incident:

- A stale GitHub Actions secret rebuilt the frontend with the old API CloudFront URL. Fix was to set `STAGING_VITE_API_URL=https://api.uni-vise.com`, redeploy the frontend, and verify the live bundle.
