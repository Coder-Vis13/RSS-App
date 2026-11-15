import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../../src/config/db';

const BASELINE_EMAIL = 'readarchive-playwright-baseline@readarchive.local';
const REAL_USER_EMAIL = 'readarchive-playwright-user@readarchive.local';
const REAL_USER_PASSWORD = 'ReadArchive E2E Test Password 123!';
const SOURCE_URL = 'https://readarchive-playwright.invalid/feed.xml';
const ARTICLE_LINK = 'https://readarchive-playwright.invalid/article/one';
const SOURCE_NAME = 'ReadArchive Playwright Fixture';
const ARTICLE_TITLE = 'ReadArchive Playwright fixture article';

function assertSafeTestDatabase(): void {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (process.env.NODE_ENV !== 'test' || !testUrl) {
    throw new Error('E2E fixtures require NODE_ENV=test and TEST_DATABASE_URL.');
  }
  if (testUrl === process.env.DATABASE_URL) {
    throw new Error('E2E fixtures refuse to use the same URL as DATABASE_URL.');
  }
}

async function removeFixtures(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sourceResult = await client.query<{ source_id: number }>(
      'SELECT source_id FROM source WHERE url = $1 FOR UPDATE',
      [SOURCE_URL]
    );
    const sourceId = sourceResult.rows[0]?.source_id;

    if (sourceId) {
      await client.query(
        `DELETE FROM users u
         USING user_source us
         WHERE us.user_id = u.user_id
           AND us.source_id = $1
           AND u.email LIKE 'demo-%@r.local'
           AND EXISTS (SELECT 1 FROM demo_session ds WHERE ds.user_id = u.user_id)`,
        [sourceId]
      );
    }

    await client.query('DELETE FROM users WHERE email = ANY($1::text[])', [
      [BASELINE_EMAIL, REAL_USER_EMAIL],
    ]);

    if (sourceId) {
      const remaining = await client.query(
        'SELECT 1 FROM user_source WHERE source_id = $1 LIMIT 1',
        [sourceId]
      );
      if (remaining.rowCount) {
        throw new Error('Fixture source still has subscriptions; refusing to remove shared fixture data.');
      }

      await client.query(
        `DELETE FROM user_item_metadata
         WHERE item_id IN (SELECT item_id FROM item WHERE source_id = $1)`,
        [sourceId]
      );
      await client.query('DELETE FROM source WHERE source_id = $1', [sourceId]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function prepareFixtures(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query<{ user_id: number }>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ('Playwright baseline', $1, 'test-only-no-login')
       RETURNING user_id`,
      [BASELINE_EMAIL]
    );
    const userId = userResult.rows[0].user_id;
    const sourceResult = await client.query<{ source_id: number }>(
      `INSERT INTO source (source_name, url, feed_type)
       VALUES ($1, $2, 'rss')
       RETURNING source_id`,
      [SOURCE_NAME, SOURCE_URL]
    );
    const sourceId = sourceResult.rows[0].source_id;

    const realUserResult = await client.query<{ user_id: number }>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ('Playwright real user', $1, $2)
       RETURNING user_id`,
      [REAL_USER_EMAIL, await bcrypt.hash(REAL_USER_PASSWORD, 4)]
    );
    const realUserId = realUserResult.rows[0].user_id;

    await client.query(
      `INSERT INTO user_source (user_id, source_id, feed_type)
       VALUES ($1, $2, 'rss'), ($3, $2, 'rss')`,
      [userId, sourceId, realUserId]
    );
    await client.query(
      `INSERT INTO item (source_id, link, title, description, pub_date, is_categorized)
       VALUES ($1, $2, $3, 'Fixed article for browser tests', NOW(), true)`,
      [sourceId, ARTICLE_LINK, ARTICLE_TITLE]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  assertSafeTestDatabase();
  const action = process.argv[2];
  if (action === 'setup') {
    await removeFixtures();
    await prepareFixtures();
    console.log('Prepared isolated Playwright database fixtures.');
  } else if (action === 'cleanup') {
    await removeFixtures();
    console.log('Removed isolated Playwright database fixtures.');
  } else {
    throw new Error('Choose fixture action: setup or cleanup.');
  }
}

main()
  .catch((error: unknown) => {
    console.error('Playwright fixture operation failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
