import { test, expect } from '@playwright/test';

// Generate a random email for each test run to ensure clean state
const randomEmail = `test-${Date.now()}@example.com`;
const password = 'password123';

test.describe('Full User Flow', () => {

    test('Register, Generate Story, Audio, and Library', async ({ page }) => {
        // Debugging: Log console and alerts
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
        page.on('dialog', async dialog => {
            console.log(`[Browser Dialog] ${dialog.message()}`);
            await dialog.accept();
        });

        // 1. Navigate to Account Page
        await page.goto('/account');

        // Handle Cookie Consent
        const cookieBtn = page.getByRole('button', { name: 'Prima, doorgaan' });
        if (await cookieBtn.isVisible()) {
            await cookieBtn.click();
        }

        // 2. Authentication (Register new user)
        const nameInput = page.getByPlaceholder('Voornaam');
        if (!await nameInput.isVisible()) {
            await page.getByRole('button', { name: 'Maak account' }).click();
            await expect(nameInput).toBeVisible();
        }

        await page.getByPlaceholder('Voornaam').fill('TestParent');
        await page.getByPlaceholder('E-mailadres').fill(randomEmail);
        await page.getByPlaceholder('Wachtwoord (min. 6 tekens)').fill(password);
        await page.getByRole('button', { name: 'Account Aanmaken' }).click();

        // 3. Verify Login success
        await expect(page.getByText('Uitloggen')).toBeVisible({ timeout: 15000 });

        // 4. Navigate to Wizard
        await page.getByText('Vandaag').click();
        await page.getByRole('button', { name: 'Start wizard' }).click();
        await expect(page).toHaveURL(/\/wizard/);

        // 5. Fill Story Wizard
        await page.getByPlaceholder('Bijv. Noor').fill('TestJantje');
        await expect(page.getByPlaceholder('Bijv. Noor')).toHaveValue('TestJantje');
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Volgende' }).click();

        // Step 2: Mood
        await expect(page.getByText('Sfeer vanavond')).toBeVisible();
        await page.getByText('Dapper').click();
        await page.getByRole('button', { name: 'Volgende' }).click();

        // Step 3: Theme
        await page.getByPlaceholder('Typ een thema...').fill('Een vliegende fiets');
        await page.getByRole('button', { name: 'Volgende' }).click();

        // Step 4: Submit
        await expect(page.getByText('Samenvatting')).toBeVisible();
        await page.getByRole('button', { name: 'Maak Verhaal' }).click();

        // 6. Wait for Generation
        await expect(page).toHaveURL(/\/story\/.+/, { timeout: 30000 });
        await expect(page.getByRole('heading', { name: 'Avontuur van TestJantje' })).toBeVisible();

        // 7. Verify Smart Audio Logic
        // In Test Mode, generation is instant.
        // We are on Story Page (Read Mode).
        // Navigate to Library to test the "Luister" button from there, or use local navigation.
        // The Story Page has "Volgende" which goes nowhere/home currently.

        // Go to Library
        await page.getByRole('link', { name: 'Bibliotheek' }).first().click();
        await expect(page).toHaveURL(/\/library/);

        // Check Buttons
        const card = page.locator('article').first(); // Assuming Card is article or div? StoryCard uses Card.
        // Or just search text
        await expect(page.getByText('TestJantje')).toBeVisible();

        // Check "Lees", "Luister", "Deel" buttons
        await expect(card.getByRole('link', { name: 'Lees' })).toBeVisible();
        const luisterBtn = card.getByRole('link', { name: 'Luister' });
        await expect(luisterBtn).toBeVisible();
        await expect(card.getByText('Deel')).toBeVisible(); // Share button text

        // 8. Generate Audio
        // Click Luister -> Should go to Generate Page (since no audio yet)
        await luisterBtn.click();
        await expect(page).toHaveURL(/\/generate-audio/);

        // Check Generate UI
        await expect(page.getByRole('heading', { name: 'Luisterversie Maken' })).toBeVisible();

        // Click Generate
        await page.getByRole('button', { name: /Genereer Audio/i }).click();

        // 9. Verify Redirection to Player
        // Should redir to ?mode=audio
        await expect(page).toHaveURL(/mode=audio/, { timeout: 15000 });

        // Verify Player UI (Toddler Mode)
        // Look for the Big Play SVG or "Audio Modus"
        await expect(page.getByText('Audio Modus')).toBeVisible();

    });

    test('Pricing page displays new plans', async ({ page }) => {
        await page.goto('/pricing');
        // Check for new plans
        await expect(page.getByText('Weekend Bundel')).toBeVisible();
        await expect(page.getByText('Premium Maandelijks')).toBeVisible();
        await expect(page.getByText('Premium Jaarlijks')).toBeVisible();
    });
});
