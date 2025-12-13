export type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  pagination?: {
    totalPage?: number;
    currentPage?: number;
    prevPage: number;
    nextPage: number;
    limit?: number;
    totalItem?: number;
  };
  meta?: TMeta;
  data: T;
};

type TMeta = {
  limit: number;
  page: number;
  total: number;
  totalPage: number;
};

export type IQueryObj = {
  [key: string]: unknown;
  page?: string;
  limit?: string;
  searchTerm?: string;
  fields?: string;
  sortBy?: string;
  sortOrder?: string;
};

export type ISearchFields = string[];
