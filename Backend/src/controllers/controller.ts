import { query } from "../config/db";
import { Request, Response } from "express";
import { addUser, createFolder, addSource, addUserSource, addUserPodcast, addItem, 
userFeedItems, addSourceIntoFolder, folderItems, markItemRead, saveItem,
markUserFeedItemsRead, markFolderItemsRead, removeUserSource, delSourceFromFolder, deleteFolder, 
allUserSources, getUserFolders, allSavedItems, sourcePriority, readItems, addUserItemMetadata,
getRecentItems, renameFolder, updateSourcePriorities,
SourcePriorityUpdate,
getItemsByCategory, getSavedItemsByCategory, allUserRSSSources, allUserPodcastSources,
getUnfolderedSources, markSourceItemsRead
} from "../models/model";
import { RSSParser } from '../services/rssService';
import { handleError } from "../utils/helpers"
import { find } from "feedfinder-ts"
import { podcastParser } from "../services/podcastService";


interface AddUser {
  userName: string;
  userEmail: string;
  password: string;
}

//create a new user or get existing one
const addUserController = async (req: Request<{}, {}, AddUser>, res: Response): Promise<void> => {
  const { userName, userEmail, password } = req.body;

  if (!userName || !userEmail || !password) {
    console.warn("WARN: Missing registration params:", req.body);
    res.status(400).json({ error: "Missing username or email or password" });
    return;
  }

  try {
    const user = await addUser({name: userName, email: userEmail, password_hash: password});

    res.json({
      message: user.created ? "User created successfully: " : "User already exists with this email: ", user
    });
  } catch (error) {
    handleError(res, error, 500, "Could not register user");
  }
};

interface CreateFolderBody {
  folderName: string;
}
interface CreateFolderParams {
  userId: string; //req.params are always strings
}

//creates a folder for a specific user
const createFolderController = async (req: Request<CreateFolderParams, {}, CreateFolderBody>, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { folderName } = req.body;
  if (!userId || !folderName) {
    console.warn("WARN: Missing params for folder creation:", req.body);
    res.status(400).json({ error: "Missing userId or folderName" });
    return;
  }
  try {
    const folder = await createFolder({user_id: Number(userId), folder_name: folderName} );
    console.info(`INFO: Folder '${folderName}' created for user ${userId}`);


    res.json(folder);
  } catch (error){
    handleError(res, error, 500, "Error in creating folder");
  }
};


const renameFolderController = async (req: Request<{userId: string, folderId: string}, {}, {name: string}>, res: Response): Promise<void> => {
  const folderId = Number(req.params.folderId)
  const userId = Number(req.params.userId)

  const { name } = req.body

  try {
    const updatedFolder = await renameFolder(userId, folderId, name);
    if (!updatedFolder) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }
    res.json(updatedFolder)
  } catch (err: any) {
    if (err.code === "23505") {
      // 23505 = unique_violation in PostgreSQL
      res.status(400).json({ error: "A folder with that name already exists. Please choose a different name" });
      return;
    }
    console.error("Error renaming folder:", err);
    res.status(500).json({ error: "Failed to rename folder" })
  }
}

interface UserId {
  userId: string;
}

//get all the folders for a user
const getUserFoldersController = async (req: Request<UserId,{},{}>, res: Response): Promise<void> => {
  const { userId } = req.params;
  const numericUserId = Number(userId);

  if (isNaN(numericUserId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  try{
    const folders = await getUserFolders(numericUserId);
    console.info(`INFO: Fetched folders for user ${userId} `);
    res.json(folders);
  } catch (error) {
    handleError(res, error, 500, "Error in getting user's folders");
  }
};


//get all unfoldered sources for a user
const getUnfolderedSourcesController = async (req: Request<{ userId: string }, {}, {}>, res: Response): Promise<void> => {
  const { userId } = req.params;
  const numericUserId = Number(userId);

  if (isNaN(numericUserId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  try {
    const sources = await getUnfolderedSources(numericUserId);
    console.info(`INFO: Fetched unfoldered sources for user ${userId}`);
    res.json(sources);
  } catch (error) {
    handleError(res, error, 500, "Error in getting user's unfoldered sources");
  }
};


interface DelFolderParams {
  userId: string;
  folderId: string;
}


//delete a folder for a user
const deleteFolderController = async (req: Request<DelFolderParams, {}, {}>, res: Response): Promise<void> => {
  const { userId, folderId } = req.params;

  try{
    const deletedFolder = await deleteFolder(Number(userId), Number(folderId));
    if (!deletedFolder) {
      console.warn(`WARN: Folder ${folderId} not found for user ${userId}.`);
      res.status(404).json({ error: "Folder not found"}); 
      return;
    }
    console.info(`INFO: Deleted folder ${folderId} for user ${userId}.`);
    res.json(deletedFolder);
    return;
  } catch (error) {
    handleError(res, error, 500, "Error deleting the folder");
  }
};

interface SourceIdBody {
  sourceId: number;
}

//adds a source into a folder for a user
const addSourceIntoFolderController = async (req: Request<DelFolderParams, {}, SourceIdBody> , res: Response): Promise<void> => {
  const { userId, folderId } = req.params;
  const { sourceId } = req.body;
  if (!userId || !folderId || !sourceId) {
    console.warn("WARN: Missing source-folder link params.");
    res.status(400).json({ error: "Missing userId, folderId, or sourceId" });
    return;
  }
  try{
    const result = await addSourceIntoFolder(Number(userId), Number(folderId), sourceId);
    console.info(`INFO: Source ${sourceId} added to folder ${folderId} for user ${userId}`);
    res.json(result);
  } catch (error){
      handleError(res, error, 500, "Could not add source into folder");  
  }
};

interface DelSourceFromFolderParams extends DelFolderParams{
  sourceId: string;
}

//delete a source from a folder for a user
const deleteSourceFromFolderController = async (req: Request<DelSourceFromFolderParams, {}, {}>, res: Response): Promise<void> => {
  const { userId, folderId, sourceId } = req.params;

  try{
    const delSource = await delSourceFromFolder(Number(userId), Number(folderId), Number(sourceId));
    console.info(`INFO: Source ${sourceId} removed from folder ${folderId} for user ${userId}`);
    res.json(delSource);
  } catch(error) {
    handleError(res, error, 500, "Error in removing source from folder"); 
  }
};

interface URL {
  sourceURL: string;
}

interface URLBody {
  sourceURL: string;
}
interface UserIdParam {
  userId: string;
}


//provide feed as soon as user adds a source
//parse source, insert/check source table, insert/check user_source table, add items
const addUserSourceController = async (req: Request<UserIdParam, {}, URLBody>, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { sourceURL } = req.body;

  if (!userId || !sourceURL) {
    res.status(400).json({ error: "Missing userId or sourceURL" });
    return;
  }

  try {
    console.log("Finding feeds for:", sourceURL);
     const feeds: { title: string; link: string }[] = (await find(sourceURL)) as {
      title: string;
      link: string;
    }[];
    console.log("Found possible feeds:", feeds);

      for (const feed of feeds) {
        const feedUrl = feed.link; 
        const feedTitle = feed.title;
        try {
          const { sourceName, sourceItems } = await RSSParser(feedUrl);
          if (sourceItems && sourceItems.length > 0) {
            console.log("Working feed found:", feedUrl);
            const source = await addSource(sourceName, feedUrl);
            const userSource = await addUserSource(Number(userId), source.source_id);

            const result = await addItem(source.source_id, sourceItems);
            const itemIds = await getRecentItems(source.source_id, 2);
            await addUserItemMetadata(Number(userId), itemIds);

            res.json({
            source_id: source.source_id,
            source_name: source.source_name,
            feed_url: feedUrl,
            itemsAdded: result.insertCount,
            userSourceCreated: userSource.created,
            });
            return;
          }
        } catch (err) {
        console.warn(`Failed to parse ${feedUrl}:`, (err as Error).message);
      }
    }

    res.status(404).json({ error: "No working feed found" });
  } catch (error) {
    handleError(res, error, 500, "Could not add source for user");
  }
};


// const addUserSourceController = async (req: Request<UserId, {}, URL>, res: Response): Promise<void> => {
//   const { userId } = req.params;
//   const { sourceURL } = req.body;
//   if (!userId || !sourceURL ) {
//     console.warn("WARN: Missing addUserSource params:", req.body);
//     res.status(400).json( { error: "Missing userId or sourceURL"});
//     return;
//   }

//   try {
//     const { sourceName, sourceItems } = await RSSParser(sourceURL);
//     console.info("INFO: Source Title:", sourceName);
//     console.info("INFO: Parsed Source Items Count:", sourceItems.length);

//     const source = await addSource(sourceName, sourceURL);
//     console.info(`INFO: Source '${sourceName}' added/existed: ${source.source_id}.`);

//     const userSource = await addUserSource(Number(userId), source.source_id);
//     console.info(`INFO: Linked user ${userId} to source ${source.source_id}`);

//     let insertCount = 0;
//     if (sourceItems.length > 0) {
//       const result = await addItem(source.source_id, sourceItems);
//       insertCount = result.insertCount;
//       console.info(`INFO: Inserted ${insertCount} items for source_id ${source.source_id}`);
//     }

//     const itemIds = await getRecentItems(source.source_id, 2);
//     await addUserItemMetadata(Number(userId), itemIds);

//     res.json({
//       source_id: source.source_id,
//       source_name: source.source_name,
//       sourceCreated: source.created,
//       userSourceCreated: userSource.created,
//       itemsAdded: insertCount,
//     });
//     return;

//   } catch (error) {
//     handleError(res, error, 500, "Could not add source for user");
//   }
// };




const addUserPodcastController = async (req: Request<UserIdParam, {}, URLBody>, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { sourceURL } = req.body;

  if (!userId || !sourceURL) {
    res.status(400).json({ error: "Missing userId or sourceURL" });
    return;
  }

  try {
    const { podcastTitle, episodeItems, totalEpisodes } = await podcastParser(sourceURL);

    const source = await addSource(podcastTitle, sourceURL, "podcast");
    const userPodcast = await addUserPodcast(Number(userId), source.source_id);
    const result = await addItem(source.source_id, episodeItems);

    const itemIds = await getRecentItems(source.source_id, 180);
    await addUserItemMetadata(Number(userId), itemIds);

    res.json({
      source_id: source.source_id,
      source_name: source.source_name,
      feed_type: "podcast",
      feed_url: sourceURL,
      episodesAdded: result.insertCount,
      userSourceCreated: userPodcast.created,
      totalEpisodes,
    });

    console.log(`Added new podcast "${podcastTitle}" for User=${userId} with ${totalEpisodes} episodes`);
  } catch (error: any) {
    console.error("Error adding podcast feed:", error);
    const message = error.message || "Could not add podcast source for user";
    handleError(res, error, 400, message);
  }
};


interface UserSource { 
  userId: string;
  sourceId: string;
}

// removes a source for a user
const removeUserSourceController = async (
  req: Request<UserSource>,
  res: Response
): Promise<void> => {
  const { userId, sourceId } = req.params;

  if (!userId || !sourceId) {
    res.status(400).json({ error: "Missing userId or sourceId" });
    return;
  }

  try {
    const updatedSources = await removeUserSource(
      Number(userId),
      Number(sourceId)
    );

    console.info(
      `INFO: Removed source ${sourceId} from user ${userId}.`
    );

    res.json({
      message: "Source removed successfully",
      sources: updatedSources,
    });
  } catch (error) {
    handleError(res, error, 500, "Could not delete source for user");
  }
};



//get unread items for all sources in user's home page
const userFeedItemsController = async (req: Request<UserId, {}, {}, { feedType?: "rss" | "podcast" }>, res: Response): Promise<void> => {
  const { userId } = req.params; 
  const { feedType } = req.query; 

  try {
    const unreadItems = await userFeedItems(Number(userId), feedType);
    console.info(`INFO: Fetched ${feedType || "all"} unread items for user ${userId}`);
    res.json(unreadItems);
  } catch (error) {
    handleError(res, error, 500, "Error fetching unread items");
  }                           
};


const getItemsByCategoryController = async (req: Request<UserId & { categoryName: string }, {}, {}, {feedType?: "rss" | "podcast" }>, res: Response) => {
  const { userId, categoryName } = req.params;
  const { feedType } = req.query; 
  try {
    const items = await getItemsByCategory(Number(userId), categoryName, feedType);
    res.json(items);
  } catch (error) {
    handleError(res, error, 500, "Error fetching items by category");
  }
};

const getSavedItemsByCategoryController = async (req: Request<UserId & { categoryName: string }, {}, {}, {feedType?: "rss" | "podcast" }>, res: Response) => {
  const { userId, categoryName } = req.params;
  const { feedType } = req.query; 
  try {
    const items = await getSavedItemsByCategory(Number(userId), categoryName, feedType);
    res.json(items);
  } catch (error) {
    handleError(res, error, 500, "Error fetching items by category");
  }
};



//display all the sources the user follows in the home page above the feed
const allUserSourcesController = async (req: Request<UserId, {}, {}>, res: Response): Promise<void> => {
  const { userId } = req.params;

  try{
    const allSources = await allUserSources(Number(userId));
    console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
    res.json(allSources);
  } catch (error) {
    handleError(res, error, 500, "Error fetching sources for this user");
  }
};


//display all the blog sources the user follows in the home page above the feed
const allUserRSSSourcesController = async (req: Request<UserId, {}, {}>, res: Response): Promise<void> => {
  const { userId } = req.params;

  try{
    const allSources = await allUserRSSSources(Number(userId));
    console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
    res.json(allSources);
  } catch (error) {
    handleError(res, error, 500, "Error fetching blog sources for this user");
  }
};

//display all the podcast sources the user follows in the home page above the feed
const allUserPodcastSourcesController = async (req: Request<UserId, {}, {}>, res: Response): Promise<void> => {
  const { userId } = req.params;

  try{
    const allSources = await allUserPodcastSources(Number(userId));
    console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
    res.json(allSources);
  } catch (error) {
    handleError(res, error, 500, "Error fetching podcast sources for this user");
  }
};

interface FolderItem {
  userId: string;
  folderId: string;
}

//get all items in a folder for a user
const folderItemsController = async (req: Request<FolderItem, {}, {}>, res: Response): Promise<void>  => {
  const { userId, folderId } = req.params; 

  try {
    const unreadItems = await folderItems(Number(userId), Number(folderId));
    console.info(`INFO: Fetched unread items for folder ${folderId}, user ${userId}.`);
    res.json(unreadItems);
  } catch(error) {
    handleError(res, error, 500, "Error fetching unread items in folder");
  }
};

interface MarkItemRead {
  userId: string;
  itemId: string;
}

//mark an item read for a user
const markItemReadController = async (req: Request<MarkItemRead, {}, {}, { feedType?: "rss" | "podcast" }>,res: Response): Promise<void> => {
  const { userId, itemId } = req.params;
  const { feedType } = req.query; 

  if (!userId || !itemId) {
    console.warn("WARN: Missing params for read item");
    res.status(400).json({ error: "Missing userId or itemId" });
    return;
  }

  try {
    const readItem = await markItemRead(Number(userId), Number(itemId), feedType);

    console.info(
      `INFO: Marked ${readItem.feed_type || "unknown"} item ${itemId} as read for user ${userId}`
    );

    res.json(readItem);
  } catch (error) {
    handleError(res, error, 500, "Error marking item as read");
  }
};


// mark all items of a specific source as read
const markSourceItemsReadController = async (req: Request<{ userId: string; sourceId: string }>,res: Response): Promise<void> => {
  const { userId, sourceId } = req.params;

  const numericUserId = Number(userId);
  const numericSourceId = Number(sourceId);

  if (isNaN(numericUserId) || isNaN(numericSourceId)) {
    res.status(400).json({ error: "Invalid userId or sourceId" });
    return;
  }

  try {
    const result = await markSourceItemsRead(
      numericUserId,
      numericSourceId
    );

    console.info(
      `INFO: Marked source items read for user \${userId}, source=\${sourceId}, count=\${result.readCount}`
    );

    res.json(result);
  } catch (error) {
    handleError(res, error, 500, "Error marking source items as read");
  }
};



//marks all items in home page as read for a user
const markUserFeedItemsReadController = async (req: Request<UserId, {}, {}, { feedType?: "rss" | "podcast" }>,res: Response): Promise<void> => {
  const { userId } = req.params;
  const { feedType } = req.query;
  const type: "rss" | "podcast" = feedType === "podcast" ? "podcast" : "rss";

  try {
    const readItems = await markUserFeedItemsRead(Number(userId), type);
    console.info(
      `INFO: Marked ${type} feed items as read for user ${userId}, count=${readItems.readCount}`
    );
    res.json(readItems);
  } catch (error) {
    handleError(res, error, 500, `Error marking ${type} items as read`);
  }
};



const markUserFolderItemsReadController = async (req: Request<FolderItem, {}, {}>, res: Response): Promise<void> => {
  const { userId, folderId } = req.params;
  try {
    const readItems = await markFolderItemsRead(Number(userId), Number(folderId));
    console.info(`INFO: Marked folder ${folderId} items as read for user ${userId}`);
    res.json(readItems);
  } catch (error) {
     handleError(res, error, 500, "Error marking all items as read");
  }
};

interface SaveItem {
  userId: number;
  itemId: number;
  save?: boolean;
  is_save?: boolean
}

//save an item for a user
const saveItemController = async (req: Request<{}, {}, SaveItem, { feedType?: "podcast" | "rss" }>, res: Response): Promise<void> => {
  const { userId, itemId, save } = req.body;
  const { feedType } = req.query;
  if (userId == null || itemId == null || save == null) {
    console.warn("WARN: Missing save item params");
    res.status(400).json( {error: "Missing userId, or itemId or save value"})
    return;
  }

  try{
    const result = await saveItem(userId, itemId, save, feedType);
    console.info(`INFO: Save status for item ${itemId} (user ${userId}): ${result.is_save}`);
    res.json( {userId: result.user_id, itemId: result.item_id, is_save: result.is_save});
  } catch (error) {
    handleError(res, error, 500, "Could not save the item for the user");
  }
};

//get all saved items for a user
const allSavedItemsController = async (req: Request<UserId, {}, {}, { feedType?: "podcast" | "rss" }>,res: Response): Promise<void> => {
  const { userId } = req.params;
  const { feedType } = req.query;
  try {
    const savedItems = await allSavedItems(Number(userId), feedType);
    console.info(
      `INFO: Fetched ${feedType || "all"} saved items for user ${userId} (${savedItems.length} items).`
    );
    res.json(savedItems);
  } catch (error) {
    handleError(res, error, 500, "Could not get saved items");
  }
};


//get priority list for a user
const sourcePriorityController = async (req: Request<UserId, {}, {},  { feedType?: "rss" | "podcast" }>,res: Response): Promise<void> => {
  const { userId } = req.params;
  const { feedType } = req.query;

  try {
    const priority = await sourcePriority(Number(userId), feedType);
    console.info(
      `INFO: Fetched source priority for user ${userId} (${feedType || "all"}).`
    );
    res.json(priority);
  } catch (error) {
    handleError(res, error, 500, "Error in getting source priority");
  }
};


interface UpdatePriority {
  userId: number;
  sources: SourcePriorityUpdate[];
}

export const updateSourcePrioritiesController = async (req: Request<{}, {}, UpdatePriority, { feedType?: "rss" | "podcast" }>,res: Response): Promise<void> => {
  const { userId, sources } = req.body;
  const { feedType } = req.query;

  if (!userId || !Array.isArray(sources) || sources.length === 0) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    console.log(
      `Updating ${feedType} priorities for user:`,
      userId,
      "sources:",
      sources
    );

    await updateSourcePriorities(userId, sources, feedType);

    console.log(`${feedType} DB update successful for user ${userId}`);
    res.json({ success: true, feedType: feedType });
  } catch (err) {
    console.error(`Error updating ${feedType} priorities:`, err);
    res.status(500).json({ error: `Failed to update ${feedType} priorities` });
  }
};




//get all read items for a user
const readItemsController = async (req: Request<UserId, {}, {}, { feedType?: "rss" | "podcast" }>,res: Response): Promise<void> => {
  const { userId } = req.params;
  const { feedType } = req.query;

  try {
    const allReadItems = await readItems(Number(userId), feedType);
    console.info(
      `INFO: Fetched ${allReadItems.length} read items for user ${userId} (${feedType || "all"})`
    );
    res.json(allReadItems);
  } catch (error) {
    handleError(res, error, 500, "Could not get read items");
  }
};


//all preset sources that users can choose from
const presetSources = async (req: Request<{},{},UserSource, { feedType?: "rss" | "podcast" }>,res: Response): Promise<void> => {
  const { userId, sourceId } = req.body;
  const { feedType } = req.query;

  if (!userId || !sourceId) {
    res.status(400).json({ message: "userId and sourceId are required" });
    return;
  }

  try {
    let result;
    if (feedType === "podcast") {
      result = await addUserPodcast(Number(userId), Number(sourceId));
    } else {
      result = await addUserSource(Number(userId), Number(sourceId));
    }
    res.json({
      message: `${feedType || "rss"} source added to user feed`,
      ...result
    });
  } catch (err) {
    console.error("Error adding user source:", err);
    res.status(500).json({ message: "Failed to add source" });
  }
};


// export const getAllItemsWithCategoriesController = async (req: Request, res: Response) => {
//   try {
//     const items = await getAllItemsWithCategories();
//     res.status(200).json(items);
//   } catch (error) {
//     console.error("Error in getAllItemsWithCategories controller:", error);
//     res.status(500).json({ error: "Error fetching categorized items" });
//   }
// };


export { addUserController, createFolderController, renameFolderController, addUserSourceController, addUserPodcastController,
userFeedItemsController, folderItemsController, markItemReadController, saveItemController, 
markUserFeedItemsReadController, markUserFolderItemsReadController, addSourceIntoFolderController, removeUserSourceController, 
deleteSourceFromFolderController, deleteFolderController, allUserSourcesController,
getUserFoldersController, allSavedItemsController, sourcePriorityController, readItemsController, presetSources, getItemsByCategoryController, getSavedItemsByCategoryController,
allUserRSSSourcesController, allUserPodcastSourcesController, getUnfolderedSourcesController, markSourceItemsReadController};