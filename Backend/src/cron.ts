import { schedule } from 'node-cron';
import { FeedEntry } from '@extractus/feed-extractor';
import { query } from './config/db';
import { parseFeed, FeedParseError } from './services/feed-ingestion/parse-feed.service';
import { addItem, addUserItemMetadata } from './models/items.model';
import pLimit from 'p-limit';
import { enqueueCategorization } from './utils/categorizer';

export interface SourceRow {
  source_id: number;
  url: string;
  feed_type: 'rss' | 'podcast';
  user_ids: number[];
}

const REFRESH_SCAN_LIMIT = 50;
const TIMEOUT_MS = 12_000;
const CONCURRENCY = 8;

interface RefreshItem {
  link: string;
  title: string;
  description: string | null;
  pubDate: Date;
  tags?: string[];
}

async function withTimeout<T>(promise: Promise<T>, ms: number, url: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms for ${url}`)), ms)
    ),
  ]);
}

function resolveLink(entry: FeedEntry): string | null {
  const link = typeof entry.link === 'string' ? entry.link.trim() : '';
  const id = typeof entry.id === 'string' ? entry.id.trim() : '';
  return link || id || null;
}

function resolvePubDate(entry: FeedEntry): Date {
  const published = entry.published as unknown;

  if (published instanceof Date && !Number.isNaN(published.getTime())) {
    return published;
  }

  if (typeof entry.published === 'string' || typeof entry.published === 'number') {
    const parsed = new Date(entry.published);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

/**
 * Refresh-specific normalizer — NO initial-import cap.
 * normalizeItems() applies INITIAL_RSS/PODCAST_IMPORT_LIMIT and must NOT be used here.
 */
function normalizeEntriesForRefresh(entries: FeedEntry[], scanLimit: number): RefreshItem[] {
  const items: RefreshItem[] = [];

  for (const entry of entries) {
    const link = resolveLink(entry);
    if (!link) continue;

    items.push({
      link,
      title:
        typeof entry.title === 'string' && entry.title.trim() ? entry.title.trim() : 'Untitled',
      description:
        typeof entry.description === 'string' && entry.description.trim()
          ? entry.description.trim()
          : null,
      pubDate: resolvePubDate(entry),
    });
  }

  return items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()).slice(0, scanLimit);
}

async function refreshSource(row: SourceRow): Promise<void> {
  const { source_id: sourceId, url, feed_type, user_ids: userIds } = row;
  const feedStart = Date.now();

  try {
    const parsed = await withTimeout(parseFeed(url), TIMEOUT_MS, url);
    const entries = parsed.entries ?? [];

    if (!entries.length) {
      console.log(`CRON -> Empty feed: ${url}`);
      return;
    }

    const items = normalizeEntriesForRefresh(entries, REFRESH_SCAN_LIMIT);

    const { insertedIds = [], insertCount = 0 } = await addItem(sourceId, items);

    if (insertCount > 0) {
      const label = feed_type === 'podcast' ? 'episodes' : 'items';
      console.log(`CRON -> +${insertCount} ${label} | ${parsed.title ?? url}`);

      if (userIds.length) {
        await Promise.allSettled(userIds.map((uid) => addUserItemMetadata(uid, insertedIds)));
        enqueueCategorization(insertedIds);
      }
    }

    console.log(
      `CRON -> OK ${feed_type} ${url} (${((Date.now() - feedStart) / 1000).toFixed(1)}s, ` +
        `scanned ${items.length}, new ${insertCount})`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const prefix = err instanceof FeedParseError ? 'parse' : 'fetch';
    console.error(`CRON -> ${prefix} error [${feed_type}] ${url}: ${message}`);
  }
}

export async function runFeedRefresh(): Promise<void> {
  const startTime = new Date();
  console.log(`CRON -> Starting feed refresh at ${startTime.toISOString()}`);

  try {
    const sourcesRes = await query<SourceRow>(`
      SELECT
        s.source_id,
        s.url,
        s.feed_type,
        COALESCE(
          array_agg(us.user_id) FILTER (WHERE us.user_id IS NOT NULL),
          '{}'
        ) AS user_ids
      FROM source s
      INNER JOIN user_source us ON us.source_id = s.source_id
      GROUP BY s.source_id, s.url, s.feed_type
    `);

    const sources = sourcesRes.rows;
    const limit = pLimit(CONCURRENCY);

    console.log(`CRON -> Refreshing ${sources.length} subscribed source(s)`);

    await Promise.allSettled(sources.map((row) => limit(() => refreshSource(row))));

    console.log(`CRON -> Finished at ${new Date().toISOString()}`);
  } catch (err: unknown) {
    console.error('CRON -> Fatal error:', err instanceof Error ? err.message : err);
  }
}

// default: every 30 minutes
schedule('*/15 * * * *', runFeedRefresh);
