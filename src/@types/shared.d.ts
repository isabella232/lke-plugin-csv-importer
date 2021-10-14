export interface ImportNodesParams {
  sourceKey: string;
  csv: string;
  itemType: string;
}

export interface ImportEdgesParams extends ImportNodesParams {
  sourceType: string;
  destinationType: string;
}

export type ImportItemsResponse = {
  success: number;
  failed?: number;
  error?: Record<string, string[]>;
  status: 'importing' | 'done';
  progress?: number;
};

export type ImportResult = {
  globalError: string;
} | {
  success: number;
  failed?: number;
  error?: Record<string, string[]>;
};

export type ImportState = {
  importing: true;
  progress: number;
} | {
  importing: false;
  lastImport?: ImportResult
}
