import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Lembretes', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('cria lembrete pontual', async ({ page }) => {
    await page.goto('/reminders');
    await expect(page.locator('h1', { hasText: 'Lembretes' })).toBeVisible();

    await page.getByRole('button', { name: /Novo lembrete/ }).click();
    const title = `Lembrete E2E ${Date.now()}`;
    await page.fill('input >> nth=0', title);
    await page.fill('textarea', 'mensagem do teste e2e');

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const iso = tomorrow.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', iso);

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText(title)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('mensagem do teste e2e').first()).toBeVisible();
  });

  test('cria lembrete recorrente com cron', async ({ page }) => {
    await page.goto('/reminders');
    await page.getByRole('button', { name: /Novo lembrete/ }).click();

    const title = `Pagamento E2E ${Date.now()}`;
    await page.fill('input >> nth=0', title);
    await page.fill('textarea', 'lembrete recorrente mensal');

    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await page.fill('input[type="datetime-local"]', future.toISOString().slice(0, 16));

    await page.locator('input[type="checkbox"]').check();
    const cronInput = page.locator('input.font-mono');
    await cronInput.fill('0 9 5 * *');

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText(title)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('recorrente').first()).toBeVisible();
  });
});
