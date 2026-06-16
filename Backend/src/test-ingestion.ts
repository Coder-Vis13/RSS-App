import { classifySourceUrl } from './services/feed-ingestion/url-classifier.service';
import { resolveFeedUrl } from './services/feed-ingestion/resolve-feed-url.service';

async function run(url: string) {
  console.log('\n====================');
  console.log('INPUT:', url);

  const start = Date.now();

  try {
    const classification = classifySourceUrl(url);
    console.log('CLASSIFICATION:', classification);

    const resolved = await resolveFeedUrl(url, classification);

    const duration = Date.now() - start;

    console.log('RESOLVED:', resolved);
    console.log(`TIME: ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - start;

    console.error('FAILED:', error instanceof Error ? error.message : error);

    console.log(`TIME: ${duration}ms`);
  }
}

(async () => {
  await run('https://www.indiatoday.in');
  await run('https://www.youtube.com/playlist?list=PLkahZjV5wKe8w9GC_n2yyhx6Wj-NKzzeE');
  await run('https://www.vogue.com/');
  await run('https://www.nytimes.com/');
  await run('https://www.theguardian.com/international');
  await run('https://www.bbc.com/');
  await run('https://www.forbesindia.com/');
  await run('https://www.lennysnewsletter.com');
  await run('https://uxdesign.cc');
  await run('https://stratechery.com');
  await run('https://economictimes.indiatimes.com/');
})();
