
import { describe, expect, it } from 'vitest';
import { classifySourceUrl } from '../../src/services/feed-ingestion/url-classifier.service';
import { parseFeed } from '../../src/services/feed-ingestion/parse-feed.service';
import { resolveFeedUrl } from '../../src/services/feed-ingestion/resolve-feed-url.service';
import { normalizeFeedUrl } from '../../src/services/feed-ingestion/feed-url-dedupe.service';

const LIVE_TEST_TIMEOUT = 45_000;

const parsedFeeds = new Map<string, Promise<number>>();

async function expectFeedContent(inputUrl: string): Promise<string> {
  const classification = classifySourceUrl(inputUrl);
  const resolved = await resolveFeedUrl(inputUrl, classification);

  expect(resolved?.feedUrl).toBeTruthy();

  const feedUrl = resolved!.feedUrl;
  const cacheKey = normalizeFeedUrl(feedUrl);

  let parsed = parsedFeeds.get(cacheKey);

  if (!parsed) {
    parsed = parseFeed(feedUrl).then((feed) => feed.entries?.length ?? 0);
    parsedFeeds.set(cacheKey, parsed);
  }

  try {
    expect(await parsed).toBeGreaterThan(0);
  } catch (error) {
    parsedFeeds.delete(cacheKey);

    throw new Error(
      `Could not parse feed for input ${inputUrl}; resolved URL: ${feedUrl}. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return feedUrl;
}

const websiteDiscoveryCases = [
  {
    name: 'NASA',
    url: 'https://www.nasa.gov/',
  },
  {
    name: 'GitHub Blog',
    url: 'https://github.blog/',
  },
  {
    name: 'React Blog',
    url: 'https://react.dev/',
  },
  {
    name: 'Mozilla Hacks',
    url: 'https://hacks.mozilla.org/',
  },
  {
    name: 'YourStory',
    url: 'https://yourstory.com/',
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/',
  },
];

const directFeedCases = [
  {
    name: 'NASA RSS',
    url: 'https://www.nasa.gov/feed/',
  },
  {
    name: 'GitHub Blog RSS',
    url: 'https://github.blog/feed/',
  },
  {
    name: 'GitHub Changelog RSS',
    url: 'https://github.blog/changelog/feed/',
  },
  {
    name: 'Hacker News RSS',
    url: 'https://news.ycombinator.com/rss',
  },
  {
    name: 'ScienceDaily RSS',
    url: 'https://www.sciencedaily.com/rss/all.xml',
  },
  {
    name: 'React RSS',
    url: 'https://react.dev/rss.xml',
  },
  {
    name: 'Rust Blog RSS',
    url: 'https://blog.rust-lang.org/feed.xml',
  },
  {
    name: 'Go Blog Atom feed',
    url: 'https://go.dev/blog/feed.atom',
  },
  {
    name: 'Node.js Blog RSS',
    url: 'https://nodejs.org/en/feed/blog.xml',
  },
  {
    name: 'TypeScript Blog RSS',
    url: 'https://devblogs.microsoft.com/typescript/feed/',
  },
  {
    name: 'AWS Blog RSS',
    url: 'https://aws.amazon.com/blogs/aws/feed/',
  },
  {
    name: 'Mozilla Hacks RSS',
    url: 'https://hacks.mozilla.org/feed/',
  },
  {
    name: 'Meta Engineering RSS',
    url: 'https://engineering.fb.com/feed/',
  },
  {
    name: 'Spotify Engineering RSS',
    url: 'https://engineering.atspotify.com/feed/',
  },
  {
    name: 'Stripe Blog RSS',
    url: 'https://stripe.com/blog/feed.rss',
  },
];

const equivalentUrlCases = [
  {
    name: 'GitHub Blog website and direct RSS URL',
    sourceUrl: 'https://github.blog/',
    directFeedUrl: 'https://github.blog/feed/',
  },
];

const youtubeCases = [
  {
    name: 'Fireship',
    channelUrl: 'https://www.youtube.com/@Fireship',
    channelId: 'UCsBjURrPoezykLs9EqgamOA',
  },
  {
    name: 'freeCodeCamp',
    channelUrl: 'https://www.youtube.com/@freecodecamp',
    channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
  },
  {
    name: 'NASA',
    channelUrl: 'https://www.youtube.com/@NASA',
    channelId: 'UCLA_DiR1FfKNvjuUpBHmylQ',
  },
];

describe('live feed ingestion smoke checks', () => {
  describe('website feed discovery', () => {
    it.each(websiteDiscoveryCases)(
      'discovers and parses a feed from $name',
      async ({ url }) => {
        await expectFeedContent(url);
      },
      LIVE_TEST_TIMEOUT
    );
  });

  describe('direct RSS and Atom feed parsing', () => {
    it.each(directFeedCases)(
      'parses the direct feed for $name',
      async ({ url }) => {
        await expectFeedContent(url);
      },
      LIVE_TEST_TIMEOUT
    );
  });

  describe('website URL and direct feed URL equivalence', () => {
    it.each(equivalentUrlCases)(
      'resolves $name to the same feed',
      async ({ sourceUrl, directFeedUrl }) => {
        const fromWebsite = await expectFeedContent(sourceUrl);
        const fromDirectFeed = await expectFeedContent(directFeedUrl);

        expect(normalizeFeedUrl(fromWebsite)).toBe(
          normalizeFeedUrl(fromDirectFeed)
        );
      },
      LIVE_TEST_TIMEOUT
    );
  });

  describe('YouTube channel resolution', () => {
    it.each(youtubeCases)(
      'resolves $name to the correct channel feed',
      async ({ channelUrl, channelId }) => {
        const fromChannel = await expectFeedContent(channelUrl);

        const expectedFeedUrl = new URL(
          'https://www.youtube.com/feeds/videos.xml'
        );
        expectedFeedUrl.searchParams.set('channel_id', channelId);

        const fromDirectFeed = await expectFeedContent(
          expectedFeedUrl.toString()
        );

        // Verify that the channel URL resolves to the intended YouTube channel.
        const resolvedChannelId = new URL(fromChannel).searchParams.get(
          'channel_id'
        );

        expect(resolvedChannelId).toBe(channelId);

        // Verify that both inputs resolve to the same feed.
        expect(normalizeFeedUrl(fromChannel)).toBe(
          normalizeFeedUrl(fromDirectFeed)
        );
      },
      LIVE_TEST_TIMEOUT
    );
  });

  describe('podcast feed ingestion', () => {
  it('classifies Syntax website and RSS URLs correctly', () => {
    expect(classifySourceUrl('https://syntax.fm/')).toBe('podcast-page');

    expect(classifySourceUrl('https://feed.syntax.fm/rss')).toBe(
      'direct-feed'
    );
  });

  it('discovers and parses a feed from the Syntax website', async () => {
    await expectFeedContent('https://syntax.fm/');
  }, LIVE_TEST_TIMEOUT);

  it('parses the direct Syntax podcast RSS feed', async () => {
    await expectFeedContent('https://feed.syntax.fm/rss');
  }, LIVE_TEST_TIMEOUT);

  it('resolves and parses The Daily Brief from Apple Podcasts', async () => {
    const feedUrl = await expectFeedContent(
      'https://podcasts.apple.com/in/podcast/the-daily-brief/id1754694834'
    );

    expect(feedUrl).toMatch(/^https?:\/\//);
  }, LIVE_TEST_TIMEOUT);
});

  describe('unsupported sources', () => {
    it('reports a website with no supported feed', async () => {
      const url = 'https://example.com/';

      await expect(
        resolveFeedUrl(url, classifySourceUrl(url))
      ).rejects.toThrow(/No feed found/);
    }, LIVE_TEST_TIMEOUT);
  });
});
