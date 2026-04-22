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

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface Post {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  caption: string;
  author: User;
  createdAt: string;
  likesCount: number;
  // Set to true on optimistic posts — PostCard uses this to show a subtle
  // uploading indicator. Never present on server-returned posts.
  isOptimistic?: boolean;
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface CreatePostPayload {
  caption: string;
  imageFile: File;
  // Client-side dataUrl for the optimistic preview — not sent to the server
  previewDataUrl?: string;
}

export interface UpdatePostPayload {
  id: string;
  caption?: string;
  imageFile?: File;
}