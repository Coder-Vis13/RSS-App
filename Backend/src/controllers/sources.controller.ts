import {
  allUserSources,
  getUnfolderedSources,
  markSourceItemsRead,
  removeUserSource,
  getSourceItems,
  checkSourceExists,
} from '../models';
import { handleError } from '../utils/helpers';
import { Request, Response } from 'express';
import { parseNumericId } from '../utils/request-parser';
import { processSource } from '../services/source.service';
import { consumeDemoSourceAddition } from '../middleware/demo-session';

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

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function isHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed);
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
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
      res.status(400).json({ message: 'sourceURL is required' });
      return;
    }

    if (req.demoMode && (typeof sourceURL !== 'string' || !isHttpUrl(sourceURL))) {
      res.status(400).json({ message: 'sourceURL must be an HTTP or HTTPS URL' });
      return;
    }

    const userId = parseNumericId(req.params.userId, 'userId');

    const exists = await checkSourceExists(userId, sourceURL);
    if (exists) {
      res.status(409).json({ message: 'Already added' });
      return;
    }

    if (!consumeDemoSourceAddition(req)) {
      res.status(429).json({ message: 'Demo source limit reached for this session.' });
      return;
    }

    const result = await processSource(userId, sourceURL, {
      demoMode: req.demoMode === true,
    });

    res.status(200).json(result);
  } catch (error) {
    handleError(res, error, 500, 'Failed to add source');
    if (error instanceof Error && error.name === 'SourceAlreadyAddedError') {
      res.status(409).json({ message: 'Already added' });
      return;
    }
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
  req: Request<{ userId: string }, {}, {}>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const allSources = await allUserSources(userId);
    res.json(allSources);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching sources for this user');
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

    res.json(result);
  } catch (error) {
    handleError(res, error, 500, 'Error marking source items as read');
  }
};

export const getSourceItemsHandler = async (
  req: Request<
    { userId: string; sourceId: string },
    {},
    {},
    { timeFilter?: 'all' | 'today' | 'week' | 'month' }
  >,
  res: Response
): Promise<void> => {
  const { timeFilter = 'all' } = req.query;

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const sourceId = parseNumericId(req.params.sourceId, 'sourceId');

    const items = await getSourceItems(userId, sourceId, timeFilter, req.demoMode === true);

    res.status(200).json(items);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching source items');
  }
};
