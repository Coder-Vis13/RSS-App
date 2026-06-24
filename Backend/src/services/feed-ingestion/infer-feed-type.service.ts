import { FeedType } from './resolve-feed-url.service';

import { FeedData, FeedEntry as FeedContent } from '@extractus/feed-extractor';

type ContentLike = FeedContent;

function isPodcastFeed(entry: ContentLike): boolean {
  const raw = entry as unknown as Record<string, unknown>;

  const media = raw.media as { url?: string; type?: string } | undefined;

  if (media?.type?.startsWith('audio/')) {
    return true;
  }

  const enclosure = raw.enclosure as { type?: string } | undefined;

  if (enclosure?.type?.startsWith('audio/')) {
    return true;
  }

  if (raw.itunes) {
    return true;
  }

  return false;
}

export function inferFeedType(parsed: FeedData, hint: FeedType): FeedType {
  if (hint === 'podcast') return 'podcast';

  const entries = parsed.entries ?? [];
  if (!entries.length) return hint;

  const podcastish = entries.filter(isPodcastFeed).length;
  return podcastish / entries.length >= 0.5 ? 'podcast' : hint;
}
