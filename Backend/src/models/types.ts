
export interface Item {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string | Date;
  source_name: string;
  categories: Category[];
  is_categorized: boolean;
}


export interface Source {
  source_id: number;
  source_name: string;
}


export interface Category {
  name: string;
  color: string;
}

export interface ReadItemResult {
  readCount: number | null;
}

export interface AddItemResult {
  insertCount: number;
  insertedIds: number[];
}


export interface InsertedItem {
  item_id: number;
  title: string;
}

export interface UserId {
  user_id: number;
}

export interface AuthUser {
  user_id: number;
  password_hash: string;
}

export interface UserRefreshToken {
  user_id: number;
}
