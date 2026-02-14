import {
  addSource,
  addUserPodcast, addUserSource,
} from "../models";
import { addItem, addUserItemMetadata, getRecentItems } from "../models/items.model";
import { resolvePodcastFromWebsite } from "./podcast.service";
import { resolveWorkingRSSFeed } from "../utils/feed-discovery";


import { checkForPodcast } from "../utils/checkForPodcast";

export const detectSourceType = async (url: string) => {
  const isPodcast = await checkForPodcast(url);
  return isPodcast ? "podcast" : "rss";
};


export const processPodcastSource = async (
  userId: number,
  sourceURL: string
) => {
  const {
    feedUrl,
    podcastTitle,
    episodeItems,
    totalEpisodes,
  } = await resolvePodcastFromWebsite(sourceURL);

  const source = await addSource(podcastTitle, feedUrl, "podcast");

  await addUserPodcast(userId, source.source_id);

  const result = await addItem(source.source_id, episodeItems);

  const itemIds = await getRecentItems(source.source_id, 180);
  await addUserItemMetadata(userId, itemIds);

  return {
    source_id: source.source_id,
    source_name: source.source_name,
    feed_type: "podcast",
    feed_url: feedUrl,
    episodesAdded: result.insertCount,
    totalEpisodes,
  };
};





export const processRSSSource = async (
  userId: number,
  sourceURL: string
) => {
  const resolvedFeed = await resolveWorkingRSSFeed(sourceURL);

  if (!resolvedFeed) {
    throw new Error("No valid RSS feed found");
  }

  const { feedUrl, sourceName, sourceItems } = resolvedFeed;

  const source = await addSource(sourceName, feedUrl, "rss");

  await addUserSource(userId, source.source_id);

  const insertResult = await addItem(source.source_id, sourceItems);

  const recentItemIds = await getRecentItems(source.source_id, 2);
  await addUserItemMetadata(userId, recentItemIds);

  return {
    source_id: source.source_id,
    source_name: source.source_name,
    feed_type: "rss",
    feed_url: feedUrl,
    itemsAdded: insertResult.insertCount,
  };
};
