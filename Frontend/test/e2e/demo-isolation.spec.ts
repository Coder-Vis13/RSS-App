import { expect, test } from '@playwright/test';

const articleTitle = 'ReadArchive Playwright fixture article';

async function startDemo(page: import('@playwright/test').Page): Promise<number> {
  await page.goto('/landing');
  await page.getByRole('button', { name: 'Try Demo' }).click();
  await expect(page.getByRole('link', { name: articleTitle })).toBeVisible();
  return Number(
    await page.evaluate(() => sessionStorage.getItem('readarchive-demo-user-id')),
  );
}

async function saveArticle(page: import('@playwright/test').Page) {
  const responsePromise = page.waitForResponse((response) => {
    return (
      new URL(response.url()).pathname.endsWith('/items/save') &&
      response.request().method() === 'POST'
    );
  });
  await page.getByRole('link', { name: articleTitle }).locator('xpath=../..').getByRole('button').click();
  expect((await responsePromise).ok()).toBe(true);
}

test('demo sessions stay isolated and reject unauthenticated or unsafe requests', async ({ browser, request }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();

  try {
    for (const context of [firstContext, secondContext]) {
      await context.route('**/*', async (route) => {
        const hostname = new URL(route.request().url()).hostname;
        if (hostname === '127.0.0.1' || hostname === 'localhost') {
          await route.continue();
        } else {
          await route.abort();
        }
      });
    }

    const firstPage = await firstContext.newPage();
    const secondPage = await secondContext.newPage();
    const [firstUserId, secondUserId] = await Promise.all([
      startDemo(firstPage),
      startDemo(secondPage),
    ]);

    const unauthenticated = await request.get(
      `http://127.0.0.1:3000/users/${firstUserId}/saved`,
    );
    expect(unauthenticated.status()).toBe(401);

    const invalidSource = await firstContext.request.post(
      `http://127.0.0.1:3000/users/${firstUserId}/source`,
      { data: { sourceURL: 'ftp://invalid.example/feed.xml' } },
    );
    expect(invalidSource.status()).toBe(400);
    expect(await invalidSource.json()).toEqual({
      message: 'sourceURL must be an HTTP or HTTPS URL',
    });

    await saveArticle(firstPage);
    await firstPage.getByRole('link', { name: 'Saved' }).click();
    await expect(firstPage.getByRole('link', { name: articleTitle })).toBeVisible();

    // The authenticated cookie remains authoritative even if the URL names the other guest.
    const alteredUserPath = await firstContext.request.get(
      `http://127.0.0.1:3000/users/${secondUserId}/saved`,
    );
    expect(alteredUserPath.status()).toBe(200);
    expect(await alteredUserPath.json()).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: articleTitle })]),
    );

    await secondPage.getByRole('link', { name: 'Saved' }).click();
    await expect(secondPage.getByText(/Found something worth keeping\?/)).toBeVisible();
    await expect(secondPage.getByRole('link', { name: articleTitle })).toHaveCount(0);
  } finally {
    await Promise.all([firstContext.close(), secondContext.close()]);
  }
});

test('demo saved state does not appear in a real user account', async ({ browser }) => {
  const demoContext = await browser.newContext();
  const realUserContext = await browser.newContext();

  try {
    const demoPage = await demoContext.newPage();
    const realUserPage = await realUserContext.newPage();
    await startDemo(demoPage);
    await saveArticle(demoPage);

    await realUserPage.goto('/landing');
    await realUserPage.getByRole('button', { name: 'Sign In' }).first().click();
    await realUserPage.locator('input[type="email"]').fill('readarchive-playwright-user@readarchive.local');
    await realUserPage.locator('input[type="password"]').fill('ReadArchive E2E Test Password 123!');
    await realUserPage.getByRole('button', { name: 'Sign In' }).last().click();

    await expect(realUserPage).toHaveURL(/\/feed$/);
    await expect(realUserPage.getByRole('link', { name: articleTitle })).toBeVisible();
    await realUserPage.getByRole('link', { name: 'Saved' }).click();
    await expect(realUserPage.getByText(/Found something worth keeping\?/)).toBeVisible();
    await expect(realUserPage.getByRole('link', { name: articleTitle })).toHaveCount(0);
  } finally {
    await Promise.all([demoContext.close(), realUserContext.close()]);
  }
});
