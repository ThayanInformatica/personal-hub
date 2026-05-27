import { test, expect } from '@playwright/test';
import { HUB_PASSWORD } from './helpers';

test.describe('Auth', () => {
  test('redireciona pra /login quando nao autenticado', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('rejeita senha errada', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="password"]', 'senha-errada-xyz');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/Senha invalida/i)).toBeVisible();
  });

  test('aceita senha correta e abre dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="password"]', HUB_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
  });
});
