"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { List, useListRef } from "react-window";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { fetchFeedPage } from "@/lib/api/posts";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "./PostSkeleton";
import { prefetchImages } from "@/hooks/useImageLoader";
import type { Post } from "@/types";

const CARD_MAX_WIDTH  = 468;
const IMAGE_ASPECT    = 5 / 4;
const CARD_CHROME     = 76 + 60;
const POST_ROW_HEIGHT = CARD_MAX_WIDTH * IMAGE_ASPECT + CARD_CHROME;
const SENTINEL_ROW_HEIGHT = 80;

const DEBUG = true;
function log(g: string, m: string, d?: unknown) {
  if (!DEBUG) return;
  const s = "color:#7c3aed;font-weight:bold;";
  d !== undefined
    ? console.log(`%c[Feed:${g}]`, s, m, d)
    : console.log(`%c[Feed:${g}]`, s, m);
}
function warn(g: string, m: string, d?: unknown) {
  if (!DEBUG) return;
  const s = "color:#d97706;font-weight:bold;";
  d !== undefined
    ? console.warn(`%c[Feed:${g}] ⚠`, s, m, d)
    : console.warn(`%c[Feed:${g}] ⚠`, s, m);
}

// ── RowProps ──────────────────────────────────────────────────────────────────
interface RowProps {
  posts: Post[];
  onDelete: (id: string) => void;
  onEdit: (post: Post) => void;
  // Callback ref — stable function identity, handles remounts correctly
  sentinelRef: (el: HTMLDivElement | null) => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}

// ── Row ───────────────────────────────────────────────────────────────────────
function Row({
  index,
  style,
  posts,
  onDelete,
  onEdit,
  sentinelRef,
  isFetchingNextPage,
  hasNextPage,
}: { index: number; style: React.CSSProperties } & RowProps) {

  const isLastRow = index === posts.length;



  if (isLastRow) {
    return (
      <div style={style}>
        {/*
         * sentinelRef is now a callback ref from useInfiniteScroll.
         * When this div mounts,  sentinelRef(el)  attaches the observer.
         * When this div unmounts, sentinelRef(null) disconnects it.
         * No manual write-through needed.
         */}
        <div
          ref={sentinelRef}
          style={{
            height: SENTINEL_ROW_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            outline:    DEBUG ? "2px dashed #7c3aed" : undefined,
            background: DEBUG ? "rgba(124,58,237,0.05)" : undefined,
          }}
        >
          {isFetchingNextPage && <PostSkeleton />}
          {!hasNextPage && !isFetchingNextPage && (
            <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>
              You're all caught up
            </p>
          )}
        </div>
      </div>
    );
  }

  const post = posts[index];
  if (!post) {
    warn("Row", `No post at index=${index}`);
    return null;
  }

  return (
    <div style={style}>
      <PostCard post={post} onDelete={onDelete} onEdit={onEdit} />
    </div>
  );
}

// ── FeedList ──────────────────────────────────────────────────────────────────
export function FeedList() {
  const queryClient    = useQueryClient();
  const listRef = useListRef(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }: { pageParam: string | null }) => {
      return fetchFeedPage(pageParam);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,  // ← the fix
    staleTime: 30_000,
  });

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data]
  );



  const rowCount = posts.length + 1;



  const getRowHeight = useCallback(
    (index: number) =>
      index === posts.length ? SENTINEL_ROW_HEIGHT : POST_ROW_HEIGHT,
    [posts.length]
  );

  const handleRowsRendered = useCallback(
    (visibleRows: { startIndex: number; stopIndex: number }) => {
      const { startIndex, stopIndex } = visibleRows;
      const sentinelInRange = stopIndex >= posts.length;

      const nextBatch = posts
        .slice(stopIndex + 1, stopIndex + 4)
        .filter((_, i) => stopIndex + 1 + i < posts.length)
        .map((p) => p.imageUrl);
      if (nextBatch.length > 0) prefetchImages(nextBatch);
    },
    [posts]
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

  // sentinelRef is now a stable callback ref — handles mount/unmount correctly
  const { sentinelRef } = useInfiniteScroll({
    onIntersect: () => {
      fetchNextPage();
    },
    hasNextPage: !!hasNextPage,
    isFetching:  isFetchingNextPage,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    
  });

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)}
      </div>
    );
  }
  if (isError) throw new Error("Failed to load feed");
  if (posts.length === 0) {
    return <p style={{ textAlign: "center", padding: "48px 0" }}>No posts yet.</p>;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <List
          listRef={listRef}
          rowCount={rowCount}
          rowHeight={getRowHeight}
          rowComponent={Row}
          rowProps={{
            posts,
            onDelete:           handleDelete,
            onEdit:             handleEdit,
            sentinelRef,
            isFetchingNextPage,
            hasNextPage:        !!hasNextPage,
          }}
          onRowsRendered={handleRowsRendered}
          overscanCount={2}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}