import { addItem, addUserItemMetadata, getRecentItems } from '../models/items.model';
import {
  addSource,
  addUserPodcast,
  addUserSource,
  allUserPodcastSources,
  allUserRSSSources,
  allUserSources,
  getUnfolderedSources,
  markSourceItemsRead,
  removeUserSource,
  sourcePriority,
  updateSourcePriorities,
  getSourceItems, 
  checkSourceExists
} from '../models';
import { handleError } from '../utils/helpers';
import { Request, Response } from 'express';
import { SourcePriorityUpdate, UserId } from './types';
import { podcastParser } from '../services/podcast.service';
import { parseNumericId } from '../utils/request-parser';
import { resolveWorkingRSSFeed } from '../utils/feed-discovery';

interface URL {
  sourceURL: string;
}

interface URLBody {
  sourceURL: string;
}
interface UserIdParam {
  userId: string;
}

interface UserSource {
  userId: string;
  sourceId: string;
}

interface UpdatePriority {
  userId: number;
  sources: SourcePriorityUpdate[];
}

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}


//get all unfoldered sources for a user
export const getUnfolderedSourcesHandler = async (
  req: Request<{ userId: string }, {}, {}>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const sources = await getUnfolderedSources(userId);
    console.info(`INFO: Fetched unfoldered sources for user ${userId}`);
    res.json(sources);
  } catch (error) {
    handleError(res, error, 500, "Error in getting user's unfoldered sources");
  }
};



//provide feed as soon as user adds a source
export const addUserSourceHandler = async (
  req: Request<UserIdParam, {}, URLBody>,
  res: Response
): Promise<void> => {
  try {
    const { sourceURL } = req.body;
    if (!sourceURL) throw new ApiError(400, 'sourceURL is required');

    const userId = parseNumericId(req.params.userId, 'userId');

    const existingSource = await checkSourceExists(userId, sourceURL);
    if (existingSource) {
      throw new ApiError(409, "This source already exists in your feed");
    }


    const resolvedFeed = await resolveWorkingRSSFeed(sourceURL);
    if (!resolvedFeed) {
      res.status(404).json({ error: 'No valid RSS feed found at provided URL' });
      return;
    }

    const { feedUrl, sourceName, sourceItems } = resolvedFeed;

    const source = await addSource(sourceName, feedUrl);
    const userSource = await addUserSource(userId, source.source_id);

    const insertResult = await addItem(source.source_id, sourceItems);
    const recentItemIds = await getRecentItems(source.source_id, 2);
    await addUserItemMetadata(userId, recentItemIds);

    res.json({
      source_id: source.source_id,
      source_name: source.source_name,
      feed_url: feedUrl,
      itemsAdded: insertResult.insertCount,
      userSourceCreated: userSource.created,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message});
      return;
    }
    res.status(500).json({ message: "Failed to add feed" });
  }
};



//add a podcast source for a user
export const addUserPodcastHandler = async (
  req: Request<UserIdParam, {}, URLBody>,
  res: Response
): Promise<void> => {
  try {
    const { sourceURL } = req.body;
    if (!sourceURL) throw new Error('sourceURL is required');

    const userId = parseNumericId(req.params.userId, 'userId');

    const { podcastTitle, episodeItems, totalEpisodes } =
      await podcastParser(sourceURL);

    const source = await addSource(podcastTitle, sourceURL, 'podcast');
    const userPodcast = await addUserPodcast(userId, source.source_id);

    const result = await addItem(source.source_id, episodeItems);
    const itemIds = await getRecentItems(source.source_id, 180);
    await addUserItemMetadata(userId, itemIds);

    res.json({
      source_id: source.source_id,
      source_name: source.source_name,
      feed_type: 'podcast',
      feed_url: sourceURL,
      episodesAdded: result.insertCount,
      userSourceCreated: userPodcast.created,
      totalEpisodes,
    });
  } catch (error) {
    handleError(res, error, 400, 'Could not add podcast source for user');
  }
};


// remove a source for a user
export const removeUserSourceHandler = async (
  req: Request<{ userId: string; sourceId: string }>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const sourceId = parseNumericId(req.params.sourceId, 'sourceId');
    const updatedSources = await removeUserSource(userId, sourceId);
    console.info(`INFO: Removed source ${sourceId} from user ${userId}.`);

    res.json({
      message: 'Source removed successfully',
      sources: updatedSources,
    });
  } catch (error) {
    handleError(res, error, 500, 'Could not delete source for user');
  }
};


//display all the sources the user follows in the home page above the feed
export const allUserSourcesHandler = async (
  req: Request<UserId, {}, {}>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const allSources = await allUserSources(userId);
    console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
    res.json(allSources);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching sources for this user');
  }
};


//display all the blog sources the user follows in the home page above the feed
export const allUserRSSSourcesHandler = async (
  req: Request<UserId, {}, {}>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const allSources = await allUserRSSSources(userId);
    console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
    res.json(allSources);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching blog sources for this user');
  }
};


//display all the podcast sources the user follows in the home page above the feed
export const allUserPodcastSourcesHandler = async (
  req: Request<UserId, {}, {}>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const allSources = await allUserPodcastSources(userId);
    console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
    res.json(allSources);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching podcast sources for this user');
  }
};


// mark all items of a specific source as read
export const markSourceItemsReadHandler = async (
  req: Request<{ userId: string; sourceId: string }>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const sourceId = parseNumericId(req.params.sourceId, 'sourceId');

    const result = await markSourceItemsRead(userId, sourceId);

    console.info(
      `INFO: Marked source items read for user ${userId}, source=${sourceId}, count=${result.readCount}`
    );

    res.json(result);
  } catch (error) {
    handleError(res, error, 500, 'Error marking source items as read');
  }
};


//get priority list for a user
export const sourcePriorityHandler = async (
  req: Request<UserId, {}, {}, { feedType?: 'rss' | 'podcast' }>,
  res: Response
): Promise<void> => {
  const { feedType } = req.query;

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const priority = await sourcePriority(Number(userId), feedType);
    console.info(`INFO: Fetched source priority for user ${userId} (${feedType || 'all'}).`);
    res.json(priority);
  } catch (error) {
    handleError(res, error, 500, 'Error in getting source priority');
  }
};


//update source priorities for a user
export const updateSourcePrioritiesHandler = async (
  req: Request<{}, {}, UpdatePriority, { feedType?: 'rss' | 'podcast' }>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(String(req.body.userId), 'userId');
    const { sources } = req.body;
    const { feedType } = req.query;

    if (!Array.isArray(sources) || sources.length === 0) {
      res.status(400).json({ error: 'Sources array is required and cannot be empty' });
      return;
    }
    await updateSourcePriorities(userId, sources, feedType);

    console.log(`${feedType} DB update successful for user ${userId}`);
    res.json({ success: true, feedType: feedType });
  } catch (err) {
    handleError(res, err, 500, 'Error updating source priorities');}
};


//all preset sources that users can choose from
export const presetSourcesHandler = async (
  req: Request<{}, {}, UserSource, { feedType?: 'rss' | 'podcast' }>,
  res: Response
): Promise<void> => {
  const { feedType } = req.query;

  try {
    const userId = parseNumericId(String(req.body.userId), 'userId');
    const sourceId = parseNumericId(String(req.body.sourceId), 'sourceId');

    let result;
    if (feedType === 'podcast') {
      result = await addUserPodcast(userId, sourceId);
    } else {
      result = await addUserSource(userId, sourceId);
    }
    res.json({
      message: `${feedType || 'rss'} source added to user feed`,
      ...result,
    });
  } catch (err) {
    handleError(res, err, 500, 'Error adding preset source to user feed');
  }
};
export const getSourceItemsHandler = async (
  req: Request<{ userId: string; sourceId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const sourceId = parseNumericId(req.params.sourceId, 'sourceId');

    const feedType: 'rss' | 'podcast' =
      req.query.feedType === 'podcast' ? 'podcast' : 'rss';

    const items = await getSourceItems(userId, sourceId, feedType);

    res.status(200).json(items);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching source items');
  }
};
