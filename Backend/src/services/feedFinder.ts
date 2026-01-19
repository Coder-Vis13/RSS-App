// services/feedService.ts
import fetch from 'node-fetch';
import { RSSParser } from './rssService';

export interface FeedResult {
  feedUrl: string;
  sourceName: string;
  sourceItems: any[];
}

/**
 * Discover the feed URL using FeedFinder API and return the first working feed.
 */
export const getWorkingFeed = async (siteUrl: string): Promise<FeedResult> => {
  // Step 1: call FeedFinder API
  const resp = await fetch('http://localhost:5000/feed/find', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: siteUrl }),
  });

  const data = (await resp.json()) as { feeds?: string[] };
  const candidates = data.feeds?.slice(0, 2) || [];

  // Step 2: test candidate feeds with RSSParser
  for (const feedUrl of candidates) {
    try {
      const { sourceName, sourceItems } = await RSSParser(feedUrl);
      if (sourceItems.length > 0) {
        return { feedUrl, sourceName, sourceItems };
      }
    } catch (err) {
      console.warn(`Feed failed for ${feedUrl}: ${(err as Error).message}`);
      continue;
    }
  }

  throw new Error('No working feed found');
};
