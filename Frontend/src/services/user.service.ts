import { get, post, del, put } from "../lib/api-client";

const addUser = (email: string, supabase_uid: string) =>
  post("/users/add", { email, supabase_uid });

const createFolder = async (userId: number, folderName: string) =>
  post(`users/${userId}/folders`, { folderName });

import type { UserFolder } from "../components/sidebar/sidebarTypes";

const getUserFolders = (userId: number): Promise<UserFolder[]> =>
  get(`users/${userId}/folders`);

const deleteFolder = (userId: number, folderId: number) =>
  del(`/users/${userId}/folders/${folderId}`);

const renameFolder = (userId: number, folderId: number, name: string) =>
  put(`/users/${userId}/folders/${folderId}`, { name });

const addSourceIntoFolder = (
  userId: number,
  folderId: number,
  sourceId: number,
) => post(`/users/${userId}/folders/${folderId}/sources`, { sourceId });

const delSourceFromFolder = (
  userId: number,
  folderId: number,
  sourceId: number,
) => del(`/users/${userId}/folders/${folderId}/sources/${sourceId}`);

const addSource = (userId: number, sourceURL: string) =>
  post(`/users/${userId}/source`, { sourceURL });

const removeUserSource = (userId: number, sourceId: number) =>
  del(`/users/${userId}/sources/${sourceId}`);

const userFeedItems = (userId: number, timeFilter?: "all" | "today" | "week" | "month") =>
  get(`/users/${userId}/feed`, { timeFilter});

const allUserSources = (userId: number) =>
  get(`/users/${userId}/sources`);

const getUnfolderedSources = (userId: number) =>
  get(`/users/${userId}/sources/unfoldered`);

const folderItems = (userId: number, folderId: number, timeFilter?: "all" | "today" | "week" | "month") =>
  get(`/users/${userId}/folders/${folderId}/feed`, {timeFilter});

const markItemRead = (userId: number, itemId: number,) => 
  post(`/users/${userId}/items/${itemId}/read`);

const markSourceItemsRead = (userId: number, sourceId: number) =>
  get(`/users/${userId}/sources/${sourceId}/read`);

const markUserFeedItemsRead = (userId: number) =>
  post(`/users/${userId}/feed/read`);

const markUserFolderItemsRead = (userId: number, folderId: number) =>
  post(`/users/${userId}/folders/${folderId}/read`);

const saveItem = (userId: number, itemId: number, save: boolean,) => 
  post(`/users/${userId}/items/save`, { userId, itemId, save });

const allSavedItems = (userId: number) =>
  get(`/users/${userId}/saved`);

const getSourceItems = (userId: number, sourceId: number, timeFilter?: "all" | "today" | "week" | "month") => 
  get(`users/${userId}/source/${sourceId}/items`, {timeFilter});


const sourcePriority = (userId: number, feedType: "rss" | "podcast") =>
  get(`/users/${userId}/sources/priority`, { feedType });

interface SourcePriorityUpdate {
  source_id: number;
  priority: number;
}

const updateSourcePriorities = async (
  userId: number,
  sources: SourcePriorityUpdate[],
  feedType: "rss" | "podcast",
) => post(`/users/${userId}/sources/priority`, { userId, sources, feedType });

const readItems = (userId: number) =>
  get(`/users/${userId}/read`);

const presetSources = (
  userId: number,
  sourceId: number,
  feedType: "rss" | "podcast",
) => post(`/users/sources/add`, { userId, sourceId, feedType });

const getItemsByCategory = (
  userId: number,
  categoryName: string,
): Promise<any[]> =>
  get(`/users/${userId}/category/${categoryName}`);

const getSavedItemsByCategory = (userId: number,categoryName: string,): Promise<any[]> =>
  get(`/users/${userId}/saved/category/${categoryName}`);


export {
  addUser,
  createFolder,
  getUserFolders,
  deleteFolder,
  renameFolder,
  addSourceIntoFolder,
  delSourceFromFolder,
  addSource as addUserSource,
  removeUserSource,
  userFeedItems,
  folderItems,
  markItemRead,
  markUserFeedItemsRead,
  markUserFolderItemsRead,
  saveItem,
  allSavedItems,
  sourcePriority,
  updateSourcePriorities,
  readItems,
  presetSources,
  getItemsByCategory,
  getSavedItemsByCategory,
  getUnfolderedSources,
  markSourceItemsRead,
  getSourceItems,
  allUserSources
};
