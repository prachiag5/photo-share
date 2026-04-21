// components/feed/FeedList.tsx
"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { List, useListRef } from "react-window";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { fetchFeedPage } from "@/lib/api/posts";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "./PostSkeleton";
import { prefetchImages } from "@/hooks/useImageLoader";
import type { Post } from "@/types";

// ─── Row — defined outside, stable reference ──────────────────────────────────
interface RowProps {
  posts: Post[];
  onDelete: (id: string) => void;
  onEdit: (post: Post) => void;
}

function Row({
  index,
  style,
  posts,
  onDelete,
  onEdit,
}: { index: number; style: React.CSSProperties } & RowProps) {
  const post = posts[index];
  if (!post) return null;
  return (
    <div style={style}>
      <PostCard post={post} onDelete={onDelete} onEdit={onEdit} />
    </div>
  );
}

// ─── FeedList ─────────────────────────────────────────────────────────────────
export function FeedList() {
  const queryClient = useQueryClient();
  const listRef = useListRef(null); // no argument

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam ?? null),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null,
    staleTime: 30_000,
  });

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const prev = queryClient.getQueryData(["feed"]);
      queryClient.setQueryData(["feed"], (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.filter((p: Post) => p.id !== id),
        })),
      }));
      try {
        await fetch(`/api/posts/${id}`, { method: "DELETE" });
      } catch {
        queryClient.setQueryData(["feed"], prev);
      }
    },
    [queryClient]
  );

  const handleEdit = useCallback((_post: Post) => {}, []);

// Replace getRowHeight in FeedList.tsx
const CARD_MAX_WIDTH = 468;
const IMAGE_ASPECT   = 5 / 4;   // 4:5 portrait — matches PostImage
const CARD_CHROME    = 76 + 60; // header (76px) + body/caption (60px)

const getRowHeight = useCallback(
  (_index: number) => {
    // All cards share the same height because images are all 4:5.
    // Width is capped at 468px inside the feed column.
    return CARD_MAX_WIDTH * IMAGE_ASPECT + CARD_CHROME;
  },
  [] // no deps — pure constant
);

  const handleRowsRendered = useCallback(
    (visibleRows: { startIndex: number; stopIndex: number }) => {
      const nextBatch = posts
        .slice(visibleRows.stopIndex + 1, visibleRows.stopIndex + 4)
        .map((p) => p.imageUrl);
      prefetchImages(nextBatch);
    },
    [posts]
  );

  const { sentinelRef } = useInfiniteScroll({
    onIntersect: fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetching: isFetchingNextPage,
  });

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 4 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) throw new Error("Failed to load feed");

  if (posts.length === 0) {
    return (
      <p style={{ textAlign: "center", padding: "48px 0" }}>
        No posts yet. Be the first to share.
      </p>
    );
  }

  return (
    /*
     * height: 100% works because the chain above is now solid:
     * html → body → #__next → layout .shell → .main → FeedList → here
     * Every ancestor is height: 100%, overflow: hidden.
     * No ancestor scrolls. Only react-window's List scrolls.
     */
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

      {/* This div takes all available height and contains the List */}
      <div style={{
        flex: 1,
        minHeight: 0,      /* critical — lets flex child shrink below content size */
        overflow: "hidden",
      }}>
        <List
          listRef={listRef}
          rowCount={posts.length}
          rowHeight={getRowHeight}
          rowComponent={Row}
          rowProps={{ posts, onDelete: handleDelete, onEdit: handleEdit }}
          onRowsRendered={handleRowsRendered}
          overscanCount={2}
          style={{ height: "100%", width: "100%" }}
        />
      </div>

      {/*
       * Sentinel is OUTSIDE the List but INSIDE the scrollable react-window.
       * Problem: react-window doesn't render elements outside its row range.
       * Solution: place sentinel as a real DOM sibling below the List div,
       * and use rootMargin on the IntersectionObserver to trigger early.
       * The observer fires when the List's bottom edge is near the viewport.
       */}
      <div ref={sentinelRef} style={{ height: 1, flexShrink: 0 }} aria-hidden />

      {isFetchingNextPage && (
        <div style={{ padding: "16px 0", flexShrink: 0 }}>
          <PostSkeleton />
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <p style={{
          textAlign: "center",
          padding: "16px 0",
          fontSize: 13,
          color: "var(--color-text-tertiary)",
          flexShrink: 0,
        }}>
          You're all caught up
        </p>
      )}
    </div>
  );
}