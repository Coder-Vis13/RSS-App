import { query } from '../config/db';
import { getFirstRow, logAction, markAsCreated } from '../utils/helpers';
import { QueryResult } from '../utils/helpers';
import { categorizeItem } from '../utils/categorizer';
import pLimit from 'p-limit';

const limit = pLimit(5);

import dotenv from 'dotenv';
import { AddItemResult, InsertedItem, Item, ReadItemResult, Source } from './types';
dotenv.config();
const USE_AI_CATEGORY = process.env.USE_AI_CATEGORY === 'false';

interface FeedItems extends Item {
  is_save: boolean;
  source_id: number;
  feed_type: 'rss' | 'podcast';
  tags?: string[];
}

interface MarkReadRow {
  user_id: number;
  item_id: number;
  read_time?: string;
}

interface MarkRead extends MarkReadRow {
  read: boolean;
}

interface Save {
  user_id: number;
  item_id: number;
  is_save?: boolean;
}

interface ItemsInserted {
  added: number;
}

interface AllReadItems extends Item {
  read_time: string;
}

//store items with metadata
export const addUserItemMetadata = async (
  userId: number,
  itemIds: number[]
): Promise<ItemsInserted> => {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return { added: 0 };
  }

  const insertResult = await query(
    `INSERT INTO user_item_metadata (user_id, item_id)
     SELECT $1, x
     FROM unnest($2::int[]) AS x 
     ON CONFLICT (user_id, item_id) DO NOTHING`,
    [userId, itemIds]
  );

  logAction(
    `Added items into user's metadata: User=${userId} itemCount=${insertResult.rowCount ?? 0}`
  );

  return { added: insertResult.rowCount ?? 0 };
};

//the full unread feed for a user
export const userFeedItems = async (
  userId: number,
  timeFilter: 'all' | 'today' | 'week' | 'month' = 'all'
): Promise<FeedItems[]> => {
  let timeClause = '';
  if (timeFilter === 'today') timeClause = `AND i.pub_date >= date_trunc('day', NOW())`;
  else if (timeFilter === 'week') timeClause = `AND i.pub_date >= date_trunc('week', NOW())`;
  else if (timeFilter === 'month') timeClause = `AND i.pub_date >= date_trunc('month', NOW())`;

  const baseQuery = `SELECT 
      i.item_id,
      i.title,
      i.link,
      i.description,
      i.pub_date,
      i.source_id,
      s.source_name,
      s.feed_type,
      COALESCE(uim.is_save, false) AS is_save,
      i.is_categorized,
      COALESCE(json_agg(DISTINCT jsonb_build_object('name', c.name, 'color', c.color)) 
           FILTER (WHERE c.name IS NOT NULL), '[]'::json) AS categories, 
      COALESCE(
      json_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL AND t.tag <> ''),
      '[]'::json
    ) AS tags
  FROM item i
  INNER JOIN source s ON i.source_id = s.source_id
  INNER JOIN user_source us ON us.source_id = i.source_id
  LEFT JOIN user_item_metadata uim ON uim.item_id = i.item_id AND uim.user_id = us.user_id
  LEFT JOIN item_category ic ON i.item_id = ic.item_id
  LEFT JOIN category c ON ic.category_id = c.category_id
  LEFT JOIN item_tag t ON i.item_id = t.item_id
  WHERE us.user_id = $1
    ${timeClause}
    AND (uim.read_time IS NULL)
  GROUP BY i.item_id, s.source_name, s.feed_type, s.source_id, uim.is_save, i.is_categorized, us.priority
  ORDER BY us.priority, i.pub_date DESC`;

  const result: QueryResult<FeedItems> = await query(baseQuery, [userId]);

  const uncategorized = result.rows.filter((item) => !item.is_categorized);

  if (uncategorized.length > 0) {
    await Promise.all(
      uncategorized.map((item) =>
        limit(async () => {
          try {
            await categorizeItem(item.item_id, item.title, item.description);
          } catch (err) {
            console.error(`Categorization failed for ${item.item_id}`, err);
          }
        })
      )
    );

    const refreshed: QueryResult<FeedItems> = await query(baseQuery, [userId]);
    return refreshed.rows;
  }

  return result.rows;
};

//get items by category
export const getItemsByCategory = async (
  userId: number,
  categoryName: string,
  timeFilter: 'all' | 'today' | 'week' | 'month' = 'all'
): Promise<FeedItems[]> => {
  let timeClause = '';
  if (timeFilter === 'today') timeClause = `AND i.pub_date >= date_trunc('day', NOW())`;
  else if (timeFilter === 'week') timeClause = `AND i.pub_date >= date_trunc('week', NOW())`;
  else if (timeFilter === 'month') timeClause = `AND i.pub_date >= date_trunc('month', NOW())`;

  const baseQuery = `
    SELECT 
      i.item_id,
      i.title,
      i.link,
      i.description,
      i.pub_date,
      i.source_id,
      s.source_name,
      s.feed_type,
      COALESCE(uim.is_save, false) AS is_save,
      i.is_categorized,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('name', c.name, 'color', c.color))
        FILTER (WHERE c.name IS NOT NULL), '[]'::json
      ) AS categories
    FROM item i
    INNER JOIN source s ON i.source_id = s.source_id
    INNER JOIN user_source us ON us.source_id = i.source_id
    LEFT JOIN user_item_metadata uim ON uim.item_id = i.item_id AND uim.user_id = us.user_id
    LEFT JOIN item_category ic ON ic.item_id = i.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    WHERE us.user_id = $1
      AND c.name = $2
      ${timeClause}
    AND (uim.read_time IS NULL)
    GROUP BY i.item_id, s.source_name, s.feed_type, s.source_id, uim.is_save, us.priority
    ORDER BY us.priority, i.pub_date DESC
  `;

  const params = [userId, categoryName];
  const result: QueryResult<FeedItems> = await query(baseQuery, params);

  await Promise.all(
    result.rows
      .filter((i) => !i.is_categorized)
      .map((i) => limit(() => categorizeItem(i.item_id, i.title, i.description)))
  );

  return result.rows;
};

//get saved items by category
export const getSavedItemsByCategory = async (
  userId: number,
  categoryName: string,
  timeFilter: 'all' | 'today' | 'week' | 'month' = 'all'
): Promise<FeedItems[]> => {
  let timeClause = '';
  if (timeFilter === 'today') timeClause = `AND i.pub_date >= date_trunc('day', NOW())`;
  else if (timeFilter === 'week') timeClause = `AND i.pub_date >= date_trunc('week', NOW())`;
  else if (timeFilter === 'month') timeClause = `AND i.pub_date >= date_trunc('month', NOW())`;

  const baseQuery = `
    SELECT 
      s.source_name,
      s.feed_type,
      i.source_id,
      COALESCE(uim.is_save, false) AS is_save,
      i.item_id,
      i.title,
      i.link,
      i.description,
      i.pub_date,
      i.is_categorized,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('name', c.name, 'color', c.color))
        FILTER (WHERE c.name IS NOT NULL), '[]'::json
      ) AS categories
    FROM user_item_metadata uim
    JOIN item i ON uim.item_id = i.item_id
    JOIN source s ON i.source_id = s.source_id
    INNER JOIN user_source us ON us.source_id = i.source_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    WHERE uim.user_id = $1
      AND uim.is_save = TRUE
      AND c.name = $2
      ${timeClause}
    GROUP BY i.item_id, i.source_id, s.source_name, s.feed_type, i.is_categorized, uim.is_save
    ORDER BY i.pub_date DESC
  `;

  const params = [userId, categoryName];
  const result: QueryResult<FeedItems> = await query(baseQuery, params);

  const uncategorized = result.rows.filter((item) => !item.is_categorized);

  await Promise.all(
    uncategorized.map((item) =>
      limit(async () => {
        await categorizeItem(item.item_id, item.title, item.description);
      })
    )
  );

  return result.rows;
};

//mark an item as read
export const markItemRead = async (
  userId: number,
  itemId: number
): Promise<MarkRead & { feed_type: 'rss' | 'podcast' }> => {
  const insertResult: QueryResult<MarkReadRow> = await query(
    `INSERT INTO user_item_metadata (user_id, item_id, read_time)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id, item_id) DO UPDATE
      SET read_time = EXCLUDED.read_time
    RETURNING user_id, item_id, read_time`,
    [userId, itemId]
  );

  const markedItem = getFirstRow(insertResult);

  // Use feed_type from item + user_source join
  const feedTypeRow: QueryResult<{ feed_type: 'rss' | 'podcast' }> = await query(
    `SELECT s.feed_type
     FROM item i
     JOIN source s ON s.source_id = i.source_id
     WHERE i.item_id = $1`,
    [itemId]
  );

  const feed_type = feedTypeRow.rows[0]?.feed_type;

  logAction(`Marked ${feed_type} item as read: User=${userId} Item=${itemId}`);

  if (!markedItem) return { user_id: userId, item_id: itemId, read: false, feed_type };

  return { ...markedItem, read: true, feed_type };
};

export const addItem = async (
  sourceId: number,
  items: {
    link: string;
    title: string;
    description: string | null;
    pubDate: string | Date | null;
    tags?: string[];
  }[]
): Promise<AddItemResult> => {
  if (!items.length) return { insertCount: 0, insertedIds: [] };

  const values: any[] = [];
  const valueStrings: string[] = [];

  items.forEach((i, idx) => {
    const baseIdx = idx * 5; // 5 columns per row
    valueStrings.push(
      `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5})`
    );
    values.push(sourceId, i.link, i.title, i.description, i.pubDate);
  });

  //Insert all items in one query
  const insertQuery = `
    INSERT INTO item(source_id, link, title, description, pub_date)
    VALUES ${valueStrings.join(', ')}
    ON CONFLICT (source_id, link) DO NOTHING
    RETURNING item_id, link
  `;
  const result: QueryResult<{ item_id: number; link: string }> = await query(insertQuery, values);

  const insertedIds: number[] = result.rows.map((r) => r.item_id);
  const insertCount = insertedIds.length;

  //Bulk insert tags
  const tagValues: any[] = [];
  const tagValueStrings: string[] = [];

  result.rows.forEach((row, rowIdx) => {
    const originalItem = items.find((i) => i.link === row.link);
    if (originalItem?.tags?.length) {
      const tagsToInsert = originalItem.tags.slice(0, 3);
      tagsToInsert.forEach((tag, tagIdx) => {
        tagValues.push(row.item_id, tag);
        tagValueStrings.push(`($${tagValues.length - 1}, $${tagValues.length})`);
      });
    }
  });

  if (tagValues.length) {
    const tagQuery = `
      INSERT INTO item_tag(item_id, tag)
      VALUES ${tagValueStrings.join(', ')}
      ON CONFLICT (item_id, tag) DO NOTHING
    `;
    await query(tagQuery, tagValues);
  }

  logAction(`Inserted items of Source=${sourceId} itemCount=${insertCount}`);
  return { insertCount, insertedIds };
};

//mark all unread items of all sources read
export const markUserFeedItemsRead = async (userId: number): Promise<ReadItemResult> => {
  const result = await query(
    `INSERT INTO user_item_metadata (user_id, item_id, read_time)
     SELECT $1, i.item_id, NOW()
     FROM item i
     JOIN user_source us ON us.source_id = i.source_id
     JOIN source s ON s.source_id = i.source_id
     WHERE us.user_id = $1
     ON CONFLICT (user_id, item_id)
       DO UPDATE SET read_time = EXCLUDED.read_time
     RETURNING user_id, item_id, read_time`,
    [userId]
  );

  logAction(`Marked items as read: User=${userId} itemCount=${result.rowCount ?? 0}`);
  return { readCount: result.rowCount ?? 0 };
};

export const saveItem = async (
  userId: number,
  itemId: number,
  save: boolean,
  feedType: 'rss' | 'podcast' = 'rss'
): Promise<Save & { feed_type: 'rss' | 'podcast' }> => {
  const insertResult: QueryResult<Save> = await query(
    `INSERT INTO user_item_metadata (user_id, item_id, is_save)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, item_id) DO UPDATE
       SET is_save = EXCLUDED.is_save
     RETURNING user_id, item_id, is_save`,
    [userId, itemId, save]
  );

  const savedItem = getFirstRow(insertResult);
  logAction(`Saved/unsaved ${feedType} item: User=${userId} Item=${itemId} Save=${!!save}`);
  if (!savedItem) return { user_id: userId, item_id: itemId, is_save: save, feed_type: feedType };

  return { ...savedItem, feed_type: feedType };
};

//get all items published recently
export const getLatestItemIds = async (sourceId: number, limit: number): Promise<number[]> => {
  const result: QueryResult<Pick<Item, 'item_id'>> = await query(
    `SELECT item_id FROM item 
     WHERE source_id = $1 
     ORDER BY pub_date DESC
     LIMIT $2`,
    [sourceId, limit]
  );
  logAction(`Recent item IDs: Source=${sourceId} itemCount=${result.rows.length}`);
  return result.rows.map((r) => r.item_id);
};

//get all saved items for a user
export const allSavedItems = async (
  userId: number,
  timeFilter: 'all' | 'today' | 'week' | 'month' = 'all'
): Promise<Item[]> => {
  let timeClause = '';
  if (timeFilter === 'today') timeClause = `AND i.pub_date >= date_trunc('day', NOW())`;
  else if (timeFilter === 'week') timeClause = `AND i.pub_date >= date_trunc('week', NOW())`;
  else if (timeFilter === 'month') timeClause = `AND i.pub_date >= date_trunc('month', NOW())`;

  const baseQuery = `
    SELECT 
      s.source_name, 
      s.feed_type,
      i.item_id, 
      i.title, 
      i.link, 
      i.description, 
      i.pub_date,
      i.is_categorized,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('name', c.name, 'color', c.color))
        FILTER (WHERE c.name IS NOT NULL),
        '[]'::json
      ) AS categories,
      COALESCE(
        json_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL AND t.tag <> ''),
        '[]'::json
      ) AS tags
    FROM user_item_metadata uim
    JOIN item i ON uim.item_id = i.item_id
    JOIN source s ON i.source_id = s.source_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    LEFT JOIN item_tag t ON i.item_id = t.item_id
    WHERE uim.is_save = TRUE
      AND uim.user_id = $1
      ${timeClause}
    GROUP BY i.item_id, s.source_name, s.feed_type, i.is_categorized
    ORDER BY i.pub_date DESC
  `;

  const params = [userId];
  const result: QueryResult<Item> = await query(baseQuery, params);

  const uncategorized = result.rows.filter((item) => !item.is_categorized);
  if (uncategorized.length > 0) {
    await Promise.all(
      uncategorized.map((item) =>
        limit(async () => {
          await categorizeItem(item.item_id, item.title, item.description);
        })
      )
    );
    const refreshed = await query(baseQuery, params);
    logAction(
      `Saved items: User=${userId} itemCount=${refreshed.rows.length} (refreshed after categorization)`
    );
    return refreshed.rows;
  }

  logAction(`Saved items: User=${userId} itemCount=${result.rows.length}`);
  return result.rows;
};

//get all read items of a user
export const readItems = async (
  userId: number,
  timeFilter: 'all' | 'today' | 'week' | 'month' = 'all'
): Promise<AllReadItems[]> => {
  let timeClause = '';
  if (timeFilter === 'today') timeClause = `AND uim.read_time >= date_trunc('day', NOW())`;
  else if (timeFilter === 'week') timeClause = `AND uim.read_time >= date_trunc('week', NOW())`;
  else if (timeFilter === 'month') timeClause = `AND uim.read_time >= date_trunc('month', NOW())`;

  const baseQuery = `
    SELECT 
      s.source_name,
      s.feed_type,
      i.item_id,
      i.title,
      i.link,
      i.description,
      i.pub_date,
      i.is_categorized,
      uim.read_time,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('name', c.name, 'color', c.color))
        FILTER (WHERE c.name IS NOT NULL),
        '[]'::json
      ) AS categories,
      COALESCE(
        json_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL AND t.tag <> ''),
        '[]'::json
      ) AS tags
    FROM user_item_metadata uim
    JOIN item i ON uim.item_id = i.item_id
    JOIN source s ON i.source_id = s.source_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    LEFT JOIN item_tag t ON i.item_id = t.item_id
    WHERE uim.user_id = $1
    AND (uim.read_time IS NOT NULL)
      ${timeClause}
    GROUP BY i.item_id, s.source_name, s.feed_type, uim.read_time, i.is_categorized
    ORDER BY i.pub_date DESC
  `;

  const params = [userId];
  const result: QueryResult<AllReadItems> = await query(baseQuery, params);

  const uncategorized = result.rows.filter((item) => !item.is_categorized);
  if (uncategorized.length) {
    await Promise.all(
      uncategorized.map((item) =>
        limit(async () => {
          await categorizeItem(item.item_id, item.title, item.description);
        })
      )
    );
    const refreshed = await query(baseQuery, params);
    logAction(
      `Read items: User=${userId} itemCount=${refreshed.rows.length} (refreshed after categorization)`
    );
    return refreshed.rows;
  }

  logAction(`Read items: User=${userId} itemCount=${result.rows.length}`);
  return result.rows;
};
