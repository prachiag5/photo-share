// src/app/api/posts/route.ts
//
// Route: GET  /api/posts          → paginated feed (page 1)
//        GET  /api/posts?cursor=x → paginated feed (page N)
//        POST /api/posts          → create a new post
//
// FILE MUST BE AT: src/app/api/posts/route.ts
// That maps to the URL:           /api/posts
//
// Common 404 causes:
//   ✗  src/pages/api/posts.ts     (wrong — that's the old Pages Router)
//   ✗  src/app/api/posts.ts       (wrong — needs a folder + route.ts)
//   ✓  src/app/api/posts/route.ts (correct)

import { NextRequest, NextResponse } from "next/server";
import { MOCK_POSTS, PAGE_SIZE, CURSOR_MAP } from "@/lib/mock/posts";
import type { FeedPage, Post } from "@/types";

// ─── GET /api/posts ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Simulate real-world network latency in development
  if (process.env.NODE_ENV === "development") {
    await sleep(400);
  }

  // Read the cursor from the query string
  // e.g. /api/posts?cursor=cursor_page_2
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  // Resolve the start index from the cursor
  // null cursor = first page (index 0)
  const startIndex = cursor ? (CURSOR_MAP[cursor] ?? 0) : 0;

  // Slice the posts for this page
  const pagePosts: Post[] = MOCK_POSTS.slice(startIndex, startIndex + PAGE_SIZE);

  // Calculate the next cursor
  // If there are more posts after this page, return a cursor; else null
  const nextStart = startIndex + PAGE_SIZE;
  const hasMore = nextStart < MOCK_POSTS.length;

  // Find the cursor key that maps to the next page's start index
  // In a real DB this would be the last record's ID or a timestamp
  const nextCursor: string | null = hasMore
    ? Object.keys(CURSOR_MAP).find((key) => CURSOR_MAP[key] === nextStart) ?? null
    : null;

  const response: FeedPage = {
    posts: pagePosts,
    nextCursor,
    hasNextPage: hasMore,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      // Allow TanStack Query to cache this for 30s on the client
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    },
  });
}

// ─── POST /api/posts ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    await sleep(600);
  }

  try {
    const formData = await request.formData();

    const caption = formData.get("caption");
    const imageFile = formData.get("image");

    // Basic validation
    if (!caption || typeof caption !== "string") {
      return NextResponse.json(
        { error: "caption is required" },
        { status: 400 }
      );
    }
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "image file is required" },
        { status: 400 }
      );
    }

    // TODO: upload imageFile to Cloudinary / S3 / Supabase Storage
    // const imageUrl = await uploadToStorage(imageFile);

    // For now: return a mock created post
    const newPost: Post = {
      id: `post_${Date.now()}`,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/800/800`,
      width: 800,
      height: 800,
      caption: caption.trim(),
      author: {
        // TODO: get from session — e.g. getServerSession(authOptions)
        id: "user_001",
        username: "anika.sharma",
        avatarUrl: "https://picsum.photos/seed/avatar001/64/64",
      },
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };

    return NextResponse.json(newPost, { status: 201 });
  } catch (err) {
    console.error("[POST /api/posts]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}