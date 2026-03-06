import { test, expect } from '@playwright/test';
import path from 'path';

const EPUB_PATH = path.resolve(__dirname, '../public/khalil-gibran_the-madman.epub');

async function importEpubAndOpenReader(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('[data-testid="file-input"]').setInputFiles(EPUB_PATH);
  await page.locator('[data-testid="book-card"]').first().waitFor({ state: 'visible' });
  await page.locator('[data-testid="book-card"]').first().click();
  await page.waitForURL('**/reader**');
}

test.describe('Reader', () => {
  test('imports an EPUB, opens the reader, and shows the book title', async ({ page }) => {
    await importEpubAndOpenReader(page);
    await expect(page).toHaveURL(/\/reader/);
    const titleEl = page.locator('[data-testid="book-title"]');
    await expect(titleEl).toBeVisible();
    await expect(titleEl).not.toBeEmpty();
  });

  test('reader navigation: next enables prev', async ({ page }) => {
    await importEpubAndOpenReader(page);

    const nextBtn = page.locator('[data-testid="next-button"]');
    const prevBtn = page.locator('[data-testid="prev-button"]');

    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await expect(prevBtn).toBeEnabled();
  });
});
