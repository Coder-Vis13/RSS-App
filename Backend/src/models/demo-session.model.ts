import type { PoolClient } from 'pg';
import { query } from '../config/db';

export interface DemoSession {
  session_id: string;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export async function createDemoSession(
  client: PoolClient,
  session: Pick<DemoSession, 'session_id' | 'user_id' | 'token_hash' | 'expires_at'>
): Promise<DemoSession> {
  const result = await client.query<DemoSession>(
    `INSERT INTO demo_session (session_id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING session_id, user_id, token_hash, expires_at, created_at`,
    [session.session_id, session.user_id, session.token_hash, session.expires_at]
  );

  return result.rows[0];
}

export async function findActiveDemoSession(tokenHash: string): Promise<DemoSession | null> {
  const result = await query<DemoSession>(
    `SELECT session_id, user_id, token_hash, expires_at, created_at
     FROM demo_session
     WHERE token_hash = $1
       AND expires_at > NOW()`,
    [tokenHash]
  );

  return result.rows[0] ?? null;
}

export async function deleteDemoSessionByTokenHash(tokenHash: string): Promise<void> {
  await query('DELETE FROM demo_session WHERE token_hash = $1', [tokenHash]);
}
