import {
  allUserSources,
  getUnfolderedSources,
  markSourceItemsRead,
  removeUserSource,
  sourcePriority,
  updateSourcePriorities,
  getSourceItems,
  checkSourceExists,
} from '../models';
import { handleError } from '../utils/helpers';
import { Request, Response } from 'express';
import { SourcePriorityUpdate, UserId } from './types';
import { parseNumericId } from '../utils/request-parser';
import {
  processSource
} from "../services/source.service";
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


//adds a source for a user
export const addSourceHandler = async (
  req: Request<UserIdParam, {}, URLBody>,
  res: Response
): Promise<void> => {
  try {
    const { sourceURL } = req.body;

    if (!sourceURL) {
      res.status(400).json({ message: "sourceURL is required" });
      return;
    }

    const userId = parseNumericId(req.params.userId, "userId");

    const exists = await checkSourceExists(userId, sourceURL);
    if (exists) {
      res.status(409).json({ message: "Already added" });
      return;
    }

    let result = await processSource(userId, sourceURL);

    res.status(200).json(result);

  } catch (error) {
    handleError(res, error, 500, "Failed to add source");
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

// //display all the blog sources the user follows in the home page above the feed
// export const allUserRSSSourcesHandler = async (
//   req: Request<UserId, {}, {}>,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = parseNumericId(req.params.userId, 'userId');
//     const allSources = await allUserRSSSources(userId);
//     console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
//     res.json(allSources);
//   } catch (error) {
//     handleError(res, error, 500, 'Error fetching blog sources for this user');
//   }
// };

// //display all the podcast sources the user follows in the home page above the feed
// export const allUserPodcastSourcesHandler = async (
//   req: Request<UserId, {}, {}>,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = parseNumericId(req.params.userId, 'userId');
//     const allSources = await allUserPodcastSources(userId);
//     console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
//     res.json(allSources);
//   } catch (error) {
//     handleError(res, error, 500, 'Error fetching podcast sources for this user');
//   }
// };

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



export const getSourceItemsHandler = async (
  req: Request<{ userId: string; sourceId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const sourceId = parseNumericId(req.params.sourceId, 'sourceId');

    const feedType: 'rss' | 'podcast' = req.query.feedType === 'podcast' ? 'podcast' : 'rss';

    const items = await getSourceItems(userId, sourceId);

    res.status(200).json(items);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching source items');
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
    handleError(res, err, 500, 'Error updating source priorities');
  }
};