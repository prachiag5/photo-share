"use client";

import { useState, useCallback, useRef, useEffect } from "react";
// Define interfaces for type safety
interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}

interface ImageUploaderProps {
  onComplete: (result: CompressionResult) => void;
  onCancel: () => void;
  accept?: string;
  maxFileMB?: number;
  compressionQuality?: number;
}

interface CropToolProps {
  imageDataUrl: string;
  onCropDone: (crop: Crop) => void;
  onSkip: () => void;
}

interface CompressionBadgeProps {
  originalSize: number;
  compressedSize: number;
}

interface StageHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

interface ErrorBannerProps {
  message: string;
}

interface LoadingStateProps {
  label: string;
}

// ─── Utility: blob → dataUrl ──────────────────────────────────────────────────
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Hook: useImageCompressor ─────────────────────────────────────────────────
function useImageCompressor() {
  const [isCompressing, setIsCompressing] = useState(false);

  const compress = useCallback(async (source: File | Blob, opts = {}) => {
    const {
      maxWidthPx = 1200,
      maxHeightPx = 1200,
      quality = 0.82,
      outputType = "image/jpeg",
    } = opts;

    setIsCompressing(true);
    try {
      const bitmap = await createImageBitmap(source);
      let { width, height } = bitmap;
      const ar = width / height;
      if (width > maxWidthPx) { width = maxWidthPx; height = Math.round(width / ar); }
      if (height > maxHeightPx) { height = maxHeightPx; width = Math.round(height * ar); }

      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await canvas.convertToBlob({ type: outputType, quality });
      const file = new File(
        [blob],
        source instanceof File ? source.name.replace(/\.[^.]+$/, ".jpg") : "image.jpg",
        { type: outputType }
      );
      const dataUrl = await blobToDataUrl(blob);
      return { file, dataUrl, originalSize: source.size, compressedSize: blob.size };
    } finally {
      setIsCompressing(false);
    }
  }, []);

  return { compress, isCompressing };
}

// ─── Hook: useImageCrop (canvas-based) ───────────────────────────────────────
function useImageCrop() {
  const applyCrop = useCallback(async (imageDataUrl: string, crop: Crop): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) reject(new Error("Failed to get canvas context"));
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Crop failed")),
          "image/jpeg", 0.95
        );
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }, []);

  return { applyCrop };
}

// ─── Sub-component: CropTool ──────────────────────────────────────────────────
function CropTool({ imageDataUrl, onCropDone, onSkip }: Readonly<CropToolProps>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState(null);
  const [imgNaturalSize, setImgNaturalSize] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  // Load image, set up canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const maxW = Math.min(img.naturalWidth, 560);
      const scale = maxW / img.naturalWidth;
      const w = maxW;
      const h = Math.round(img.naturalHeight * scale);
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight, scale });
      setCanvasSize({ w, h });
      // default crop: center square
      const side = Math.min(w, h) * 0.8;
      const x = (w - side) / 2;
      const y = (h - side) / 2;
      setCropRect({ x, y, w: side, h: side });
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // Draw canvas whenever cropRect changes
  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || !cropRect) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;

    // Draw image
    ctx.drawImage(imgRef.current, 0, 0, canvasSize.w, canvasSize.h);

    // Darken outside crop
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    // Clear crop area (show image through)
    ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    ctx.drawImage(
      imgRef.current,
      (cropRect.x / canvasSize.w) * imgRef.current.naturalWidth,
      (cropRect.y / canvasSize.h) * imgRef.current.naturalHeight,
      (cropRect.w / canvasSize.w) * imgRef.current.naturalWidth,
      (cropRect.h / canvasSize.h) * imgRef.current.naturalHeight,
      cropRect.x, cropRect.y, cropRect.w, cropRect.h
    );

    // Crop border + corners
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);

    // Rule-of-thirds grid
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cropRect.x + (cropRect.w / 3) * i, cropRect.y);
      ctx.lineTo(cropRect.x + (cropRect.w / 3) * i, cropRect.y + cropRect.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cropRect.x, cropRect.y + (cropRect.h / 3) * i);
      ctx.lineTo(cropRect.x + cropRect.w, cropRect.y + (cropRect.h / 3) * i);
      ctx.stroke();
    }

    // Corner handles
    const cs = 10;
    ctx.fillStyle = "#fff";
    const corners = [
      [cropRect.x, cropRect.y],
      [cropRect.x + cropRect.w - cs, cropRect.y],
      [cropRect.x, cropRect.y + cropRect.h - cs],
      [cropRect.x + cropRect.w - cs, cropRect.y + cropRect.h - cs],
    ];
    corners.forEach(([cx, cy]) => ctx.fillRect(cx, cy, cs, cs));
  }, [cropRect, canvasSize]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvasSize.w / rect.width;
    const scaleY = canvasSize.h / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    const pos = getPos(e);
    dragStart.current = pos;
    setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const pos = getPos(e);
    const x = Math.min(dragStart.current.x, pos.x);
    const y = Math.min(dragStart.current.y, pos.y);
    const w = Math.abs(pos.x - dragStart.current.x);
    const h = Math.abs(pos.y - dragStart.current.y);
    // Clamp to canvas bounds
    setCropRect({
      x: Math.max(0, x),
      y: Math.max(0, y),
      w: Math.min(w, canvasSize.w - x),
      h: Math.min(h, canvasSize.h - y),
    });
  };

  const onMouseUp = () => { isDragging.current = false; };

  const handleConfirm = () => {
    if (!cropRect || !imgNaturalSize) return;
    // Convert canvas-space crop back to natural image coordinates
    const naturalCrop = {
      x: Math.round((cropRect.x / canvasSize.w) * imgNaturalSize.w),
      y: Math.round((cropRect.y / canvasSize.h) * imgNaturalSize.h),
      width: Math.round((cropRect.w / canvasSize.w) * imgNaturalSize.w),
      height: Math.round((cropRect.h / canvasSize.h) * imgNaturalSize.h),
    };
    onCropDone(naturalCrop);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", textAlign: "center" }}>
        Drag to select a crop area. Rule-of-thirds grid shown.
      </p>
      <div style={{ position: "relative", cursor: "crosshair", maxWidth: "100%" }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", maxWidth: "100%", borderRadius: 8 }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
        />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onSkip} style={btnStyle("ghost")}>
          Skip crop
        </button>
        <button
          onClick={handleConfirm}
          disabled={!cropRect || cropRect.w < 10 || cropRect.h < 10}
          style={btnStyle("primary")}
        >
          Apply crop
        </button>
      </div>
    </div>
  );
}

// ─── Sub-component: CompressionBadge ─────────────────────────────────────────
function CompressionBadge({ originalSize, compressedSize }: Readonly<CompressionBadgeProps>) {
  const saved = Math.round((1 - compressedSize / originalSize) * 100);
  const fmt = (b) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 20,
      background: "var(--color-background-success)",
      border: "1px solid var(--color-border-success)",
    }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="var(--color-text-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize: 12, color: "var(--color-text-success)", fontWeight: 500 }}>
        {saved}% smaller · {fmt(originalSize)} → {fmt(compressedSize)}
      </span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function btnStyle(variant: "primary" | "ghost" | "danger") {
  const base = {
    padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: "pointer", border: "none", transition: "opacity 0.15s",
    fontFamily: "inherit",
  };
  if (variant === "primary") return {
    ...base,
    background: "var(--color-text-primary)", color: "var(--color-background-primary)",
    opacity: 1,
  };
  if (variant === "ghost") return {
    ...base,
    background: "transparent", color: "var(--color-text-secondary)",
    border: "1px solid var(--color-border-secondary)",
  };
  if (variant === "danger") return {
    ...base,
    background: "var(--color-background-danger)", color: "var(--color-text-danger)",
    border: "1px solid var(--color-border-danger)",
  };
  return base;
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * ImageUploader
 *
 * Props:
 *   onComplete(result: { file: File, dataUrl: string, originalSize: number, compressedSize: number }) => void
 *   onCancel() => void
 *   accept?: string           default "image/jpeg,image/png,image/webp"
 *   maxFileMB?: number        default 20
 *   compressionQuality?: number  0-1, default 0.82
 */
export default function ImageUploader({
  onComplete,
  onCancel,
  accept = "image/jpeg,image/png,image/webp",
  maxFileMB = 20,
  compressionQuality = 0.82,
}: Readonly<ImageUploaderProps>) {
  // Stage: "select" | "crop" | "preview"
  const [stage, setStage] = useState("select");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Raw selected file + its dataUrl (original, uncropped)
  const [rawDataUrl, setRawDataUrl] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);

  // After crop + compression
  const [result, setResult] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef(null);
  const { compress, isCompressing } = useImageCompressor();
  const { applyCrop } = useImageCrop();

  // ── File validation & ingestion ─────────────────────────────────────────────
  const ingestFile = useCallback(async (file) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > maxFileMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxFileMB} MB.`);
      return;
    }

    const dataUrl = await blobToDataUrl(file);
    setRawFile(file);
    setRawDataUrl(dataUrl);
    setStage("crop");
  }, [maxFileMB]);

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) ingestFile(file);
  }, [ingestFile]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);

  // ── After crop: apply crop → compress → show preview ─────────────────────
  const handleCropDone = useCallback(async (naturalCrop: Crop) => {
    try {
      const croppedBlob = await applyCrop(rawDataUrl!, naturalCrop);
      const compressed = await compress(croppedBlob, { quality: compressionQuality });
      setResult(compressed);
      setStage("preview");
    } catch (error) {
      console.error(error);
      setError("Something went wrong processing the image. Please try again.");
    }
  }, [rawDataUrl, applyCrop, compress, compressionQuality]);

  // ── Skip crop: compress original directly ──────────────────────────────────
  const handleSkipCrop = useCallback(async () => {
    try {
      const compressed = await compress(rawFile!, { quality: compressionQuality });
      setResult(compressed);
      setStage("preview");
    } catch (error) {
      console.error(error);
      setError("Compression failed. Please try again.");
    }
  }, [rawFile, compress, compressionQuality]);

  // ── Reset to start ─────────────────────────────────────────────────────────
  const reset = () => {
    setStage("select");
    setRawDataUrl(null);
    setRawFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Stage: SELECT ──────────────────────────────────────────────────────────
  if (stage === "select") return (
    <div style={wrapStyle}>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `1.5px dashed ${isDragOver ? "var(--color-text-primary)" : "var(--color-border-secondary)"}`,
          borderRadius: 12,
          padding: "48px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
          background: isDragOver ? "var(--color-background-secondary)" : "transparent",
          userSelect: "none",
        }}
      >
        {/* Upload icon */}
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
          <rect width="40" height="40" rx="10" fill="var(--color-background-secondary)"/>
          <path d="M20 26V14M20 14l-4 4M20 14l4 4" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 28h14" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>

        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
          Drop your photo here
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>
          or click to browse — JPEG, PNG, WebP up to {maxFileMB} MB
        </p>

        <span style={{
          display: "inline-block", padding: "8px 18px", borderRadius: 8,
          background: "var(--color-text-primary)", color: "var(--color-background-primary)",
          fontSize: 13, fontWeight: 500, pointerEvents: "none",
        }}>
          Choose file
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) ingestFile(f); }}
        />
      </div>

      {error && <ErrorBanner message={error} />}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onCancel} style={btnStyle("ghost")}>Cancel</button>
      </div>
    </div>
  );

  // ─── Stage: CROP ────────────────────────────────────────────────────────────
  if (stage === "crop") return (
    <div style={wrapStyle}>
      <StageHeader
        title="Crop your image"
        subtitle="Drag to select the area you want to keep"
        onBack={reset}
      />

      {isCompressing ? (
        <LoadingState label="Applying crop & compressing…" />
      ) : (
        <CropTool
          imageDataUrl={rawDataUrl}
          onCropDone={handleCropDone}
          onSkip={handleSkipCrop}
        />
      )}

      {error && <ErrorBanner message={error} />}
    </div>
  );

  // ─── Stage: PREVIEW ─────────────────────────────────────────────────────────
  if (stage === "preview" && result) return (
    <div style={wrapStyle}>
      <StageHeader
        title="Looking good"
        subtitle="Review your photo before uploading"
        onBack={() => setStage("crop")}
      />

      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "var(--color-background-secondary)" }}>
        <img
          src={result.dataUrl}
          alt="Preview"
          style={{ display: "block", width: "100%", maxHeight: 420, objectFit: "contain" }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
        <CompressionBadge originalSize={result.originalSize} compressedSize={result.compressedSize} />
      </div>

      {error && <ErrorBanner message={error} />}

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <button onClick={reset} style={btnStyle("ghost")}>
          Start over
        </button>
        <button onClick={() => onComplete?.(result)} style={btnStyle("primary")}>
          Use this photo
        </button>
      </div>
    </div>
  );

  return null;
}

// ─── Tiny shared sub-components ───────────────────────────────────────────────
function StageHeader({ title, subtitle, onBack }: Readonly<StageHeaderProps>) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer", padding: "2px 0",
        color: "var(--color-text-secondary)", fontSize: 20, lineHeight: 1,
      }}>←</button>
      <div>
        <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: "var(--color-text-primary)" }}>{title}</p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: Readonly<ErrorBannerProps>) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, marginTop: 8,
      background: "var(--color-background-danger)",
      border: "1px solid var(--color-border-danger)",
      fontSize: 13, color: "var(--color-text-danger)",
    }}>
      {message}
    </div>
  );
}

function LoadingState({ label }: Readonly<LoadingStateProps>) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-text-secondary)", fontSize: 13 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "2px solid var(--color-border-secondary)",
        borderTopColor: "var(--color-text-primary)",
        animation: "spin 0.7s linear infinite",
        margin: "0 auto 12px",
      }} />
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const wrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: 20,
  borderRadius: 14,
  border: "1px solid var(--color-border-tertiary)",
  background: "var(--color-background-primary)",
  maxWidth: 600,
  width: "100%",
  fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
};