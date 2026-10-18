import { addSource, addUserSource } from '../models';
import { addItem, addUserItemMetadata, getLatestItemIds } from '../models/items.model';
import { query } from '../config/db';
import { getFirstRow } from '../utils/helpers';
import { FeedResolutionError } from '../utils/types';
import { classifySourceUrl } from './feed-ingestion/url-classifier.service';
import { resolveFeedUrl } from './feed-ingestion/resolve-feed-url.service';
import { parseFeed } from './feed-ingestion/parse-feed.service';
import { normalizeItems } from './feed-ingestion/normalize-items.service';
import {
  createDuplicateChecker,
  preventDoubleFetch,
} from './feed-ingestion/feed-url-dedupe.service';
import { inferFeedType } from './feed-ingestion/infer-feed-type.service';
import { getInitialImportLimit } from '../config/ingestion-limits';
import { enqueueCategorization } from '../utils/categorizer';

interface ProcessSourceOptions {
  enqueueCategorization?: boolean;
  demoMode?: boolean;
}

const DEMO_CONTENT_WINDOW_MS = 48 * 60 * 60 * 1000;

export const processSource = async (
  userId: number,
  sourceURL: string,
  options: ProcessSourceOptions = {}
) => {
  const feedDedupe = createDuplicateChecker();
  const recentDemoCutoff = options.demoMode
    ? new Date(Date.now() - DEMO_CONTENT_WINDOW_MS)
    : undefined;

  console.log(`[ingestion] start user=${userId} url=${sourceURL}`);
  const classification = classifySourceUrl(sourceURL);

  const resolved = await resolveFeedUrl(sourceURL, classification);

  if (!resolved) {
    throw new FeedResolutionError(`Podcast feed resolution is not yet supported for ${sourceURL}`);
  }

  const { feedUrl, feedType } = resolved;
  const { safeUrl: canonicalFeedUrl, isDuplicate } = feedDedupe.markAsSeen(feedUrl);

  return preventDoubleFetch(canonicalFeedUrl, async () => {
    if (isDuplicate) {
      console.log(`[ingestion] dedupe duplicate_feed_url`);
    }

    console.log(`[ingestion] resolved: ${canonicalFeedUrl} (${feedType})`);

    // In processSource, after resolving canonicalFeedUrl:
    const alreadyFollowing = await query(
      `SELECT 1 FROM user_source us
   JOIN source s ON s.source_id = us.source_id
   WHERE us.user_id = $1 AND s.url = $2 LIMIT 1`,
      [userId, canonicalFeedUrl]
    );
    if (alreadyFollowing.rows.length) {
      const err = new Error('Already added');
      err.name = 'SourceAlreadyAddedError';
      throw err;
    }

    const existingSource = getFirstRow<{ source_id: number; source_name: string }>(
      await query(`SELECT source_id, source_name FROM source WHERE url = $1`, [canonicalFeedUrl])
    );

    if (existingSource) {
      // Parse once so direct podcast RSS URLs get correct feed_type even on re-subscribe.
      const parsed = await parseFeed(canonicalFeedUrl);
      const feedTypeResolved = inferFeedType(parsed, feedType);

      await addUserSource(userId, existingSource.source_id, feedTypeResolved);

      if (options.demoMode) {
        const normalizedItems = normalizeItems(parsed.entries ?? [], feedTypeResolved);
        const recentItems = recentDemoCutoff
          ? normalizedItems.filter((item) => item.pubDate >= recentDemoCutoff)
          : normalizedItems;
        await addItem(existingSource.source_id, recentItems);
      }

      const importLimit = getInitialImportLimit(feedTypeResolved);
      const metadataIds = await getLatestItemIds(
        existingSource.source_id,
        importLimit,
        recentDemoCutoff
      );
      await addUserItemMetadata(userId, metadataIds);
      if (
        options.demoMode &&
        metadataIds.length > 0 &&
        options.enqueueCategorization !== false
      ) {
        void enqueueCategorization(metadataIds);
      }

      return {
        source_id: existingSource.source_id,
        source_name: existingSource.source_name,
        feed_type: feedTypeResolved,
        feed_url: canonicalFeedUrl,
        itemsAdded: 0,
        ...(feedTypeResolved === 'podcast' ? { episodesAdded: 0 } : {}),
      };
    }

    const parsed = await parseFeed(canonicalFeedUrl);
    const feedTypeResolved = inferFeedType(parsed, feedType);

    const source = await addSource(
      parsed.title || 'Untitled Source',
      canonicalFeedUrl,
      feedTypeResolved
    );

    await addUserSource(userId, source.source_id, feedTypeResolved);

    const normalizedItems = normalizeItems(parsed.entries ?? [], feedTypeResolved);
    const items = recentDemoCutoff
      ? normalizedItems.filter((item) => item.pubDate >= recentDemoCutoff)
      : normalizedItems;

    const insertResult = await addItem(source.source_id, items);
    await addUserItemMetadata(userId, insertResult.insertedIds);
    if (insertResult.insertedIds.length > 0 && options.enqueueCategorization !== false) {
      void enqueueCategorization(insertResult.insertedIds);
    }

    console.log(`[ingestion] done: ${insertResult.insertCount} items added`);

    return {
      source_id: source.source_id,
      source_name: source.source_name,
      feed_type: feedTypeResolved,
      feed_url: canonicalFeedUrl,
      itemsAdded: insertResult.insertCount,
      ...(feedTypeResolved === 'podcast' ? { episodesAdded: insertResult.insertCount } : {}),
    };
  });
};
