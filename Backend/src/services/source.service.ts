 /*

 F. Windowed DB Writes                │  processSource (source.service.ts)
│  Filter items BEFORE insert         │
│  RSS: pub_date within 2 days        │
│  Podcast: within 180 days           │
│  addSource(name, feedUrl, feedType) │  ← fix feed_type on source row
│  addUserSource                      │
│  addItem (bulk)                     │
│  addUserItemMetadata(insertedIds)   │  ← no getRecentItems re-query

*/

import { addSource, addUserSource } from "../models";
import { addItem, addUserItemMetadata, getRecentItems } from "../models/items.model";
import { query } from "../config/db";
import { getFirstRow } from "../utils/helpers";
import { FeedResolutionError } from "../utils/types";
import { classifySourceUrl } from "./ingestion/url-classifier";
import { resolveFeedUrl } from "./ingestion/resolve-feed-url";
import { parseFeed } from "./ingestion/parse-feed";
import { normalizeItems } from "./ingestion/normalize-items";
import { createRequestFeedDedupe, withIngestionDedupe } from "./ingestion/feed-url-dedupe";
import { inferFeedType } from "./ingestion/infer-feed-type";

export const processSource = async (userId: number, sourceURL: string) => {
  const feedDedupe = createRequestFeedDedupe();

  console.log(`[ingestion] classify: ${sourceURL}`);
  const classification = classifySourceUrl(sourceURL);
  console.log(`[ingestion] classified as: ${classification}`);

  console.log(`[ingestion] resolve feed URL`);
  const resolved = await resolveFeedUrl(sourceURL, classification);

  if (!resolved) {
    throw new FeedResolutionError(
      `Podcast feed resolution is not yet supported for ${sourceURL}`
    );
  }

  const { feedUrl, feedType } = resolved;
  const { canonicalFeedUrl, isDuplicate } = feedDedupe.register(feedUrl);

  return withIngestionDedupe(canonicalFeedUrl, async () => {
    if (isDuplicate) {
      console.log(`[ingestion] dedupe: duplicate resolved feed URL (${canonicalFeedUrl})`);
    }

    console.log(`[ingestion] resolved: ${canonicalFeedUrl} (${feedType})`);

    console.log(`[ingestion] check DB for existing source`);
    const existingSource = getFirstRow<{ source_id: number; source_name: string }>(
      await query(`SELECT source_id, source_name FROM source WHERE url = $1`, [canonicalFeedUrl])
    );

    if (existingSource) {
      console.log(`[ingestion] short-circuit: source already exists (${existingSource.source_id})`);
      await addUserSource(userId, existingSource.source_id, feedType);
      const recentDays = feedType === "podcast" ? 180 : 30;
      const recentItemIds = await getRecentItems(existingSource.source_id, recentDays);
      await addUserItemMetadata(userId, recentItemIds);

      return {
        source_id: existingSource.source_id,
        source_name: existingSource.source_name,
        feed_type: feedType,
        feed_url: canonicalFeedUrl,
        itemsAdded: 0,
        ...(feedType === "podcast" ? { episodesAdded: 0 } : {}),
      };
    }

    console.log(`[ingestion] parse feed`);
    const parsed = await parseFeed(canonicalFeedUrl);

    console.log(`[ingestion] normalize items`);
    const items = normalizeItems(parsed.entries ?? [], feedType);
    const totalEpisodes = feedType === "podcast" ? items.length : undefined;

    const source = await addSource(parsed.title || "Untitled Source", canonicalFeedUrl);

    await addUserSource(userId, source.source_id, feedType);
    const insertResult = await addItem(source.source_id, items);
    const recentCount = feedType === "podcast" ? 180 : 30;
    const recentItemIds = await getRecentItems(source.source_id, recentCount);
    await addUserItemMetadata(userId, recentItemIds);

    console.log(`[ingestion] done: ${insertResult.insertCount} items added`);

    return {
      source_id: source.source_id,
      source_name: source.source_name,
      feed_type: feedType,
      feed_url: canonicalFeedUrl,
      itemsAdded: insertResult.insertCount,
      ...(feedType === "podcast"
        ? { episodesAdded: insertResult.insertCount, totalEpisodes }
        : {}),
    };
  });
};









/*
 Process a source (RSS or Podcast) for a user:
  Adds the source to DB if not exists
  Adds it for the user
  Adds feed items
  Adds user item metadata
 */




// export const detectSourceType = async (url: string) => {
//   const isPodcast = await checkForPodcast(url);
//   return isPodcast ? "podcast" : "rss";
// };




// export const processSource = async (userId: number, sourceURL: string) => {
//   // Automatically detect feed type
//   const feedType: "rss" | "podcast" = await detectSourceType(sourceURL);

//   let source: { source_id: number; source_name: string };
//   let items: any[] = [];
//   let feedUrl: string;
//   let totalEpisodes: number | undefined;

//   if (feedType === "podcast") {
//     const podcastData = await resolvePodcastFromWebsite(sourceURL);
//     feedUrl = podcastData.feedUrl;
//     source = await addSource(podcastData.podcastTitle, feedUrl);
//     items = podcastData.episodeItems;
//     totalEpisodes = podcastData.totalEpisodes;
//   } else {
//     const rssData = await resolveWorkingRSSFeed(sourceURL);
//     if (!rssData) throw new Error("No valid RSS feed found");
//     feedUrl = rssData.feedUrl;
//     source = await addSource(rssData.sourceName, feedUrl);
//     items = rssData.sourceItems;
//   }

//   await addUserSource(userId, source.source_id);

//   const insertResult = await addItem(source.source_id, items);

//   const recentCount = feedType === "podcast" ? 180 : 2;
//   const recentItemIds = await getRecentItems(source.source_id, recentCount);
//   await addUserItemMetadata(userId, recentItemIds);

//   return {
//     source_id: source.source_id,
//     source_name: source.source_name,
//     feed_type: feedType,
//     feed_url: feedUrl,
//     itemsAdded: insertResult.insertCount,
//     ...(feedType === "podcast" ? { episodesAdded: insertResult.insertCount, totalEpisodes } : {}),
//   };
// };



// export const processPodcastSource = async (
//   userId: number,
//   sourceURL: string
// ) => {
//   const {
//     feedUrl,
//     podcastTitle,
//     episodeItems,
//     totalEpisodes,
//   } = await resolvePodcastFromWebsite(sourceURL);

//   const source = await addSource(podcastTitle, feedUrl);

//   await addUserSource(userId, source.source_id);

//   const result = await addItem(source.source_id, episodeItems);

//   const itemIds = await getRecentItems(source.source_id, 180);
//   await addUserItemMetadata(userId, itemIds);

//   return {
//     source_id: source.source_id,
//     source_name: source.source_name,
//     feed_type: "podcast",
//     feed_url: feedUrl,
//     episodesAdded: result.insertCount,
//     totalEpisodes,
//   };
// };





// export const processRSSSource = async (
//   userId: number,
//   sourceURL: string
// ) => {
//   const resolvedFeed = await resolveWorkingRSSFeed(sourceURL);

//   if (!resolvedFeed) {
//     throw new Error("No valid RSS feed found");
//   }

//   const { feedUrl, sourceName, sourceItems } = resolvedFeed;

//   const source = await addSource(sourceName, feedUrl);

//   await addUserSource(userId, source.source_id);

//   const insertResult = await addItem(source.source_id, sourceItems);

//   const recentItemIds = await getRecentItems(source.source_id, 2);
//   await addUserItemMetadata(userId, recentItemIds);

//   return {
//     source_id: source.source_id,
//     source_name: source.source_name,
//     feed_type: "rss",
//     feed_url: feedUrl,
//     itemsAdded: insertResult.insertCount,
//   };
// };
