import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pool from '../../src/config/db';
import { createApp } from '../../src/app';
import { signAccessToken } from '../../src/utils/jwt';
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

const app = createApp();

describe('folder ownership and item subscription metadata', () => {
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

  it('does not allow one user to rename or delete another user’s folder', async () => {
    const ownerId = await createUser('folder-owner@example.test');
    const otherId = await createUser('folder-other@example.test');
    await createFolder(ownerId, 'Owner folder');
    const otherFolderId = await createFolder(otherId, 'Other folder');
    const token = signAccessToken(ownerId);

    const rename = await request(app)
      .put(`/users/${otherId}/folders/${otherFolderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Changed by another user' });
    const deletion = await request(app)
      .delete(`/users/${otherId}/folders/${otherFolderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect.soft(rename.status).toBe(404);
    expect.soft(deletion.status).toBe(404);

    const unchanged = await testQuery<{ name: string }>(
      'SELECT name FROM folder WHERE user_id = $1',
      [otherId]
    );
    expect.soft(unchanged.rows.map((folder) => folder.name)).toEqual(['Other folder']);
  });

  it('rejects mapping a user-owned source into another user’s folder', async () => {
    const userId = await createUser('mapping-user@example.test');
    const folderOwnerId = await createUser('mapping-folder-owner@example.test');
    const sourceId = await createSource('User source', 'https://mapping.test/feed.xml');
    await subscribeUser(userId, sourceId);
    const otherFolderId = await createFolder(folderOwnerId, 'Other user folder');

    const response = await request(app)
      .post(`/users/${userId}/folders/${otherFolderId}/sources`)
      .set('Authorization', `Bearer ${signAccessToken(userId)}`)
      .send({ sourceId });

    expect.soft(response.status).toBe(404);
    expect.soft(response.body).toEqual({ error: 'Folder or source not found for this user' });

    const mapping = await testQuery(
      'SELECT 1 FROM user_source_folder WHERE user_id = $1 AND folder_id = $2 AND source_id = $3',
      [userId, otherFolderId, sourceId]
    );
    expect.soft(mapping.rowCount).toBe(0);
  });

  it('rejects saving an item from a source the user does not follow', async () => {
    const ownerId = await createUser('item-owner@example.test');
    const otherId = await createUser('item-other@example.test');
    const sourceId = await createSource('Owner source', 'https://item-owner.test/feed.xml');
    await subscribeUser(ownerId, sourceId);
    const itemId = await createItem(sourceId, 'https://item-owner.test/article');

    const response = await request(app)
      .post(`/users/${otherId}/items/save`)
      .set('Authorization', `Bearer ${signAccessToken(otherId)}`)
      .send({ itemId, save: true });

    expect.soft(response.status).toBe(404);
    expect.soft(response.body).toEqual({ error: 'Item not found for this user' });

    const metadata = await testQuery(
      'SELECT 1 FROM user_item_metadata WHERE user_id = $1 AND item_id = $2',
      [otherId, itemId]
    );
    expect.soft(metadata.rowCount).toBe(0);
  });

  it('rejects marking an unsubscribed item as read', async () => {
    const ownerId = await createUser('read-owner@example.test');
    const otherId = await createUser('read-other@example.test');
    const sourceId = await createSource('Read owner source', 'https://read-owner.test/feed.xml');
    await subscribeUser(ownerId, sourceId);
    const itemId = await createItem(sourceId, 'https://read-owner.test/article');

    const response = await request(app)
      .post(`/users/${otherId}/items/${itemId}/read`)
      .set('Authorization', `Bearer ${signAccessToken(otherId)}`);

    expect.soft(response.status).toBe(404);
    expect.soft(response.body).toEqual({ error: 'Item not found for this user' });

    const metadata = await testQuery(
      'SELECT 1 FROM user_item_metadata WHERE user_id = $1 AND item_id = $2',
      [otherId, itemId]
    );
    expect.soft(metadata.rowCount).toBe(0);
  });

  it('checks that a source is subscribed before adding it to a folder', async () => {
    const userId = await createUser('unsubscribed-source@example.test');
    const folderId = await createFolder(userId, 'My folder');
    const sourceId = await createSource('Not subscribed', 'https://not-subscribed.test/feed.xml');

    const response = await request(app)
      .post(`/users/${userId}/folders/${folderId}/sources`)
      .set('Authorization', `Bearer ${signAccessToken(userId)}`)
      .send({ sourceId });

    expect.soft(response.status).toBe(404);
    expect.soft(response.body).toEqual({ error: 'Folder or source not found for this user' });

    const mapping = await testQuery(
      'SELECT 1 FROM user_source_folder WHERE user_id = $1 AND folder_id = $2 AND source_id = $3',
      [userId, folderId, sourceId]
    );
    expect.soft(mapping.rowCount).toBe(0);
  });

  it('allows a user to add their subscribed source to their own folder', async () => {
    const userId = await createUser('valid-folder-source@example.test');
    const folderId = await createFolder(userId, 'My folder');
    const sourceId = await createSource('My source', 'https://my-source.test/feed.xml');
    await subscribeUser(userId, sourceId);

    const response = await request(app)
      .post(`/users/${userId}/folders/${folderId}/sources`)
      .set('Authorization', `Bearer ${signAccessToken(userId)}`)
      .send({ sourceId });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user_id: userId, folder_id: folderId, source_id: sourceId, added: true });
  });

  it('allows a user to save and mark read an item from a subscribed source', async () => {
    const userId = await createUser('valid-item-actions@example.test');
    const sourceId = await createSource('My source', 'https://my-items.test/feed.xml');
    await subscribeUser(userId, sourceId);
    const itemId = await createItem(sourceId, 'https://my-items.test/article');
    const token = signAccessToken(userId);

    const save = await request(app)
      .post(`/users/${userId}/items/save`)
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId, save: true });
    const read = await request(app)
      .post(`/users/${userId}/items/${itemId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(save.status).toBe(200);
    expect(save.body).toMatchObject({ userId, itemId, is_save: true });
    expect(read.status).toBe(200);

    const metadata = await testQuery<{ is_save: boolean; read_time: string | null }>(
      'SELECT is_save, read_time FROM user_item_metadata WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    expect(metadata.rows).toHaveLength(1);
    expect(metadata.rows[0].is_save).toBe(true);
    expect(metadata.rows[0].read_time).not.toBeNull();
  });
});
