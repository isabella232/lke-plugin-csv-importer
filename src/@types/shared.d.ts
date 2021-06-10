export interface ImportNodesParams {
  sourceKey: string;
  csv: string;
  itemType: string;
  separator: string;
}

export interface ImportEdgesParams extends ImportNodesParams {
  sourceType: string;
  destinationType: string;
}

export type ImportItemsResponse = {
  success: number;
  failed?: number;
  error?: string;
}
