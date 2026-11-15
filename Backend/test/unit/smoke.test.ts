import { describe, expect, it } from 'vitest';

describe('backend unit smoke', () => {
  it('runs vitest in node', () => {
    expect(1 + 1).toBe(2);
  });
});
