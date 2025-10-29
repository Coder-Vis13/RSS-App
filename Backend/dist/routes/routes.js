import express from "express";
import { addUserController, createFolderController, addUserSourceController, userFeedItemsController, folderItemsController, markItemReadController, saveItemController, markUserFeedItemsReadController, addSourceIntoFolderController, removeUserSourceController, deleteSourceFromFolderController, deleteFolderController, allUserSourcesController, getUserFoldersController, allSavedItemsController, sourcePriorityController, readItemsController } from "../controllers/controller";
const router = express.Router();
// Home
// router.get("/", homePage);
//User
router.post('/users/add', addUserController);
// Sources
router.get("/users/:userId/sources", allUserSourcesController); // get all sources for a user
router.post("/users/:userId/sources", addUserSourceController); // add a source for user
router.delete("/users/:userId/sources", removeUserSourceController); // remove source for user
// Items
router.get("/users/:userId/feed", userFeedItemsController); // get unread home feed
router.post("/users/:userId/items/:itemId/read", markItemReadController); // mark single item read
router.post("/users/:userId/items/save", saveItemController); // save/unsave item
router.post("/users/:userId/feed/read", markUserFeedItemsReadController); // mark all home items read
router.get("/users/:userId/saved", allSavedItemsController); // get saved items
router.get("/users/:userId/read", readItemsController); // get read items
// Folders
router.get("/users/:userId/folders", getUserFoldersController); // get all user folders
router.post("/users/:userId/folders", createFolderController); // create folder
router.delete("/users/:userId/folders/:folderId", deleteFolderController); // delete folder
// Folder sources
router.post("/users/:userId/folders/:folderId/sources", addSourceIntoFolderController); // add source into folder
router.delete("/users/:userId/folders/:folderId/sources/:sourceId", deleteSourceFromFolderController); // remove source from folder
router.get("/users/:userId/folders/:folderId/feed", folderItemsController); // get unread items for folder
// Source Priority
router.get("/users/:userId/sources/priority", sourcePriorityController); // get sources with priority
export default router;
//# sourceMappingURL=routes.js.map