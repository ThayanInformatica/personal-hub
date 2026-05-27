import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Cofre', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('cria bookmark, snippet e nota', async ({ page }) => {
    await page.goto('/vault');
    await expect(page.locator('h1', { hasText: 'Cofre' })).toBeVisible();

    const bookmarkTitle = `Link E2E ${Date.now()}`;
    await page.getByRole('button', { name: /Novo link/ }).click();
    await page.fill('input >> nth=0', bookmarkTitle);
    await page.fill('input >> nth=1', 'https://example.com');
    await page.fill('input >> nth=2', 'descricao teste');
    await page.fill('input >> nth=3', 'tag1, tag2');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(bookmarkTitle)).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: 'Snippets' }).click();
    const snippetTitle = `Snippet E2E ${Date.now()}`;
    await page.getByRole('button', { name: /Novo snippet/ }).click();
    await page.fill('input >> nth=0', snippetTitle);
    await page.fill('input >> nth=1', 'bash');
    await page.fill('textarea', 'echo "hello e2e"');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(snippetTitle)).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: 'Notas' }).click();
    const noteTitle = `Nota E2E ${Date.now()}`;
    await page.getByRole('button', { name: /Nova nota/ }).click();
    await page.fill('input >> nth=0', noteTitle);
    await page.fill('textarea', 'corpo da nota');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 8000 });
  });
});
