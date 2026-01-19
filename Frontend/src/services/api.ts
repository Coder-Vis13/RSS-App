import { get, post, del, put } from "./apiHelper";

 const addUser = (email: string, supabase_uid: string) =>
  post("/users/add", { email, supabase_uid });

 const getUserBySupabaseUID = (supabase_uid: string) =>
  get(`/users/by-supabase-uid/${supabase_uid}`);

 const createFolder = async (userId: number, folderName: string) =>
  post(`users/${userId}/folders`, { folderName });

 const getUserFolders = (userId: number) =>
  get(`users/${userId}/folders`);

 const deleteFolder = (userId: number, folderId: number) => 
    del(`/users/${userId}/folders/${folderId}`);

 const renameFolder = (userId: number, folderId: number, name: string) =>
    put(`/users/${userId}/folders/${folderId}`, { name });

 const addSourceIntoFolder = (userId: number, folderId: number, sourceId: number) =>
    post(`/users/${userId}/folders/${folderId}/sources`, { sourceId });

 const delSourceFromFolder = (userId: number, folderId: number, sourceId: number) =>
    del(`/users/${userId}/folders/${folderId}/sources/${sourceId}`);

 const addUserSource = (userId: number, sourceURL: string) =>
    post(`/users/${userId}/sources`, { sourceURL });

  const addUserPodcast = (userId: number, sourceURL: string) =>
    post(`/users/${userId}/sources`, { sourceURL });

 const removeUserSource = (userId: number, sourceId: number) => 
    del(`/users/${userId}/sources/${sourceId}`);

 const userFeedItems = (userId: number, feedType: "rss" | "podcast") =>
     get(`/users/${userId}/feed`, { feedType });

 const allUserRSSSources = (userId: number) =>
    get(`/users/${userId}/blog/sources`);

 const allUserPodcastSources = (userId: number) =>
    get(`/users/${userId}/podcast/sources`);

 const getUnfolderedSources = (userId: number) =>
      get(`/users/${userId}/sources/unfoldered`);

 const folderItems = (userId: number, folderId: number) =>
    get(`/users/${userId}/folders/${folderId}/feed`);

 const markItemRead = (userId: number, itemId: number, feedType: "rss" | "podcast") =>
    post(`/users/${userId}/items/${itemId}/read`, {feedType});

 const markSourceItemsRead = (userId: number, sourceId: number) =>
    get(`/users/${userId}/sources/${sourceId}/read`);

 const markUserFeedItemsRead = (userId: number, feedType: "rss" | "podcast") =>
    post(`/users/${userId}/feed/read`, {feedType});

 const markUserFolderItemsRead = (userId: number, folderId: number) =>
    post(`/users/${userId}/folders/${folderId}/read`);

 const saveItem = (userId: number, itemId: number, save: boolean, feedType: "rss" | "podcast") =>
    post(`/users/${userId}/items/save`, { userId, itemId, save, feedType });

 const allSavedItems = (userId: number, feedType: "rss" | "podcast") =>
    get(`/users/${userId}/saved`, {feedType});

 const sourcePriority = (userId: number, feedType: "rss" | "podcast") => 
    get(`/users/${userId}/sources/priority`, {feedType});

 interface SourcePriorityUpdate {
  source_id: number;
  priority: number;
    }

 const updateSourcePriorities = async (userId: number, sources: SourcePriorityUpdate[], feedType: "rss" | "podcast") => 
    post(`/users/${userId}/sources/priority`, { userId, sources, feedType });
    

 const readItems = (userId: number, feedType: "rss" | "podcast") =>
    get(`/users/${userId}/read`, {feedType});

 const presetSources = (userId: number, sourceId: number, feedType: "rss" | "podcast") => 
    post(`/users/sources/add`, {userId, sourceId, feedType});
    
 const getItemsByCategory = (userId: number, categoryName: string, feedType: "rss" | "podcast"): Promise<any[]> => 
   get(`/users/${userId}/category/${categoryName}`, {feedType});
 
 const getSavedItemsByCategory = (userId: number, categoryName: string, feedType: "rss" | "podcast"): Promise<any[]> => 
   get(`/users/${userId}/saved/category/${categoryName}`, {feedType});


export {addUser, createFolder, getUserFolders, deleteFolder, renameFolder, addSourceIntoFolder, delSourceFromFolder, addUserSource, 
    removeUserSource, userFeedItems, folderItems, markItemRead, markUserFeedItemsRead, markUserFolderItemsRead, saveItem, 
    allSavedItems, sourcePriority, updateSourcePriorities, readItems, presetSources, addUserPodcast, getItemsByCategory, getSavedItemsByCategory, getUserBySupabaseUID,
    allUserRSSSources, allUserPodcastSources, getUnfolderedSources, markSourceItemsRead
 }


