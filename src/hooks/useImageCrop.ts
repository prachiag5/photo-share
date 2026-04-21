// hooks/useImageCrop.ts
import { useState, useCallback, useRef } from "react";

export interface CropArea {
  x: number;      // pixels from left of original image
  y: number;      // pixels from top of original image
  width: number;
  height: number;
}

export function useImageCrop() {
  const [cropArea, setCropArea] = useState<CropArea | null>(null);

  // Takes the original image dataUrl + the crop area in pixels
  // Returns a cropped blob using Canvas
  const applyCrop = useCallback(
    async (imageDataUrl: string, crop: CropArea): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = crop.width;
          canvas.height = crop.height;
          const ctx = canvas.getContext("2d")!;

          ctx.drawImage(
            img,
            crop.x, crop.y,           // source start
            crop.width, crop.height,   // source size
            0, 0,                      // dest start
            crop.width, crop.height    // dest size
          );

          canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error("Crop failed")),
            "image/jpeg",
            0.95 // high quality pre-compression; compressor runs after
          );
        };
        img.onerror = reject;
        img.src = imageDataUrl;
      });
    },
    []
  );

  return { cropArea, setCropArea, applyCrop };
}