
# 0002. Technology Stack Definition

Date: 2026-01-23

## Status

Accepted

## Context

We need a modern, scalable, and "calm" technology stack for the "Bedtijdavonturen" bedtime stories application. It must support reliable server-side AI generation, secure authentication, and a peaceful UI.

## Decision

We have selected the following stack:

1.  **Frontend Framework**: Next.js 14+ (App Router).
    *   *Why*: Server Components for SEO, API Routes for backend logic, industry standard.
2.  **Styling**: Tailwind CSS.
    *   *Why*: Utility-first, fast development, easy to implement design tokens (colors).
3.  **Database**: Firebase Firestore.
    *   *Why*: Real-time, flexible schema, easy integration with Auth.
4.  **Authentication**: Firebase Auth (Google Provider).
    *   *Why*: Secure, handles identity management, integrates with Firestore rules.
5.  **Analytics**: PostHog.
    *   *Why*: Product analytics (funnels, retention) + Feature Flags. Self-hostable compatible (EU Cloud).
6.  **AI Services**:
    *   **Text**: OpenAI (GPT-4o/mini) via Vercel AI SDK / Custom fetch.
    *   **Audio**: ElevenLabs (High quality TTS).
7.  **Secrets**: Google Secret Manager (GSM).
    *   *Why*: Centralized, secure encryption, prevents `.env` sprawl.

## Consequences

- Teams must be proficient in Next.js App Router patterns (Server Actions).
- Dependency on Firebase ecosystem is high.
- Costs scale with usage (OpenAI/ElevenLabs), requiring strict budget monitoring (Viktor Protocol).
