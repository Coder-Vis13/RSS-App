import express, { Router } from "express";
import { addUserController, createFolderController, renameFolderController, addUserSourceController, addUserPodcastController, 
userFeedItemsController, folderItemsController, markItemReadController, saveItemController, 
markUserFeedItemsReadController, markUserFolderItemsReadController, addSourceIntoFolderController, removeUserSourceController, 
deleteSourceFromFolderController, deleteFolderController, allUserSourcesController,
getUserFoldersController, allSavedItemsController, sourcePriorityController, updateSourcePrioritiesController, readItemsController, presetSources, getItemsByCategoryController, 
getSavedItemsByCategoryController} from "../controllers/controller";

const router: Router = express.Router();


// Home
// router.get("/", homePage);

//User
router.post('/users/add', addUserController);

// Sources
router.get("/users/:userId/sources", allUserSourcesController);  // get all sources for a user
router.post("/users/:userId/sources", addUserSourceController); // add a source for user
router.delete("/users/:userId/sources/:sourceId", removeUserSourceController); // remove source for user
router.post("/users/sources/add", presetSources); // add preset source to user's feed
router.post("/users/:userId/podcast", addUserPodcastController); //add a podcast for user

// Items
router.get("/users/:userId/feed", userFeedItemsController); // get unread home feed       //http://localhost:5000/users/11/feed?feedType=podcast
router.post("/users/:userId/items/:itemId/read", markItemReadController); // mark single item read
router.post("/users/:userId/items/save", saveItemController); // save/unsave item
router.post("/users/:userId/feed/read", markUserFeedItemsReadController); // mark all home items read
router.get("/users/:userId/saved", allSavedItemsController); // get saved items
router.get("/users/:userId/read", readItemsController); // get read items
router.post("/users/:userId/folders/:folderId/read", markUserFolderItemsReadController) //mark all folder items read
router.get("/users/:userId/category/:categoryName", getItemsByCategoryController); // get items with categories   
router.get("/users/:userId/saved/category/:categoryName", getSavedItemsByCategoryController);

// Folders
router.get("/users/:userId/folders", getUserFoldersController); // get all user folders
router.post("/users/:userId/folders", createFolderController);  // create folder
router.delete("/users/:userId/folders/:folderId", deleteFolderController); // delete folder
router.put("/users/:userId/folders/:folderId", renameFolderController); //rename folder

// Folder sources
router.post("/users/:userId/folders/:folderId/sources", addSourceIntoFolderController); // add source into folder
router.delete("/users/:userId/folders/:folderId/sources/:sourceId", deleteSourceFromFolderController); // remove source from folder
router.get("/users/:userId/folders/:folderId/feed", folderItemsController); // get unread items for folder

// Source Priority
router.get("/users/:userId/sources/priority", sourcePriorityController); // get sources with priority
router.post("/users/:userId/sources/priority", updateSourcePrioritiesController); //update priorities

export default router;
