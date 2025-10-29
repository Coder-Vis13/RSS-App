import { get, post, del, put } from "./apiHelper";

export const addUser = (userName: string, userEmail: string, password: string) =>
  post("/users/add", { userName, userEmail, password });

export const createFolder = async (userId: number, folderName: string) =>
  post(`users/${userId}/folders`, { folderName });

export const getUserFolders = (userId: number) =>
  get(`users/${userId}/folders`);

export const deleteFolder = (userId: number, folderId: number) => 
    del(`/users/${userId}/folders/${folderId}`);

export const renameFolder = (userId: number, folderId: number, name: string) =>
    put(`/users/${userId}/folders/${folderId}`, { name });

export const addSourceIntoFolder = (userId: number, folderId: number, sourceId: number) =>
    post(`/users/${userId}/folders/${folderId}/sources`, { sourceId });

export const delSourceFromFolder = (userId: number, folderId: number, sourceId: number) =>
    del(`/users/${userId}/folders/${folderId}/sources/${sourceId}`);

export const addUserSource = (userId: number, sourceURL: string) =>
    post(`/users/${userId}/sources`, { sourceURL });

export const removeUserSource = (userId: number, sourceId: number) => 
    del(`/users/${userId}/sources/${sourceId}`);

export const userFeedItems = (userId: number) =>
    get(`/users/${userId}/feed`);

export const allUserSources = (userId: number) =>
    get(`/users/${userId}/sources`);

export const folderItems = (userId: number, folderId: number) =>
    get(`/users/${userId}/folders/${folderId}/feed`);

export const markItemRead = (userId: number, itemId: number) =>
    post(`/users/${userId}/items/${itemId}/read`);

export const markUserFeedItemsRead = (userId: number) =>
    post(`/users/${userId}/feed/read`);

export const markUserFolderItemsRead = (userId: number, folderId: number) =>
    post(`/users/${userId}/folders/${folderId}/read`);

export const saveItem = (userId: number, itemId: number, save: boolean) =>
    post(`/users/${userId}/items/save`, { userId, itemId, save });

export const allSavedItems = (userId: number) =>
    get(`/users/${userId}/saved`);

export const sourcePriority = (userId: number) => 
    get(`/users/${userId}/sources/priority`);

export interface SourcePriorityUpdate {
  source_id: number;
  priority: number;
}

export const updateSourcePriorities = async (userId: number, sources: SourcePriorityUpdate[]) => {
     post(`/users/${userId}/sources/priority`, { userId, sources });
};

export const readItems = (userId: number) =>
    get(`/users/${userId}/read`);

export const presetSources = (userId: number, sourceId: number) => {
    post(`/users/sources/add`, {userId, sourceId});
}





