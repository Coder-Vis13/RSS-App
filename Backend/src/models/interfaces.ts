


export interface DelFolderParams {
  userId: string;
  folderId: string;
}













// Folder
export interface Folder {
  folder_id: number;
  name: string;
  user_id: number;
  created_at?: string;
}

export interface CreateFolderResult {
    user_id: number;
    name: string;
    folder_id: number;
}


export interface DeleteFolderResult {
  folder_id: number;
  name: string;
}

// ---------- Source ----------
export interface Source {
  source_id: number;
  source_name: string;
  url?: string;
}

export interface CreateSourceResult extends Source {
  created: boolean;
}

export interface UserSource {
  user_id: number;
  source_id: number;
  priority: number;
}

export interface AddUserSourceResult extends UserSource {
  created: boolean;
}

export interface SourceSummary {
  source_id: number;
  source_name: string;
}

export interface RemoveUserSourceResult {
  source_id: number;
  priority: number;
}

// ---------- Items ----------
export interface Item {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  source_name?: string; // added via joins
  source_id?: number;
}

export interface HomeItem extends Item {}

export interface FolderItem extends Item {}

export interface SavedItem {
    item_id: number;
    title: string;
    link: string;
    description: string;
    pub_date: Date;
    source_name: string;
}

export interface ReadItem extends Item {
  read_time: string;
}

// ---------- User Item Metadata ----------
export interface MarkItemReadResult {
  user_id: number;
  item_id: number;
  read_time?: string;
  read: boolean;
}

export interface MarkHomeItemsReadResult {
  readCount: number;
}

export interface SaveItemResult {
  user_id: number;
  item_id: number;
  is_save?: boolean;
  saved: boolean;
}

// ---------- Folder + Sources ----------
export interface UserSourceFolder {
  user_id: number;
  folder_id: number;
  source_id: number;
  added?: boolean;
}

