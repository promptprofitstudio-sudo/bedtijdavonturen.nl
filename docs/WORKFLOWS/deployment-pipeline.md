
# Deployment Pipeline

## Overview
We use **GitHub Actions** to automate deployment to **Firebase App Hosting** / **Cloud Functions**.

## Pipeline Steps (`.github/workflows/deploy.yml`)
1.  **Trigger:** Push to `main` branch.
2.  **Environment Setup:** Node.20, check out code.
3.  **Dependency Install:** `npm ci`.
4.  **Lint & Test:** `npm run lint` and `npm run build`. (Tests WIP).
5.  **Secret Injection:**
    *   Github Secrets (`FIREBASE_SERVICE_ACCOUNT...`) are injected as env vars.
    *   PostHog keys are injected to build args.
6.  **Deploy:**
    *   `firebase deploy --only functions,hosting,firestore,storage`.
    *   Identity: `github-deploy@bedtijdavonturen-prod.iam.gserviceaccount.com`.

## Troubleshooting
- **GitHub Actions Fail:** Check the "Actions" tab.
- **"Delinquent" Error:** Check Google Cloud Billing status (ADR 0003).
- **Permission Denied:** Ensure `github-deploy` SA has `Firebase Admin` and `Service Account User` roles.
