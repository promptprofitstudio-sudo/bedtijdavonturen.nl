# ADR 001: Next.js 16 & Firebase Frameworks Compatibility

## Status
Accepted (2026-01-31)

## Context
Next.js 16 introduces **Turbopack** as the default development bundler. However, our deployment stack relies on **Firebase Hosting with Web Frameworks** and **next-pwa** (Progressive Web App support).

### The Conflict
1.  **Firebase Frameworks**: During `firebase deploy`, the frameworks adapter attempts to override specific build configurations to inject its own server adapters. Turbopack in Next.js 16 is less permissive than Webpack, leading to build-time errors when these overrides occur.
2.  **next-pwa**: This plugin relies heavily on Webpack hooks to generate service workers (`sw.js`). Turbopack support for these plugins is currently experimental/incomplete, leading to missing service workers or build failures.

## Decision
We have decided to **Explicitly Disable Turbopack** for production builds and **Silence Config Conflicts**.

### Implementation Details
1.  **Force Webpack**: The build command in `package.json` is effectively `next build` (which defaults to Webpack for production unless `--turbo` is explicitly passed). We ensure local dev scripts (`npm run dev`) *can* use Turbopack if desired, but CI/CD must use Webpack.
2.  **Silence Turbopack Warning**: We applied a configuration hack in `next.config.ts`:
    ```typescript
    experimental: {
      // @ts-expect-error - This is a hack to silence the conflict warning for Firebase
      turbopack: {},
    }
    ```
    This empty object tricks the Firebase Frameworks adapter into proceeding without throwing a "Config Validation Error".

## Consequences
### Positive
*   **Deployment Stability**: Builds successfully deploy to Firebase Hosting.
*   **PWA Functionality**: `next-pwa` correctly generates service workers using the stable Webpack hooks.

### Negative
*   **Build Speed**: We lose the performance benefits of Turbopack for production builds (approx. 20-30% slower).
*   **Hack Maintenance**: The `turbopack: {}` hack relies on internal validation logic of `firebase-tools`. Future updates to Firebase CLI might patch this, requiring a new workaround.

## Compliance
All future Next.js upgrades must verify this hack is still functional. If Firebase officially supports Turbopack, this ADR should be deprecated.
