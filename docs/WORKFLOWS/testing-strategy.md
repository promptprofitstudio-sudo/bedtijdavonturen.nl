
# Testing Strategy (TDD)

## Philosophy: Double Loop TDD
We use two nested feedback loops to ensure quality and prevent regressions.

### Inner Loop: Unit Tests (Fast)
- **Goal:** Verify logic correctness in milliseconds.
- **Tools:** `vitest`.
- **Command:** `npm run test` or `npx vitest source/file.ts`.
- **When to use:**
  - Logic parsing (Zod schemas).
  - Data transformations.
  - Helper functions (`src/lib/utils.ts`).
- **Standard:** Every utility function in `src/lib/` MUST have a co-located `.test.ts` file.

### Outer Loop: E2E Tests (Confidence)
- **Goal:** Verify that the "User Story" actually works on the deployed (or local prod-like) app.
- **Tools:** `playwright`.
- **Command:** `npx playwright test`.
- **When to use:**
  - Critical flows (Payment, Authentication, Story Generation).
  - Database integrations (Firestore reads/writes).
- **Standard:** Every major feature (Pricing, Wizard, Account) MUST have at least one E2E positive-path test.

## Running Tests
- **Pre-Commit:** It is recommended to run `npm run test` before pushing.
- **CI/CD:** GitHub Actions will automatically run all tests. If they fail, deployment is blocked.
