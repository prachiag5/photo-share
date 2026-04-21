// components/feed/PostSkeleton.tsx
"use client";

const CARD_HEIGHT = 468 * (5 / 4) + 136;

export function PostSkeleton() {
  return (
    <article style={{
      background:   "var(--color-background-primary)",
      border:       "1px solid var(--color-border-tertiary)",
      borderRadius: 12,
      overflow:     "hidden",
      maxWidth:     468,
      width:        "100%",
      margin:       "0 auto",
    }}>
      {/* Header */}
      <div style={{
        display:    "flex",
        alignItems: "center",
        gap:        10,
        padding:    "12px 16px",
      }}>
        <div className="skeleton skeleton--avatar" />
        <div>
          <div className="skeleton skeleton--text" style={{ width: 100, height: 12 }} />
          <div className="skeleton skeleton--text" style={{ width: 60,  height: 10, marginTop: 4 }} />
        </div>
      </div>

      {/* Image — exact same aspect-ratio as PostImage */}
      <div style={{
        width:       "100%",
        aspectRatio: "4 / 5",
      }}
        className="skeleton"
      />

      {/* Caption */}
      <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text skeleton--text-short" />
      </div>
    </article>
  );
}