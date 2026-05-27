import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Assistente IA', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('pagina /chat carrega', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByTestId('chat-panel')).toBeVisible();
  });

  test('botao flutuante aparece em outras paginas', async ({ page }) => {
    await page.goto('/cs2');
    await expect(page.getByTestId('chat-fab')).toBeVisible();
  });

  test('botao flutuante NAO aparece em /chat', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByTestId('chat-fab')).toHaveCount(0);
  });

  test('cria mira via chat (stub ou real)', async ({ page }) => {
    await page.goto('/chat');
    const uniqueName = `Chat E2E ${Date.now()}`;
    await page.getByTestId('chat-input').fill(`cria uma mira chamada "${uniqueName}" verde pequena com ponto`);
    await page.getByTestId('chat-send').click();
    await expect(page.getByText(/create_crosshair|generate_crosshair_from_description/)).toBeVisible({ timeout: 30000 });

    await page.goto('/cs2#crosshairs');
    await expect(page.getByText(uniqueName).first()).toBeVisible({ timeout: 8000 });
  });

  test('responde mensagem qualquer', async ({ page }) => {
    await page.goto('/chat');
    const before = await page.locator('[data-testid="chat-panel"] .whitespace-pre-wrap').count();
    await page.getByTestId('chat-input').fill('lista minhas miras');
    await page.getByTestId('chat-send').click();
    await expect.poll(async () => {
      return await page.locator('[data-testid="chat-panel"] .whitespace-pre-wrap').count();
    }, { timeout: 30000 }).toBeGreaterThan(before + 1);
  });

  test('toggle de TTS funciona', async ({ page }) => {
    await page.goto('/chat');
    const btn = page.getByTestId('tts-toggle');
    await expect(btn).toBeVisible();
    await btn.click();
    await btn.click();
  });
});
