"use client";

/**
 * LazyImage
 *
 * A production-grade lazy-loading image component.
 *
 * Features:
 *  - IntersectionObserver: image src only assigned when element enters viewport
 *  - Shimmer skeleton: shown while loading
 *  - Blur-up technique: starts blurred, sharpens when fully loaded
 *  - Error fallback: graceful broken-image state
 *  - Native `loading="lazy"` as a belt-and-suspenders fallback
 *  - Aspect-ratio placeholder: prevents layout shift (CLS)
 *  - Accessible: alt text always required, role/aria on states
 *
 * Usage:
 *   <LazyImage
 *     src="/photo.jpg"
 *     alt="A mountain at sunset"
 *     aspectRatio={4 / 3}
 *     className={styles.postImage}
 *   />
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type ImgHTMLAttributes,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoadStatus = "idle" | "loading" | "loaded" | "error";

export interface LazyImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;

  /**
   * Width / Height ratio. e.g. 16/9, 4/3, 1 (square).
   * Used to reserve space before load and prevent CLS.
   * Defaults to 1 (square).
   */
  aspectRatio?: number;

  /**
   * Low-quality placeholder src shown blurred while the full image loads.
   * Typically a 20px wide thumbnail (LQIP). Optional.
   */
  placeholderSrc?: string;

  /**
   * How far outside the viewport to start loading (px).
   * Defaults to "200px" — loads before user scrolls to it.
   */
  rootMargin?: string;

  /** Wrapper div className */
  wrapperClassName?: string;

  /** Wrapper div style */
  wrapperStyle?: CSSProperties;
}

// ─── In-memory image cache ────────────────────────────────────────────────────
// Prevents re-fetching images that have already been loaded in this session.
// Shared across all LazyImage instances.
const loadedCache = new Set<string>();

// ─── Component ────────────────────────────────────────────────────────────────

export function LazyImage({
  src,
  alt,
  aspectRatio = 1,
  placeholderSrc,
  rootMargin = "200px",
  className,
  wrapperClassName,
  wrapperStyle,
  ...imgProps
}: LazyImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // If already in session cache, skip the loading state entirely
  const [status, setStatus] = useState<LoadStatus>(
    loadedCache.has(src) ? "loaded" : "idle"
  );
  const [isInView, setIsInView] = useState(loadedCache.has(src));

  // ── IntersectionObserver: set isInView when wrapper enters viewport ─────────
  useEffect(() => {
    if (isInView) return; // Already triggered — don't re-observe
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // One-shot — stop observing after first trigger
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isInView, rootMargin]);

  // ── When isInView becomes true, start loading ───────────────────────────────
  useEffect(() => {
    if (!isInView || status === "loaded" || status === "loading") return;
    setStatus("loading");
  }, [isInView, status]);

  // ── Image event handlers ────────────────────────────────────────────────────
  const handleLoad = useCallback(() => {
    loadedCache.add(src);
    setStatus("loaded");
  }, [src]);

  const handleError = useCallback(() => {
    setStatus("error");
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────
  const showShimmer = status === "idle" || status === "loading";
  const showImage = status === "loading" || status === "loaded";
  const showError = status === "error";

  return (
    <div
      ref={wrapperRef}
      className={wrapperClassName}
      style={{
        position: "relative",
        width: "100%",
        // Aspect-ratio placeholder prevents CLS — height is reserved before image loads
        paddingBottom: `${(1 / aspectRatio) * 100}%`,
        overflow: "hidden",
        backgroundColor: "var(--color-background-secondary)",
        borderRadius: "inherit",
        ...wrapperStyle,
      }}
      aria-busy={showShimmer}
    >
      {/* ── Shimmer skeleton ─────────────────────────────────────────────── */}
      {showShimmer && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(
              90deg,
              var(--color-background-secondary) 25%,
              var(--color-background-tertiary) 50%,
              var(--color-background-secondary) 75%
            )`,
            backgroundSize: "200% 100%",
            animation: "lazyimage-shimmer 1.5s ease-in-out infinite",
          }}
        />
      )}

      {/* ── LQIP placeholder (blurred) ───────────────────────────────────── */}
      {placeholderSrc && status !== "loaded" && (
        <img
          src={placeholderSrc}
          aria-hidden
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(12px)",
            transform: "scale(1.05)", // hide blur edges
            transition: "opacity 0.3s ease",
            opacity: status === "loading" ? 1 : 0,
          }}
        />
      )}

      {/* ── Main image ───────────────────────────────────────────────────── */}
      {showImage && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy" // native fallback for browsers without JS
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          {...imgProps}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            // Blur-up: starts blurred, transitions to sharp when loaded
            filter: status === "loaded" ? "blur(0)" : "blur(8px)",
            transform: status === "loaded" ? "scale(1)" : "scale(1.03)",
            opacity: status === "loaded" ? 1 : 0,
            transition:
              "opacity 0.4s ease, filter 0.4s ease, transform 0.4s ease",
            ...imgProps.style,
          }}
        />
      )}

      {/* ── Error fallback ───────────────────────────────────────────────── */}
      {showError && (
        <div
          role="img"
          aria-label={`Failed to load: ${alt}`}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: "var(--color-text-tertiary)",
          }}
        >
          {/* Broken image icon */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden
          >
            <rect
              x="4"
              y="6"
              width="24"
              height="20"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M4 20l7-7 5 5 3-3 9 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="11" cy="13" r="2" fill="currentColor" />
          </svg>
          <span style={{ fontSize: 12 }}>Failed to load</span>
        </div>
      )}

      {/* ── Global shimmer keyframe (injected once) ──────────────────────── */}
      <style>{`
        @keyframes lazyimage-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-busy="true"] > div { animation: none; }
        }
      `}</style>
    </div>
  );
}