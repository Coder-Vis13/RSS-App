import 'dotenv/config';
import pool from '../src/config/db';
import { ensureUserSourceUserCascade } from '../src/db/migrations/ensure-user-source-user-cascade';

async function migrateUserSourceCascade(): Promise<void> {
  const client = await pool.connect();
  try {
    await ensureUserSourceUserCascade(client);
    console.log('user_source user ownership cascade is ready.');
  } finally {
    client.release();
  }
}

migrateUserSourceCascade()
  .catch((error: unknown) => {
    console.error('user_source cascade migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
