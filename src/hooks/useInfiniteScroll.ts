// hooks/useInfiniteScroll.ts
"use client";

import { useEffect, useRef, useCallback } from "react";

interface Options {
  onIntersect: () => void;
  hasNextPage: boolean;
  isFetching: boolean;
  rootMargin?: string;
}

export function useInfiniteScroll({
  onIntersect,
  hasNextPage,
  isFetching,
  rootMargin = "0px",
}: Options) {
  const observerRef    = useRef<IntersectionObserver | null>(null);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingRef  = useRef(isFetching);
  const onIntersectRef = useRef(onIntersect);

  // Keep refs current on every render — no observer recreation needed
  useEffect(() => { hasNextPageRef.current = hasNextPage; }, [hasNextPage]);
  useEffect(() => { isFetchingRef.current  = isFetching;  }, [isFetching]);
  useEffect(() => { onIntersectRef.current = onIntersect; }, [onIntersect]);

  // Disconnect + reconnect whenever the DOM node changes.
  // Using useCallback so the function identity is stable.
  const sentinelRef = useCallback(
    (el: HTMLDivElement | null) => {
      // Always disconnect the previous observer first
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!el) return; // node removed — nothing to observe

      // Create a fresh observer for the new node
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&
            hasNextPageRef.current &&
            !isFetchingRef.current
          ) {
            onIntersectRef.current();
          }
        },
        { rootMargin, threshold: 0 }
      );

      observerRef.current.observe(el);
    },
    // rootMargin is the only real dep — everything else uses refs
    [rootMargin]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { sentinelRef };
}