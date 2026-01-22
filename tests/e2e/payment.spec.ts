import { test, expect } from '@playwright/test'

test.describe('Payment Flow', () => {
    test('should display all pricing plans correctly', async ({ page }) => {
        // 1. Visit Pricing Page
        await page.goto('/pricing')

        // 2. Check for "Weekend Bundel"
        const weekendPlan = page.getByText('Weekend Bundel')
        await expect(weekendPlan).toBeVisible()

        // 3. Check Button Visibility
        // The user says the button is "not visible" for the weekend bundle.
        // We expect a button inside the specific card.
        // Assuming the structure from PlanCard.tsx
        const weekendCard = page.locator('.border-teal-200') // Based on "isWeekend" styling
        const weekendButton = weekendCard.getByRole('button', { name: /Kies Weekend Bundel/i })

        // Fails here if button is truly invisible or missing text
        await expect(weekendButton).toBeVisible()
        await expect(weekendButton).toHaveCSS('background-color', 'rgb(13, 148, 136)') // teal-600 hex check approximation
    })

    test('should trigger checkout flow when plan selected', async ({ page }) => {
        // Mock Auth (if needed, but page handles "Log eerst in" check)
        // We need to be logged in to test the redirect

        // ... Login logic would go here if we had a full auth fixture ...
        // For now, let's just checking the "Log eerst in" toast if we are anonymous, 
        // which confirms the button IS clickable.

        await page.goto('/pricing')
        const weekendCard = page.locator('.border-teal-200')
        const weekendButton = weekendCard.getByRole('button', { name: /Kies Weekend Bundel/i })

        await weekendButton.click()

        // Expect Toast or Redirect message
        // If not logged in:
        await expect(page.getByText('Log eerst in om te abonneren')).toBeVisible()
    })
})
