export type SortDirection = "ASC" | "DESC";

export interface PageQuery<TSort extends string = string> {
  page: number;
  limit: number;
  sortBy?: TSort;
  sortDirection?: SortDirection;
}

export interface PageResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
