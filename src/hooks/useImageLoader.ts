// hooks/useImageLoader.ts
import { useState, useEffect, useRef } from "react";

// A simple in-memory cache to avoid re-fetching already-loaded images
const imageCache = new Map<string, "loading" | "loaded" | "error">();

export function useImageLoader(src: string) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    imageCache.get(src) ?? "loading"
  );

  useEffect(() => {
    if (status === "loaded") return; // Already in cache

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, "loaded");
      setStatus("loaded");
    };
    img.onerror = () => {
      imageCache.set(src, "error");
      setStatus("error");
    };
    img.src = src;
  }, [src, status]);

  return { isLoading: status === "loading", isError: status === "error" };
}

// Prefetch the next N images in the feed before the user scrolls to them
export function prefetchImages(urls: string[]) {
  urls.forEach((url) => {
    if (imageCache.has(url)) return; // Skip if already cached
    imageCache.set(url, "loading");
    const img = new Image();
    img.onload = () => imageCache.set(url, "loaded");
    img.onerror = () => imageCache.set(url, "error");
    img.src = url;
  });
}