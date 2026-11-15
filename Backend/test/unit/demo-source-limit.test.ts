import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { consumeDemoSourceAddition } from '../../src/middleware/demo-session';

describe('demo source addition limit', () => {
  it('allows five additions for a session and rejects the next one', () => {
    const sessionToken = randomUUID();
    const request = {
      demoMode: true,
      cookies: { demo_session: sessionToken },
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(consumeDemoSourceAddition(request)).toBe(true);
    }

    expect(consumeDemoSourceAddition(request)).toBe(false);
  });

  it('does not apply the demo limit to a normal authenticated request', () => {
    expect(consumeDemoSourceAddition({ demoMode: false, cookies: {} })).toBe(true);
  });
});
