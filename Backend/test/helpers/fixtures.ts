import { testQuery } from './test-db';

export async function createUser(email: string, name = 'Integration User'): Promise<number> {
  const result = await testQuery<{ user_id: number }>(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, 'test-password-hash')
     RETURNING user_id`,
    [name, email]
  );
  return result.rows[0].user_id;
}

export async function createSource(
  name: string,
  url: string,
  feedType: 'rss' | 'podcast' = 'rss'
): Promise<number> {
  const result = await testQuery<{ source_id: number }>(
    `INSERT INTO source (source_name, url, feed_type)
     VALUES ($1, $2, $3)
     RETURNING source_id`,
    [name, url, feedType]
  );
  return result.rows[0].source_id;
}

export async function subscribeUser(userId: number, sourceId: number): Promise<void> {
  await testQuery(
    `INSERT INTO user_source (user_id, source_id, feed_type)
     VALUES ($1, $2, 'rss')`,
    [userId, sourceId]
  );
}

export async function createFolder(userId: number, name: string): Promise<number> {
  const result = await testQuery<{ folder_id: number }>(
    `INSERT INTO folder (user_id, name)
     VALUES ($1, $2)
     RETURNING folder_id`,
    [userId, name]
  );
  return result.rows[0].folder_id;
}

export async function createItem(sourceId: number, link: string): Promise<number> {
  const result = await testQuery<{ item_id: number }>(
    `INSERT INTO item (source_id, link, title, description, pub_date)
     VALUES ($1, $2, 'Test article', 'Test description', NOW())
     RETURNING item_id`,
    [sourceId, link]
  );
  return result.rows[0].item_id;
}

