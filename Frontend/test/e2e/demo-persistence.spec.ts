import { expect, test } from '@playwright/test';

const fixtureArticleTitle = 'ReadArchive Playwright fixture article';

test('a saved demo article remains saved after refreshing', async ({ page }) => {
  await page.goto('/landing');
  await page.getByRole('button', { name: 'Try Demo' }).click();

  const articleLink = page.getByRole('link', { name: fixtureArticleTitle });
  await expect(articleLink).toBeVisible();

  const saveRequest = page.waitForResponse((response) => {
    const request = response.request();
    return (
      new URL(response.url()).pathname.endsWith('/items/save') &&
      request.method() === 'POST'
    );
  });
  await articleLink.locator('xpath=../..').getByRole('button').click();
  expect((await saveRequest).ok()).toBe(true);
  await page.reload();

  await expect(articleLink).toBeVisible();
  await page.getByRole('link', { name: 'Saved' }).click();
  await expect(page.getByRole('link', { name: fixtureArticleTitle })).toBeVisible();
});
