import { processSource } from './services/source.service';

async function run(userId: number, url: string) {
  const start = Date.now();

  console.log('\n====================');
  console.log('INPUT:', url);

  try {
    const result = await processSource(userId, url);

    console.log('RESULT:');
    console.dir(result, { depth: null });
  } catch (error) {
    console.error('FAILED:', error instanceof Error ? error.message : error);
  }

  console.log(`TIME: ${Date.now() - start}ms`);
}

(async () => {
  const totalStart = Date.now();

  const userId = 1; // use a real user id from your DB

  await run(userId, 'https://www.indiatoday.in');

  console.log('\n====================');
  console.log(`TOTAL TIME: ${Date.now() - totalStart}ms`);
})();
