// components/post/CreatePostForm.tsx
"use client";

/**
 * CreatePostForm
 *
 * Reuses:
 *  - ImageUploader  — select → crop → compress pipeline
 *  - CaptionInput   — textarea with character count
 *  - ConfirmDialog  — "discard changes?" guard
 *  - useCreatePost  — mutation with optimistic update
 *
 * Flow:
 *  1. User picks + crops + compresses an image (ImageUploader)
 *  2. User writes a caption (CaptionInput)
 *  3. User hits "Share" → optimistic post inserted into feed cache
 *  4. API call fires in background
 *  5. On success: navigate to feed
 *     On failure: roll back + show error
 *
 * Props:
 *  onSuccess()  — called after post is created (e.g. router.push("/"))
 *  onCancel()   — called when user cancels (e.g. router.back())
 */

import { useState, useCallback } from "react";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CaptionInput } from "./CaptionInput";
import ImageUploader from "@/components/post/ImageUploader";

// Result shape returned by ImageUploader's onComplete
interface ImageResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}

interface CreatePostFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// ── Stage type ────────────────────────────────────────────────────────────────
// "upload"  → ImageUploader visible, no image chosen yet
// "compose" → Image chosen, caption form visible
type Stage = "upload" | "compose";

export function CreatePostForm({ onSuccess, onCancel }: CreatePostFormProps) {
  const [stage, setStage]               = useState<Stage>("upload");
  const [imageResult, setImageResult]   = useState<ImageResult | null>(null);
  const [caption, setCaption]           = useState("");
  const [captionError, setCaptionError] = useState<string | undefined>();

  const { submit, isSubmitting, error: submitError, clearError } = useCreatePost();
  const confirm = useConfirmDialog();

  // ── Dirty check — has the user started filling anything in? ───────────────
  const isDirty = imageResult !== null || caption.trim().length > 0;

  // ── ImageUploader callback ─────────────────────────────────────────────────
  const handleImageComplete = useCallback((result: ImageResult) => {
    setImageResult(result);
    setStage("compose");
  }, []);

  // ── Cancel with unsaved-work guard ─────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    if (!isDirty) {
      onCancel();
      return;
    }
    const confirmed = await confirm.open({
      title: "Discard this post?",
      description: "Your image and caption will be lost.",
      variant: "danger",
      confirmLabel: "Discard",
      cancelLabel: "Keep editing",
    });
    if (confirmed) onCancel();
  }, [isDirty, confirm, onCancel]);

  // ── Go back to image selection ─────────────────────────────────────────────
  const handleChangeImage = useCallback(async () => {
    const confirmed = await confirm.open({
      title: "Replace image?",
      description: "Your current image selection will be cleared.",
      variant: "warning",
      confirmLabel: "Replace",
      cancelLabel: "Keep current",
    });
    if (confirmed) {
      setImageResult(null);
      setStage("upload");
      clearError();
    }
  }, [confirm, clearError]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!imageResult) return;

    // Client-side validation
    if (!caption.trim()) {
      setCaptionError("Please add a caption before sharing.");
      return;
    }
    setCaptionError(undefined);

    const post = await submit({
      caption: caption.trim(),
      imageFile: imageResult.file,
      previewDataUrl: imageResult.dataUrl,
    });

    if (post) onSuccess();
  }, [imageResult, caption, submit, onSuccess]);

  // ── File size display ──────────────────────────────────────────────────────
  const fmt = (b: number) =>
    b > 1024 * 1024
      ? `${(b / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(b / 1024)} KB`;

  return (
    <>
      {/* Confirm dialogs render here via the imperative hook */}
      {confirm.dialog}

      <div style={containerStyle}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={headerStyle}>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            aria-label="Cancel"
            style={ghostBtnStyle}
          >
            ←
          </button>
          <h1 style={titleStyle}>New post</h1>
          {/* Share button in header — disabled until both image + caption ready */}
          <button
            onClick={handleSubmit}
            disabled={!imageResult || isSubmitting}
            style={{
              ...primaryBtnStyle,
              opacity: !imageResult || isSubmitting ? 0.45 : 1,
              minWidth: 72,
            }}
          >
            {isSubmitting ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Spinner /> Sharing…
              </span>
            ) : (
              "Share"
            )}
          </button>
        </div>

        {/* ── Stage: Upload ───────────────────────────────────────────────── */}
        {stage === "upload" && (
          <div style={{ padding: "0 0 24px" }}>
            <ImageUploader
              onComplete={handleImageComplete}
              onCancel={handleCancel}
              maxFileMB={20}
              compressionQuality={0.82}
            />
          </div>
        )}

        {/* ── Stage: Compose ──────────────────────────────────────────────── */}
        {stage === "compose" && imageResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Image preview with "change" overlay */}
            <div style={previewContainerStyle}>
              <img
                src={imageResult.dataUrl}
                alt="Post preview"
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: 400,
                  objectFit: "contain",
                  borderRadius: 10,
                  background: "var(--color-background-secondary)",
                }}
              />

              {/* Compression badge */}
              <div style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)",
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, color: "#fff", fontWeight: 500 }}>
                  {fmt(imageResult.compressedSize)}
                </span>
              </div>

              {/* Change image button */}
              <button
                onClick={handleChangeImage}
                disabled={isSubmitting}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(4px)",
                  border: "none",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Change
              </button>
            </div>

            {/* Caption input */}
            <CaptionInput
              value={caption}
              onChange={(v) => {
                setCaption(v);
                if (captionError) setCaptionError(undefined);
                if (submitError) clearError();
              }}
              error={captionError}
              disabled={isSubmitting}
              placeholder="Write a caption…"
            />

            {/* API error */}
            {submitError && (
              <div style={errorBannerStyle} role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <circle cx="7" cy="7" r="6" stroke="var(--color-text-danger)" strokeWidth="1.2"/>
                  <path d="M7 4v3.5M7 9.5v.5" stroke="var(--color-text-danger)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {submitError}
              </div>
            )}

            {/* Mobile-friendly bottom Share button (duplicate of header btn) */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                ...primaryBtnStyle,
                width: "100%",
                padding: "13px",
                fontSize: 15,
                justifyContent: "center",
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <Spinner /> Sharing…
                </span>
              ) : (
                "Share post"
              )}
            </button>

          </div>
        )}
      </div>
    </>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <>
      <svg
        width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden
        style={{ animation: "createpost-spin 0.6s linear infinite", flexShrink: 0 }}
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2"
          strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round" />
      </svg>
      <style>{`@keyframes createpost-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  maxWidth: 560,
  width: "100%",
  margin: "0 auto",
  fontFamily: "var(--font-sans)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  paddingBottom: 16,
  borderBottom: "1px solid var(--color-border-tertiary)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: "var(--color-text-primary)",
};

const ghostBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 8px",
  color: "var(--color-text-secondary)",
  fontSize: 20,
  lineHeight: 1,
  fontFamily: "inherit",
  borderRadius: 6,
};

const primaryBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 18px",
  borderRadius: 8,
  border: "none",
  background: "var(--color-text-primary)",
  color: "var(--color-background-primary)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "opacity 0.15s",
};

const previewContainerStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: 10,
  overflow: "hidden",
  border: "1px solid var(--color-border-tertiary)",
};

const errorBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 8,
  background: "var(--color-background-danger)",
  border: "1px solid var(--color-border-danger)",
  fontSize: 13,
  color: "var(--color-text-danger)",
};