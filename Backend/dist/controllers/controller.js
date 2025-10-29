import { addUser, createFolder, addSource, addUserSource, addItem, userFeedItems, addSourceIntoFolder, folderItems, markItemRead, saveItem, markuserFeedItemsRead, removeUserSource, delSourceFromFolder, deleteFolder, allUserSources, getUserFolders, allSavedItems, sourcePriority, readItems, addUserItemMetadata, getRecentItems } from "../models/model.js";
import { RSSParser } from '../services/rssService.js';
import { handleError } from "../utils/helpers.js";
//create a new user or get existing one
const addUserController = async (req, res) => {
    const { userName, userEmail, password } = req.body;
    if (!userName || !userEmail || !password) {
        console.warn("WARN: Missing registration params:", req.body);
        res.status(400).json({ error: "Missing username or email or password" });
        return;
    }
    try {
        const user = await addUser({ name: userName, email: userEmail, password_hash: password });
        res.json({
            message: user.created ? "User created successfully: " : "User already exists with this email: ", user
        });
    }
    catch (error) {
        handleError(res, error, 500, "Could not register user");
    }
};
//creates a folder for a specific user
const createFolderController = async (req, res) => {
    const { userId } = req.params;
    const { folderName } = req.body;
    if (!userId || !folderName) {
        console.warn("WARN: Missing params for folder creation:", req.body);
        res.status(400).json({ error: "Missing userId or folderName" });
        return;
    }
    try {
        const folder = await createFolder({ user_id: Number(userId), name: folderName });
        console.info(`INFO: Folder '${folderName}' created for user ${userId}`);
        res.json(folder);
    }
    catch (error) {
        handleError(res, error, 500, "Error in creating folder");
    }
};
//get all the folders for a user
const getUserFoldersController = async (req, res) => {
    const { userId } = req.params;
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
        res.status(400).json({ error: "Invalid userId" });
        return;
    }
    try {
        const folders = await getUserFolders(numericUserId);
        console.info(`INFO: Fetched folders for user ${userId} `);
        res.json(folders);
    }
    catch (error) {
        handleError(res, error, 500, "Error in getting user's folders");
    }
};
//delete a folder for a user
const deleteFolderController = async (req, res) => {
    const { userId, folderId } = req.params;
    try {
        const deletedFolder = await deleteFolder(Number(userId), Number(folderId));
        if (!deletedFolder) {
            console.warn(`WARN: Folder ${folderId} not found for user ${userId}.`);
            res.status(404).json({ error: "Folder not found" });
            return;
        }
        console.info(`INFO: Deleted folder ${folderId} for user ${userId}.`);
        res.json(deletedFolder);
        return;
    }
    catch (error) {
        handleError(res, error, 500, "Error deleting the folder");
    }
};
//adds a source into a folder for a user
const addSourceIntoFolderController = async (req, res) => {
    const { userId, folderId } = req.params;
    const { sourceId } = req.body;
    if (!userId || !folderId || !sourceId) {
        console.warn("WARN: Missing source-folder link params.");
        res.status(400).json({ error: "Missing userId, folderId, or sourceId" });
        return;
    }
    try {
        const result = await addSourceIntoFolder(Number(userId), Number(folderId), sourceId);
        console.info(`INFO: Source ${sourceId} added to folder ${folderId} for user ${userId}`);
        res.json(result);
    }
    catch (error) {
        handleError(res, error, 500, "Could not add source into folder");
    }
};
//delete a source from a folder for a user
const deleteSourceFromFolderController = async (req, res) => {
    const { userId, folderId, sourceId } = req.params;
    try {
        const delSource = await delSourceFromFolder(Number(userId), Number(folderId), Number(sourceId));
        console.info(`INFO: Source ${sourceId} removed from folder ${folderId} for user ${userId}`);
        res.json(delSource);
    }
    catch (error) {
        handleError(res, error, 500, "Error in removing source from folder");
    }
};
//provide feed as soon as user adds a source
//parse source, insert/check source table, insert/check user_source table, add items
const addUserSourceController = async (req, res) => {
    const { userId } = req.params;
    const { sourceURL } = req.body;
    if (!userId || !sourceURL) {
        console.warn("WARN: Missing addUserSource params:", req.body);
        res.status(400).json({ error: "Missing userId or sourceURL" });
        return;
    }
    try {
        const { sourceName, sourceItems } = await RSSParser(sourceURL);
        console.info("INFO: Source Title:", sourceName);
        console.info("INFO: Parsed Source Items Count:", sourceItems.length);
        const source = await addSource(sourceName, sourceURL);
        console.info(`INFO: Source '${sourceName}' added/existed: ${source.source_id}.`);
        const userSource = await addUserSource(Number(userId), source.source_id);
        console.info(`INFO: Linked user ${userId} to source ${source.source_id}`);
        let insertCount = 0;
        if (sourceItems.length > 0) {
            const result = await addItem(source.source_id, sourceItems);
            insertCount = result.insertCount;
            console.info(`INFO: Inserted ${insertCount} items for source_id ${source.source_id}`);
        }
        const itemIds = await getRecentItems(source.source_id, 2);
        await addUserItemMetadata(Number(userId), itemIds);
        res.json({
            source_id: source.source_id,
            source_name: source.source_name,
            sourceCreated: source.created,
            userSourceCreated: userSource.created,
            itemsAdded: insertCount,
        });
        return;
    }
    catch (error) {
        handleError(res, error, 500, "Could not add source for user");
    }
};
//removes a source for a user
const removeUserSourceController = async (req, res) => {
    const { userId } = req.params;
    const { sourceId } = req.body;
    try {
        const updatedSources = await removeUserSource(Number(userId), sourceId);
        console.info(`INFO: Removed source ${sourceId} from user ${userId}.`);
        res.json(updatedSources);
    }
    catch (error) {
        handleError(res, error, 500, "Could not delete source for user");
    }
};
//get unread items for all sources in user's home page
const userFeedItemsController = async (req, res) => {
    const { userId } = req.params;
    try {
        const unreadItems = await userFeedItems(Number(userId));
        console.info(`INFO: Fetched unread items for user ${userId}`);
        res.json(unreadItems);
    }
    catch (error) {
        handleError(res, error, 500, "Error fetching unread items");
    }
};
//display all the sources the user follows in the home page above the feed
const allUserSourcesController = async (req, res) => {
    const { userId } = req.params;
    try {
        const allSources = await allUserSources(Number(userId));
        console.info(`INFO: User ${userId} follows ${allSources.length} sources`);
        res.json(allSources);
    }
    catch (error) {
        handleError(res, error, 500, "Error fetching sources for this user");
    }
};
//get all items in a folder for a user
const folderItemsController = async (req, res) => {
    const { userId, folderId } = req.params;
    try {
        const unreadItems = await folderItems(Number(userId), Number(folderId));
        console.info(`INFO: Fetched unread items for folder ${folderId}, user ${userId}.`);
        res.json(unreadItems);
    }
    catch (error) {
        handleError(res, error, 500, "Error fetching unread items in folder");
    }
};
//mark an item read for a user
const markItemReadController = async (req, res) => {
    const { userId, itemId } = req.params;
    if (!userId || !itemId) {
        console.warn("WARN: Missing params for read item");
        res.status(400).json({ error: "Missing userId or itemId" });
        return;
    }
    try {
        const readItem = await markItemRead(Number(userId), Number(itemId));
        console.info(`INFO: Marked item ${itemId} as read for user ${userId}`);
        res.json(readItem);
    }
    catch (error) {
        handleError(res, error, 500, "Error marking item as read");
    }
};
//marks all items in home page as read for a user
const markUserFeedItemsReadController = async (req, res) => {
    const { userId } = req.params;
    try {
        const readItems = await markuserFeedItemsRead(Number(userId));
        console.info(`INFO: Marked home feed items as read for user ${userId}`);
        res.json(readItems);
    }
    catch (error) {
        handleError(res, error, 500, "Error marking all items as read");
    }
};
//save an item for a user
const saveItemController = async (req, res) => {
    const { userId, itemId, save } = req.body;
    if (userId == null || itemId == null || save == null) {
        console.warn("WARN: Missing save item params");
        res.status(400).json({ error: "Missing userId, or itemId or save value" });
        return;
    }
    try {
        const result = await saveItem(userId, itemId, save);
        console.info(`INFO: Save status for item ${itemId} (user ${userId}): ${save}`);
        res.json(result);
    }
    catch (error) {
        handleError(res, error, 500, "Could not save the item for the user");
    }
};
//get all saved items for a user
const allSavedItemsController = async (req, res) => {
    const { userId } = req.params;
    try {
        const savedItems = await allSavedItems(Number(userId));
        console.info(`INFO: Fetched ${savedItems.length} saved items for user ${userId}.`);
        res.json(savedItems);
    }
    catch (error) {
        handleError(res, error, 500, "Could not get saved items");
    }
};
//get priority list for a user
const sourcePriorityController = async (req, res) => {
    const { userId } = req.params;
    try {
        const priority = await sourcePriority(Number(userId));
        console.info(`INFO: Fetched source priority for user ${userId}.`);
        res.json(priority);
    }
    catch (error) {
        handleError(res, error, 500, "Error in getting source priority");
    }
};
//get all read items for a user
const readItemsController = async (req, res) => {
    const { userId } = req.params;
    try {
        const allReadItems = await readItems(Number(userId));
        console.info(`INFO: Fetched ${allReadItems.length} read items for user ${userId}`);
        res.json(allReadItems);
    }
    catch (error) {
        handleError(res, error, 500, "Could not get read items");
    }
};
export { addUserController, createFolderController, addUserSourceController, userFeedItemsController, folderItemsController, markItemReadController, saveItemController, markUserFeedItemsReadController, addSourceIntoFolderController, removeUserSourceController, deleteSourceFromFolderController, deleteFolderController, allUserSourcesController, getUserFoldersController, allSavedItemsController, sourcePriorityController, readItemsController };
//# sourceMappingURL=controller.js.map