
import { query } from "../config/db";
import { getFirstRow, logAction, markAsCreated } from "../utils/helpers";
import { QueryResult } from "../utils/helpers";
import { getLogo } from "../utils/getLogo";
import { categorizeItem } from "../utils/categorizer";


import dotenv from "dotenv";
dotenv.config();
const USE_AI_CATEGORY = process.env.USE_AI_CATEGORY === "true";

export interface DBUser {
user_id: number;
name: string;
email: string;
password_hash?: string;
created_at: string;  
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
  folder_name: string;
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
         RETURNING user_id, folder_id, name`, [folder.user_id, folder.folder_name]
    );
    const newFolder = getFirstRow(insertResult);
    if (newFolder) {
    logAction(`Created new folder for the User=${folder.user_id}: Folder="${folder.folder_name}"`);
    return markAsCreated(newFolder);
  }
  //folder already exists. getting existing folder
    const selectResult: QueryResult<Folder> = await query(
        `SELECT user_id, folder_id, name FROM folder WHERE user_id = $1 AND name = $2`,
        [folder.user_id, folder.folder_name]
    );
    const existingFolder = getFirstRow(selectResult);
     if (!existingFolder) {
    throw new Error(`User not found`);
  }
    logAction(`Existing folder for the User=${folder.user_id}: Folder="${folder.folder_name}"`);
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

interface UserFolder extends Folder {
  sources: {
    source_id : number;
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


//get all folders for a user
const getUserFolders = async (userId: number): Promise<UserFolder[]> => {
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
        folder_name: row.folder_name,
        sources: []
      });
    }

    if (row.source_id !== null) {
      map.get(row.folder_id)!.sources.push({
        source_id: row.source_id,
        source_name: row.source_name!
      });
    }
  }
    logAction(`Number of folders of User=${userId}: folderCount=${map.size}`);
    return Array.from(map.values());
};


// get all unfoldered sources for a user
const getUnfolderedSources = async (userId: number): Promise<{ source_id: number; source_name: string }[]> => {
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




interface Source {
    source_id: number;
    source_name: string;
}
interface AddSource extends Source {
  created: boolean;
}

//add a new source to the source table. if it already exists, get it
const addSource = async (sourceName: string, sourceURL: string, feedType: "rss" | "podcast"= "rss"): Promise<AddSource> => {

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
        `INSERT INTO source(source_name, url, feed_type)
        VALUES ($1, $2, $3)
        RETURNING source_id, source_name`, [sourceName, sourceURL, feedType]
    );
    const newSource = getFirstRow(insertResult);
    logAction(`Added new source: Name=${sourceName} URL=${sourceURL} type=${feedType}`);
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
    const existingUserPodcast = getFirstRow(selectResult);

    if (existingUserPodcast) {
        logAction(`Source=${sourceId} for the User=${userId} already exists `);
        return { ...existingUserPodcast, created: false };
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

const addUserPodcast = async (userId: number, sourceId: number): Promise<AddUserSourceResult> => {
  const selectResult: QueryResult<UserSource> = await query(
    `SELECT user_id, podcast_id AS source_id, priority
     FROM user_podcast 
     WHERE user_id = $1 AND podcast_id = $2`,
    [userId, sourceId]
  );
  const existingUserPodcast = getFirstRow(selectResult);

  if (existingUserPodcast) {
    logAction(`Podcast Source=${sourceId} for User=${userId} already exists`);
    return { ...existingUserPodcast, created: false };
  }

  const priorityResult: QueryResult<{ new_priority: number }> = await query(
    `SELECT COALESCE(MAX(priority), 0) + 1 AS new_priority
     FROM user_podcast up
     JOIN source s ON up.podcast_id = s.source_id
     WHERE up.user_id = $1 AND s.feed_type = 'podcast'`,
    [userId]
  );

  const { new_priority } = getFirstRow(priorityResult) || { new_priority: 1 };
  const newPriority = new_priority || 1;

  const insertResult: QueryResult<UserSource> = await query(
    `INSERT INTO user_podcast (user_id, podcast_id, priority)
     VALUES ($1, $2, $3)
     RETURNING user_id, podcast_id AS source_id, priority`,
    [userId, sourceId, newPriority]
  );

  const newUserPodcast = getFirstRow(insertResult);

  logAction(
    `Added new Podcast Source=${sourceId} for User=${userId} with Priority=${newUserPodcast?.priority}`
  );

  return markAsCreated(newUserPodcast);
};


interface UserSourcePriority {
  priority: number;
}

type AllUserSources = Omit<UserSource, "user_id">;


//remove a source for a user -> rss + podcast
const removeUserSource = async (userId: number, sourceId: number, feedType: "rss" | "podcast" = "rss"): Promise<AllUserSources[]> => {
  //table based on feed type
  const table = feedType === "podcast" ? "user_podcast" : "user_source";
  const idColumn = feedType === "podcast" ? "podcast_id" : "source_id";

  //get the priority of the source being removed
  const userPriority: QueryResult<UserSourcePriority> = await query(
    `SELECT priority FROM ${table} WHERE user_id = $1 AND ${idColumn} = $2`,
    [userId, sourceId]
  );
  const removedPriority = getFirstRow(userPriority)?.priority ?? null;

  //delete the source entry for the user
  await query(
    `DELETE FROM ${table} WHERE user_id = $1 AND ${idColumn} = $2`,
    [userId, sourceId]
  );

  //delete unread + unsaved items for that source
  await query(
    `DELETE FROM user_item_metadata 
     WHERE user_id = $1 
       AND item_id IN (SELECT item_id FROM item WHERE source_id = $2)
       AND read_time IS NULL 
       AND is_save IS FALSE`,
    [userId, sourceId]
  );

  //fix priorities
  if (removedPriority !== null) {
    await query(
      `UPDATE ${table}
       SET priority = priority - 1 
       WHERE user_id = $1 AND priority > $2`,
      [userId, removedPriority]
    );
  }

  //check if the source is still used or has metadata
  const stillUsed = await query(
    `SELECT 1 FROM ${table} WHERE ${idColumn} = $1 LIMIT 1`,
    [sourceId]
  );
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

  //return updated list
  const sourcesResult = await query<AllUserSources>(
    `SELECT ${idColumn} AS source_id, priority FROM ${table} WHERE user_id = $1 ORDER BY priority ASC`,
    [userId]
  );

  logAction(`Removed ${feedType} source: User=${userId} Source=${sourceId}`);
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




interface UserRSSSources {
    source_id: number;
    source_name: string;
    url: string;
}

//get all the sources for a user
const allUserRSSSources = async (userId: number): Promise<UserRSSSources[]> => {
    const result: QueryResult<UserRSSSources> = await query(
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


interface UserPodcastSources {
    source_id: number;
    source_name: string;
    url: string;
}

const allUserPodcastSources = async (userId: number): Promise<UserPodcastSources[]> => {
    const result: QueryResult<UserPodcastSources> = await query(
        `SELECT s.source_id, s.source_name, s.url FROM user_podcast up
        JOIN source s ON s.source_id = up.podcast_id
        WHERE up.user_id = $1
        ORDER BY up.priority ASC`, [userId]
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


interface InsertedItem {
  item_id: number;
  title: string;
}

export interface AddItemResult {
  insertCount: number;
  insertedIds: number[];
}

//add an item into the item table
// const limit = pLimit(5);  //limit to 5 concurrent AI category calls


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

interface Category {
  name: string;
  color: string;
}


interface Items{
    item_id: number;
    title: string;
    link: string;
    description: string;
    pub_date: string | Date;
    source_name: string;
    categories: Category[];
    is_categorized: boolean;
}

interface FeedItems extends Items {
  is_save: boolean;
}


//get all unread items of all sources
const userFeedItems = async (userId: number, feedType: "rss" | "podcast" = "rss"): Promise<FeedItems[]> => {
  const interval = feedType === "podcast" ? "6 months" : "2 days";
  const table = feedType === "podcast" ? "user_podcast" : "user_source";

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
    INNER JOIN ${table} us ON us.${feedType === "podcast" ? "podcast_id" : "source_id"} = i.source_id
    LEFT JOIN user_item_metadata uim
      ON uim.item_id = i.item_id AND uim.user_id = us.user_id
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN category c ON ic.category_id = c.category_id
    WHERE us.user_id = $1
      AND i.pub_date >= NOW() - interval '${interval}'
      AND (uim.read_time IS NULL)
    ${feedType ? "AND s.feed_type = $2" : ""}
    GROUP BY i.item_id, s.source_name, s.feed_type, s.source_id, us.priority, uim.is_save
    ORDER BY us.priority, i.pub_date DESC`;

  const params = feedType ? [userId, feedType] : [userId];
  const result = await query(baseQuery, params);
  console.log(
  "CATEGORY TEST → FULL CATEGORIES:",
  JSON.stringify(
    result.rows.map(r => ({
      item_id: r.item_id,
      categories: r.categories
    })),
    null,
    2
  )
);
  const uncategorized = result.rows.filter(item => !item.is_categorized);

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

const getItemsByCategory = async (userId: number, categoryName: string, feedType: "rss" | "podcast" = "rss"): Promise<Items[]> => {
  const interval = feedType === "podcast" ? "6 months" : "2 days";
  const table = feedType === "podcast" ? "user_podcast" : "user_source";
  const joinKey = feedType === "podcast" ? "podcast_id" : "source_id";

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



const getSavedItemsByCategory = async (
  userId: number,
  categoryName: string,
  feedType?: "rss" | "podcast"
): Promise<Items[]> => {
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
      ${feedType ? "AND s.feed_type = $3" : ""}
    GROUP BY i.item_id, s.source_name, s.feed_type, i.is_categorized
    ORDER BY i.pub_date DESC
  `;

  const params = feedType ? [userId, categoryName, feedType] : [userId, categoryName];
  const result = await query(baseQuery, params);

  // Auto-categorize uncategorized saved items
  const uncategorized = result.rows.filter(item => !item.is_categorized);
  for (const item of uncategorized) {
    try {
      await categorizeItem(item.item_id, item.title, item.description);
    } catch (err) {
      console.error(`Error categorizing saved item ${item.item_id}:`, err);
    }
  }

  return result.rows;
};




interface FolderItems extends Items {
    source_id: number;
    is_save: boolean;
    
}


const folderItems = async (userId: number, folderId: number): Promise<FolderItems[]> => {
const baseQuery = `SELECT 
      i.item_id,
      i.title,
      i.link,
      i.description,
      i.pub_date,
      s.source_id,
      s.source_name,
      i.is_categorized,
      COALESCE(json_agg(DISTINCT jsonb_build_object('name', c.name, 'color', c.color)) 
           FILTER (WHERE c.name IS NOT NULL), '[]') AS categories    
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
    WHERE i.pub_date >= NOW() - interval '2 days'
      AND (uim.read_time IS NULL)
    GROUP BY i.item_id, s.source_name, s.source_id, us.priority, uim.is_save, i.is_categorized
    ORDER BY us.priority, i.pub_date DESC`;

  const params = [userId, folderId];
  const result: QueryResult<FolderItems> = await query(baseQuery, params);
  // Categorize items that aren’t categorized yet
  const uncategorized = result.rows.filter(item => !item.is_categorized);
  if (uncategorized.length) {
    for (const item of uncategorized) {
      try {
        await categorizeItem(item.item_id, item.title, item.description); 
      } catch (err) {
        console.error(`Error categorizing item ${item.item_id}:`, err);
      }
    }
    const refreshed = await query(baseQuery, params);
    logAction(`Folder items: User=${userId} Folder=${folderId} itemCount=${refreshed.rows.length} (refreshed after categorization)`);
    return refreshed.rows;
  }

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
const markItemRead = async (userId: number,itemId: number, feedType: "rss" | "podcast" = "rss"): Promise<MarkRead & { feed_type: "rss" | "podcast" }> => {
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

  if (!markedItem)
    return { user_id: userId, item_id: itemId, read: false, feed_type: feedType };

  return { ...markedItem, read: true, feed_type: feedType };
};



// mark all items of a specific source as read for a user
const markSourceItemsRead = async (userId: number, sourceId: number): Promise<{ readCount: number }> => {
  const result = await query(
    `
    INSERT INTO user_item_metadata (user_id, item_id, read_time)
    SELECT $1, i.item_id, NOW()
    FROM item i
    JOIN user_source us
      ON us.source_id = i.source_id
    WHERE us.user_id = $1
      AND us.source_id = $2
    ON CONFLICT (user_id, item_id)
      DO UPDATE SET read_time = EXCLUDED.read_time
    RETURNING user_id, item_id, read_time
    `,
    [userId, sourceId]
  );

  logAction(`Marked source items as read: User=\${userId} Source=\${sourceId} itemCount=\${result.rowCount}`);

  return { readCount: result.rowCount ?? 0 };

};


interface ReadItems {
    readCount: number | null;
}

//mark all unread items of all sources read
//Handles both “insert if missing” and “update if exists” in one query.
const markUserFeedItemsRead = async (userId: number, feedType: "rss" | "podcast" = "rss"): Promise<ReadItems> => {
  const table = feedType === "podcast" ? "user_podcast" : "user_source";
  const idColumn = feedType === "podcast" ? "podcast_id" : "source_id";
  const interval = feedType === "podcast" ? "6 months" : "2 days";

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

  logAction(
    `Marked ${feedType} items as read: User=${userId} itemCount=${result.rowCount}`
  );

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
const saveItem = async (userId: number,itemId: number,save: boolean, feedType: "rss" | "podcast" = "rss"): Promise<Save & { feed_type: "rss" | "podcast" }> => {
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
  if (!savedItem)
    return { user_id: userId, item_id: itemId, is_save: save, feed_type: feedType };

  return { ...savedItem, feed_type: feedType };
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
const allSavedItems = async (userId: number, feedType?: "podcast" | "rss" | string): Promise<Items[]> => {
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
      ${feedType ? "AND s.feed_type = $2" : ""}
    GROUP BY i.item_id, s.source_name, s.feed_type, i.is_categorized
    ORDER BY i.pub_date DESC
  `;


  const params = feedType ? [userId, feedType] : [userId];
  const result: QueryResult<Items> = await query(baseQuery, params);

  // Find items not yet categorized
  const uncategorized = result.rows.filter(item => !item.is_categorized);
  if (uncategorized.length > 0) {
    for (const item of uncategorized) {
      try {
        await categorizeItem(item.item_id, item.title, item.description);
      } catch (err) {
        console.error(`Error categorizing saved item ${item.item_id}:`, err);
      }
    }
    const refreshed = await query(baseQuery, params);
    logAction(`Saved items: User=${userId} feedType=${feedType || "all"} itemCount=${refreshed.rows.length} (refreshed after categorization)`);
    return refreshed.rows;
  }

  logAction(
    `Saved items: User=${userId} feedType=${feedType || "all"} itemCount=${result.rows.length}`
  );
  return result.rows;
};


interface SourceWithPriority extends Source {
  priority: number;
}

//get all sources for a user ordered by priority
const sourcePriority = async (userId: number, feedType?: string): Promise<SourceWithPriority[]> => {
  // Decide which table to use based on feed type
  const table = feedType === "podcast" ? "user_podcast" : "user_source";

  const result: QueryResult<SourceWithPriority> = await query(
    `
    SELECT us.${feedType === "podcast" ? "podcast_id" : "source_id"} AS source_id,
           us.priority,
           s.source_name
    FROM ${table} us
    JOIN source s ON us.${feedType === "podcast" ? "podcast_id" : "source_id"} = s.source_id
    WHERE us.user_id = $1
    ORDER BY us.priority ASC
    `,
    [userId]
  );

  logAction(
    `Source priorities (${feedType || "all"}): User=${userId} count=${result.rows.length}`
  );

  return result.rows;
};


export interface SourcePriorityUpdate {
  source_id: number;
  priority: number;
}

const updateSourcePriorities = async (userId: number, sources: SourcePriorityUpdate[], feedType: "podcast" | "rss" = "rss"): Promise<void> => {
  if (!sources.length) return;

  const table = feedType === "podcast" ? "user_podcast" : "user_source";
  const idColumn = feedType === "podcast" ? "podcast_id" : "source_id";

  const client = await (await import("../config/db")).default.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);

    //re-insert in new priority order
    for (const s of sources) {
      await client.query(
        `INSERT INTO ${table}(user_id, ${idColumn}, priority) VALUES ($1, $2, $3)`,
        [userId, s.source_id, s.priority]
      );
    }

    await client.query("COMMIT");
    console.info(
      `INFO: Updated ${feedType} priorities for user ${userId} (count=${sources.length}).`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`Failed to update ${feedType} priorities:`, err);
    throw err;
  } finally {
    client.release();
  }
};



interface AllReadItems extends Items {
  read_time: string | Date;
}

//get all read items of a user
const readItems = async (userId: number, feedType?: "rss" | "podcast"): Promise<AllReadItems[]> => {
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
      ${feedType ? "AND s.feed_type = $2" : ""}
    GROUP BY i.item_id, s.source_name, s.feed_type, uim.read_time, i.is_categorized
    ORDER BY i.pub_date DESC
  `;

  const params = feedType ? [userId, feedType] : [userId];
  const result: QueryResult<AllReadItems> = await query(baseQuery, params);

  // Only categorize uncategorized items
  const uncategorized = result.rows.filter(item => !item.is_categorized);
  if (uncategorized.length) {
    for (const item of uncategorized) {
      try {
        await categorizeItem(item.item_id, item.title, item.description);
      } catch (err) {
        console.error(`Error categorizing read item ${item.item_id}:`, err);
      }
    }
    const refreshed = await query(baseQuery, params);
    logAction(`Saved items: User=${userId} feedType=${feedType || "all"} itemCount=${refreshed.rows.length} (refreshed after categorization)`);
    return refreshed.rows;
  }

  logAction(
    `Read items: User=${userId} feedType=${feedType || "all"} itemCount=${result.rows.length}`
  );
  return result.rows;
};


export { addUser, createFolder, renameFolder, addSource, addUserSource, addUserPodcast, addItem, 
userFeedItems, addSourceIntoFolder, folderItems, markItemRead, saveItem,
markUserFeedItemsRead, markFolderItemsRead, removeUserSource, delSourceFromFolder, deleteFolder, 
allUserSources, getUserFolders, allSavedItems, sourcePriority, updateSourcePriorities, readItems, addUserItemMetadata,
getRecentItems, getItemsByCategory, getSavedItemsByCategory, allUserRSSSources, allUserPodcastSources, getUnfolderedSources, markSourceItemsRead };
