import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows empty state and import button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your library is empty' })).toBeVisible();
    await expect(page.getByTestId('import-button')).toBeVisible();
  });
});
