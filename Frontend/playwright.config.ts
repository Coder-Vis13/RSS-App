import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  globalSetup: './test/e2e/global-setup.ts',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../Backend',
      url: 'http://127.0.0.1:3000/',
      name: 'Backend test server',
      env: {
        NODE_ENV: 'test',
        PORT: '3000',
        DEMO_BASELINE_EMAIL: 'readarchive-playwright-baseline@readarchive.local',
      },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
      url: 'http://127.0.0.1:5173',
      name: 'Frontend test server',
      env: { VITE_API_URL: 'http://127.0.0.1:3000' },
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
