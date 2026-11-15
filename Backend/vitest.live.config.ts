import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/live/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 45_000,
    globals: false,
  },
});
