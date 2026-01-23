
# Development Protocol & Agent Interaction

**Target Audience:** AI Agents (@Architect, @Frontend, @StoryEngine) and Human Developers.
**Purpose:** Define the rules of engagement for modifying the codebase.

## 1. The Core Loop
All feature work must follow this cycle:
1.  **Context Loading:** Read `.ai-config.md` and relevant `docs/ADR/*`.
2.  **Task Definition:** Break down the request into atomic steps (use `task_boundary` tool).
3.  **Planning:** Create/Update `implementation_plan.md` for complex changes.
4.  **Execution (TDD preference):**
    *   Write a failing test (`vitest` or `playwright`).
    *   Implement the feature.
    *   Verify the test passes.
5.  **Verification:** Run relevant scripts (`scripts/validate-*.ts`) or manual checks.
6.  **Handover:** Update `walkthrough.md` with proof of work.

## 2. Agent Responsibilities (Personas)

| Agent | Scope | NOT Allowed |
| :--- | :--- | :--- |
| **@Architect** | Backend logic, DB Schema, API routes, Security Rules, Secrets. | Changing pixel-perfect UI styles. |
| **@Frontend** | `src/components/*`, `src/app/*` (pages), CSS, Animations. | Changing Database Schema or Secret logic. |
| **@StoryEngine** | Prompts, Story content structure, JSON schema validation. | Modifying the app runtime code directly. |

## 3. Tool usage Rules
- **Formatting:** Always run `npm run lint` or `npm run format` if unsure.
- **Secrets:** NEVER output secrets to console/logs. Use `getSecret()` helper.
- **Filesystem:** Do not create files in root unless config. Use `src/` for code, `docs/` for docs.
