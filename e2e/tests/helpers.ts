import { Page, expect } from '@playwright/test';

export const HUB_PASSWORD = process.env.HUB_PASSWORD ?? 'changeme';

export async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="password"]', HUB_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
}
