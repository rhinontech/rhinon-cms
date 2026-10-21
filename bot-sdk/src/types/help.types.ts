// Help and articles type definitions

export interface Article {
  articleId: string;
  title: string;
  content: string;
  status: string;
  views: number;
  likes: number;
  dislikes: number;
  createdAt: string;
  updated_at: string;
}

export interface Folder {
  folderId: string;
  name: string;
  description: string;
  articles: Article[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsItem {
  title: string;
  content: string;
  img: string;
  tags: string[];
  authorImg: string;
  authorName: string;
  updatedAt: string;
}
