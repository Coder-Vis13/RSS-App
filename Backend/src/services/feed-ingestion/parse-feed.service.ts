// parse rss feed

import { extract, FeedData } from '@extractus/feed-extractor';

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = 'RSS-App/1.0';

export type ParsedFeed = FeedData;

export class FeedParseError extends Error {
  constructor(
    message: string,
    public readonly feedUrl: string
  ) {
    super(message);
    this.name = 'FeedParseError';
  }
}

export async function parseFeed(feedUrl: string): Promise<ParsedFeed> {
  const trimmed = feedUrl.trim();
  if (!trimmed) {
    throw new FeedParseError('Feed URL is required', feedUrl);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const feed = await extract(
      trimmed,
      {
        normalization: true,
        useISODateFormat: true,
        descriptionMaxLen: 320,
      },
      {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      }
    );

    if (!feed?.title && !feed?.entries?.length) {
      throw new FeedParseError('Feed returned no title or entries', trimmed);
    }

    return feed;
  } catch (err) {
    if (err instanceof FeedParseError) {
      throw err;
    }

    if (err instanceof Error && err.name === 'AbortError') {
      throw new FeedParseError(`Feed fetch timed out after ${FETCH_TIMEOUT_MS}ms`, trimmed);
    }

    const message = err instanceof Error ? err.message : 'Unknown feed parse error';
    throw new FeedParseError(message, trimmed);
  } finally {
    clearTimeout(timeout);
  }
}
