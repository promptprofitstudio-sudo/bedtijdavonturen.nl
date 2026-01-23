
# 0003. Centralized Secret Management

Date: 2026-01-23

## Status

Accepted

## Context

Managing secrets via `.env` files across local, CI/CD, and production environments leads to drift, security leaks, and "it works on my machine" issues. We need a single source of truth.

## Decision

We will use **Google Secret Manager (GSM)** as the primary source of truth for all backend secrets.

1.  **Server-Side**:
    *   Code MUST NOT rely on `process.env` alone.
    *   Code MUST use the `getSecret()` utility (`src/lib/secrets.ts`), which first checks `process.env` (cache/CI injection) and fallbacks to fetching from GSM at runtime.
2.  **Client-Side**:
    *   Public keys (e.g. `NEXT_PUBLIC_POSTHOG_KEY`) MUST be injected at build time via CI/CD Secrets (GitHub Secrets), sourced originally from GSM.
3.  **Local Development**:
    *   Developers authenticate via `gcloud auth application-default login`.
    *   The app fetches secrets directly from GSM, eliminating the need for local `.env` files containing sensitive keys.

## Consequences

- **Pros**: Rotations are easy (change in GSM). New developers onboard instantly (just `gcloud login`).
- **Cons**: Requires Google Cloud setup and billing enablement. adds slight latency on cold starts (mitigated by caching).
