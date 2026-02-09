import express, { Router } from 'express';

import { addUserHandler } from '../controllers';

import {
  allUserSourcesHandler,
  getUnfolderedSourcesHandler,
  allUserRSSSourcesHandler,
  allUserPodcastSourcesHandler,
  addUserSourceHandler,
  removeUserSourceHandler,
  presetSourcesHandler,
  addUserPodcastHandler,
  markSourceItemsReadHandler,
  sourcePriorityHandler,
  updateSourcePrioritiesHandler,
  getSourceItemsHandler
} from '../controllers';

import {
  userFeedItemsHandler,
  markItemReadHandler,
  saveItemHandler,
  markUserFeedItemsReadHandler,
  allSavedItemsHandler,
  readItemsHandler,
  getItemsByCategoryHandler,
  getSavedItemsByCategoryHandler,
} from '../controllers';

import {
  getUserFoldersHandler,
  createFolderHandler,
  deleteFolderHandler,
  renameFolderHandler,
  addSourceIntoFolderHandler,
  deleteSourceFromFolderHandler,
  folderItemsHandler,
  markFolderItemsReadHandler
} from '../controllers';

import { loginHandler } from "../controllers/auth/login.controller";
import { registerHandler } from "../controllers/auth/register.controller";
import { refreshHandler } from "../controllers/auth/refresh.controller";
import { logoutHandler } from "../controllers/auth/logout.controller";

const router: Router = express.Router();




//User
router.post('/users/add', addUserHandler);

//Auth
router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);

// Sources
router.get('/users/:userId/sources', allUserSourcesHandler); // get all sources for a user
router.get('/users/:userId/sources/unfoldered', getUnfolderedSourcesHandler); // get all unfoldered sources for a user
router.get('/users/:userId/blog/sources', allUserRSSSourcesHandler); // get all blog sources for a user
router.get('/users/:userId/podcast/sources', allUserPodcastSourcesHandler); // get all blog sources for a user
router.post('/users/:userId/sources', addUserSourceHandler); // add a source for user
router.delete('/users/:userId/sources/:sourceId', removeUserSourceHandler); // remove source for user
router.post('/users/sources/add', presetSourcesHandler); // add preset source to user's feed
router.post('/users/:userId/podcast', addUserPodcastHandler); //add a podcast for user
router.get('/users/:userId/source/:sourceId/items', getSourceItemsHandler) //get all unread items of a source for a user

// Items
router.get('/users/:userId/feed', userFeedItemsHandler); // get unread home feed
router.post('/users/:userId/items/:itemId/read', markItemReadHandler); // mark single item read
router.post('/users/:userId/items/save', saveItemHandler); // save/unsave item
router.post('/users/:userId/feed/read', markUserFeedItemsReadHandler); // mark all home items read
router.get('/users/:userId/saved', allSavedItemsHandler); // get saved items
router.get('/users/:userId/read', readItemsHandler); // get read items
router.get('/users/:userId/sources/:sourceId/read', markSourceItemsReadHandler); // mark all items from source as read
router.post('/users/:userId/folders/:folderId/read', markFolderItemsReadHandler); //mark all folder items read
router.get('/users/:userId/category/:categoryName', getItemsByCategoryHandler); // get items with categories
router.get('/users/:userId/saved/category/:categoryName', getSavedItemsByCategoryHandler); // get saved items with categories

// Folders
router.get('/users/:userId/folders', getUserFoldersHandler); // get all user folders
router.post('/users/:userId/folders', createFolderHandler); // create folder
router.delete('/users/:userId/folders/:folderId', deleteFolderHandler); // delete folder
router.put('/users/:userId/folders/:folderId', renameFolderHandler); //rename folder

// Folder sources
router.post('/users/:userId/folders/:folderId/sources', addSourceIntoFolderHandler); // add source into folder
router.delete('/users/:userId/folders/:folderId/sources/:sourceId', deleteSourceFromFolderHandler); // remove source from folder
router.get('/users/:userId/folders/:folderId/feed', folderItemsHandler); // get unread items for folder

// Source Priority
router.get('/users/:userId/sources/priority', sourcePriorityHandler); // get sources with priority
router.post('/users/:userId/sources/priority', updateSourcePrioritiesHandler); //update priorities

export default router;
