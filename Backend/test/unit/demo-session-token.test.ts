import { describe, expect, it } from 'vitest';
import {
  createDemoSessionToken,
  DEMO_SESSION_TTL_MS,
  hashDemoSessionToken,
} from '../../src/services/demo-session.service';

describe('demo session token helpers', () => {
  it('returns the same SHA-256 hash for the same token', () => {
    const token = 'sample-demo-session-token';

    expect(hashDemoSessionToken(token)).toBe(hashDemoSessionToken(token));
  });

  it('returns a 64-character hexadecimal hash that differs from the raw token', () => {
    const token = 'sample-demo-session-token';
    const hash = hashDemoSessionToken(token);

    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('sets expiration to the session lifetime after the supplied time', () => {
    const now = new Date('2025-01-01T00:00:00.000Z');
    const session = createDemoSessionToken(now);

    expect(session.expiresAt).toEqual(new Date(now.getTime() + DEMO_SESSION_TTL_MS));
    expect(session.token).not.toBe(session.tokenHash);
    expect(session.token).toMatch(/^[a-f0-9]{64}$/);
  });
});
