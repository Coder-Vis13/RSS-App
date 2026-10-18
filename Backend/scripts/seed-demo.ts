import 'dotenv/config';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import pool, { query } from '../src/config/db';
import { DEMO_BASELINE_FOLDER_NAME, DEMO_SOURCES } from '../src/config/demo-sources';
import { runFeedRefresh } from '../src/cron';
import { processSource } from '../src/services/source.service';
import { enqueueCategorization } from '../src/utils/categorizer';

const BASELINE_NAME = 'ReadArchive Demo';
const BASELINE_EMAIL = process.env.DEMO_BASELINE_EMAIL ?? 'demo-baseline@readarchive.local';

interface BaselineUserRow {
  user_id: number;
}

interface ItemRow {
  item_id: number;
}

async function getOrCreateBaselineUser(): Promise<number> {
  const existing = await query<BaselineUserRow>(
    'SELECT user_id FROM users WHERE email = $1',
    [BASELINE_EMAIL]
  );

  if (existing.rows[0]) {
    return existing.rows[0].user_id;
  }

  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  const created = await query<BaselineUserRow>(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id`,
    [BASELINE_NAME, BASELINE_EMAIL, passwordHash]
  );

  return created.rows[0].user_id;
}

async function resetBaselineUser(userId: number): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_item_metadata WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM folder WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_source WHERE user_id = $1', [userId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createBaselineFolder(userId: number, sourceIds: number[]): Promise<void> {
  const folder = await query<{ folder_id: number }>(
    `INSERT INTO folder (user_id, name)
     VALUES ($1, $2)
     RETURNING folder_id`,
    [userId, DEMO_BASELINE_FOLDER_NAME]
  );

  const folderId = folder.rows[0].folder_id;
  await query(
    `INSERT INTO user_source_folder (user_id, folder_id, source_id)
     SELECT $1, $2, source_id
     FROM unnest($3::int[]) AS source_ids(source_id)`,
    [userId, folderId, sourceIds]
  );
}

async function categorizeRecentItems(sourceIds: number[]): Promise<void> {
  const recentItems = await query<ItemRow>(
    `SELECT item_id
     FROM item
     WHERE source_id = ANY($1::int[])
       AND pub_date >= NOW() - INTERVAL '48 hours'
       AND is_categorized = false`,
    [sourceIds]
  );

  await enqueueCategorization(recentItems.rows.map((item) => item.item_id));
}

async function seedDemo(): Promise<void> {
  const baselineUserId = await getOrCreateBaselineUser();
  await resetBaselineUser(baselineUserId);

  const sourceIds: number[] = [];
  for (const source of DEMO_SOURCES) {
    console.log(`[demo seed] adding ${source.name}`);
    const result = await processSource(baselineUserId, source.url, {
      enqueueCategorization: false,
      demoMode: true,
    });
    sourceIds.push(result.source_id);
  }

  await runFeedRefresh({ sourceIds, enqueueCategorization: false, recentOnly: true });
  await createBaselineFolder(baselineUserId, sourceIds);
  await categorizeRecentItems(sourceIds);

  console.log(`[demo seed] baseline ready with ${sourceIds.length} source(s)`);
}

seedDemo()
  .catch((error: unknown) => {
    console.error('[demo seed] failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
