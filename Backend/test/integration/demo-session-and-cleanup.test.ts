import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import pool from '../../src/config/db';
import { createApp } from '../../src/app';
import { cleanupExpiredDemoSessions } from '../../src/services/demo-cleanup.service';
import { hashDemoSessionToken } from '../../src/services/demo-session.service';
import {
  createFolder,
  createItem,
  createSource,
  createUser,
  subscribeUser,
} from '../helpers/fixtures';
import {
  closeTestPool,
  ensureTestSchema,
  testQuery,
  truncateTestTables,
} from '../helpers/test-db';

vi.mock('../../src/services/feed-ingestion/parse-feed.service', () => ({
  parseFeed: vi.fn(async () => ({
    title: 'Guest-only source',
    entries: [
      {
        title: 'Guest-only article',
        link: 'https://guest-source.test/articles/one',
        description: 'Deterministic test entry',
        published: new Date(),
      },
    ],
  })),
}));

vi.mock('../../src/utils/get-logo', () => ({
  getLogo: vi.fn().mockResolvedValue(null),
}));

const app = createApp();

function demoCookie(response: request.Response): string {
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  const cookie = cookies?.find((value) => value.startsWith('demo_session='));
  expect(cookie).toBeDefined();
  return cookie!.split(';')[0];
}

async function startDemo(): Promise<{ userId: number; cookie: string }> {
  const response = await request(app).post('/demo/session');
  expect(response.status).toBe(201);
  return { userId: response.body.userId, cookie: demoCookie(response) };
}

describe('demo session isolation and expiration cleanup', () => {
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

  it('keeps saved state, folders, and added sources separate between guests', async () => {
    const baselineId = await createUser('demo-baseline@readarchive.local', 'Demo Baseline');
    const baselineSourceId = await createSource(
      'Baseline source',
      'https://baseline.test/feed.xml'
    );
    await subscribeUser(baselineId, baselineSourceId);
    await createFolder(baselineId, 'Baseline folder');
    const itemId = await createItem(baselineSourceId, 'https://baseline.test/article');

    const firstGuest = await startDemo();
    const secondGuest = await startDemo();

    const firstFolder = await request(app)
      .post(`/users/${firstGuest.userId}/folders`)
      .set('Cookie', firstGuest.cookie)
      .send({ folderName: 'First guest folder' });
    expect(firstFolder.status).toBe(200);

    const saveResponse = await request(app)
      .post(`/users/${firstGuest.userId}/items/save`)
      .set('Cookie', firstGuest.cookie)
      .send({ itemId, save: true });
    expect(saveResponse.status).toBe(200);

    const addSourceResponse = await request(app)
      .post(`/users/${firstGuest.userId}/source`)
      .set('Cookie', firstGuest.cookie)
      .send({ sourceURL: 'https://guest-source.test/feed.xml' });
    expect(addSourceResponse.status).toBe(200);

    const firstSaved = await request(app)
      .get(`/users/${firstGuest.userId}/saved`)
      .set('Cookie', firstGuest.cookie);
    const secondSaved = await request(app)
      .get(`/users/${secondGuest.userId}/saved`)
      .set('Cookie', secondGuest.cookie);
    const firstFolders = await request(app)
      .get(`/users/${firstGuest.userId}/folders`)
      .set('Cookie', firstGuest.cookie);
    const secondFolders = await request(app)
      .get(`/users/${secondGuest.userId}/folders`)
      .set('Cookie', secondGuest.cookie);
    const firstSources = await request(app)
      .get(`/users/${firstGuest.userId}/sources`)
      .set('Cookie', firstGuest.cookie);
    const secondSources = await request(app)
      .get(`/users/${secondGuest.userId}/sources`)
      .set('Cookie', secondGuest.cookie);

    expect(firstSaved.body.map((item: { item_id: number }) => item.item_id)).toContain(itemId);
    expect(secondSaved.body).toEqual([]);
    expect(firstFolders.body.map((folder: { name: string }) => folder.name)).toContain(
      'First guest folder'
    );
    expect(secondFolders.body.map((folder: { name: string }) => folder.name)).not.toContain(
      'First guest folder'
    );
    expect(firstSources.body.map((source: { source_name: string }) => source.source_name)).toContain(
      'Guest-only source'
    );
    expect(secondSources.body.map((source: { source_name: string }) => source.source_name)).not.toContain(
      'Guest-only source'
    );
  });

  it('removes expired guests and their orphaned data but preserves baseline and shared sources', async () => {
    const baselineId = await createUser('demo-baseline@readarchive.local', 'Demo Baseline');
    const sharedSourceId = await createSource('Shared source', 'https://shared.test/feed.xml');
    await subscribeUser(baselineId, sharedSourceId);
    const baselineFolderId = await createFolder(baselineId, 'Baseline folder');

    const realUserId = await createUser('real-user@example.test', 'Real User');
    await subscribeUser(realUserId, sharedSourceId);
    const sharedItemId = await createItem(sharedSourceId, 'https://shared.test/article');
    await testQuery(
      `INSERT INTO user_item_metadata (user_id, item_id, is_save)
       VALUES ($1, $2, TRUE)`,
      [realUserId, sharedItemId]
    );

    const guest = await startDemo();
    const guestOnlySourceId = await createSource(
      'Guest-only source',
      'https://guest-only.test/feed.xml'
    );
    await subscribeUser(guest.userId, guestOnlySourceId);
    const guestOnlyItemId = await createItem(
      guestOnlySourceId,
      'https://guest-only.test/article'
    );
    await testQuery(
      `INSERT INTO user_item_metadata (user_id, item_id, is_save)
       VALUES ($1, $2, TRUE)`,
      [guest.userId, guestOnlyItemId]
    );

    const token = decodeURIComponent(guest.cookie.slice('demo_session='.length));
    await testQuery(
      'UPDATE demo_session SET expires_at = NOW() - INTERVAL \'1 minute\' WHERE token_hash = $1',
      [hashDemoSessionToken(token)]
    );

    await cleanupExpiredDemoSessions();

    const remainingUsers = await testQuery<{ user_id: number }>(
      'SELECT user_id FROM users WHERE user_id = ANY($1::int[])',
      [[baselineId, realUserId, guest.userId]]
    );
    expect(remainingUsers.rows.map((row) => row.user_id)).toEqual([baselineId, realUserId]);

    const remainingSession = await testQuery(
      'SELECT 1 FROM demo_session WHERE user_id = $1',
      [guest.userId]
    );
    expect(remainingSession.rowCount).toBe(0);

    const baselineState = await testQuery<{ folder_id: number }>(
      'SELECT folder_id FROM folder WHERE user_id = $1',
      [baselineId]
    );
    expect(baselineState.rows.map((row) => row.folder_id)).toEqual([baselineFolderId]);

    const sharedState = await testQuery<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM source s
       JOIN item i ON i.source_id = s.source_id
       JOIN user_item_metadata uim ON uim.item_id = i.item_id
       WHERE s.source_id = $1 AND uim.user_id = $2 AND uim.is_save = TRUE`,
      [sharedSourceId, realUserId]
    );
    expect(sharedState.rows[0].count).toBe('1');

    const removedOrphan = await testQuery(
      'SELECT 1 FROM source WHERE source_id = $1',
      [guestOnlySourceId]
    );

    const remainingReferences = await testQuery<{
      subscriptions: string;
      metadata: string;
    }>(
      `SELECT
         (SELECT COUNT(*)::text FROM user_source WHERE source_id = $1) AS subscriptions,
         (SELECT COUNT(*)::text
          FROM user_item_metadata uim
          JOIN item i ON i.item_id = uim.item_id
          WHERE i.source_id = $1) AS metadata`,
      [guestOnlySourceId]
    );
    expect.soft(remainingReferences.rows[0]).toEqual({ subscriptions: '0', metadata: '0' });
    expect.soft(removedOrphan.rowCount).toBe(0);
  });
});
