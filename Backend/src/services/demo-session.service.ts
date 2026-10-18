import { createHash, randomBytes, randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { createDemoSession } from '../models/demo-session.model';

export const DEMO_SESSION_COOKIE = 'demo_session';
export const DEMO_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const BASELINE_EMAIL = process.env.DEMO_BASELINE_EMAIL ?? 'demo-baseline@readarchive.local';
const GUEST_NAME = 'ReadArchive Guest';

export interface NewDemoSessionToken {
  sessionId: string;
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function createDemoSessionToken(now = new Date()): NewDemoSessionToken {
  const token = randomBytes(32).toString('hex');

  return {
    sessionId: randomUUID(),
    token,
    tokenHash: hashDemoSessionToken(token),
    expiresAt: new Date(now.getTime() + DEMO_SESSION_TTL_MS),
  };
}

export function hashDemoSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface CreatedDemoSession {
  userId: number;
  token: string;
  expiresAt: Date;
}

export async function createGuestDemoSession(
  previousToken?: string
): Promise<CreatedDemoSession> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (previousToken) {
      const previousSession = await client.query<{ user_id: number }>(
        `SELECT user_id
         FROM demo_session
         WHERE token_hash = $1
         FOR UPDATE`,
        [hashDemoSessionToken(previousToken)]
      );

      const previousUserId = previousSession.rows[0]?.user_id;
      if (previousUserId) {
        await client.query('DELETE FROM users WHERE user_id = $1', [previousUserId]);
      }
    }

    const baseline = await client.query<{ user_id: number }>(
      'SELECT user_id FROM users WHERE email = $1',
      [BASELINE_EMAIL]
    );
    const baselineUserId = baseline.rows[0]?.user_id;

    if (!baselineUserId) {
      throw new Error('Demo baseline user not found. Run npm run db:seed-demo first.');
    }

    const guestEmail = `demo-${randomBytes(12).toString('hex')}@r.local`;
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
    const guest = await client.query<{ user_id: number }>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING user_id`,
      [GUEST_NAME, guestEmail, passwordHash]
    );
    const guestUserId = guest.rows[0].user_id;

    await client.query(
      `INSERT INTO user_source (user_id, source_id, feed_type)
       SELECT $1, source_id, feed_type
       FROM user_source
       WHERE user_id = $2`,
      [guestUserId, baselineUserId]
    );

    await client.query(
      `INSERT INTO folder (user_id, name)
       SELECT $1, name
       FROM folder
       WHERE user_id = $2`,
      [guestUserId, baselineUserId]
    );

    await client.query(
      `INSERT INTO user_source_folder (user_id, folder_id, source_id)
       SELECT $1, new_folder.folder_id, mapping.source_id
       FROM user_source_folder mapping
       INNER JOIN folder old_folder
         ON old_folder.folder_id = mapping.folder_id
        AND old_folder.user_id = $2
       INNER JOIN folder new_folder
         ON new_folder.user_id = $1
        AND new_folder.name = old_folder.name
       WHERE mapping.user_id = $2`,
      [guestUserId, baselineUserId]
    );

    const sessionToken = createDemoSessionToken();
    await createDemoSession(client, {
      session_id: sessionToken.sessionId,
      user_id: guestUserId,
      token_hash: sessionToken.tokenHash,
      expires_at: sessionToken.expiresAt,
    });

    await client.query('COMMIT');

    return {
      userId: guestUserId,
      token: sessionToken.token,
      expiresAt: sessionToken.expiresAt,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
