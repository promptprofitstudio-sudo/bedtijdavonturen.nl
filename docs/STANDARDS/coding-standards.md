
# Coding Standards

subsection: "Rules of the Road"

## General
- **Language:** TypeScript (Strict mode). No `any` unless absolutely necessary (and commented).
- **Linter:** ESLint + Prettier. Run `npm run lint` before committing.
- **File Names:** `kebab-case` for files/folders (`user-profile.tsx`), except Components which are `PascalCase` (`UserProfile.tsx`).

## Backend & API
- **Validation:** All inputs to Server Actions/APIs MUST be validated with `Zod`.
- **Error Handling:** Use `try/catch`. Log errors to `console.error` (captured by Cloud Logging). Throw user-friendly errors.
- **Secrets:** Use `getSecret()` from `src/lib/secrets.ts`. NEVER `process.env.SECRET`.

## Frontend
- **Components:** Use Functional Components with Hooks.
- **Styling:** Tailwind CSS utility classes. Avoid `style={{...}}` props.
- **State:** Use `React.useState` for local, `Context` for global (Auth). Avoid Redux/Zustand unless complexity demands it.
- **Images:** Use `next/image` for optimization.

## Data
- **Mock Data:** Use `src/lib/mockData.ts` as the "interface contract" before implementing the backend.
- **Dates:** Store as `Timestamp` (Firestore) or ISO String (JSON). Display using `Intl.DateTimeFormat`.
