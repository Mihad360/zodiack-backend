export interface INews {
  title: string;
  thumbnail?: string;
  category: string;
  readTime: string;
  publishedDate: string;
  description: string;
  isDeleted: boolean;
}

export interface ILegal {
  description: string;
  isDeleted: boolean;
}
