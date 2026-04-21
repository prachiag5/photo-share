// hooks/useImageCompressor.ts
import { useState, useCallback } from "react";

interface CompressOptions {
  maxWidthPx?: number;   // default 1200
  maxHeightPx?: number;  // default 1200
  quality?: number;      // 0–1, default 0.82
  outputType?: "image/jpeg" | "image/webp";
}

interface CompressResult {
  file: File;
  dataUrl: string;
  originalSize: number;  // bytes
  compressedSize: number;
}

export function useImageCompressor() {
  const [isCompressing, setIsCompressing] = useState(false);

  const compress = useCallback(
    async (source: File | Blob, opts: CompressOptions = {}): Promise<CompressResult> => {
      const {
        maxWidthPx = 1200,
        maxHeightPx = 1200,
        quality = 0.82,
        outputType = "image/jpeg",
      } = opts;

      setIsCompressing(true);

      try {
        // 1. Read source into a bitmap
        const bitmap = await createImageBitmap(source);

        // 2. Calculate scaled dimensions (maintain aspect ratio)
        let { width, height } = bitmap;
        const aspectRatio = width / height;

        if (width > maxWidthPx) {
          width = maxWidthPx;
          height = Math.round(width / aspectRatio);
        }
        if (height > maxHeightPx) {
          height = maxHeightPx;
          width = Math.round(height * aspectRatio);
        }

        // 3. Draw onto an offscreen canvas
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close(); // free memory

        // 4. Export as compressed blob
        const compressedBlob = await canvas.convertToBlob({
          type: outputType,
          quality,
        });

        // 5. Convert to File + dataUrl for preview
        const compressedFile = new File(
          [compressedBlob],
          source instanceof File ? source.name.replace(/\.[^.]+$/, ".jpg") : "image.jpg",
          { type: outputType }
        );

        const dataUrl = await blobToDataUrl(compressedBlob);

        return {
          file: compressedFile,
          dataUrl,
          originalSize: source.size,
          compressedSize: compressedBlob.size,
        };
      } finally {
        setIsCompressing(false);
      }
    },
    []
  );

  return { compress, isCompressing };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}