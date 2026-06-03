# UniVise Smoke Test Checklist

## Baseline production smoke test

Date:
Tester: Thenuja Wijesuriya

## Current production URLs

Frontend:
Backend:
Supabase project:

## Checks before AWS changes

- [ ] Frontend homepage loads
- [ ] User can log in
- [ ] User session persists after refresh
- [ ] UNSW roadmap page loads
- [ ] Roadmap generation starts successfully
- [ ] Roadmap generated sections appear
- [ ] Completed roadmap reloads from URL/id
- [ ] MindMesh visualisation loads nodes and edges
- [ ] Progress tracking updates Supabase rows
- [ ] Transfer analysis flow completes
- [ ] Eunice chat sends and receives a response
- [ ] Saved items can be added and removed
- [ ] Backend health endpoint responds

## Existing issues before AWS migration

Add any bugs or unstable behaviour here before starting AWS deployment.

## Notes

This checklist is used to compare the current Vercel/Render deployment against the future AWS staging deployment.
