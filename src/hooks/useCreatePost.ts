// hooks/useCreatePost.ts
"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/lib/api/posts";
import type { CreatePostPayload, Post, FeedPage } from "@/types";

interface CreatePostState {
  isSubmitting: boolean;
  error: string | null;
}

interface UseCreatePostReturn extends CreatePostState {
  submit: (payload: CreatePostPayload) => Promise<Post | null>;
  clearError: () => void;
}

export function useCreatePost(): UseCreatePostReturn {
  const queryClient = useQueryClient();
  const [state, setState] = useState<CreatePostState>({
    isSubmitting: false,
    error: null,
  });

  const submit = useCallback(
    async (payload: CreatePostPayload): Promise<Post | null> => {
      setState({ isSubmitting: true, error: null });

      // ── Snapshot current cache for rollback ─────────────────────────────
      const previousFeed = queryClient.getQueryData<{ pages: FeedPage[] }>(["feed"]);

      // ── Optimistic update — insert a placeholder at the top of page 1 ──
      // The real post (with server-assigned id, createdAt, etc.) replaces it
      // after the API responds. If the API fails, we roll back.
      const optimisticPost: Post = {
        id: `optimistic_${Date.now()}`,
        imageUrl: payload.previewDataUrl ?? "",
        width: 800,
        height: 800,
        caption: payload.caption,
        author: {
          // TODO: replace with real session user
          id: "user_001",
          username: "anika.sharma",
          avatarUrl: "https://picsum.photos/seed/avatar001/64/64",
        },
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isOptimistic: true, // flag so PostCard can show a subtle loading state
      };

      queryClient.setQueryData<{ pages: FeedPage[] }>(["feed"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0
              ? { ...page, posts: [optimisticPost, ...page.posts] }
              : page
          ),
        };
      });

      try {
        const newPost = await createPost(payload);

        // Replace the optimistic placeholder with the real post from the server
        queryClient.setQueryData<{ pages: FeedPage[] }>(["feed"], (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === 0
                ? {
                    ...page,
                    posts: page.posts.map((p) =>
                      p.id === optimisticPost.id ? newPost : p
                    ),
                  }
                : page
            ),
          };
        });

        setState({ isSubmitting: false, error: null });
        return newPost;
      } catch (err) {
        // ── Rollback on failure ──────────────────────────────────────────
        queryClient.setQueryData(["feed"], previousFeed);

        const message =
          err instanceof Error ? err.message : "Failed to create post. Please try again.";

        setState({ isSubmitting: false, error: message });
        return null;
      }
    },
    [queryClient]
  );

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return { ...state, submit, clearError };
}