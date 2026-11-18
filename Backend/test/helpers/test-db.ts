import { Pool, type QueryResult } from 'pg';
import { createSchema } from '../../src/db/createSchema';
import { ensureUserSourceUserCascade } from '../../src/db/migrations/ensure-user-source-user-cascade';

const TEST_TABLES = [
  'item_category',
  'user_item_metadata',
  'user_source_folder',
  'user_source',
  'item',
  'folder',
  'demo_session',
  'category',
  'source',
  'users',
] as const;

let pool: Pool | null = null;
let schemaReady = false;

export const assertTestDatabaseUrl = (): string => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url.trim() === '') {
    throw new Error(
      'TEST_DATABASE_URL is required for integration tests. It must point to a dedicated test database and must not fall back to DATABASE_URL.'
    );
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === url) {
    throw new Error(
      'TEST_DATABASE_URL must not be the same as DATABASE_URL. Use a separate empty test database.'
    );
  }
  return url;
};

const getPool = (): Pool => {
  if (!pool) {
    const connectionString = assertTestDatabaseUrl();
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? undefined
        : { rejectUnauthorized: false },
    });
  }
  return pool;
};

export const testQuery = async <T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  return getPool().query<T>(text, params);
};

export const ensureTestSchema = async (): Promise<void> => {
  if (schemaReady) {
    return;
  }
  assertTestDatabaseUrl();
  await createSchema(testQuery);
  const client = await getPool().connect();
  try {
    await ensureUserSourceUserCascade(client);
  } finally {
    client.release();
  }
  schemaReady = true;
};

export const truncateTestTables = async (): Promise<void> => {
  await testQuery(
    `TRUNCATE TABLE ${TEST_TABLES.join(', ')} RESTART IDENTITY CASCADE`
  );
};

export const closeTestPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    schemaReady = false;
  }
};

export const getTestDatabaseName = async (): Promise<string> => {
  const result = await testQuery<{ current_database: string }>(
    'SELECT current_database() AS current_database'
  );
  return result.rows[0]?.current_database ?? '';
};
