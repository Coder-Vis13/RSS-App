import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type { FullConfig } from '@playwright/test';

const backendDirectory = resolve(process.cwd(), '../Backend');
const fixtureScript = resolve(backendDirectory, 'node_modules/.bin/ts-node');

function runFixtureAction(action: 'setup' | 'cleanup'): void {
  execFileSync(fixtureScript, ['test/e2e/demo-fixtures.ts', action], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DEMO_BASELINE_EMAIL: 'readarchive-playwright-baseline@readarchive.local',
    },
    stdio: 'inherit',
  });
}

export default async function globalSetup(_config: FullConfig) {
  try {
    runFixtureAction('setup');
  } catch (error) {
    try {
      runFixtureAction('cleanup');
    } catch {
      // Keep the setup error visible; cleanup is best-effort after partial setup.
    }
    throw error;
  }
  return async () => runFixtureAction('cleanup');
}
