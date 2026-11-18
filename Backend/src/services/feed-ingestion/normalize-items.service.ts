import { getInitialImportLimit, takeLatestByPubDate } from '../../config/ingestion-limits';
import { FeedEntry as FeedContent } from '@extractus/feed-extractor';
import { FeedType } from './resolve-feed-url.service';

export interface NormalizedItem {
  link: string;
  title: string;
  description: string | null;
  pubDate: Date;
}

type RawFeedContent = FeedContent;

function resolveLink(entry: RawFeedContent): string | null {
  const link = typeof entry.link === 'string' ? entry.link.trim() : '';
  const id = typeof entry.id === 'string' ? entry.id.trim() : '';
  return link || id || null;
}

function resolveTitle(entry: RawFeedContent): string {
  const title = typeof entry.title === 'string' ? entry.title.trim() : '';
  return title || 'Untitled';
}

function resolveDescription(entry: RawFeedContent): string | null {
  const description = typeof entry.description === 'string' ? entry.description.trim() : '';
  return description || null;
}

function resolvePubDate(entry: RawFeedContent): Date {
  const { published } = entry;

  const publishedValue = published as unknown;

  if (publishedValue instanceof Date && !Number.isNaN(publishedValue.getTime())) {
    return publishedValue;
  }

  if (typeof published === 'string' || typeof published === 'number') {
    const parsed = new Date(published);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function normalizeContent(entry: RawFeedContent): NormalizedItem | null {
  const link = resolveLink(entry);
  if (!link) {
    return null;
  }

  return {
    link,
    title: resolveTitle(entry),
    description: resolveDescription(entry),
    pubDate: resolvePubDate(entry),
  };
}

export function normalizeItems(entries: RawFeedContent[], feedType: FeedType): NormalizedItem[] {
  const normalized = entries
    .map(normalizeContent)
    .filter((item): item is NormalizedItem => item !== null);

  return takeLatestByPubDate(normalized, getInitialImportLimit(feedType));
}
