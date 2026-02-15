import { query } from '../config/db';
import { categorizeItem } from '../utils/categorizer';
import { getFirstRow, logAction, markAsCreated, QueryResult } from '../utils/helpers';
import { Item, ReadItemResult, Source } from './types';

export interface Folder {
  user_id: number;
  folder_id: number;
  name: string;
}

export interface CreatedFolder extends Folder {
  created: boolean;
}

export type NewFolder = Omit<Folder, 'folder_id'>;

interface UserFolder extends Folder {
  sources: {
    source_id: number;
    source_name: string;
  }[];
}

interface UserFolderRow {
  folder_id: number;
  user_id: number;
  folder_name: string;
  source_id: number | null;
  source_name: string | null;
}

interface FolderItems extends Item {
  source_id: number;
  is_save: boolean;
  feed_type: 'rss' | 'podcast';
}

interface AddSourceToFolder extends Omit<Folder, 'name'> {
  source_id: number;
  added: boolean;
}

//create a folder for a user
export const createFolder = async (folder: NewFolder): Promise<CreatedFolder> => {
  const insertResult: QueryResult<Folder> = await query(
    `INSERT INTO folder(user_id, name)
         VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO NOTHING
         RETURNING user_id, folder_id, name`,
    [folder.user_id, folder.name]
  );
  const newFolder = getFirstRow(insertResult);
  if (newFolder) {
    logAction(`Created new folder for the User=${folder.user_id}: Folder="${folder.name}"`);
    return markAsCreated(newFolder);
  }
  const selectResult: QueryResult<Folder> = await query(
    `SELECT user_id, folder_id, name FROM folder WHERE user_id = $1 AND name = $2`,
    [folder.user_id, folder.name]
  );
  const existingFolder = getFirstRow(selectResult);
  if (!existingFolder) {
    throw new Error(`User not found`);
  }
  logAction(`Existing folder for the User=${folder.user_id}: Folder="${folder.name}"`);
  return { ...existingFolder, created: false };
};

//delete a folder for a user
export const deleteFolder = async (userId: number, folderId: number): Promise<Folder | null> => {
  const insertResult: QueryResult<Folder> = await query(
    `DELETE FROM folder
        WHERE user_id = $1 AND folder_id = $2
        RETURNING folder_id, name`,
    [userId, folderId]
  );
  const deletedFolder = getFirstRow(insertResult);
  if (deletedFolder) {
    logAction(`Deleted folder for the User=${userId}: Folder=${folderId}`);
  }
  return deletedFolder;
};

//rename a folder for a user
export const renameFolder = async (
  userId: number,
  folderId: number,
  name: string
): Promise<Folder> => {
  const result: QueryResult<Folder> = await query(
    'UPDATE folder SET name = $1 WHERE folder_id = $2 AND user_id = $3 RETURNING *',
    [name, folderId, userId]
  );
  return result.rows[0];
};

//get all folders for a user
export const getUserFolders = async (userId: number): Promise<UserFolder[]> => {
  const insertResult: QueryResult<UserFolderRow> = await query(
    `SELECT
    f.folder_id,
    f.user_id,
    f.name AS folder_name,
    s.source_id,
    s.source_name
  FROM folder f
  LEFT JOIN user_source_folder usf
  ON f.folder_id = usf.folder_id
  AND f.user_id = usf.user_id
  LEFT JOIN source s
    ON usf.source_id = s.source_id
  WHERE f.user_id = $1
  ORDER BY f.folder_id
  `,
    [userId]
  );
  const map = new Map<number, UserFolder>();

  for (const row of insertResult.rows) {
    if (!map.has(row.folder_id)) {
      map.set(row.folder_id, {
        folder_id: row.folder_id,
        user_id: row.user_id,
        name: row.folder_name,
        sources: [],
      });
    }

    if (row.source_id !== null) {
      map.get(row.folder_id)!.sources.push({
        source_id: row.source_id,
        source_name: row.source_name!,
      });
    }
  }
  logAction(`Number of folders of User=${userId}: folderCount=${map.size}`);
  return Array.from(map.values());
};


//get all unread items of a folder
export const folderItems = async (
  userId: number,
  folderId: number,
  timeFilter: 'all' | 'today' | 'week' | 'month' = 'all'
): Promise<FolderItems[]> => {
  const interval = '2 days';

  let timeClause = '';
  if (timeFilter === 'today') timeClause = `AND i.pub_date >= date_trunc('day', NOW())`;
  else if (timeFilter === 'week') timeClause = `AND i.pub_date >= date_trunc('week', NOW())`;
  else if (timeFilter === 'month') timeClause = `AND i.pub_date >= date_trunc('month', NOW())`;
  else timeClause = `AND i.pub_date >= NOW() - interval '${interval}'`;

  const baseQuery = `SELECT 
      i.item_id,
      i.title,
      i.link,
      i.description,
      i.pub_date,
      s.source_id,
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
    INNER JOIN source s 
      ON i.source_id = s.source_id
    INNER JOIN user_source_folder usf 
      ON usf.source_id = s.source_id 
      AND usf.user_id = $1 
      AND usf.folder_id = $2
    INNER JOIN user_source us 
      ON us.user_id = $1 
      AND us.source_id = s.source_id
    LEFT JOIN user_item_metadata uim 
      ON uim.user_id = $1 
      AND uim.item_id = i.item_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    LEFT JOIN item_tag t ON i.item_id = t.item_id
    WHERE 1=1
          ${timeClause}
      AND (uim.read_time IS NULL)
            AND (
        (s.feed_type = 'rss' AND i.pub_date >= NOW() - interval '2 days')
        OR
        (s.feed_type = 'podcast' AND i.pub_date >= NOW() - interval '6 months')
      )
    GROUP BY i.item_id, s.source_name, s.feed_type, s.source_id, us.priority, uim.is_save, i.is_categorized
    ORDER BY us.priority, i.pub_date DESC`;

  const params = [userId, folderId];
  const result: QueryResult<FolderItems> = await query(baseQuery, params);
  // Categorize items that aren’t categorized yet
  const uncategorized = result.rows.filter((item) => !item.is_categorized);
  if (uncategorized.length) {
    for (const item of uncategorized) {
      try {
        await categorizeItem(item.item_id, item.title, item.description);
      } catch (err) {
        console.error(`Error categorizing item ${item.item_id}:`, err);
      }
    }
    const refreshed = await query(baseQuery, params);
    logAction(
      `Folder items: User=${userId} Folder=${folderId} itemCount=${refreshed.rows.length} (refreshed after categorization)`
    );
    return refreshed.rows;
  }

  logAction(`Folder items: User=${userId} Folder=${folderId} itemCount=${result.rows.length}`);
  return result.rows;
};

//add a source into a folder
export const addSourceIntoFolder = async (
  userId: number,
  folderId: number,
  sourceId: number
): Promise<AddSourceToFolder> => {
  const insertResult: QueryResult<AddSourceToFolder> = await query(
    `INSERT INTO user_source_folder(user_id, folder_id, source_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, folder_id, source_id) DO NOTHING
        RETURNING user_id, folder_id, source_id`,
    [userId, folderId, sourceId]
  );

  const addedSource = getFirstRow(insertResult);
  if (addedSource) {
    logAction(`Added source to folder: User=${userId} Folder=${folderId} Source=${sourceId}`);
    return { ...addedSource, added: true };
  }

  //if source already exists in the folder, get it
  const selectResult: QueryResult<AddSourceToFolder> = await query(
    `SELECT user_id, folder_id, source_id FROM user_source_folder WHERE user_id = $1 AND folder_id = $2 AND source_id = $3`,
    [userId, folderId, sourceId]
  );
  const existingSource = getFirstRow(selectResult);

  if (!existingSource) {
    throw new Error(`Source ${sourceId} not found in folder ${folderId} for user ${userId}`);
  }

  logAction(
    `Source already exists in folder: User=${userId} Folder=${folderId} Source=${sourceId}`
  );
  return { ...existingSource, added: false };
};

type DeletedSource = Omit<Source, 'source_name'>;

//delete a source from a folder
export const delSourceFromFolder = async (
  userId: number,
  folderId: number,
  sourceId: number
): Promise<DeletedSource[]> => {
  await query<DeletedSource>(
    `DELETE FROM user_source_folder 
        WHERE user_id = $1 AND folder_id = $2 AND source_id = $3`,
    [userId, folderId, sourceId]
  );
  logAction(`Removed source from folder: User=${userId} Folder=${folderId} Source=${sourceId}`);
  const folderSources: QueryResult<DeletedSource> = await query(
    `SELECT source_id FROM user_source_folder 
        WHERE user_id = $1`,
    [userId]
  );
  return folderSources.rows;
};


//mark all items of a folder of a user as read
export const markFolderItemsRead = async (
  userId: number,
  folderId: number
): Promise<ReadItemResult> => {
  const result = await query(
    `INSERT INTO user_item_metadata (user_id, item_id, read_time)
     SELECT $1, i.item_id, NOW()
     FROM item i
     JOIN user_source_folder usf 
       ON usf.source_id = i.source_id 
       AND usf.user_id = $1 
       AND usf.folder_id = $2
     JOIN user_source us 
       ON us.user_id = $1 
       AND us.source_id = i.source_id
     JOIN source s 
       ON s.source_id = i.source_id
     WHERE 
       (s.feed_type = 'rss' AND i.pub_date >= NOW() - interval '2 days')
       OR
       (s.feed_type = 'podcast' AND i.pub_date >= NOW() - interval '6 months')
     ON CONFLICT (user_id, item_id)
       DO UPDATE SET read_time = EXCLUDED.read_time
     RETURNING item_id;`,
    [userId, folderId]
  );

  logAction(`Marked folder items as read: User=${userId} Folder=${folderId} itemCount=${result.rowCount ?? 0}`);
  return { readCount: result.rowCount ?? 0 };
};

