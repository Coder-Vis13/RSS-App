import { query } from '../config/db';
import { getLogo } from '../utils/get-logo';
import { getFirstRow, logAction, markAsCreated, QueryResult } from '../utils/helpers';
import { Source } from './types';
import pLimit from 'p-limit';

const limit = pLimit(5);

interface UserSource {
  user_id: number;
  source_id: number;
  feed_type: 'rss' | 'podcast';
}

interface AddUserSourceResult extends UserSource {
  created: boolean;
}

interface AddSource extends Source {
  created: boolean;
}

type AllUserSources = Omit<UserSource, 'user_id'>;

interface UserSources {
  source_id: number;
  source_name: string;
  url: string;
}

interface MarkReadRow {
  user_id: number;
  item_id: number;
  read_time: Date;
}

interface SourceItem extends Source {
  item_id: number;
  title: string;
  link: string;
  description: string | null;
  pub_date: Date;
  source_id: number;
  source_name: string;
  feed_type: 'rss' | 'podcast';
  is_save: boolean;
  is_categorized: boolean;
  categories: { name: string; color: string }[];
  tags?: string[];
}

interface SourceExistsRow {
  source_id: number;
}

// get all unfoldered sources for a user
export const getUnfolderedSources = async (
  userId: number
): Promise<{ source_id: number; source_name: string }[]> => {
  const result: QueryResult<{ source_id: number; source_name: string }> = await query(
    `
    SELECT s.source_id, s.source_name
    FROM user_source us
    JOIN source s ON us.source_id = s.source_id
    LEFT JOIN user_source_folder usf
      ON us.user_id = usf.user_id
      AND us.source_id = usf.source_id
    WHERE us.user_id = $1
      AND usf.folder_id IS NULL
    ORDER BY s.source_name
    `,
    [userId]
  );

  return result.rows;
};

// add a new source to the source table
export const addSource = async (
  sourceName: string,
  sourceURL: string,
  feedType: 'rss' | 'podcast' = 'rss'
): Promise<AddSource> => {
  const selectResult: QueryResult<Pick<Source, 'source_id' | 'source_name'>> = await query(
    `SELECT source_id, source_name FROM source WHERE url = $1`,
    [sourceURL]
  );
  const existingSource = getFirstRow(selectResult);

  if (existingSource) {
    logAction(`Source Name=${sourceName} already exists`);
    return { ...existingSource, created: false };
  }

  const insertResult: QueryResult<Pick<Source, 'source_id' | 'source_name'>> = await query(
    `INSERT INTO source(source_name, url, feed_type)
     VALUES ($1, $2, $3)
     RETURNING source_id, source_name`,
    [sourceName, sourceURL, feedType]
  );
  const newSource = getFirstRow(insertResult);
  logAction(`Added new source: Name=${sourceName} URL=${sourceURL}`);
  return markAsCreated(newSource);
};

// add a source (RSS or podcast) for a user
export const addUserSource = async (
  userId: number,
  sourceId: number,
  feedType: 'rss' | 'podcast'
): Promise<AddUserSourceResult> => {
  // check if the user already has this source
  const selectResult: QueryResult<UserSource> = await query(
    `SELECT user_id, source_id
     FROM user_source
     WHERE user_id = $1 AND source_id = $2`,
    [userId, sourceId]
  );
  const existingUserSource = getFirstRow(selectResult);

  if (existingUserSource) {
    logAction(`Source=${sourceId} for User=${userId} already exists`);
    return { ...existingUserSource, created: false };
  }

  // insert into user_source
  const insertResult: QueryResult<UserSource> = await query(
    `INSERT INTO user_source (user_id, source_id, feed_type)
     VALUES ($1, $2, $3)
     RETURNING user_id, source_id, feed_type`,
    [userId, sourceId, feedType]
  );
  const newUserSource = getFirstRow(insertResult);

  logAction(`Added a new Source=${sourceId} for User=${userId} feed_type=${feedType}`);

  return markAsCreated(newUserSource);
};

// remove a source for a user
export const removeUserSource = async (
  userId: number,
  sourceId: number
): Promise<AllUserSources[]> => {
  const userRow = getFirstRow(
    await query(
      `SELECT feed_type
     FROM user_source
     WHERE user_id = $1 AND source_id = $2`,
      [userId, sourceId]
    )
  );

  const feedType = userRow?.feed_type ?? 'rss';

  await query(`DELETE FROM user_source WHERE user_id = $1 AND source_id = $2`, [userId, sourceId]);

  await query(
    `DELETE FROM user_item_metadata
     WHERE user_id = $1
       AND item_id IN (SELECT item_id FROM item WHERE source_id = $2)
       AND read_time IS NULL
       AND is_save IS FALSE`,
    [userId, sourceId]
  );

  const stillUsed = await query(`SELECT 1 FROM user_source WHERE source_id = $1 LIMIT 1`, [
    sourceId,
  ]);
  const metadataExists = await query(
    `SELECT 1 FROM user_item_metadata uim
     INNER JOIN item i ON uim.item_id = i.item_id
     WHERE i.source_id = $1 LIMIT 1`,
    [sourceId]
  );

  if (stillUsed.rowCount === 0 && metadataExists.rowCount === 0) {
    await query(`DELETE FROM source WHERE source_id = $1`, [sourceId]);
    logAction(`Deleted ${feedType} source not used by any user: Source=${sourceId}`);
  }

  const sourcesResult = await query<AllUserSources>(
    `SELECT source_id
   FROM user_source
   WHERE user_id = $1`,
    [userId]
  );

  logAction(`Removed ${feedType} source: User=${userId} Source=${sourceId}`);
  return sourcesResult.rows;
};

// get all sources for a user (RSS + Podcasts combined)
export const allUserSources = async (userId: number): Promise<UserSources[]> => {
  const result: QueryResult<UserSources> = await query(
    `SELECT s.source_id, s.source_name, s.url, s.feed_type
     FROM user_source us
     JOIN source s ON s.source_id = us.source_id
     WHERE us.user_id = $1`,
    [userId]
  );

  logAction(`All sources of User=${userId}: Sources=${result.rows.length}`);

  const sourcesWithLogos = await Promise.all(
    result.rows.map(async (source) => {
      const logo = await getLogo(source.url);
      return { ...source, logo_url: logo };
    })
  );

  return sourcesWithLogos;
};

// mark all items of a specific source as read for a user
export const markSourceItemsRead = async (
  userId: number,
  sourceId: number
): Promise<{ readCount: number }> => {
  const sourceResult = await query<{ feed_type: 'rss' | 'podcast' }>(
    `SELECT feed_type FROM source WHERE source_id = $1`,
    [sourceId]
  );
  const source = sourceResult.rows[0];
  if (!source) throw new Error(`Source ${sourceId} not found`);

  const result: QueryResult<MarkReadRow> = await query(
    `
    INSERT INTO user_item_metadata (user_id, item_id, read_time)
    SELECT $1, i.item_id, NOW()
    FROM item i
    JOIN user_source us ON us.source_id = i.source_id
    WHERE us.user_id = $1
      AND i.source_id = $2
    ON CONFLICT (user_id, item_id)
      DO UPDATE SET read_time = EXCLUDED.read_time
    RETURNING user_id, item_id, read_time
    `,
    [userId, sourceId]
  );

  logAction(
    `Marked ${source.feed_type} source items as read: User=${userId} Source=${sourceId} itemCount=${result.rows.length}`
  );

  return { readCount: result.rows.length ?? 0 };
};

//get all items of a source
export const getSourceItems = async (
  userId: number,
  sourceId: number,
  timeFilter: 'all' | 'today' | 'week' | 'month' = 'all'
): Promise<SourceItem[]> => {
  let timeClause = '';
  if (timeFilter === 'today') timeClause = `AND i.pub_date >= date_trunc('day', NOW())`;
  else if (timeFilter === 'week') timeClause = `AND i.pub_date >= date_trunc('week', NOW())`;
  else if (timeFilter === 'month') timeClause = `AND i.pub_date >= date_trunc('month', NOW())`;

  const sourceRow = await query<{ feed_type: 'rss' | 'podcast' }>(
    `SELECT feed_type FROM source WHERE source_id = $1`,
    [sourceId]
  );
  const source = sourceRow.rows[0];
  if (!source) throw new Error(`Source ${sourceId} not found`);

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
        json_agg(
          DISTINCT jsonb_build_object('name', c.name)
        ) FILTER (WHERE c.name IS NOT NULL),
        '[]'::json
      ) AS categories,
      COALESCE(
        json_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL AND t.tag <> ''),
        '[]'::json
      ) AS tags
    FROM item i
    JOIN source s ON i.source_id = s.source_id
    JOIN user_source us ON us.source_id = i.source_id
    LEFT JOIN user_item_metadata uim
      ON uim.item_id = i.item_id AND uim.user_id = us.user_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    LEFT JOIN item_tag t ON i.item_id = t.item_id
    WHERE us.user_id = $1
      AND i.source_id = $2
      AND uim.read_time IS NULL
      ${timeClause}
    GROUP BY i.item_id, s.source_name, s.feed_type, s.source_id, uim.is_save, i.is_categorized
    ORDER BY i.pub_date DESC
  `;

  const params = [userId, sourceId];
  const result = await query(baseQuery, params);

  return result.rows;
};

//checks if the user has the source in the feed already
export const checkSourceExists = async (userId: number, sourceURL: string): Promise<boolean> => {
  //Check if a source with this URL already exists
  const sourceResult: QueryResult<SourceExistsRow> = await query(
    `
    SELECT source_id
    FROM source
    WHERE url = $1
    `,
    [sourceURL]
  );

  const source = getFirstRow(sourceResult);
  if (!source) {
    return false; // source not in DB → cannot already be in user's feed
  }

  //Check if user already has this source
  const userSourceResult: QueryResult<{ exists: number }> = await query(
    `
    SELECT 1 AS exists
    FROM user_source
    WHERE user_id = $1 AND source_id = $2
    LIMIT 1
    `,
    [userId, source.source_id]
  );

  const exists = userSourceResult.rows.length > 0;

  if (exists) {
    logAction(`Source already exists for user: User=${userId} Source=${source.source_id}`);
  }

  return exists;
};
