import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pool from '../../src/config/db';
import { createApp } from '../../src/app';
import { signAccessToken } from '../../src/utils/jwt';
import { createFolder, createUser } from '../helpers/fixtures';
import {
  closeTestPool,
  ensureTestSchema,
  testQuery,
  truncateTestTables,
} from '../helpers/test-db';

const app = createApp();

function refreshCookie(response: request.Response): string {
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  const cookie = cookies?.find((value) => value.startsWith('refresh='));
  expect(cookie).toBeDefined();
  return cookie!.split(';')[0];
}

describe('authentication and user ownership', () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await truncateTestTables();
  });

  afterAll(async () => {
    await closeTestPool();
    await pool.end();
  });

  it('rejects missing and invalid bearer tokens on user routes', async () => {
    const missingToken = await request(app).get('/users/1/folders');
    const invalidToken = await request(app)
      .get('/users/1/folders')
      .set('Authorization', 'Bearer not-a-valid-token');

    expect(missingToken.status).toBe(401);
    expect(invalidToken.status).toBe(403);
  });

  it('uses the token user instead of the user ID supplied in the URL', async () => {
    const requesterId = await createUser('requester@example.test');
    const otherUserId = await createUser('other@example.test');
    await createFolder(requesterId, 'Requester folder');
    await createFolder(otherUserId, 'Other folder');

    const response = await request(app)
      .get(`/users/${otherUserId}/folders`)
      .set('Authorization', `Bearer ${signAccessToken(requesterId)}`);

    expect(response.status).toBe(200);
    expect(response.body.map((folder: { name: string }) => folder.name)).toEqual([
      'Requester folder',
    ]);
  });

  it('registers, logs in, refreshes, and logs out a session', async () => {
    const email = 'auth-flow@example.test';
    const password = 'correct-horse-battery';

    const registration = await request(app).post('/register').send({
      name: 'Auth Test',
      email,
      password,
    });
    expect(registration.status).toBe(201);
    expect(registration.body.accessToken).toEqual(expect.any(String));

    const login = await request(app).post('/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toEqual(expect.any(String));
    const firstCookie = refreshCookie(login);

    const refresh = await request(app).post('/refresh').set('Cookie', firstCookie);
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toEqual(expect.any(String));
    const rotatedCookie = refreshCookie(refresh);

    const logout = await request(app).post('/logout').set('Cookie', rotatedCookie);
    const loggedOutRefresh = await request(app).post('/refresh').set('Cookie', rotatedCookie);
    const storedToken = await testQuery<{ refresh_token: string | null }>(
      'SELECT refresh_token FROM users WHERE email = $1',
      [email]
    );

    expect(logout.status).toBe(204);
    expect(loggedOutRefresh.status).toBe(403);
    expect(storedToken.rows[0].refresh_token).toBeNull();
  });
});
