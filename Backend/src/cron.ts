import { schedule } from 'node-cron';
import { query } from './config/db';
import { RSSParser, ParsedRSS, RSSItem } from './services/rssService';
import { podcastParser } from './services/podcastService';
import { QueryResult } from './utils/helpers';
import { addSource, addItem, addUserItemMetadata } from './models/model';

export interface SourceRow {
  source_id: number;
  url: string;
  feed_type: 'rss' | 'podcast';
  rss_user_ids: number[] | null;
  podcast_user_ids: number[] | null;
}

export interface AddItemResult {
  insertedIds: number[];
  insertCount: number;
}

export interface AppError extends Error {
  stack?: string;
  message: string;
}

// Utility: timeout for slow sources
async function withTimeout<T>(promise: Promise<T>, ms: number, url: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms for ${url}`)), ms)
    ),
  ]);
}

// --- Main feed refresh function ---
export async function runFeedRefresh(): Promise<void> {
  const startTime = new Date();
  console.log(`🕓 CRON -> Starting feed refresh at ${startTime.toISOString()}`);

  try {
    // Fetch all sources (RSS + Podcasts)
    const sourcesRes: QueryResult<SourceRow> = await query(
      `SELECT s.source_id, s.url, s.feed_type, 
              COALESCE(array_agg(DISTINCT us.user_id), array[]::int[]) AS rss_user_ids,
              COALESCE(array_agg(DISTINCT up.user_id), array[]::int[]) AS podcast_user_ids
       FROM source s
       LEFT JOIN user_source us ON us.source_id = s.source_id
       LEFT JOIN user_podcast up ON up.podcast_id = s.source_id
       GROUP BY s.source_id, s.url, s.feed_type`
    );

    const sources = sourcesRes.rows;
    const BATCH_SIZE = 5; // process 5 feeds in parallel
    const TIMEOUT_MS = 15000; // 15s timeout per feed

    for (let i = 0; i < sources.length; i += BATCH_SIZE) {
      const batch = sources.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (row) => {
          const { source_id: sourceId, url, feed_type, rss_user_ids, podcast_user_ids } = row;
          const userIds = feed_type === 'podcast' ? podcast_user_ids : rss_user_ids;

          const feedStart = Date.now();
          try {
            if (feed_type === 'rss') {
              // --- RSS HANDLER ---
              const { sourceName, sourceItems }: ParsedRSS = await withTimeout(
                RSSParser(url),
                TIMEOUT_MS,
                url
              );
              console.log(`CRON -> Processing RSS: ${sourceName}`);

              // ensure source exists/updates its name
              await addSource(sourceName, url);

              const twoDaysAgo = new Date();
              twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

              const recentItems: RSSItem[] = (sourceItems || []).filter(
                (i) => i.pubDate && new Date(i.pubDate) >= twoDaysAgo
              );

              if (recentItems.length === 0) {
                console.log(`CRON -> No new RSS items for ${sourceName}`);
                return;
              }

              const { insertedIds = [], insertCount = 0 }: AddItemResult = await addItem(
                sourceId,
                recentItems
              );
              if (insertCount > 0)
                console.log(`CRON -> Inserted ${insertCount} RSS items for source ${sourceId}`);

              if (insertedIds.length > 0 && userIds?.length) {
                await Promise.allSettled(
                  userIds.map((userId) => addUserItemMetadata(userId, insertedIds))
                );
              }
            } else if (feed_type === 'podcast') {
              // --- PODCAST HANDLER ---
              const { podcastTitle, episodeItems } = await withTimeout(
                podcastParser(url),
                TIMEOUT_MS,
                url
              );
              console.log(`CRON -> Processing Podcast: ${podcastTitle}`);

              const { insertedIds = [], insertCount = 0 }: AddItemResult = await addItem(
                sourceId,
                episodeItems
              );
              if (insertCount > 0)
                console.log(`CRON -> Inserted ${insertCount} podcast episodes for ${podcastTitle}`);

              if (insertedIds.length > 0 && userIds?.length) {
                await Promise.allSettled(
                  userIds.map((userId) => addUserItemMetadata(userId, insertedIds))
                );
              }
            }

            console.log(`CRON -> Done ${feed_type} ${url} in ${(Date.now() - feedStart) / 1000}s`);
          } catch (err: unknown) {
            const error = err as AppError;
            console.error(`CRON -> Error processing ${feed_type} ${url}:`, error.message);
          }
        })
      );
    }

    const endTime = new Date();
    console.log(`CRON -> Finished feed refresh at ${endTime.toISOString()}`);
  } catch (error: unknown) {
    const err = error as AppError;
    console.error('CRON -> Fatal error:', err.message);
  }
}


// --- Schedule job ---
// Every 7 minutes
schedule('0 */2 * * *', runFeedRefresh);




// Also run immediately at startup for testing
// runFeedRefresh();

