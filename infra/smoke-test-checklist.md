# UniVise Smoke Test Checklist

## Baseline production smoke test

Date: 2026-06-04
Tester: Thenuja Wijesuriya

## Current production URLs

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

This checklist is used to compare the current Vercel/Render deployment against the future AWS staging deployment.

## AWS staging smoke test

Date: 2026-06-04
Tester: Thenuja Wijesuriya

## AWS staging URLs

Frontend: https://d1pyscw0to902k.cloudfront.net
Backend API: https://d1esobith2xwt7.cloudfront.net
Backend health: https://d1esobith2xwt7.cloudfront.net/health

## Checks after AWS staging deployment

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
- [x] Backend health endpoint responds through API CloudFront

## AWS staging issues

No blocking staging issues recorded. All tested product flows worked through the CloudFront frontend URL.
