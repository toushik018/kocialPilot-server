export interface SearchResult {
  id: string;
  type: 'post' | 'video' | 'image' | 'user';
  title: string;
  description?: string;
  thumbnail?: string;
  url: string;
  createdAt: Date;
  relevanceScore?: number;
}

export interface SearchQuery {
  query: string;
  type?: 'all' | 'post' | 'video' | 'image' | 'user';
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
}
