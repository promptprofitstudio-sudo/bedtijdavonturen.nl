
# Deployment Pipeline

## Overview
We use **GitHub Actions** to automate deployment to **Firebase App Hosting** / **Cloud Functions**.

## Pipeline Steps (`.github/workflows/deploy.yml`)
## Pipeline Steps (`.github/workflows/deploy.yml`)
1.  **Trigger:** Push to `main` branch.
2.  **Environment Setup:** Node.20, check out code.
3.  **Dependency Install:** 
    *   `npm ci` (Root).
    *   **CRITICAL**: `functions/package-lock.json` must be synced.
    *   `functions.predeploy` hook runs `npm ci` in `firebase.json`.
4.  **Lint & Test:** `eslint .` (Flat Config) and `npm run build` (Webpack enforced).
5.  **Secret Injection:**
    *   Github Secrets (`FIREBASE_SERVICE_ACCOUNT...`).
6.  **Deploy:**
    *   `firebase deploy --only functions,hosting,firestore,storage`.
    *   Identity: `github-deploy@bedtijdavonturen-prod.iam.gserviceaccount.com`.

## Troubleshooting
- **GitHub Actions Fail:** Check the "Actions" tab.
- **"Delinquent" Error:** Check Google Cloud Billing status (ADR 0003).
- **Permission Denied (403):**
    *   **Secret Manager**: Ensure **Omni-Grant** (Accessor + Viewer) is applied to `github-deploy` AND `cloudbuild` SAs (See `docs/STANDARDS/deployment_identity_sovereignty.md`).
    *   **Cloud Scheduler**: Ensure `cloudscheduler.admin` is granted to both SAs.
- **Next.js Conflict**: If "Turbopack" error occurs, verify `next.config.ts` has `turbopack: {}` hack (See `docs/ADR/ADR-001_nextjs16_firebase_frameworks.md`).

