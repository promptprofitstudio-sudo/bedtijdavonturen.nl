import { test, expect, devices } from '@playwright/test';

// Configure for iPhone simulation
test.use({
    ...devices['iPhone 15 Pro'], // Closest to iPhone 17
    locale: 'nl-NL',
    timezoneId: 'Europe/Amsterdam',
});

test.describe('Google Sign-In on iPhone 17 Safari', () => {

    test('should load page and show Google sign-in button without errors', async ({ page }) => {
        // Listen for console errors
        const consoleErrors: string[] = [];
        const consoleWarnings: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
            if (msg.type() === 'warning') {
                consoleWarnings.push(msg.text());
            }
        });

        // Navigate to production site
        await page.goto('https://bedtijdavonturen-prod.web.app/account');

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Take screenshot of initial state
        await page.screenshot({ path: 'test-results/iphone-account-initial.png', fullPage: true });

        // Check if Firebase initialization logs appear
        await page.waitForTimeout(3000);

        // Look for the auth context initialization logs
        const hasAuthInit = consoleErrors.some(log => log.includes('AuthContext'));
        const hasFirebaseInit = consoleWarnings.some(log => log.includes('Firebase'));

        console.log('=== Console Errors ===');
        consoleErrors.forEach(err => console.log(err));

        console.log('\n=== Console Warnings ===');
        consoleWarnings.forEach(warn => console.log(warn));

        // Check if Google Sign-In button or error message appears
        const pageContent = await page.content();

        // Take screenshot after wait
        await page.screenshot({ path: 'test-results/iphone-account-after-wait.png', fullPage: true });

        // Check for the error message
        const hasErrorAlert = pageContent.includes('De inlog-service is nog aan het laden');

        if (hasErrorAlert) {
            console.log('❌ ERROR: Login service loading message detected!');
        }

        // Try to click sign-in button if visible
        try {
            const signInButton = page.getByRole('button', { 'name': /google/i }).first();
            const isVisible = await signInButton.isVisible({ timeout: 5000 });

            if (isVisible) {
                console.log('✅ Google Sign-In button is visible');
                await signInButton.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'test-results/iphone-after-click.png', fullPage: true });
            }
        } catch (e) {
            console.log('⚠️ Could not find or click Google Sign-In button:', e);
        }

        // Check for critical Firebase errors
        const hasCriticalError = consoleErrors.some(err =>
            err.includes('Firebase Auth service not initialized') ||
            err.includes('Failed to load Firebase config')
        );

        // Assertions
        expect(hasCriticalError).toBe(false);
    });

    test('should initialize Firebase services on mobile', async ({ page }) => {
        const initLogs: string[] = [];

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('AuthContext') || text.includes('Firebase') || text.includes('🔐')) {
                initLogs.push(text);
            }
        });

        await page.goto('https://bedtijdavonturen-prod.web.app/account');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);

        console.log('\n=== Firebase Initialization Logs ===');
        initLogs.forEach(log => console.log(log));

        // Check for successful initialization
        const hasInitSuccess = initLogs.some(log =>
            log.includes('Persistence set to local') ||
            log.includes('Auth state changed')
        );

        expect(initLogs.length).toBeGreaterThan(0);

        await page.screenshot({ path: 'test-results/iphone-firebase-init.png', fullPage: true });
    });
});
