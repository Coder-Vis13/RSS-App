import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  INITIAL_PODCAST_IMPORT_LIMIT,
  INITIAL_RSS_IMPORT_LIMIT,
} from '../../src/config/ingestion-limits';
import { createDuplicateChecker, normalizeFeedUrl } from '../../src/services/feed-ingestion/feed-url-dedupe.service';
import { normalizeItems } from '../../src/services/feed-ingestion/normalize-items.service';
import { classifySourceUrl } from '../../src/services/feed-ingestion/url-classifier.service';
import type { FeedEntry } from '@extractus/feed-extractor';

function entry(overrides: Record<string, unknown> = {}): FeedEntry {
  return {
    title: 'Example article',
    link: 'https://example.test/article',
    published: '2025-01-01T00:00:00.000Z',
    ...overrides,
  } as unknown as FeedEntry;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('classifySourceUrl', () => {
  it('classifies the supplied websites and direct feed URLs', () => {
    expect(classifySourceUrl('https://www.nasa.gov/')).toBe('website');
    expect(classifySourceUrl('https://www.nasa.gov/feed/')).toBe('direct-feed');
    expect(classifySourceUrl('https://www.nasa.gov/blogs/')).toBe('website');
    expect(classifySourceUrl('https://news.ycombinator.com/rss')).toBe('direct-feed');
    expect(classifySourceUrl('https://www.sciencedaily.com/rss/all.xml')).toBe('direct-feed');
    expect(classifySourceUrl('https://www.youtube.com/@NASA')).toBe('youtube');
    expect(
      classifySourceUrl(
        'https://www.youtube.com/feeds/videos.xml?channel_id=UCLA_DiR1FfKNvjuUpBHmylQ'
      )
    ).toBe('youtube');
    expect(classifySourceUrl('https://www.reddit.com/r/programming/.rss')).toBe('reddit');
    expect(classifySourceUrl('https://example.com/')).toBe('website');
  });

  it('classifies a podcast page and adds HTTPS when a protocol is omitted', () => {
    expect(classifySourceUrl('podcasts.apple.com/us/podcast/huberman-lab/id1545953110')).toBe(
      'podcast-page'
    );
    expect(classifySourceUrl('github.blog')).toBe('website');
  });

  it('rejects empty and malformed URLs', () => {
    expect(() => classifySourceUrl('  ')).toThrow('URL is required');
    expect(() => classifySourceUrl('http://')).toThrow();
  });
});

describe('normalizeItems', () => {
  it('drops entries without a link and applies title and description defaults', () => {
    const normalized = normalizeItems(
      [
        entry({ link: '', id: '' }),
        entry({ title: '  ', description: '  ' }),
      ],
      'rss'
    );

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({ title: 'Untitled', description: null });
  });

  it('parses valid dates and uses the current time for invalid or missing dates', () => {
    const now = new Date('2025-05-10T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const normalized = normalizeItems(
      [
        entry({ link: 'https://example.test/valid', published: '2024-06-01T10:30:00.000Z' }),
        entry({ link: 'https://example.test/invalid', published: 'not a date' }),
        entry({ link: 'https://example.test/missing', published: undefined }),
      ],
      'rss'
    );

    expect(normalized.find((item) => item.link.endsWith('/valid'))?.pubDate).toEqual(
      new Date('2024-06-01T10:30:00.000Z')
    );
    expect(normalized.filter((item) => !item.link.endsWith('/valid')).map((item) => item.pubDate)).toEqual([
      now,
      now,
    ]);
  });

  it('sorts newest first and applies the RSS and podcast import limits', () => {
    const makeEntries = (count: number) =>
      Array.from({ length: count }, (_, index) =>
        entry({
          link: `https://example.test/${index}`,
          published: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
        })
      );

    const rssItems = normalizeItems(makeEntries(INITIAL_RSS_IMPORT_LIMIT + 1), 'rss');
    const podcastItems = normalizeItems(makeEntries(INITIAL_PODCAST_IMPORT_LIMIT + 1), 'podcast');

    expect(rssItems).toHaveLength(INITIAL_RSS_IMPORT_LIMIT);
    expect(podcastItems).toHaveLength(INITIAL_PODCAST_IMPORT_LIMIT);
    expect(rssItems[0].link).toBe(`https://example.test/${INITIAL_RSS_IMPORT_LIMIT}`);
    expect(rssItems.at(-1)?.link).toBe('https://example.test/1');
  });
});

describe('feed URL deduplication', () => {
  it('normalizes host, fragment, and trailing path slashes', () => {
    expect(normalizeFeedUrl('https://www.Example.com/feed///?format=rss#latest')).toBe(
      'https://example.com/feed?format=rss'
    );
  });

  it('recognizes URLs with equivalent normalized forms as duplicates', () => {
    const checker = createDuplicateChecker();

    expect(checker.markAsSeen('https://www.example.com/feed/#top').isDuplicate).toBe(false);
    expect(checker.markAsSeen('https://example.com/feed').isDuplicate).toBe(true);
  });
});
