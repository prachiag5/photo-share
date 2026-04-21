// types/index.ts
export interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  author: User;
  createdAt: string; // ISO string
  likesCount: number;
}

// What the API returns for paginated feeds
export interface FeedPage {
  posts: Post[];
  nextCursor: string | null; // null = no more pages
  hasNextPage: boolean;
}

// For creating/editing a post
export interface CreatePostPayload {
  caption: string;
  imageFile: File;
}

export interface UpdatePostPayload {
  id: string;
  caption?: string;
  imageFile?: File;
}