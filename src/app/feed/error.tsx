// app/(feed)/error.tsx
"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void; // Next.js injects this — re-renders the page
}

export default function FeedError({ error, reset }: Props) {
  useEffect(() => {
    // Log to your error tracking (Sentry, Datadog, etc.)
    console.error("[Feed error]", error);
  }, [error]);

  return (
    <div style={{
      padding: "48px 24px",
      textAlign: "center",
    }}>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>
        Couldn't load the feed
      </p>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 24 }}>
        {error.message || "Something went wrong. Please try again."}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "9px 20px",
          borderRadius: 8,
          background: "var(--color-text-primary)",
          color: "var(--color-background-primary)",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Try again
      </button>
    </div>
  );
}