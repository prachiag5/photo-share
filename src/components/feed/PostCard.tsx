// components/feed/PostCard.tsx
"use client";

import React, { memo, useCallback, useState, useRef, useEffect } from "react";
import { LazyImage } from "@/components/ui/LazyImage";
import type { Post } from "@/types";

interface Props {
  post: Post;
  onDelete: (id: string) => void;
  onEdit: (post: Post) => void;
}

export const PostCard = memo(function PostCard({ post, onDelete, onEdit }: Props) {
  const handleDelete = useCallback(() => onDelete(post.id), [onDelete, post.id]);
  const handleEdit   = useCallback(() => onEdit(post),    [onEdit,   post]);

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
      <PostHeader post={post} onEdit={handleEdit} onDelete={handleDelete} />
      <PostImage  post={post} />
      <PostBody   post={post} />
    </article>
  );
});

/* ─── PostHeader ──────────────────────────────────────────────────────────── */
function PostHeader({
  post,
  onEdit,
  onDelete,
}: {
  post: Post;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Initials fallback avatar
  const initials = post.author.username
    .split(/[._-]/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  // Format timestamp
  const timeAgo = formatRelative(post.createdAt);

  return (
    <header style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      padding:        "12px 16px",
    }}>
      {/* Left: avatar + name + time */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              width={36}
              height={36}
              style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <InitialsAvatar initials={initials} />
          )}
        </div>
        <div>
          <p style={{
            margin:     0,
            fontSize:   14,
            fontWeight: 600,
            color:      "var(--color-text-primary)",
            lineHeight: 1.2,
          }}>
            {post.author.username}
          </p>
          {timeAgo && (
            <p style={{
              margin:   0,
              fontSize: 12,
              color:    "var(--color-text-tertiary)",
              marginTop: 1,
            }}>
              {timeAgo}
            </p>
          )}
        </div>
      </div>

      {/* Right: ⋯ overflow menu */}
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Post options"
          style={{
            width:      32,
            height:     32,
            borderRadius: 6,
            border:     "none",
            background: menuOpen
              ? "var(--color-background-secondary)"
              : "transparent",
            cursor:     "pointer",
            display:    "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap:        3,
            padding:    0,
            transition: "background 0.15s",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width:        3,
              height:       3,
              borderRadius: "50%",
              background:   "var(--color-text-secondary)",
              display:      "block",
            }} />
          ))}
        </button>

        {menuOpen && (
          <div style={{
            position:    "absolute",
            right:       0,
            top:         "calc(100% + 4px)",
            background:  "var(--color-background-primary)",
            border:      "1px solid var(--color-border-tertiary)",
            borderRadius: 10,
            boxShadow:   "0 4px 16px rgba(0,0,0,0.12)",
            minWidth:    140,
            zIndex:      100,
            overflow:    "hidden",
          }}>
            <button
              onClick={() => { setMenuOpen(false); onEdit(); }}
              style={menuItemStyle()}
            >
              <EditIcon />
              Edit post
            </button>
            <div style={{
              height:     "1px",
              background: "var(--color-border-tertiary)",
              margin:     "0 12px",
            }} />
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              style={menuItemStyle("danger")}
            >
              <TrashIcon />
              Delete post
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── PostImage ───────────────────────────────────────────────────────────── */
function PostImage({ post }: { post: Post }) {
  return (
    // The wrapper enforces 4:5 ratio — react-window must use a fixed height
    // that matches this, e.g. width * (5/4). The image itself never overflows.
    <div style={{
      width:       "100%",
      aspectRatio: "4 / 5",
      overflow:    "hidden",
      background:  "var(--color-background-secondary)",
    }}>
      <LazyImage
        src={post.imageUrl}
        alt={post.caption ?? "Post image"}
        aspectRatio={4 / 5}
        wrapperStyle={{
          // Override LazyImage's paddingBottom hack — let the parent aspectRatio govern
          paddingBottom: 0,
          height:        "100%",
          width:         "100%",
        }}
      />
    </div>
  );
}

/* ─── PostBody ────────────────────────────────────────────────────────────── */
function PostBody({ post }: { post: Post }) {
  return (
    <div style={{ padding: "12px 16px 16px" }}>
      {post.caption && (
        <p style={{
          margin:     0,
          fontSize:   14,
          color:      "var(--color-text-primary)",
          lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 600, marginRight: 6 }}>
            {post.author.username}
          </span>
          {post.caption}
        </p>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width:          36,
      height:         36,
      borderRadius:   "50%",
      background:     "var(--color-background-secondary)",
      border:         "1px solid var(--color-border-tertiary)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       13,
      fontWeight:     600,
      color:          "var(--color-text-secondary)",
    }}>
      {initials}
    </div>
  );
}

function menuItemStyle(variant?: "danger"): React.CSSProperties {
  return {
    display:    "flex",
    alignItems: "center",
    gap:        10,
    width:      "100%",
    padding:    "10px 16px",
    background: "none",
    border:     "none",
    cursor:     "pointer",
    fontSize:   14,
    color: variant === "danger"
      ? "var(--color-text-danger)"
      : "var(--color-text-primary)",
    textAlign:  "left",
    fontFamily: "inherit",
    transition: "background 0.12s",
  };
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667A1.333 1.333 0 0 1 3.333 13.333V4h9.334z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function formatRelative(date?: string | Date): string {
  if (!date) return "";
  const d   = typeof date === "string" ? new Date(date) : date;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60)              return "just now";
  if (sec < 3600)            return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)           return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}