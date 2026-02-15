import { addSource, addUserSource } from "../models";
import { addItem, addUserItemMetadata, getRecentItems } from "../models/items.model";
import { resolvePodcastFromWebsite } from "./podcast.service";
import { resolveWorkingRSSFeed } from "../utils/feed-discovery";
import { FeedResolutionError, RSSResult, PodcastResult } from "../utils/types";

export const processSource = async (userId: number, sourceURL: string) => {
  let source: { source_id: number; source_name: string };
  let items: any[] = [];
  let feedUrl: string;
  let totalEpisodes: number | undefined;
  let feedType: "rss" | "podcast";

  //Try resolving RSS first
  const rssData: RSSResult | null = await resolveWorkingRSSFeed(sourceURL);

  if (rssData) {
    feedUrl = rssData.feedUrl;
    source = await addSource(rssData.sourceName, feedUrl);
    items = rssData.sourceItems;
    feedType = "rss";
  } else {
    // 2️⃣ Fallback to podcast with error handling
    let podcastData: PodcastResult | null = null;
    try {
      podcastData = await resolvePodcastFromWebsite(sourceURL);
    } catch (err) {
      console.error("Podcast resolution failed:", err);
      throw new FeedResolutionError(
        `Could not resolve feed for ${sourceURL} as RSS or podcast`
      );
    }

    feedUrl = podcastData.feedUrl;
    source = await addSource(podcastData.podcastTitle, feedUrl);
    items = podcastData.episodeItems;
    totalEpisodes = podcastData.totalEpisodes;
    feedType = "podcast";
  }

  //Add source & items
  await addUserSource(userId, source.source_id, feedType);
  const insertResult = await addItem(source.source_id, items);
  const recentCount = feedType === "podcast" ? 180 : 2;
  const recentItemIds = await getRecentItems(source.source_id, recentCount);
  await addUserItemMetadata(userId, recentItemIds);

  // 4️⃣ Return
  return {
    source_id: source.source_id,
    source_name: source.source_name,
    feed_type: feedType,
    feed_url: feedUrl,
    itemsAdded: insertResult.insertCount,
    ...(feedType === "podcast"
      ? { episodesAdded: insertResult.insertCount, totalEpisodes }
      : {}),
  };
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
