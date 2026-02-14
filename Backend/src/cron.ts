import { schedule } from 'node-cron';
import { query } from './config/db';
import { RSSParser, ParsedRSS, RSSItem } from './services/rss.service';
import { podcastParser } from './services/podcast.service';
import { addItem, addUserItemMetadata } from './models/items.model';
import { addSource } from './models/sources.model';
import pLimit from 'p-limit';

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

// Utility: timeout per feed
async function withTimeout<T>(promise: Promise<T>, ms: number, url: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms for ${url}`)), ms)
    ),
  ]);
}

export async function runFeedRefresh(): Promise<void> {
  const startTime = new Date();
  console.log(`🕓 CRON -> Starting feed refresh at ${startTime.toISOString()}`);

  try {
    const sourcesRes = await query<SourceRow>(`
      SELECT s.source_id, s.url, s.feed_type, 
             COALESCE(array_agg(DISTINCT us.user_id), array[]::int[]) AS rss_user_ids,
             COALESCE(array_agg(DISTINCT up.user_id), array[]::int[]) AS podcast_user_ids
      FROM source s
      LEFT JOIN user_source us ON us.source_id = s.source_id
      LEFT JOIN user_podcast up ON up.podcast_id = s.source_id
      GROUP BY s.source_id, s.url, s.feed_type
    `);

    const sources = sourcesRes.rows;
    const TIMEOUT_MS = 15000; // per-feed timeout
    const CONCURRENCY = 10; // process 10 feeds at a time
    const limit = pLimit(CONCURRENCY);

    await Promise.allSettled(
      sources.map((row) =>
        limit(async () => {
          const { source_id: sourceId, url, feed_type, rss_user_ids, podcast_user_ids } = row;
          const userIds = feed_type === 'podcast' ? podcast_user_ids : rss_user_ids;

          const feedStart = Date.now();

          try {
            if (feed_type === 'rss') {
              const { sourceName, sourceItems }: ParsedRSS = await withTimeout(
                RSSParser(url),
                TIMEOUT_MS,
                url
              );

              console.log(`CRON -> Processing RSS: ${sourceName} (${sourceItems.length} items)`);

              // Ensure source exists or update its name
              await addSource(sourceName, url);

              if (sourceItems.length === 0) return;

              // Bulk insert items
              const { insertedIds = [], insertCount = 0 } = await addItem(sourceId, sourceItems);
              if (insertCount > 0) console.log(`CRON -> Inserted ${insertCount} RSS items`);

              if (insertedIds.length > 0 && userIds?.length) {
                await Promise.allSettled(
                  userIds.map((uid) => addUserItemMetadata(uid, insertedIds))
                );
              }
            } else if (feed_type === 'podcast') {
              const { podcastTitle, episodeItems } = await withTimeout(
                podcastParser(url),
                TIMEOUT_MS,
                url
              );

              console.log(
                `CRON -> Processing Podcast: ${podcastTitle} (${episodeItems.length} episodes)`
              );

              const { insertedIds = [], insertCount = 0 } = await addItem(sourceId, episodeItems);
              if (insertCount > 0) console.log(`CRON -> Inserted ${insertCount} podcast episodes`);

              if (insertedIds.length > 0 && userIds?.length) {
                await Promise.allSettled(
                  userIds.map((uid) => addUserItemMetadata(uid, insertedIds))
                );
              }
            }

            console.log(`CRON -> Done ${feed_type} ${url} in ${(Date.now() - feedStart) / 1000}s`);
          } catch (err: unknown) {
            console.error(`CRON -> Error processing ${feed_type} ${url}:`, (err as Error).message);
          }
        })
      )
    );

    console.log(`CRON -> Finished feed refresh at ${new Date().toISOString()}`);
  } catch (err: unknown) {
    console.error('CRON -> Fatal error:', (err as Error).message);
  }
}

// Schedule every 7 minutes
// schedule('0 */7 * * *', runFeedRefresh);

// Run immediately at startup
// runFeedRefresh();
