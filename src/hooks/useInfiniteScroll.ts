// hooks/useInfiniteScroll.ts
import { useEffect, useRef, useCallback } from "react";

interface Options {
  onIntersect: () => void;
  hasNextPage: boolean;
  isFetching: boolean;
  threshold?: number; // 0-1, default 0.1
}

export function useInfiniteScroll({
  onIntersect,
  hasNextPage,
  isFetching,
  threshold = 0.1,
}: Options) {
  // This ref attaches to the sentinel element at the bottom of your list
  const sentinelRef = useRef<HTMLDivElement>(null);

  // useCallback so we don't recreate the observer on every render
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      // Only fire if: element IS visible, there's more data, and we're not already fetching
      if (entry.isIntersecting && hasNextPage && !isFetching) {
        onIntersect();
      }
    },
    [onIntersect, hasNextPage, isFetching]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root: null, // viewport
      rootMargin: "200px", // start loading 200px BEFORE the user hits the bottom
      threshold,
    });

    observer.observe(sentinel);

    // Cleanup is critical: disconnect when component unmounts
    return () => observer.disconnect();
  }, [handleIntersect, threshold]);

  return { sentinelRef };
}