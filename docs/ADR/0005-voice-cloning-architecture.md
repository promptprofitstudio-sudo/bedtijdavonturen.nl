# ADR 0005: Voice Cloning & Centralized Audio Generation

**Date:** 2026-01-24
**Status:** Accepted

## Context
The application had fragmented logic for audio generation (`generate-audio.ts` vs `audio.ts`) and relied on generic, robotic default voices. We wanted to offer premium "Voice Cloning" features using ElevenLabs to increase user engagement and premium subscriptions.

## Decision
We centralized all audio generation logic into `src/app/actions/audio.ts` and enabled ElevenLabs Voice Cloning.

**Key Components:**
1.  **Single Action:** `src/app/actions/audio.ts` is the single source of truth for generating speech to text.
2.  **Voice ID Selection:** The logic checks `user.customVoiceId` first. If present, it uses that specific cloned voice. If not, it falls back to a high-quality default "Rachel" voice (instead of random/robotic ones).
3.  **Client Integration:** The UI (`StoryCard.tsx`) now calls this centralized action.
4.  **Legacy Cleanup:** Deleted `src/app/actions/generate-audio.ts` to prevent usage of the old, inferior pattern.

## Consequences
-   **Positive:** Consistent, high-quality audio experience. Support for premium "Clone Your Voice" feature. Reduced code duplication.
-   **Negative:** Dependency on ElevenLabs API stability and quota management.
