import { query } from '../config/db';
import { getFirstRow, logAction, markAsCreated } from '../utils/helpers';
import { QueryResult } from '../utils/helpers';
import { categorizeItem } from '../utils/categorizer';

import dotenv from 'dotenv';
import { AddItemResult, InsertedItem, Item, ReadItemResult, Source } from './types';
dotenv.config();
const USE_AI_CATEGORY = process.env.USE_AI_CATEGORY === 'false';



interface FeedItems extends Item {
  is_save: boolean;
}

interface MarkReadRow {
  user_id: number;
  item_id: number;
  read_time?: string | Date;
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
  added: number | null;
}



//add items into userItemMetadata table
export const addUserItemMetadata = async (userId: number, itemIds: number[]): Promise<ItemsInserted> => {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return { added: 0 };
  }
  //insert rows for this user & these item IDs, ignore duplicates
  //bulk insert lots of items at once as array of items which are expanded into rows
  const insertResult = await query(
    `INSERT INTO user_item_metadata (user_id, item_id)
     SELECT $1, x
     FROM unnest($2::int[]) AS x 
     ON CONFLICT (user_id, item_id) DO NOTHING`,
    [userId, itemIds]
  );
  logAction(`Added items into user's metadata: User=${userId} itemCount=${insertResult.rowCount}`);
  return { added: insertResult.rowCount };
};


//get all unread items of all sources
export const userFeedItems = async (
  userId: number,
  feedType: 'rss' | 'podcast' = 'rss'
): Promise<FeedItems[]> => {
  const interval = feedType === 'podcast' ? '6 months' : '2 days';
  const table = feedType === 'podcast' ? 'user_podcast' : 'user_source';

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
           FILTER (WHERE c.name IS NOT NULL), '[]') AS categories    FROM item i
    INNER JOIN source s ON i.source_id = s.source_id
    INNER JOIN ${table} us ON us.${feedType === 'podcast' ? 'podcast_id' : 'source_id'} = i.source_id
    LEFT JOIN user_item_metadata uim
      ON uim.item_id = i.item_id AND uim.user_id = us.user_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    WHERE us.user_id = $1
      AND i.pub_date >= NOW() - interval '${interval}'
      AND (uim.read_time IS NULL)
    ${feedType ? 'AND s.feed_type = $2' : ''}
    GROUP BY i.item_id, s.source_name, s.feed_type, s.source_id, us.priority, uim.is_save
    ORDER BY us.priority, i.pub_date DESC`;

  const params = feedType ? [userId, feedType] : [userId];
  const result = await query(baseQuery, params);
  console.log(
    'CATEGORY TEST → FULL CATEGORIES:',
    JSON.stringify(
      result.rows.map((r) => ({
        item_id: r.item_id,
        categories: r.categories,
      })),
      null,
      2
    )
  );
  const uncategorized = result.rows.filter((item) => !item.is_categorized);

  for (const item of uncategorized) {
    await categorizeItem(item.item_id, item.title);
    await query(`UPDATE item SET is_categorized = true WHERE item_id = $1`, [item.item_id]);
  }
  if (uncategorized.length > 0) {
    // re-run query to include newly added categories
    const refreshed = await query(baseQuery, params);
    return refreshed.rows;
  }
  return result.rows;
};



export const getItemsByCategory = async (
  userId: number,
  categoryName: string,
  feedType: 'rss' | 'podcast' = 'rss'
): Promise<Item[]> => {
  const interval = feedType === 'podcast' ? '6 months' : '2 days';
  const table = feedType === 'podcast' ? 'user_podcast' : 'user_source';
  const joinKey = feedType === 'podcast' ? 'podcast_id' : 'source_id';

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
      COALESCE(json_agg(DISTINCT jsonb_build_object('name', c.name, 'color', c.color)) 
           FILTER (WHERE c.name IS NOT NULL), '[]') AS categories    
           FROM item i
    INNER JOIN source s ON i.source_id = s.source_id
    INNER JOIN ${table} us ON us.${joinKey} = i.source_id
    LEFT JOIN user_item_metadata uim 
      ON uim.item_id = i.item_id AND uim.user_id = us.user_id
    LEFT JOIN item_category ic ON ic.item_id = i.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    WHERE us.user_id = $1
      AND i.pub_date >= NOW() - interval '${interval}'
      AND c.name = $2
      AND s.feed_type = $3
    GROUP BY i.item_id, s.source_name, s.feed_type, s.source_id, us.priority, uim.is_save, i.is_categorized
    ORDER BY us.priority, i.pub_date DESC;
  `;

  const params = [userId, categoryName, feedType];
  const result = await query(baseQuery, params);

  // Auto-categorize any uncategorized items safely
  for (const item of result.rows.filter((i) => !i.is_categorized)) {
    try {
      await categorizeItem(item.item_id, item.title, item.description);
    } catch (err) {
      console.error(`Failed to categorize item ${item.item_id}:`, err);
    }
  }

  return result.rows;
};

export const getSavedItemsByCategory = async (
  userId: number,
  categoryName: string,
  feedType?: 'rss' | 'podcast'
): Promise<Item[]> => {
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
        json_agg(
          DISTINCT jsonb_build_object('name', c.name, 'color', c.color)
        ) FILTER (WHERE c.name IS NOT NULL),
      '[]') AS categories
    FROM user_item_metadata uim
    JOIN item i ON uim.item_id = i.item_id
    JOIN source s ON i.source_id = s.source_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    WHERE uim.user_id = $1
      AND uim.is_save = TRUE
      AND c.name = $2
      ${feedType ? 'AND s.feed_type = $3' : ''}
    GROUP BY i.item_id, s.source_name, s.feed_type, i.is_categorized
    ORDER BY i.pub_date DESC
  `;

  const params = feedType ? [userId, categoryName, feedType] : [userId, categoryName];
  const result = await query(baseQuery, params);

  // Auto-categorize uncategorized saved items
  const uncategorized = result.rows.filter((item) => !item.is_categorized);
  for (const item of uncategorized) {
    try {
      await categorizeItem(item.item_id, item.title, item.description);
    } catch (err) {
      console.error(`Error categorizing saved item ${item.item_id}:`, err);
    }
  }

  return result.rows;
};




//mark an item as read
//handles both “insert if missing” and “update if exists” in one query.
export const markItemRead = async (
  userId: number,
  itemId: number,
  feedType: 'rss' | 'podcast' = 'rss'
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

  // feedType is already provided, so no need for another query
  logAction(`Marked ${feedType} item as read: User=${userId} Item=${itemId}`);

  if (!markedItem) return { user_id: userId, item_id: itemId, read: false, feed_type: feedType };

  return { ...markedItem, read: true, feed_type: feedType };
};




//add an item into the item table
// const limit = pLimit(5);  //limit to 5 concurrent AI category calls

export const addItem = async (
  sourceId: number,
  items: {
    link: string;
    title: string;
    description: string | null;
    pubDate: string | Date | null;
  }[]
): Promise<AddItemResult> => {
  //bulk insert
  const insertItem: Promise<QueryResult<InsertedItem>>[] = items.map((i) =>
    query<InsertedItem>(
      `INSERT INTO item(source_id, link, title, description, pub_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (source_id, link) DO NOTHING
     RETURNING item_id`,
      [sourceId, i.link, i.title, i.description, i.pubDate]
    )
  );
  const results: QueryResult<InsertedItem>[] = await Promise.all(insertItem);

  //aggregate inserted IDs and count the number of items inserted
  const insertedIds: number[] = [];
  let insertCount = 0;
  results.forEach((result) => {
    const insertedRow = getFirstRow(result);
    if (insertedRow) {
      insertCount++;
      insertedIds.push(insertedRow.item_id);
    }
  });

  logAction(`Inserted items of Source=${sourceId} itemCount=${insertCount}`);
  return { insertCount, insertedIds };
};




//mark all unread items of all sources read
//Handles both “insert if missing” and “update if exists” in one query.
export const markUserFeedItemsRead = async (
  userId: number,
  feedType: 'rss' | 'podcast' = 'rss'
): Promise<ReadItemResult> => {
  const table = feedType === 'podcast' ? 'user_podcast' : 'user_source';
  const idColumn = feedType === 'podcast' ? 'podcast_id' : 'source_id';
  const interval = feedType === 'podcast' ? '6 months' : '2 days';

  const result = await query(
    `INSERT INTO user_item_metadata (user_id, item_id, read_time)
    SELECT $1, i.item_id, NOW()
    FROM item i
    JOIN ${table} us ON us.${idColumn} = i.source_id
    WHERE us.user_id = $1
      AND i.pub_date >= NOW() - interval '${interval}'
    ON CONFLICT (user_id, item_id)
      DO UPDATE SET read_time = EXCLUDED.read_time
    RETURNING user_id, item_id, read_time`,
    [userId]
  );

  logAction(`Marked ${feedType} items as read: User=${userId} itemCount=${result.rowCount}`);

  return { readCount: result.rowCount };
};


// interface SaveItem extends Save{
//     saved: boolean;
// }

//save or unsave an item
//Handles both “insert if missing” and “update if exists” in one query
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

//get all items published in the past 2 days
export const getRecentItems = async (sourceId: number, days = 2): Promise<number[]> => {
  const result: QueryResult<Pick<Item, 'item_id'>> = await query(
    `SELECT item_id FROM item 
     WHERE source_id = $1 
     AND pub_date >= NOW() - interval '${days} days'`,
    [sourceId]
  );
  logAction(`Recent item IDs: Source=${sourceId} Days=${days} itemCount=${result.rows.length}`);
  return result.rows.map((r) => r.item_id);
};

//get all saved items for a user
export const allSavedItems = async (
  userId: number,
  feedType?: 'podcast' | 'rss' | string
): Promise<Item[]> => {
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
        json_agg(
          DISTINCT jsonb_build_object(
            'name', c.name,
            'color', c.color
          )
        ) FILTER (WHERE c.name IS NOT NULL),
        '[]'
      ) AS categories
    FROM user_item_metadata uim
    JOIN item i ON uim.item_id = i.item_id
    JOIN source s ON i.source_id = s.source_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    WHERE uim.is_save = TRUE
      AND uim.user_id = $1
      ${feedType ? 'AND s.feed_type = $2' : ''}
    GROUP BY i.item_id, s.source_name, s.feed_type, i.is_categorized
    ORDER BY i.pub_date DESC
  `;

  const params = feedType ? [userId, feedType] : [userId];
  const result: QueryResult<Item> = await query(baseQuery, params);

  // Find items not yet categorized
  const uncategorized = result.rows.filter((item) => !item.is_categorized);
  if (uncategorized.length > 0) {
    for (const item of uncategorized) {
      try {
        await categorizeItem(item.item_id, item.title, item.description);
      } catch (err) {
        console.error(`Error categorizing saved item ${item.item_id}:`, err);
      }
    }
    const refreshed = await query(baseQuery, params);
    logAction(
      `Saved items: User=${userId} feedType=${feedType || 'all'} itemCount=${refreshed.rows.length} (refreshed after categorization)`
    );
    return refreshed.rows;
  }

  logAction(
    `Saved items: User=${userId} feedType=${feedType || 'all'} itemCount=${result.rows.length}`
  );
  return result.rows;
};

interface AllReadItems extends Item {
  read_time: string | Date;
}

//get all read items of a user
export const readItems = async (userId: number, feedType?: 'rss' | 'podcast'): Promise<AllReadItems[]> => {
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
        json_agg(
          DISTINCT jsonb_build_object(
            'name', c.name,
            'color', c.color
          )
        ) FILTER (WHERE c.name IS NOT NULL),
        '[]'
      ) AS categories
    FROM user_item_metadata uim
    JOIN item i ON uim.item_id = i.item_id
    JOIN source s ON i.source_id = s.source_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    WHERE uim.read_time IS NOT NULL
      AND uim.user_id = $1
      ${feedType ? 'AND s.feed_type = $2' : ''}
    GROUP BY i.item_id, s.source_name, s.feed_type, uim.read_time, i.is_categorized
    ORDER BY i.pub_date DESC
  `;

  const params = feedType ? [userId, feedType] : [userId];
  const result: QueryResult<AllReadItems> = await query(baseQuery, params);

  // Only categorize uncategorized items
  const uncategorized = result.rows.filter((item) => !item.is_categorized);
  if (uncategorized.length) {
    for (const item of uncategorized) {
      try {
        await categorizeItem(item.item_id, item.title, item.description);
      } catch (err) {
        console.error(`Error categorizing read item ${item.item_id}:`, err);
      }
    }1
    const refreshed = await query(baseQuery, params);
    logAction(
      `Saved items: User=${userId} feedType=${feedType || 'all'} itemCount=${refreshed.rows.length} (refreshed after categorization)`
    );
    return refreshed.rows;
  }

  logAction(
    `Read items: User=${userId} feedType=${feedType || 'all'} itemCount=${result.rows.length}`
  );
  return result.rows;
};

