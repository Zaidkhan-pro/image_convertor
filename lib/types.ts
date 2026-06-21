/**
 * lib/types.ts
 * Strict TypeScript interfaces for the PixelShift application.
 */

// ─── Supported Formats ──────────────────────────────────────────────────────

export type InputFormat  = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'image/bmp' | 'image/gif' | 'image/x-icon' | 'image/svg+xml' | 'image/tiff' | 'image/heic' | 'image/jxl';
export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'image/bmp' | 'image/gif' | 'image/x-icon' | 'image/tiff' | 'image/heic' | 'image/jxl';

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  'image/jpeg': 'JPEG',
  'image/png':  'PNG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'image/bmp':  'BMP',
  'image/gif':  'GIF',
  'image/x-icon': 'ICO',
  'image/tiff': 'TIFF',
  'image/heic': 'HEIC',
  'image/jxl':  'JXL',
};

export const OUTPUT_FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/bmp':  'bmp',
  'image/gif':  'gif',
  'image/x-icon': 'ico',
  'image/tiff': 'tiff',
  'image/heic': 'heic',
  'image/jxl':  'jxl',
};

// ─── Conversion Configuration ───────────────────────────────────────────────

export interface ConversionConfig {
  outputFormat: OutputFormat;
  quality: number; // 0.0 – 1.0 (ignored for PNG)
  maxWidthPx: number | null;  // null = no resize
  maxHeightPx: number | null; // null = no resize
}

export const DEFAULT_CONFIG: ConversionConfig = {
  outputFormat: 'image/webp',
  quality: 0.9,
  maxWidthPx: null,
  maxHeightPx: null,
};

// ─── File Queue Item ─────────────────────────────────────────────────────────

export type ConversionStatus =
  | 'pending'
  | 'processing'
  | 'done'
  | 'error';

export interface QueueItem {
  id: string;
  file: File;
  status: ConversionStatus;
  previewUrl: string | null;   // object URL for source preview
  outputBlob: Blob | null;     // converted result
  outputUrl: string | null;    // object URL for converted preview
  outputFilename: string;
  errorMessage: string | null;
  originalSize: number;
  convertedSize: number | null;
}

// ─── Guest Tracker ───────────────────────────────────────────────────────────

export interface GuestState {
  conversionCount: number;
  limitReached: boolean;
}

export const GUEST_LIMIT = 5;
export const GUEST_STORAGE_KEY = 'pixelshift_guest_conversions';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
}

// ─── Drop Zone Events ─────────────────────────────────────────────────────────

export interface FileDropEvent {
  acceptedFiles: File[];
  rejectedFiles: Array<{
    file: File;
    errors: Array<{ code: string; message: string }>;
  }>;
}

// ─── reCAPTCHA ───────────────────────────────────────────────────────────────

export interface RecaptchaVerifyResult {
  success: boolean;
  score?: number;
  action?: string;
  errorCodes?: string[];
}
