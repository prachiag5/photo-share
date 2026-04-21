// lib/api/posts.ts
import type { FeedPage, Post, CreatePostPayload, UpdatePostPayload } from "@/types";

const BASE = "/api"; // Your Next.js Route Handlers

// Fetch a page of posts. cursor = null means first page.
export async function fetchFeedPage(cursor: string | null): Promise<FeedPage> {
  const url = cursor
    ? `${BASE}/posts?cursor=${cursor}`
    : `${BASE}/posts`;

  const res = await fetch(url, { next: { revalidate: 0 } }); // no caching on client
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const form = new FormData();
  form.append("caption", payload.caption);
  form.append("image", payload.imageFile);

  const res = await fetch(`${BASE}/posts`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

export async function updatePost(payload: UpdatePostPayload): Promise<Post> {
  const form = new FormData();
  if (payload.caption) form.append("caption", payload.caption);
  if (payload.imageFile) form.append("image", payload.imageFile);

  const res = await fetch(`${BASE}/posts/${payload.id}`, {
    method: "PATCH",
    body: form,
  });
  if (!res.ok) throw new Error("Failed to update post");
  return res.json();
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${BASE}/posts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete post");
}