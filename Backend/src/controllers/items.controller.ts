import { Request, Response } from 'express';
import {
  userFeedItems,
  markItemRead,
  saveItem,
  markUserFeedItemsRead,
  allSavedItems,
  readItems,
  getItemsByCategory,
  getSavedItemsByCategory 
} from '../models';
import { handleError } from '../utils/helpers';
import { UserId } from './types';
import { parseNumericId } from '../utils/request-parser';



interface MarkItemRead {
  userId: string;
  itemId: string;
}

interface SaveItem {
  userId: number;
  itemId: number;
  save?: boolean;
  is_save?: boolean;
}


//get unread items for all sources in user's home page
export const userFeedItemsHandler = async (
  req: Request<UserId, {}, {}, { feedType?: 'rss' | 'podcast' }>,
  res: Response
): Promise<void> => {
  const { feedType } = req.query;

  try {
    const userId = parseNumericId(req.params.userId, 'userId');

    const unreadItems = await userFeedItems(userId, feedType);
    console.info(`INFO: Fetched ${feedType || 'all'} unread items for user ${userId}`);
    res.json(unreadItems);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching unread items');
  }
};


export const getItemsByCategoryHandler = async (
  req: Request<UserId & { categoryName: string }, {}, {}, { feedType?: 'rss' | 'podcast' }>,
  res: Response
) => {
  const { categoryName } = req.params;
  const { feedType } = req.query;
  try {
    const userId = parseNumericId(req.params.userId, 'userId');

    const items = await getItemsByCategory(userId, categoryName, feedType);
    res.json(items);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching items by category');
  }
};


//get saved items by category for a user
export const getSavedItemsByCategoryHandler = async (
  req: Request<UserId & { categoryName: string }, {}, {}, { feedType?: 'rss' | 'podcast' }>,
  res: Response
) => {
  const { categoryName } = req.params;
  const { feedType } = req.query;
  try {
    const userId = parseNumericId(req.params.userId, 'userId');

    const items = await getSavedItemsByCategory(userId, categoryName, feedType);
    res.json(items);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching items by category');
  }
};


//mark an item read for a user
export const markItemReadHandler = async (
  req: Request<MarkItemRead, {}, {}, { feedType?: 'rss' | 'podcast' }>,
  res: Response
): Promise<void> => {
  const { feedType } = req.query;

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const itemId = parseNumericId(req.params.itemId, 'itemId');
    const readItem = await markItemRead(userId, itemId, feedType);

    console.info(
      `INFO: Marked ${readItem.feed_type || 'unknown'} item ${itemId} as read for user ${userId}`
    );

    res.json(readItem);
  } catch (error) {
    handleError(res, error, 500, 'Error marking item as read');
  }
};


//marks all items in home page as read for a user
export const markUserFeedItemsReadHandler = async (
  req: Request<UserId, {}, {}, { feedType?: 'rss' | 'podcast' }>,
  res: Response
): Promise<void> => {
  const { feedType } = req.query;
  const type: 'rss' | 'podcast' = feedType === 'podcast' ? 'podcast' : 'rss';

  try {
    const userId = parseNumericId(req.params.userId, 'userId');

    const readItems = await markUserFeedItemsRead(userId, type);
    console.info(
      `INFO: Marked ${type} feed items as read for user ${userId}, count=${readItems.readCount}`
    );
    res.json(readItems);
  } catch (error) {
    handleError(res, error, 500, `Error marking ${type} items as read`);
  }
};


//save an item for a user
export const saveItemHandler = async (
  req: Request<{}, {}, SaveItem, { feedType?: 'podcast' | 'rss' }>,
  res: Response
): Promise<void> => {
  const { userId, itemId, save } = req.body;
  const { feedType } = req.query;

  if (userId == null || itemId == null || save == null) {
    console.warn('WARN: Missing save item params');
    res.status(400).json({ error: 'Missing userId, itemId, or save value' });
    return;
  }

  try {
    const parsedUserId = parseNumericId(String(userId), 'userId');
    const parsedItemId = parseNumericId(String(itemId), 'itemId');

    const result = await saveItem(parsedUserId, parsedItemId, save, feedType);

    console.info(
      `INFO: Save status for item ${parsedItemId} (user ${parsedUserId}): ${result.is_save}`
    );

    res.json({
      userId: result.user_id,
      itemId: result.item_id,
      is_save: result.is_save,
    });
  } catch (error) {
    handleError(res, error, 500, 'Could not save the item for the user');
  }
};


//get all saved items for a user
export const allSavedItemsHandler = async (
  req: Request<UserId, {}, {}, { feedType?: 'podcast' | 'rss' }>,
  res: Response
): Promise<void> => {
  const { feedType } = req.query;
  try {
    const userId = parseNumericId(req.params.userId, 'userId');

    const savedItems = await allSavedItems(userId, feedType);
    console.info(
      `INFO: Fetched ${feedType || 'all'} saved items for user ${userId} (${savedItems.length} items).`
    );
    res.json(savedItems);
  } catch (error) {
    handleError(res, error, 500, 'Could not get saved items');
  }
};


//get all read items for a user
export const readItemsHandler = async (
  req: Request<UserId, {}, {}, { feedType?: 'rss' | 'podcast' }>,
  res: Response
): Promise<void> => {
  const { feedType } = req.query;

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const allReadItems = await readItems(userId, feedType);
    console.info(
      `INFO: Fetched ${allReadItems.length} read items for user ${userId} (${feedType || 'all'})`
    );
    res.json(allReadItems);
  } catch (error) {
    handleError(res, error, 500, 'Could not get read items');
  }
};


