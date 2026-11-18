import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pool from '../../src/config/db';
import {
  allSavedItems,
  getItemsByCategory,
  getSavedItemsByCategory,
  readItems,
  userFeedItems,
} from '../../src/models/items.model';
import { DEMO_ITEMS_PER_SOURCE } from '../../src/config/demo-sources';
import { folderItems } from '../../src/models/folders.model';
import { getSourceItems } from '../../src/models/sources.model';
import { createFolder, createSource, createUser } from '../helpers/fixtures';
import { closeTestPool, ensureTestSchema, testQuery, truncateTestTables } from '../helpers/test-db';

interface ItemLimitFixture {
  demoUserId: number;
  regularUserId: number;
  blogSourceId: number;
  podcastSourceId: number;
}

async function createItemLimitFixture(): Promise<ItemLimitFixture> {
  const demoUserId = await createUser('demo-item-limit@example.test');
  const regularUserId = await createUser('regular-item-limit@example.test');
  const blogSourceId = await createSource(
    'Test blog',
    'https://items.example.test/blog.xml',
    'rss',
  );
  const podcastSourceId = await createSource(
    'Test podcast',
    'https://items.example.test/podcast.xml',
    'podcast',
  );

  await testQuery(
    `INSERT INTO user_source (user_id, source_id, feed_type)
     VALUES
       ($1, $2, 'rss'),
       ($1, $3, 'podcast'),
       ($4, $2, 'rss'),
       ($4, $3, 'podcast')`,
    [demoUserId, blogSourceId, podcastSourceId, regularUserId],
  );

  for (const source of [
    { id: blogSourceId, slug: 'blog' },
    { id: podcastSourceId, slug: 'podcast' },
  ]) {
    await testQuery(
      `INSERT INTO item (source_id, link, title, description, pub_date)
       SELECT
         $1,
         'https://items.example.test/${source.slug}/' || item_number,
         '${source.slug} item ' || item_number,
         'Test item',
         NOW() - (item_number + 3) * INTERVAL '1 day'
       FROM generate_series(1, 20) AS item_number`,
      [source.id],
    );
  }

  return { demoUserId, regularUserId, blogSourceId, podcastSourceId };
}

function expectFifteenPerSource(items: { link: string }[]): void {
  expect(items).toHaveLength(DEMO_ITEMS_PER_SOURCE * 2);
  expect(items.filter((item) => item.link.includes('/blog/'))).toHaveLength(
    DEMO_ITEMS_PER_SOURCE,
  );
  expect(items.filter((item) => item.link.includes('/podcast/'))).toHaveLength(
    DEMO_ITEMS_PER_SOURCE,
  );
}

describe('demo per-source item limit', () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await truncateTestTables();
  });

  afterAll(async () => {
    await closeTestPool();
    await pool.end();
  });

  it('shows the latest 15 items per source in demo mode without limiting regular users', async () => {
    const { demoUserId, regularUserId, blogSourceId, podcastSourceId } =
      await createItemLimitFixture();

    const demoItems = await userFeedItems(demoUserId, 'all', true);
    const regularItems = await userFeedItems(regularUserId, 'all', false);

    expect(demoItems).toHaveLength(DEMO_ITEMS_PER_SOURCE * 2);
    expect(regularItems).toHaveLength(40);
    expect(
      demoItems.every(
        (item) => new Date(item.pub_date).getTime() < Date.now() - 48 * 60 * 60 * 1000,
      ),
    ).toBe(true);

    for (const source of [
      { id: blogSourceId, slug: 'blog' },
      { id: podcastSourceId, slug: 'podcast' },
    ]) {
      const sourceItems = demoItems.filter((item) => item.source_id === source.id);
      const expectedLinks = Array.from(
        { length: DEMO_ITEMS_PER_SOURCE },
        (_, index) => `https://items.example.test/${source.slug}/${index + 1}`,
      ).sort();

      expect(sourceItems).toHaveLength(DEMO_ITEMS_PER_SOURCE);
      expect(sourceItems.map((item) => item.link).sort()).toEqual(expectedLinks);
    }
  });

  it('applies the same demo item set to categories, saved/read, folders, and source views', async () => {
    const { demoUserId, regularUserId, blogSourceId, podcastSourceId } =
      await createItemLimitFixture();
    const sourceIds = [blogSourceId, podcastSourceId];
    const category = await testQuery<{ category_id: number }>(
      `INSERT INTO category (name) VALUES ('Technology') RETURNING category_id`,
    );
    const categoryId = category.rows[0].category_id;

    await testQuery(
      `INSERT INTO item_category (item_id, category_id)
       SELECT item_id, $1 FROM item WHERE source_id = ANY($2::int[])`,
      [categoryId, sourceIds],
    );

    for (const userId of [demoUserId, regularUserId]) {
      await testQuery(
        `INSERT INTO user_item_metadata (user_id, item_id, is_save)
         SELECT $1, item_id, true FROM item WHERE source_id = ANY($2::int[])`,
        [userId, sourceIds],
      );
    }

    const demoFolderId = await createFolder(demoUserId, 'Demo test folder');
    const regularFolderId = await createFolder(regularUserId, 'Regular test folder');
    for (const [userId, folderId] of [
      [demoUserId, demoFolderId],
      [regularUserId, regularFolderId],
    ]) {
      await testQuery(
        `INSERT INTO user_source_folder (user_id, folder_id, source_id)
         VALUES ($1, $2, $3), ($1, $2, $4)`,
        [userId, folderId, blogSourceId, podcastSourceId],
      );
    }

    expectFifteenPerSource(
      await getItemsByCategory(demoUserId, 'Technology', 'all', true),
    );
    expect(
      await getItemsByCategory(regularUserId, 'Technology', 'all', false),
    ).toHaveLength(40);

    expectFifteenPerSource(await allSavedItems(demoUserId, 'all', true));
    expect(await allSavedItems(regularUserId, 'all', false)).toHaveLength(40);
    expectFifteenPerSource(
      await getSavedItemsByCategory(demoUserId, 'Technology', 'all', true),
    );
    expect(
      await getSavedItemsByCategory(regularUserId, 'Technology', 'all', false),
    ).toHaveLength(40);

    expectFifteenPerSource(
      await folderItems(demoUserId, demoFolderId, 'all', true),
    );
    expect(await folderItems(regularUserId, regularFolderId, 'all', false)).toHaveLength(40);

    expect(
      await getSourceItems(demoUserId, blogSourceId, 'all', true),
    ).toHaveLength(DEMO_ITEMS_PER_SOURCE);
    expect(
      await getSourceItems(regularUserId, blogSourceId, 'all', false),
    ).toHaveLength(20);

    await testQuery(
      `UPDATE user_item_metadata
       SET read_time = NOW()
       WHERE user_id = ANY($1::int[])`,
      [[demoUserId, regularUserId]],
    );
    expectFifteenPerSource(await readItems(demoUserId, 'all', true));
    expect(await readItems(regularUserId, 'all', false)).toHaveLength(40);
  });
});
