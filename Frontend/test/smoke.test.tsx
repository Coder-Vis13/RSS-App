import { describe, expect, it } from 'vitest';

describe('frontend smoke', () => {
  it('runs vitest with jsdom', () => {
    expect(typeof window).toBe('object');
    expect(document.createElement('div')).toBeInstanceOf(HTMLElement);
  });
});
