export interface UserFolder {
  folder_id: number;
  name: string;
  sources: Source[];
}

export interface Source {
  source_id: number;
  source_name: string;
}
