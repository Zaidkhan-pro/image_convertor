/**
 * lib/imageConverter.ts
 * Client-side image conversion using the HTML5 Canvas API.
 * Runs entirely in the browser — zero server load.
 */

import type { ConversionConfig, OutputFormat } from './types';
import { OUTPUT_FORMAT_EXTENSIONS } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Load a File / Blob into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Calculate dimensions after applying an optional max-width / max-height
 * constraint while preserving the aspect ratio.
 */
function calcDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number | null,
  maxHeight: number | null,
): { width: number; height: number } {
  let width  = srcWidth;
  let height = srcHeight;

  if (maxWidth && width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width  = maxWidth;
  }

  if (maxHeight && height > maxHeight) {
    width  = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}

// ─── Core Conversion ─────────────────────────────────────────────────────────

/**
 * Convert a single image File to a Blob in the requested format.
 *
 * @param file   Source image file (JPEG, PNG, or WebP)
 * @param config Conversion parameters
 * @returns      A Blob of the converted image
 */
export async function convertImage(
  file: File,
  config: ConversionConfig,
): Promise<Blob> {
  const img = await loadImage(file);

  const { width, height } = calcDimensions(
    img.naturalWidth,
    img.naturalHeight,
    config.maxWidthPx,
    config.maxHeightPx,
  );

  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  // White background for JPEG (no alpha channel)
  if (config.outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null.'));
      },
      config.outputFormat,
      config.outputFormat === 'image/png' ? undefined : config.quality,
    );
  });
}

// ─── Filename Helpers ─────────────────────────────────────────────────────────

/**
 * Derive an output filename by replacing the source extension.
 */
export function buildOutputFilename(
  originalName: string,
  format: OutputFormat,
): string {
  const base = originalName.replace(/\.[^/.]+$/, '');
  return `${base}.${OUTPUT_FORMAT_EXTENSIONS[format]}`;
}

// ─── Download Trigger ─────────────────────────────────────────────────────────

/**
 * Programmatically download a Blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── Batch Processing ─────────────────────────────────────────────────────────

export interface BatchProgressEvent {
  index: number;
  total: number;
  filename: string;
}

/**
 * Convert an array of files sequentially, emitting progress callbacks.
 */
export async function convertBatch(
  files: File[],
  config: ConversionConfig,
  onProgress?: (event: BatchProgressEvent) => void,
): Promise<Array<{ blob: Blob; filename: string } | { error: string; filename: string }>> {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({ index: i, total: files.length, filename: file.name });

    try {
      const blob     = await convertImage(file, config);
      const filename = buildOutputFilename(file.name, config.outputFormat);
      results.push({ blob, filename });
    } catch (err) {
      results.push({
        error:    err instanceof Error ? err.message : 'Unknown error',
        filename: file.name,
      });
    }
  }

  return results;
}

// ─── Size Formatter ───────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0)          return '0 B';
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
