import { query } from '../config/db';
import { SourcePriorityUpdate } from '../controllers/types';
import { categorizeItem } from '../utils/categorizer';
import { getLogo } from '../utils/get-logo';
import { getFirstRow, logAction, markAsCreated, QueryResult } from '../utils/helpers';
import { Source } from './types';

interface UserSource {
  user_id: number;
  source_id: number;
  priority: number;
  feed_type: "rss" | "podcast";
}

interface AddUserSourceResult extends UserSource {
  created: boolean;
}

interface AddSource extends Source {
  created: boolean;
}

interface UserSourcePriority {
  priority: number;
}

type AllUserSources = Omit<UserSource, 'user_id'>;

interface UserSources {
  source_id: number;
  source_name: string;
  url: string;
}


interface SourceWithPriority extends Source {
  priority: number;
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

  console.info(`INFO: Number of unfoldered sources for User=${userId}: ${result.rows.length}`);
  return result.rows;
};

// add a new source to the source table
export const addSource = async (
  sourceName: string,
  sourceURL: string
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
    `INSERT INTO source(source_name, url)
     VALUES ($1, $2)
     RETURNING source_id, source_name`,
    [sourceName, sourceURL]
  );
  const newSource = getFirstRow(insertResult);
  logAction(`Added new source: Name=${sourceName} URL=${sourceURL}`);
  return markAsCreated(newSource);
};


// add a source (RSS or podcast) for a user
export const addUserSource = async (
  userId: number,
  sourceId: number,
  feedType: "rss" | "podcast"
): Promise<AddUserSourceResult> => {
  // check if the user already has this source
  const selectResult: QueryResult<UserSource> = await query(
    `SELECT user_id, source_id, priority
     FROM user_source
     WHERE user_id = $1 AND source_id = $2`,
    [userId, sourceId]
  );
  const existingUserSource = getFirstRow(selectResult);

  if (existingUserSource) {
    logAction(`Source=${sourceId} for User=${userId} already exists`);
    return { ...existingUserSource, created: false };
  }

  // calculate new priority
  const priorityResult: QueryResult<{ new_priority: number }> = await query(
    `SELECT COALESCE(MAX(priority), 0) + 1 AS new_priority
     FROM user_source
     WHERE user_id = $1`,
    [userId]
  );
  const { new_priority } = getFirstRow(priorityResult) || { new_priority: 1 };
  const newPriority = new_priority || 1;

  // insert into user_source
  const insertResult: QueryResult<UserSource> = await query(
    `INSERT INTO user_source(user_id, source_id, priority, feed_type)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, source_id, priority, feed_type`,
    [userId, sourceId, newPriority, feedType]
  );
  const newUserSource = getFirstRow(insertResult);

  logAction(
    `Added a new Source=${sourceId} for User=${userId} with Priority=${newUserSource?.priority} feed_type=${feedType}`
  );

  return markAsCreated(newUserSource);
};





// // add a source for a user
// export const addUserRSS = async (
//   userId: number,
//   sourceId: number
// ): Promise<AddUserSourceResult> => {
//   const selectResult: QueryResult<UserSource> = await query(
//     `SELECT user_id, source_id, priority
//      FROM user_source
//      WHERE user_id = $1 AND source_id = $2`,
//     [userId, sourceId]
//   );
//   const existingUserSource = getFirstRow(selectResult);

//   if (existingUserSource) {
//     logAction(`Source=${sourceId} for User=${userId} already exists`);
//     return { ...existingUserSource, created: false };
//   }

//   const priorityResult: QueryResult<{ new_priority: number }> = await query(
//     `SELECT COALESCE(MAX(priority), 0) + 1 AS new_priority
//      FROM user_source
//      WHERE user_id = $1`,
//     [userId]
//   );
//   const { new_priority } = getFirstRow(priorityResult) || { new_priority: 1 };
//   const newPriority = new_priority || 1;

//   const insertResult: QueryResult<UserSource> = await query(
//     `INSERT INTO user_source(user_id, source_id, priority)
//      VALUES ($1, $2, $3)
//      RETURNING user_id, source_id, priority`,
//     [userId, sourceId, newPriority]
//   );
//   const newUserSource = getFirstRow(insertResult);

//   logAction(
//     `Added a new Source=${sourceId} for User=${userId} with default Priority=${newUserSource?.priority}`
//   );
//   return markAsCreated(newUserSource);
// };


// //adding a podcast source for a user
// export const addUserPodcast = async (
//   userId: number,
//   sourceId: number
// ): Promise<AddUserSourceResult> => {
//   const selectResult: QueryResult<UserSource> = await query(
//     `SELECT user_id, podcast_id AS source_id, priority
//      FROM user_podcast 
//      WHERE user_id = $1 AND podcast_id = $2`,
//     [userId, sourceId]
//   );
//   const existingUserPodcast = getFirstRow(selectResult);

//   if (existingUserPodcast) {
//     logAction(`Podcast Source=${sourceId} for User=${userId} already exists`);
//     return { ...existingUserPodcast, created: false };
//   }

//   const priorityResult: QueryResult<{ new_priority: number }> = await query(
//     `SELECT COALESCE(MAX(priority), 0) + 1 AS new_priority
//      FROM user_podcast up
//      JOIN source s ON up.podcast_id = s.source_id
//      WHERE up.user_id = $1 AND s.feed_type = 'podcast'`,
//     [userId]
//   );

//   const { new_priority } = getFirstRow(priorityResult) || { new_priority: 1 };
//   const newPriority = new_priority || 1;

//   const insertResult: QueryResult<UserSource> = await query(
//     `INSERT INTO user_podcast (user_id, podcast_id, priority)
//      VALUES ($1, $2, $3)
//      RETURNING user_id, podcast_id AS source_id, priority`,
//     [userId, sourceId, newPriority]
//   );

//   const newUserPodcast = getFirstRow(insertResult);

//   logAction(
//     `Added new Podcast Source=${sourceId} for User=${userId} with Priority=${newUserPodcast?.priority}`
//   );

//   return markAsCreated(newUserPodcast);
// };


// remove a source for a user
export const removeUserSource = async (
  userId: number,
  sourceId: number
): Promise<AllUserSources[]> => {
  const userRow = getFirstRow(
    await query(
      `SELECT priority, feed_type FROM user_source WHERE user_id = $1 AND source_id = $2`,
      [userId, sourceId]
    )
  );
  const removedPriority = userRow?.priority ?? null;
  const feedType = userRow?.feed_type ?? 'rss';

  await query(`DELETE FROM user_source WHERE user_id = $1 AND source_id = $2`, [
    userId,
    sourceId,
  ]);

  await query(
    `DELETE FROM user_item_metadata
     WHERE user_id = $1
       AND item_id IN (SELECT item_id FROM item WHERE source_id = $2)
       AND read_time IS NULL
       AND is_save IS FALSE`,
    [userId, sourceId]
  );

  if (removedPriority !== null) {
    await query(
      `UPDATE user_source
       SET priority = priority - 1
       WHERE user_id = $1 AND priority > $2`,
      [userId, removedPriority]
    );
  }

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
    `SELECT source_id, priority FROM user_source WHERE user_id = $1 ORDER BY priority ASC`,
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
     WHERE us.user_id = $1
     ORDER BY us.priority ASC`,
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


// //get all the blog sources for a user
// export const allUserRSSSources = async (userId: number): Promise<UserRSSSources[]> => {
//   const result: QueryResult<UserRSSSources> = await query(
//     `SELECT s.source_id, s.source_name, s.url FROM user_source us
//         JOIN source s ON s.source_id = us.source_id
//         WHERE us.user_id = $1
//         ORDER BY us.priority ASC`,
//     [userId]
//   );
//   logAction(`All sources of User=${userId}: Sources=${result.rows.length}`);
//   const sourcesWithLogos = await Promise.all(
//     result.rows.map(async (source) => {
//       const logo = await getLogo(source.url);
//       return { ...source, logo_url: logo };
//     })
//   );

//   return sourcesWithLogos;
// };

// //get all the podcast sources for a user
// export const allUserPodcastSources = async (userId: number): Promise<UserPodcastSources[]> => {
//   const result: QueryResult<UserPodcastSources> = await query(
//     `SELECT s.source_id, s.source_name, s.url FROM user_podcast up
//         JOIN source s ON s.source_id = up.podcast_id
//         WHERE up.user_id = $1
//         ORDER BY up.priority ASC`,
//     [userId]
//   );
//   logAction(`All sources of User=${userId}: Sources=${result.rows.length}`);
//   const sourcesWithLogos = await Promise.all(
//     result.rows.map(async (source) => {
//       const logo = await getLogo(source.url);
//       return { ...source, logo_url: logo };
//     })
//   );

//   return sourcesWithLogos;
// };



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

  // Determine the interval based on feed_type
  const interval = source.feed_type === 'podcast' ? '6 months' : '2 days';

  const result: QueryResult<MarkReadRow> = await query(
    `
    INSERT INTO user_item_metadata (user_id, item_id, read_time)
    SELECT $1, i.item_id, NOW()
    FROM item i
    JOIN user_source us ON us.source_id = i.source_id
    WHERE us.user_id = $1
      AND i.source_id = $2
      AND i.pub_date >= NOW() - interval '${interval}'
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
          DISTINCT jsonb_build_object('name', c.name, 'color', c.color)
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
      AND (
      (s.feed_type = 'rss' AND i.pub_date >= NOW() - interval '2 days')
      OR
      (s.feed_type = 'podcast' AND i.pub_date >= NOW() - interval '6 months')
    )
    GROUP BY i.item_id, s.source_name, s.feed_type, s.source_id, us.priority, uim.is_save, i.is_categorized
    ORDER BY us.priority, i.pub_date DESC
  `;

  const params = [userId, sourceId];
  const result = await query(baseQuery, params);

  // Auto-categorize uncategorized items
  const uncategorized = result.rows.filter((item) => !item.is_categorized);

  for (const item of uncategorized) {
    await categorizeItem(item.item_id, item.title, item.description);
    await query(`UPDATE item SET is_categorized = true WHERE item_id = $1`, [item.item_id]);
  }

  if (uncategorized.length > 0) {
    const refreshed = await query(baseQuery, params);
    return refreshed.rows;
  }

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







//get all sources for a user ordered by priority
export const sourcePriority = async (
  userId: number,
  feedType?: string
): Promise<SourceWithPriority[]> => {
  // Decide which table to use based on feed type
  const table = feedType === 'podcast' ? 'user_podcast' : 'user_source';

  const result: QueryResult<SourceWithPriority> = await query(
    `
    SELECT us.${feedType === 'podcast' ? 'podcast_id' : 'source_id'} AS source_id,
           us.priority,
           s.source_name
    FROM ${table} us
    JOIN source s ON us.${feedType === 'podcast' ? 'podcast_id' : 'source_id'} = s.source_id
    WHERE us.user_id = $1
    ORDER BY us.priority ASC
    `,
    [userId]
  );

  logAction(`Source priorities (${feedType || 'all'}): User=${userId} count=${result.rows.length}`);

  return result.rows;
};

//update source priorities for a user
export const updateSourcePriorities = async (
  userId: number,
  sources: SourcePriorityUpdate[],
  feedType: 'podcast' | 'rss' = 'rss'
): Promise<void> => {
  if (!sources.length) return;

  const table = feedType === 'podcast' ? 'user_podcast' : 'user_source';
  const idColumn = feedType === 'podcast' ? 'podcast_id' : 'source_id';

  const client = await (await import('../config/db')).default.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);

    //re-insert in new priority order
    for (const s of sources) {
      await client.query(
        `INSERT INTO ${table}(user_id, ${idColumn}, priority) VALUES ($1, $2, $3)`,
        [userId, s.source_id, s.priority]
      );
    }

    await client.query('COMMIT');
    console.info(
      `INFO: Updated ${feedType} priorities for user ${userId} (count=${sources.length}).`
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Failed to update ${feedType} priorities:`, err);
    throw err;
  } finally {
    client.release();
  }
};