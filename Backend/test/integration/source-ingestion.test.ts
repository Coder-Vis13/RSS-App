import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedData, FeedEntry } from '@extractus/feed-extractor';
import pool from '../../src/config/db';
import { addItem } from '../../src/models/items.model';
import { enqueueCategorization } from '../../src/utils/categorizer';
import { parseFeed } from '../../src/services/feed-ingestion/parse-feed.service';
import type { ResolvedFeedUrl } from '../../src/services/feed-ingestion/resolve-feed-url.service';
import { resolveFeedUrl } from '../../src/services/feed-ingestion/resolve-feed-url.service';
import { processSource } from '../../src/services/source.service';
import { createSource, createUser, subscribeUser } from '../helpers/fixtures';
import { closeTestPool, ensureTestSchema, testQuery, truncateTestTables } from '../helpers/test-db';

let fetchMock: ReturnType<typeof vi.fn>;

vi.mock('../../src/services/feed-ingestion/resolve-feed-url.service', () => ({
  resolveFeedUrl: vi.fn(),
}));

vi.mock('../../src/services/feed-ingestion/parse-feed.service', () => ({
  parseFeed: vi.fn(),
}));

function feedEntry(index: number, overrides: Record<string, unknown> = {}): FeedEntry {
  return {
    title: `Feed article ${index}`,
    link: `https://articles.example.test/${index}`,
    description: `Description ${index}`,
    published: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
    ...overrides,
  } as unknown as FeedEntry;
}

function mockResolvedFeed(feedUrl: string, requestUrl?: string): void {
  vi.mocked(resolveFeedUrl).mockResolvedValue({
    feedUrl,
    ...(requestUrl ? { requestUrl } : {}),
    feedType: 'rss',
  } satisfies ResolvedFeedUrl);
}

function mockParsedFeed(entries: FeedEntry[]): void {
  vi.mocked(parseFeed).mockResolvedValue({
    title: 'Test feed',
    entries,
  } as FeedData);
}

describe('source ingestion', () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await truncateTestTables();
    vi.mocked(resolveFeedUrl).mockReset();
    vi.mocked(parseFeed).mockReset();
    fetchMock = vi.fn(async () => {
      throw new Error('Unexpected network request in source-ingestion test');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    const fetchCallCount = fetchMock.mock.calls.length;
    vi.unstubAllGlobals();
    expect(fetchCallCount).toBe(0);
  });

  afterAll(async () => {
    await closeTestPool();
    await pool.end();
  });

  it('stores normalized feed entries and creates user metadata', async () => {
    const userId = await createUser('ingestion-user@example.test');
    const feedUrl = 'https://feeds.example.test/first.xml';
    const entries = [
      ...Array.from({ length: 31 }, (_, index) => feedEntry(index)),
      feedEntry(99, { link: '', id: '' }),
    ];
    mockResolvedFeed(feedUrl);
    mockParsedFeed(entries);

    const result = await processSource(userId, 'https://publisher.example.test/');

    expect(vi.mocked(resolveFeedUrl)).toHaveBeenCalledWith(
      'https://publisher.example.test/',
      'website'
    );
    expect(vi.mocked(parseFeed)).toHaveBeenCalledWith(feedUrl);
    expect(result.itemsAdded).toBe(30);

    const storedItems = await testQuery<{ link: string }>(
      'SELECT link FROM item ORDER BY pub_date DESC'
    );
    expect(storedItems.rows).toHaveLength(30);
    expect(storedItems.rows.map((item) => item.link)).not.toContain(
      'https://articles.example.test/99'
    );
    expect(storedItems.rows.map((item) => item.link)).not.toContain(
      'https://articles.example.test/0'
    );

    const subscription = await testQuery(
      'SELECT 1 FROM user_source WHERE user_id = $1 AND source_id = $2',
      [userId, result.source_id]
    );
    const metadata = await testQuery(
      'SELECT 1 FROM user_item_metadata WHERE user_id = $1',
      [userId]
    );
    expect(subscription.rowCount).toBe(1);
    expect(metadata.rowCount).toBe(30);
    expect(vi.mocked(enqueueCategorization)).toHaveBeenCalled();
  });

  it('fetches YouTube through the local request URL and stores its canonical URL', async () => {
    const userId = await createUser('youtube-ingestion@example.test');
    const canonicalUrl = 'https://youtube.com/feeds/videos.xml?channel_id=UC123';
    const requestUrl = 'http://localhost:8080/feeds/videos.xml?channel_id=UC123';
    mockResolvedFeed(canonicalUrl, requestUrl);
    mockParsedFeed([feedEntry(1)]);

    const result = await processSource(userId, 'https://www.youtube.com/channel/UC123');

    expect(vi.mocked(parseFeed)).toHaveBeenCalledWith(requestUrl);
    const storedSource = await testQuery<{ url: string }>(
      'SELECT url FROM source WHERE source_id = $1',
      [result.source_id]
    );
    expect(storedSource.rows[0]?.url).toBe(canonicalUrl);
  });

  it('rejects a second subscription to the same canonical feed for one user', async () => {
    const userId = await createUser('duplicate-subscription@example.test');
    const feedUrl = 'https://feeds.example.test/duplicate.xml';
    const sourceId = await createSource('Existing feed', feedUrl);
    await subscribeUser(userId, sourceId);
    mockResolvedFeed(feedUrl);

    await expect(processSource(userId, 'https://publisher.example.test/duplicate')).rejects.toMatchObject({
      name: 'SourceAlreadyAddedError',
    });

    const subscriptions = await testQuery(
      'SELECT 1 FROM user_source WHERE user_id = $1 AND source_id = $2',
      [userId, sourceId]
    );
    expect(subscriptions.rowCount).toBe(1);
    expect(vi.mocked(parseFeed)).not.toHaveBeenCalled();
  });

  it('does not insert duplicate articles when addItem receives the same link twice', async () => {
    const sourceId = await createSource(
      'Duplicate item feed',
      'https://feeds.example.test/items.xml'
    );
    const item = {
      link: 'https://articles.example.test/duplicate',
      title: 'Duplicate article',
      description: 'Same article inserted twice',
      pubDate: new Date('2025-01-01T00:00:00.000Z'),
    };

    const firstInsert = await addItem(sourceId, [item]);
    const secondInsert = await addItem(sourceId, [item]);

    expect(firstInsert.insertCount).toBe(1);
    expect(secondInsert.insertCount).toBe(0);
    const stored = await testQuery(
      'SELECT 1 FROM item WHERE source_id = $1 AND link = $2',
      [sourceId, item.link]
    );
    expect(stored.rowCount).toBe(1);
  });
});
