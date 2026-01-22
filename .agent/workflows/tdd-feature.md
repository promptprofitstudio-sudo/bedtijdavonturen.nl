---
description: How to implement a new feature using TDD
---

# TDD Feature Workflow

Follow this workflow whenever the USER asks for a new feature or logic change.

### 1. 🛑 RED (Outer Loop)
Create a failing E2E test or update an existing one to reflect the new requirement.
- **File:** `tests/e2e/[feature].spec.ts`
- **Action:** Run `npx playwright test` to confirm failure.

### 2. 🛑 RED (Inner Loop)
Create a failing unit test for the specific logic component needed.
- **File:** `src/[path]/[component].test.ts`
- **Action:** Run `npm run test` to confirm failure.

### 3. 🟢 GREEN (Inner Loop)
Implement the minimal logic to satisfy the unit test.
- **Action:** Run `npm run test` until it passes.

### 4. 🔵 REFACTOR (Inner Loop)
Clean up code, improve types, and ensure tests stay green.

### 5. 🟢 GREEN (Outer Loop)
Wire up the logic to the UI/API.
- **Action:** Run `npx playwright test` to confirm the feature works end-to-end.

### 6. 🧹 COMMIT
Commit the changes with conventional commits.
- `feat(scope): ...`
- `test(scope): ...`
