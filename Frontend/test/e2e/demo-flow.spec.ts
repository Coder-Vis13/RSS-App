import { expect, test } from '@playwright/test';

const demoUserId = 9001;
const article = {
  item_id: 501,
  title: 'A sample article for the demo feed',
  link: 'https://example.test/article',
  description: 'A short article used to exercise the reading workflow.',
  pub_date: '2026-11-14T12:00:00.000Z',
  source_name: 'Example News',
  is_save: false,
  feed_type: 'rss',
  source_id: 21,
  categories: [{ name: 'Technology', color: '#123456' }],
  tags: [],
  is_categorized: true,
};

test('a visitor can enter the demo and save an article', async ({ page }) => {
  let isSaved = false;

  await page.route('**/*', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === '/demo/session' && request.method() === 'POST') {
      await route.fulfill({ json: { userId: demoUserId } });
    } else if (
      path === `/users/${demoUserId}/sources` ||
      path === `/users/${demoUserId}/sources/unfoldered` ||
      path === `/users/${demoUserId}/folders`
    ) {
      await route.fulfill({ json: [] });
    } else if (path === `/users/${demoUserId}/feed`) {
      await route.fulfill({ json: [{ ...article, is_save: isSaved }] });
    } else if (path === `/users/${demoUserId}/items/save` && request.method() === 'POST') {
      const body = request.postDataJSON() as { itemId: number; save: boolean };
      isSaved = body.save;
      await route.fulfill({ json: { success: true } });
    } else if (path === `/users/${demoUserId}/saved`) {
      await route.fulfill({ json: isSaved ? [{ ...article, is_save: true }] : [] });
    } else if (/\/(demo|users|login|register|refresh|logout)(\/|$)/.test(path)) {
      await route.fulfill({ status: 500, json: { error: `Unexpected API request: ${path}` } });
    } else {
      await route.continue();
    }
  });

  await page.goto('/landing');
  await page.getByRole('button', { name: 'Try Demo' }).click();

  await expect(
    page.getByText('Demo mode — changes are private to this session and reset automatically.'),
  ).toBeVisible();

  const articleLink = page.getByRole('link', { name: article.title });
  await expect(articleLink).toBeVisible();
  await articleLink.locator('xpath=../..').getByRole('button').click();

  await page.getByRole('link', { name: 'Saved' }).click();
  await expect(page.getByRole('link', { name: article.title })).toBeVisible();
});

test('a signed-out visitor is redirected away from the feed', async ({ page }) => {
  await page.goto('/feed');

  await expect(page).toHaveURL(/\/landing$/);
  await expect(page.getByRole('button', { name: 'Try Demo' })).toBeVisible();
});
