# TDD Workflow: "Red-Green-Refactor"

This project uses **Double Loop TDD**.

## The Inner Loop (Unit Tests)
**Tool:** `vitest`
**Command:** `npm run test:watch`

1.  **Red:** Write a failing unit test in `src/**/*.test.ts`.
2.  **Green:** Write the minimal code to make it pass.
3.  **Refactor:** Clean up the code while keeping tests green.

### When to use?
-   Developing utility functions (`src/lib/*`).
-   Building complex UI components (logic only).
-   Creating Server Actions (mocking database/external APIs).

## The Outer Loop (E2E Tests)
**Tool:** `playwright`
**Command:** `npx playwright test`

1.  **Red:** Write a failing user scenario in `tests/e2e/*.spec.ts`.
2.  **Green:** Implement the feature components and actions (using Inner Loop).
3.  **Refactor:** Optimize performance or structure.

### When to use?
-   New pages or major features.
-   Critical user flows (e.g., "User generates a story").

## commands
-   `npm run test` - Run all unit tests.
-   `npm run test:watch` - Run unit tests in watch mode.
