# Incident Log

| ID | Component | Severity | Description | Suggested Fix |
|----|-----------|----------|-------------|---------------|
| INC-001 | **Auth** | High | `127.0.0.1` is not an Authorized Domain in Firebase Console. Prevents Register/Login in local E2E tests. | Add `127.0.0.1` to Firebase Console -> Authentication -> Settings -> Authorized Domains. |
| INC-002 | **Voice Cloning** | Medium | `tests/e2e/voice-cloning.spec.ts` failed. Likely outdated selectors or depency on real Auth. | Update `voice-cloning.spec.ts` to use the new `scripts/` or mock auth provider. |
| INC-003 | **Payment** | Medium | `payment.spec.ts` failed. Old pricing plan selectors ("Lite", "Pro") vs new "Weekend/Premium". | Update `payment.spec.ts` to match new Pricing Cards. |
| INC-004 | **My Stories** | Low | `my-stories.spec.ts` failed (Redirection). Depends on Auth success (INC-001). | Fix INC-001 first. |
| INC-005 | **Library** | Low | "Luister" button checks in `e2e.spec.ts` failed due to upstream Auth failure prevents reaching Library. | Fix INC-001 first. |

## Next Steps
1.  **Authorize Localhost**: Essential for any E2E tests involving real Firebase Auth.
2.  **Refactor Legacy Tests**: Delete or update `tests/e2e/*.spec.ts` to align with the new `bedtijdavonturen-ui` 2.0 structure.
3.  **Mock Auth**: Consider implementing a "Test Mode" Auth provider that bypasses Firebase for UI testing.
