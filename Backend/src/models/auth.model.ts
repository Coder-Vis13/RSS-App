import { query } from '../config/db';
import { AuthUser, UserRefreshToken, UserId } from './types';

export async function createUser(email: string, passwordHash: string): Promise<UserId> {
  const result = await query(
    `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING user_id
    `,
    [email, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const result = await query('SELECT user_id, password_hash FROM users WHERE email = $1', [email]);
  return result.rows[0] ?? null;
}

export async function saveRefreshToken(userId: number, token: string) {
  await query('UPDATE users SET refresh_token = $1 WHERE user_id = $2', [token, userId]);
}

export async function clearRefreshToken(token: string) {
  await query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [token]);
}

export async function findUserByRefreshToken(token: string): Promise<UserRefreshToken | null> {
  const result = await query('SELECT user_id FROM users WHERE refresh_token = $1', [token]);
  return result.rows[0] ?? null;
}
