# ADR 0004: PostHog EU Analytics Migration

**Date:** 2026-01-24
**Status:** Accepted

## Context
The application initially used a US-based or default PostHog configuration. We needed to ensure compliance with EU data privacy standards (GDPR) and utilize the PostHog EU Cloud infrastructure for improved latency and data sovereignty.

## Decision
We have migrated all analytics data ingestion to the PostHog EU Cloud instance (`https://eu.i.posthog.com`).

**Key Changes:**
1.  **Configuration:** Updated `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local` and all deployment environments to point to the EU endpoint.
2.  **Dashboarding:** Created a consolidated "Bedtijd Avonturen v2.0 Metrics (EU)" dashboard in the new PostHog project (`118115`).
3.  **Scripts:** Updated or created scripts (`scripts/update-posthog-dashboard.ts`, `scripts/merge-posthog-dashboards.ts`) to interact exclusively with the EU API.
4.  **Secrets:** The Personal API Key used for programmatic dashboard management (`POSTHOG_PERSONAL_API_KEY`) is securely stored in Google Secret Manager and corresponds to a user in the EU organization.

## Consequences
-   **Positive:** Data resides in the EU, complying with stricter privacy regulations. Dashboard logic is now unified.
-   **Negative:** Historical data in any previous US-based project is isolated from the new EU project (fresh start for v2.0 metrics).
