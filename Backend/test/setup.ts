import 'dotenv/config';
import { vi } from 'vitest';
import { assertTestDatabaseUrl } from './helpers/test-db';

// Integration setup validates env before any DB work runs.
assertTestDatabaseUrl();
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET ||= 'readarchive-test-access-secret';
process.env.REFRESH_TOKEN_SECRET ||= 'readarchive-test-refresh-secret';
process.env.DEMO_BASELINE_EMAIL = 'demo-baseline@readarchive.local';

vi.mock('../src/utils/categorizer', () => ({
  enqueueCategorization: vi.fn().mockResolvedValue(undefined),
  categorizeItem: vi.fn().mockResolvedValue(undefined),
}));
