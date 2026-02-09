import { Request, Response } from 'express';
import { handleError } from '../utils/helpers';
import {
  addSourceIntoFolder,
  createFolder,
  deleteFolder,
  delSourceFromFolder,
  folderItems,
  getUserFolders,
  markFolderItemsRead,
  renameFolder
} from '../models';
import { DelFolderParams, UserId } from './types';
import { parseNumericId } from '../utils/request-parser';



interface CreateFolderBody {
  folderName: string;
}
interface CreateFolderParams {
  userId: string; 
}

interface SourceIdBody {
  sourceId: number;
}

interface DelSourceFromFolderParams extends DelFolderParams {
  sourceId: string;
}

interface FolderItem {
  userId: string;
  folderId: string;
}



//create a folder for a specific user
export const createFolderHandler = async (
  req: Request<CreateFolderParams, {}, CreateFolderBody>,
  res: Response
): Promise<void> => {

  try {
    const { folderName } = req.body;
    if (!folderName) {
      throw new Error('folderName is required');
    }

    const userId = parseNumericId(req.params.userId, 'userId');
    const folder = await createFolder({ user_id: userId, folder_name: folderName });
    console.info(`INFO: Folder '${folderName}' created for user ${userId}`);

    res.json(folder);
  } catch (error) {
    handleError(res, error, 500, 'Error in creating folder');
  }
};


//rename a folder for a user
export const renameFolderHandler = async (
  req: Request<{ userId: string; folderId: string }, {}, { name: string }>,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    const userId = parseNumericId(req.params.userId, 'userId');
    const folderId = parseNumericId(req.params.folderId, 'folderId');
    const updatedFolder = await renameFolder(userId, folderId, name);
    if (!updatedFolder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }
    res.json(updatedFolder);
  } catch (err: any) {
    if (err.code === '23505') {  // 23505 = unique_violation in PostgreSQL
      res
        .status(400)
        .json({ error: 'A folder with that name already exists. Please choose a different name' });
      return;
    }
    console.error('Error renaming folder:', err);
    res.status(500).json({ error: 'Failed to rename folder' });
  }
};


//get all the folders for a user
export const getUserFoldersHandler = async (
  req: Request<UserId, {}, {}>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseNumericId(req.params.userId, 'userId');

    const folders = await getUserFolders(userId);
    console.info(`INFO: Fetched folders for user ${userId} `);
    res.json(folders);
  } catch (error) {
    handleError(res, error, 500, "Error in getting user's folders");
  }
};


//delete a folder for a user
export const deleteFolderHandler = async (
  req: Request<DelFolderParams, {}, {}>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const folderId = parseNumericId(req.params.folderId, 'folderId');
    const deletedFolder = await deleteFolder(userId, folderId);
    if (!deletedFolder) {
      console.warn(`WARN: Folder ${folderId} not found for user ${userId}.`);
      res.status(404).json({ error: 'Folder not found' });
      return;
    }
    console.info(`INFO: Deleted folder ${folderId} for user ${userId}.`);
    res.json(deletedFolder);
    return;
  } catch (error) {
    handleError(res, error, 500, 'Error deleting the folder');
  }
};


//adds a source into a folder for a user
export const addSourceIntoFolderHandler = async (
  req: Request<DelFolderParams, {}, SourceIdBody>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const folderId = parseNumericId(req.params.folderId, 'folderId');
    const sourceId = parseNumericId(String(req.body.sourceId), 'sourceId');
    const result = await addSourceIntoFolder(userId, folderId, sourceId);
    console.info(`INFO: Source ${sourceId} added to folder ${folderId} for user ${userId}`);
    res.json(result);
  } catch (error) {
    handleError(res, error, 500, 'Could not add source into folder');
  }
};


//delete a source from a folder for a user
export const deleteSourceFromFolderHandler = async (
  req: Request<DelSourceFromFolderParams>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const folderId = parseNumericId(req.params.folderId, 'folderId');
    const sourceId = parseNumericId(String(req.body.sourceId), 'sourceId');
    const delSource = await delSourceFromFolder(userId, folderId, sourceId);
    console.info(`INFO: Source ${sourceId} removed from folder ${folderId} for user ${userId}`);
    res.json(delSource);
  } catch (error) {
    handleError(res, error, 500, 'Error in removing source from folder');
  }
};


//get all items in a folder for a user
export const folderItemsHandler = async (
  req: Request<FolderItem, {}, {}>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const folderId = parseNumericId(req.params.folderId, 'folderId');

    const unreadItems = await folderItems(userId, folderId);
    console.info(`INFO: Fetched unread items for folder ${folderId}, user ${userId}.`);
    res.json(unreadItems);
  } catch (error) {
    handleError(res, error, 500, 'Error fetching unread items in folder');
  }
};


export const markFolderItemsReadHandler = async (
  req: Request<FolderItem, {}, {}>,
  res: Response
): Promise<void> => {

  try {
    const userId = parseNumericId(req.params.userId, 'userId');
    const folderId = parseNumericId(req.params.folderId, 'folderId');
    const readItems = await markFolderItemsRead(userId, folderId);
    console.info(`INFO: Marked folder ${folderId} items as read for user ${userId}`);
    res.json(readItems);
  } catch (error) {
    handleError(res, error, 500, 'Error marking all items as read');
  }
};