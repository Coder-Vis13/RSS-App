import 'dotenv/config';
import pool from '../src/config/db';

async function migrateDemoSession(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS demo_session (
      session_id UUID PRIMARY KEY,
      user_id INT NOT NULL UNIQUE
        REFERENCES users(user_id)
        ON DELETE CASCADE,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS demo_session_expires_at_idx
      ON demo_session (expires_at);
  `);
}

migrateDemoSession()
  .then(() => {
    console.log('Demo session table is ready.');
  })
  .catch((error: unknown) => {
    console.error('Demo session migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
