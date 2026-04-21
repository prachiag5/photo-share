// src/app/api/posts/[id]/route.ts
//
// Route: GET    /api/posts/:id  → single post
//        PATCH  /api/posts/:id  → update caption / image
//        DELETE /api/posts/:id  → delete post
//
// FILE MUST BE AT: src/app/api/posts/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { MOCK_POSTS } from "@/lib/mock/posts";
import type { Post } from "@/types";

// Next.js App Router passes route params as the second argument
interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const post = MOCK_POSTS.find((p) => p.id === id);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

// ─── PATCH /api/posts/:id ─────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const post = MOCK_POSTS.find((p) => p.id === id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const caption = formData.get("caption");
    const imageFile = formData.get("image");

    // Build the updated post — only patch fields that were sent
    const updated: Post = {
      ...post,
      ...(caption && typeof caption === "string"
        ? { caption: caption.trim() }
        : {}),
      ...(imageFile instanceof File
        ? {
            // TODO: upload new image and replace imageUrl
            imageUrl: `https://picsum.photos/seed/${Date.now()}/800/800`,
          }
        : {}),
    };

    // TODO: persist updated post to DB
    // In mock mode we just return the updated shape — the real list
    // doesn't mutate in memory (that's fine for dev)

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/posts/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const exists = MOCK_POSTS.some((p) => p.id === id);
  if (!exists) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // TODO: delete from DB
  // In mock mode: 204 No Content — tells the client "it's gone"
  return new NextResponse(null, { status: 204 });
}