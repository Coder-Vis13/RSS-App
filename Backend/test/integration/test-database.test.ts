import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assertTestDatabaseUrl,
  closeTestPool,
  ensureTestSchema,
  getTestDatabaseName,
  testQuery,
  truncateTestTables,
} from '../helpers/test-db';

describe('test database connection', () => {
  beforeAll(async () => {
    assertTestDatabaseUrl();
    await ensureTestSchema();
  });

  afterAll(async () => {
    await closeTestPool();
  });

  it('uses TEST_DATABASE_URL only (not DATABASE_URL)', async () => {
    const testUrl = assertTestDatabaseUrl();
    const dbName = await getTestDatabaseName();

    expect(testUrl).toBeTruthy();
    expect(dbName).toBeTruthy();

    if (process.env.DATABASE_URL) {
      const productionUrl = new URL(process.env.DATABASE_URL);
      const testDatabaseUrl = new URL(testUrl);

      expect(testDatabaseUrl.hostname).not.toBe(productionUrl.hostname);
    }
  });

  it('can bootstrap schema and truncate application tables', async () => {
    await truncateTestTables();

    const tables = await testQuery<{ tablename: string }>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('users', 'source', 'item', 'demo_session')
      ORDER BY tablename
    `);

    expect(tables.rows.map((r) => r.tablename)).toEqual([
      'demo_session',
      'item',
      'source',
      'users',
    ]);
  });
});
