import { test, expect } from '@playwright/test';

test.describe('My Stories Library', () => {
    test('redirects unauthenticated user to login', async ({ page }) => {
        await page.goto('/stories');
        // Ensure the page has loaded and client-side code (useEffect) runs
        await page.waitForLoadState('networkidle');
        await page.waitForURL(/\/login/);
    });

    test.skip('authenticated user can view their stories', async ({ page }) => {
        // TODO: Implement Auth Mocking. Currently skipped because we cannot login easily in E2E.
        // See docs/WORKFLOWS/testing-strategy.md for future auth mocking plans.

        await page.goto('/stories');
        await expect(page.getByRole('heading', { name: 'Mijn Verhalen' })).toBeVisible();
    });
});
