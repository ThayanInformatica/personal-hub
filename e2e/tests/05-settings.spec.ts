import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Configurações', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('carrega aba WhatsApp e mostra status', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1', { hasText: 'Configurações' })).toBeVisible();

    await expect(page.getByTestId('whatsapp-panel')).toBeVisible();
    await expect(page.getByTestId('wa-state')).not.toHaveText('...', { timeout: 15000 });
    const state = await page.getByTestId('wa-state').textContent();
    expect(state!.trim().length).toBeGreaterThan(0);
  });

  test('mostra presets de cron e copia', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('settings-tab-cron').click();
    await expect(page.getByText('Todo dia 5 às 9h')).toBeVisible();
    await expect(page.getByText('0 9 5 * *')).toBeVisible();
    await expect(page.getByText('Toda segunda 10h')).toBeVisible();
  });

  test('salva template de mensagem', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('settings-tab-templates').click();
    await expect(page.getByText('Template de mensagem')).toBeVisible();
    await page.fill('input >> nth=1', '— Tha');
    await page.getByTestId('save-template').click();
    await expect(page.getByText('Salvo!')).toBeVisible({ timeout: 5000 });
  });

  test('aba sistema mostra config', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('settings-tab-system').click();
    await expect(page.getByText('Variáveis ativas')).toBeVisible();
    await expect(page.getByText('Evolution URL')).toBeVisible();
  });
});
