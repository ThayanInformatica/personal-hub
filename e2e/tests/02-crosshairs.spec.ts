import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('CS2 - Crosshairs', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('cria mira com preview SVG', async ({ page }) => {
    await page.goto('/cs2#crosshairs');
    await expect(page.locator('h1', { hasText: 'CS2' })).toBeVisible();

    page.on('dialog', (d) => d.accept());

    await page.getByRole('button', { name: /Nova mira/ }).click();
    const name = `Mira E2E ${Date.now()}`;
    await page.getByTestId('ch-name').fill(name);
    await page.getByTestId('ch-code').fill('CSGO-TEST-12345-ABCDE-FGHIJ-KLMNO');

    await expect(page.getByTestId('ch-preview-dialog').locator('svg')).toBeVisible();

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });

    const card = page.locator('div.rounded-xl').filter({ hasText: name });
    await expect(card.getByLabel('preview da mira')).toBeVisible();
  });

  test('botao decodificar preenche e mostra mensagem', async ({ page }) => {
    await page.goto('/cs2#crosshairs');
    await page.getByRole('button', { name: /Nova mira/ }).click();

    await page.getByTestId('ch-code').fill('CSGO-codigo-invalido-curto');
    await page.getByTestId('ch-decode').click();
    await expect(page.getByText(/Não consegui decodificar|Cole um código/)).toBeVisible();
  });

  test('cria config CS2', async ({ page }) => {
    await page.goto('/cs2#crosshairs');
    await page.getByRole('button', { name: 'Configs' }).click();

    page.on('dialog', (d) => d.accept());

    await page.getByRole('button', { name: /Nova config/ }).click();
    const name = `autoexec-e2e-${Date.now()}`;
    await page.locator('select').selectOption('AUTOEXEC');
    await page.fill('input[required]', name);
    await page.fill('textarea', 'cl_crosshairstyle 4\nfps_max 240');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });
  });
});
