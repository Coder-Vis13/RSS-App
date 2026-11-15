import 'dotenv/config';
import { createApp } from './app';
import { startDemoCleanupSchedule, startFeedRefreshSchedule } from './cron';

const PORT = process.env.PORT || 3000;
const isTestMode = process.env.NODE_ENV === 'test';

if (isTestMode) {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;

  if (!testDatabaseUrl || testDatabaseUrl.trim() === '') {
    throw new Error('TEST_DATABASE_URL is required when starting the backend in test mode.');
  }

  if (process.env.DATABASE_URL && testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must be different from DATABASE_URL.');
  }
}

const app = createApp();

app.listen(PORT, () => console.log('Server running on port ' + PORT));

if (!isTestMode) {
  startFeedRefreshSchedule();
  startDemoCleanupSchedule();
}
