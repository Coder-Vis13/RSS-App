
import { query } from "../config/db";
import { getFirstRow, logAction, markAsCreated } from "../utils/helpers";
import { QueryResult } from "../utils/helpers";
import { getLogo } from "../utils/getLogo";

export interface DBUser {
user_id: number;
name: string;
email: string;
password_hash?: string;
created_at: string;  //should this be date?
}

export interface User extends DBUser {
    created: boolean;
}

export type NewUser = Omit<DBUser, "user_id" | "created_at">;


//create a new user
const addUser = async (user: NewUser): Promise<User> => {
  //try to insert. if it exists, select it  
  const insertResult: QueryResult<DBUser> = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING user_id, name, email, password_hash, created_at`,
    [user.name, user.email, user.password_hash]
  );
    const insertedUser = getFirstRow(insertResult);

    if (insertedUser) {
        logAction(`Registered new user with Email=${user.email}`);
        return markAsCreated(insertedUser);
  }

  // If email already exists, fetch existing user details
  const selectResult: QueryResult<DBUser> = await query(
    `SELECT user_id, name, email, created_at FROM users WHERE email = $1`,
    [user.email]
  );
  const existingUser = getFirstRow(selectResult);
   if (!existingUser) {
    throw new Error(`User with email ${user.email} not found`);
  }
  logAction(`Existing user with Email=${user.email}`);
  return { ...existingUser, created: false };
};



export interface Folder {
  user_id: number;
  folder_id: number;
  name: string;
}

export interface CreatedFolder extends Folder {
  created: boolean;
}

export type NewFolder = Omit<Folder, "folder_id">; //do not omit user_id since i have to explicitly give the user_id to the function

//create a folder for a user
const createFolder = async (folder: NewFolder): Promise<CreatedFolder> => {
    //try to insert. if it exists, select it  
    const insertResult: QueryResult<Folder> = await query(
        `INSERT INTO folder(user_id, name)
         VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO NOTHING
         RETURNING user_id, folder_id, name`, [folder.user_id, folder.name]
    );
    const newFolder = getFirstRow(insertResult);
    if (newFolder) {
    logAction(`Created new folder for the User=${folder.user_id}: Folder="${folder.name}"`);
    return markAsCreated(newFolder);
  }
  //folder already exists. getting existing folder
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
const deleteFolder = async ( userId: number, folderId: number ): Promise<Folder | null> => {
    const insertResult: QueryResult<Folder> = await query(
        `DELETE FROM folder
        WHERE user_id = $1 AND folder_id = $2
        RETURNING folder_id, name`, [userId, folderId]
    );
    const deletedFolder = getFirstRow(insertResult);
    if (deletedFolder) {
    logAction(`Deleted folder for the User=${userId}: Folder=${folderId}`);
  }
  return deletedFolder;
};


const renameFolder = async(userId: number, folderId: number, name: string): Promise<Folder> => {
  const result: QueryResult<Folder> = await query (
     "UPDATE folder SET name = $1 WHERE folder_id = $2 AND user_id = $3 RETURNING *",
    [name, folderId, userId]
  )
  return result.rows[0];
}


//get all folders for a user
const getUserFolders = async (userId: number): Promise<Pick<Folder, "folder_id" | "name">[]> => {
    const insertResult: QueryResult<Pick<Folder, "folder_id" | "name">> = await query(
        `SELECT folder_id, name
        FROM folder WHERE user_id = $1`, [userId]
    );
    logAction(`Number of folders of User=${userId}: folderCount=${insertResult.rows.length}`);
    return insertResult.rows;
};

interface Source {
    source_id: number;
    source_name: string;
}
interface AddSource extends Source {
  created: boolean;
}

//add a new source to the source table. if it already exists, get it
const addSource = async (sourceName: string, sourceURL: string): Promise<AddSource> => {

    //if source already exists
    const selectResult: QueryResult<Pick<Source, "source_id" | "source_name">> = await query(
        `SELECT source_id, source_name FROM source
        WHERE url = $1`, [sourceURL]
    );
    const existingSource = getFirstRow(selectResult);

    if (existingSource) {
        logAction(`Source Name=${sourceName} already exists`);
        return { ...existingSource, created: false };
    }
    
    //if source doesn't already exist, add a new row
    const insertResult: QueryResult<Pick<Source, "source_id" | "source_name">>  = await query(
        `INSERT INTO source(source_name, url)
        VALUES ($1, $2)
        RETURNING source_id, source_name`, [sourceName, sourceURL]
    );
    const newSource = getFirstRow(insertResult);
    logAction(`Added new source: Name=${sourceName} URL=${sourceURL}`);
    return markAsCreated(newSource);
};


interface UserSource {
    user_id: number;
    source_id: number;
    priority: number;
}


interface AddUserSourceResult extends UserSource{
    created: boolean;
}


//adding a source for a user
const addUserSource = async (userId: number, sourceId: number):Promise<AddUserSourceResult>  => {
    //check if it exists
    const selectResult: QueryResult<UserSource> = await query(
        `SELECT user_id, source_id, priority
        FROM user_source 
        WHERE user_id = $1 AND source_id = $2`, [userId, sourceId]
    );
    const existingUserSource = getFirstRow(selectResult);

    if (existingUserSource) {
        logAction(`Source=${sourceId} for the User=${userId} already exists `);
        return { ...existingUserSource, created: false };
  }
    //get a new default priority for the source
    const priorityResult: QueryResult<{new_priority: number}> = await query(
        `SELECT COALESCE(MAX(priority),0)+1 AS new_priority FROM user_source
        WHERE user_id = $1`, [userId]
    );
    const { new_priority } = getFirstRow(priorityResult) || { new_priority: 1 };
    const newPriority = new_priority || 1;

    const insertResult: QueryResult<UserSource> = await query(
        `INSERT INTO user_source(user_id, source_id, priority)
        VALUES ($1, $2, $3)
        RETURNING user_id, source_id, priority`, [userId, sourceId, newPriority]
    );   
    const newUserSource = getFirstRow(insertResult);
    logAction(`Added a new Source=${sourceId} for User=${userId} with a default Priority=${newUserSource?.priority}`);
    return markAsCreated(newUserSource);
};

interface UserSourcePriority {
  priority: number;
}

type AllUserSources = Omit<UserSource, "user_id">;


//remove a source for a user
const removeUserSource = async (
  userId: number,
  sourceId: number
): Promise<AllUserSources[]> => {
  // Get the priority of the source being removed
  const userPriority: QueryResult<UserSourcePriority> = await query(
    `SELECT priority FROM user_source WHERE user_id = $1 AND source_id = $2`,
    [userId, sourceId]
  );
  const removedPriorityRow = getFirstRow(userPriority);
  const removedPriority = removedPriorityRow?.priority ?? null;

  // Delete the source for the user
  await query(
    `DELETE FROM user_source WHERE user_id = $1 AND source_id = $2`,
    [userId, sourceId]
  );

  // Delete unread items of that source that aren't saved
  await query(
    `DELETE FROM user_item_metadata 
     WHERE user_id = $1 
       AND item_id IN (SELECT item_id FROM item WHERE source_id = $2) 
       AND read_time IS NULL 
       AND is_save IS FALSE`,
    [userId, sourceId]
  );

  // Fix all priorities
  if (removedPriority !== null) {
    await query(
      `UPDATE user_source 
       SET priority = priority - 1 
       WHERE user_id = $1 
         AND priority > $2`,
      [userId, removedPriority]
    );
  }

  // If no users are still subscribed to the source and no metadata exists, delete the source
  const stillUsedSource = await query(
    `SELECT 1 FROM user_source WHERE source_id = $1 LIMIT 1`,
    [sourceId]
  );
  const metadataExists = await query(
    `SELECT 1 FROM user_item_metadata uim 
     INNER JOIN item i ON uim.item_id = i.item_id 
     WHERE i.source_id = $1 LIMIT 1`,
    [sourceId]
  );

  if (stillUsedSource.rowCount === 0 && metadataExists.rowCount === 0) {
    await query(
      `DELETE FROM source WHERE source_id = $1`,
      [sourceId]
    );
    logAction(`Deleted source that no users are subscribed to: Source=${sourceId}`);
  }

  // Get all sources of the user
  const sourcesResult = await query<AllUserSources>(
    `SELECT source_id, priority FROM user_source WHERE user_id = $1 ORDER BY priority ASC`,
    [userId]
  );

  logAction(`Updated list of sources after removal of a source: User=${userId} Source=${sourceId}`);
  return sourcesResult.rows;
};

interface UserSources {
    source_id: number;
    source_name: string;
    url: string;
}

//get all the sources for a user


const allUserSources = async (userId: number): Promise<UserSources[]> => {
    const result: QueryResult<UserSources> = await query(
        `SELECT s.source_id, s.source_name, s.url FROM user_source us
        JOIN source s ON s.source_id = us.source_id
        WHERE us.user_id = $1
        ORDER BY us.priority ASC`, [userId]
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

// const allUserSources = async (userId: number): Promise<UserSources[]> => {
//     const result: QueryResult<UserSources> = await query(
//         `SELECT s.source_id, s.source_name FROM user_source us
//         JOIN source s ON s.source_id = us.source_id
//         WHERE us.user_id = $1
//         ORDER BY us.priority ASC`, [userId]
//     ); 
//     logAction(`All sources of User=${userId}: Sources=${result.rows.length}`);
//     return result.rows;
// };

interface InsertedItem {
  item_id: number;
}

export interface AddItemResult {
  insertCount: number;
  insertedIds: number[];
}

//add an item into the item table
const addItem = async (sourceId: number, items:{
  link: string;
  title: string;
  description: string | null;
  pubDate: string | Date | null;
}[]): Promise<AddItemResult> => {
  //bulk insert
  const insertItem: Promise<QueryResult<InsertedItem>>[] = items.map(i => query<InsertedItem>(
    `INSERT INTO item(source_id, link, title, description, pub_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (source_id, link) DO NOTHING
     RETURNING item_id`,
    [sourceId, i.link, i.title, i.description, i.pubDate]
  ));
  const results: QueryResult<InsertedItem>[]= await Promise.all(insertItem);

  //aggregate inserted IDs and count the number of items inserted
  const insertedIds: number[] = [];
  let insertCount = 0;
  results.forEach(result => {
    const insertedRow = getFirstRow(result);
    if (insertedRow) {
      insertCount++;
      insertedIds.push(insertedRow.item_id);
    }
  });

  logAction(`Inserted items of Source=${sourceId} itemCount=${insertCount}`);
  return { insertCount, insertedIds };
};

interface Items{
    item_id: number;
    title: string;
    link: string;
    description: string;
    pub_date: string | Date;
    source_name: string;
}

interface FeedItems extends Items {
  is_save: boolean;
}

//get all unread items sorted by priority
const userFeedItems = async (userId: number): Promise<Items[]> => {
  const result: QueryResult<Items> = await query(
    `SELECT 
        i.item_id, i.title, i.link, i.description, i.pub_date, i.source_id, s.source_name,
        COALESCE(uim.is_save, false) AS is_save
     FROM item i
     INNER JOIN source s ON i.source_id = s.source_id
     INNER JOIN user_source us ON us.source_id = i.source_id
     LEFT JOIN user_item_metadata uim
       ON uim.item_id = i.item_id AND uim.user_id = us.user_id AND uim.read_time IS NULL
     WHERE us.user_id = $1
       AND i.pub_date >= NOW() - interval '2 days'
     ORDER BY us.priority, i.pub_date DESC`,
    [userId]
  );
  return result.rows;
};



interface FolderItems extends Items {
    source_id: number;
    is_save: boolean;
}

//get all unread items for a folder for a user
const folderItems = async (userId: number, folderId: number): Promise<FolderItems[]> => {
  const result: QueryResult<FolderItems> = await query(
    `SELECT i.item_id, i.title, i.link, i.description, i.pub_date, s.source_id, s.source_name,
      COALESCE(uim.is_save, false) AS is_save
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
     WHERE i.pub_date >= NOW() - interval '2 days'
       AND (uim.read_time IS NULL)
     ORDER BY us.priority, i.pub_date DESC`,
    [userId, folderId]
  );

  logAction(`Folder items: User=${userId} Folder=${folderId} itemCount=${result.rows.length}`);
  return result.rows;
};


interface AddSourceToFolder extends Omit<Folder, 'name'> {
    source_id: number;
    added: boolean;
}

//add a source into a folder
const addSourceIntoFolder = async (userId: number, folderId: number, sourceId: number): Promise<AddSourceToFolder> => {
    const insertResult: QueryResult<AddSourceToFolder> = await query(
        `INSERT INTO user_source_folder(user_id, folder_id, source_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, folder_id, source_id) DO NOTHING
        RETURNING user_id, folder_id, source_id`, [userId, folderId, sourceId]
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

  logAction(`Source already exists in folder: User=${userId} Folder=${folderId} Source=${sourceId}`);
  return { ...existingSource, added: false };
};

type DeletedSource = Omit<Source, "source_name"> 

//delete a source from a folder
const delSourceFromFolder = async (userId: number, folderId: number, sourceId: number): Promise<DeletedSource[]> => {
    await query<DeletedSource>(
        `DELETE FROM user_source_folder 
        WHERE user_id = $1 AND folder_id = $2 AND source_id = $3`, [userId, folderId, sourceId]
    );
      logAction(`Removed source from folder: User=${userId} Folder=${folderId} Source=${sourceId}`);
    const folderSources: QueryResult<DeletedSource> = await query(
        `SELECT source_id FROM user_source_folder 
        WHERE user_id = $1`, [userId]
    );
    return folderSources.rows;
};

interface ItemsInserted {
    added: number | null;
}

//add items into userItemMetadata table
const addUserItemMetadata = async (userId: number, itemIds: number[]): Promise<ItemsInserted> => {
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

interface MarkReadRow {
    user_id: number;
    item_id: number;
    read_time?: string | Date;
}

interface MarkRead extends MarkReadRow {
    read: boolean;
}

//mark an item as read
//handles both “insert if missing” and “update if exists” in one query.
const markItemRead = async (userId: number, itemId: number): Promise<MarkRead> => {
    const insertResult: QueryResult<MarkReadRow> = await query(
        `INSERT INTO user_item_metadata (user_id, item_id, read_time)
        VALUES($1, $2, NOW())
        ON CONFLICT (user_id, item_id) DO UPDATE
            SET read_time = EXCLUDED.read_time --overwrite old timestamp if a row already exists
        RETURNING user_id, item_id, read_time`, [userId, itemId]
    );
    const markedItem = getFirstRow(insertResult);
    logAction(`Marked item as read: User=${userId} Item=${itemId}`);

    if (!markedItem) 
        return { user_id: userId, item_id: itemId, read: false };
    return { ...markedItem, read: true }; 
};

interface ReadItems {
    readCount: number | null;
}

//mark all unread items of all sources read
//Handles both “insert if missing” and “update if exists” in one query.
const markuserFeedItemsRead = async (userId: number): Promise<ReadItems> => {
  const result = await query(
    `INSERT INTO user_item_metadata (user_id, item_id, read_time)
     SELECT $1, i.item_id, NOW()
     FROM item i
     JOIN user_source us ON us.source_id = i.source_id
     WHERE us.user_id = $1
       AND i.pub_date >= NOW() - interval '2 days'
     ON CONFLICT (user_id, item_id) DO UPDATE SET read_time = EXCLUDED.read_time
     RETURNING user_id, item_id, read_time`,
    [userId]
  );
  logAction(`Marked items as read: User=${userId} itemCount=${result.rowCount}`);
  return { readCount: result.rowCount };
};

const markFolderItemsRead = async (userId: number, folderId: number): Promise<ReadItems> => {
  const result = await query(
    `INSERT INTO user_item_metadata (user_id, item_id, read_time)
    SELECT $1, i.item_id, NOW()
    FROM item i
    JOIN user_source_folder usf 
      ON usf.source_id = i.source_id
    WHERE usf.user_id = $1
      AND usf.folder_id = $2
      AND i.pub_date >= NOW() - interval '2 days'
    ON CONFLICT (user_id, item_id)
      DO UPDATE SET read_time = EXCLUDED.read_time
    RETURNING item_id;`,
    [userId, folderId]
  );
  logAction(`Marked items as read: User=${userId} itemCount=${result.rowCount}`);
  return { readCount: result.rowCount };
};


interface Save {
    user_id: number;
    item_id: number, 
    is_save?: boolean;
}

// interface SaveItem extends Save{
//     saved: boolean;
// }

//save or unsave an item
//Handles both “insert if missing” and “update if exists” in one query
const saveItem = async (userId: number, itemId: number, save: boolean): Promise<Save> => {
    const insertResult: QueryResult<Save> = await query(
        `INSERT INTO user_item_metadata (user_id, item_id, is_save)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, item_id) DO UPDATE
            SET is_save = EXCLUDED.is_save
        RETURNING user_id, item_id, is_save`, [userId, itemId, save]
    );
    const savedRow = getFirstRow(insertResult) as  Save | undefined;
    logAction(`Saved/unsaved item: User=${userId} Item=${itemId} Save=${!!save}`);
    if (!savedRow) 
        return { user_id: userId, item_id: itemId, is_save: false };
    return savedRow;
  };


//get all items published in the past 2 days
const getRecentItems = async (sourceId: number, days = 2): Promise<number[]> => {
  const result: QueryResult<Pick<Items, "item_id">> = await query(
    `SELECT item_id FROM item 
     WHERE source_id = $1 
     AND pub_date >= NOW() - interval '${days} days'`,
    [sourceId]
  );
  logAction(`Recent item IDs: Source=${sourceId} Days=${days} itemCount=${result.rows.length}`);
  return result.rows.map(r => r.item_id);
};

//get all saved items for a user
const allSavedItems = async (userId: number): Promise<Items[]> => {
    const result: QueryResult<Items> = await query(
        `SELECT s.source_name, i.item_id, i.title, i.link, i.description, i.pub_date
        FROM user_item_metadata uim
        JOIN item i ON uim.item_id = i.item_id
        JOIN source s ON i.source_id = s.source_id
        WHERE uim.is_save = TRUE
        AND uim.user_id = $1
        ORDER BY i.pub_date DESC`, [userId]
    );
    logAction(`Saved items: User=${userId} itemCount=${result.rows.length}`);
    return result.rows;
};

interface SourceWithPriority extends Source {
  priority: number;
}

//get all sources for a user ordered by priority
const sourcePriority = async (userId: number): Promise<SourceWithPriority[]> => {
    const result: QueryResult<SourceWithPriority>  = await query(
        `SELECT us.source_id, us.priority, s.source_name
        FROM user_source us
        JOIN source s ON us.source_id = s.source_id
        WHERE us.user_id = $1
        ORDER BY priority ASC`, [userId]
    );
    logAction(`Source priorities: User=${userId} sourceCount=${result.rows.length}`);
    return result.rows;
};

export interface SourcePriorityUpdate {
  source_id: number;
  priority: number;
}

const updateSourcePriorities = async (
  userId: number,
  sources: SourcePriorityUpdate[]
): Promise<void> => {
  if (!sources.length) return;

  const client = await (await import("../config/db")).default.connect();
  try {
    await client.query("BEGIN");

    // Delete all user's sources
    await client.query(`DELETE FROM user_source WHERE user_id = $1`, [userId]);

    // Re-insert in new priority order
    for (const s of sources) {
      await client.query(
        `INSERT INTO user_source(user_id, source_id, priority) VALUES ($1, $2, $3)`,
        [userId, s.source_id, s.priority]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to update source priorities:", err);
    throw err;
  } finally {
    client.release();
  }
};


interface AllReadItems extends Items {
  read_time: string | Date;
}

//get all read items of a user
const readItems = async (userId: number): Promise<AllReadItems[]> => {
    const result: QueryResult<AllReadItems> = await query (
        `SELECT s.source_name, i.item_id, i.title, i.link, i.description, i.pub_date, uim.read_time
        FROM user_item_metadata uim
        JOIN item i ON uim.item_id = i.item_id
        JOIN source s ON i.source_id = s.source_id
        WHERE uim.read_time IS NOT NULL
        AND uim.user_id = $1
        ORDER BY i.pub_date DESC`, [userId]
    );
    logAction(`Read items: User=${userId} itemCount=${result.rows.length}`);
    return result.rows;
};

export { addUser, createFolder, renameFolder, addSource, addUserSource, addItem, 
userFeedItems, addSourceIntoFolder, folderItems, markItemRead, saveItem,
markuserFeedItemsRead, markFolderItemsRead, removeUserSource, delSourceFromFolder, deleteFolder, 
allUserSources, getUserFolders, allSavedItems, sourcePriority, updateSourcePriorities, readItems, addUserItemMetadata,
getRecentItems };
