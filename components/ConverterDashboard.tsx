'use client';

/**
 * components/ConverterDashboard.tsx
 * Main stateful dashboard — file queue, conversion settings, progress, output.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSession }              from 'next-auth/react';
import { useGoogleReCaptcha }      from 'react-google-recaptcha-v3';
import { useDropzone }             from 'react-dropzone';
import {
  Upload, Settings2, Trash2, Download, RefreshCw,
  CheckCircle, XCircle, Loader2, ImageIcon, ArrowRight,
  ChevronDown, Zap,
} from 'lucide-react';

import {
  convertImage,
  buildOutputFilename,
  downloadBlob,
  formatBytes,
} from '@/lib/imageConverter';
import {
  getGuestState,
  incrementGuestCount,
  resetGuestCount,
} from '@/lib/guestTracker';
import GuestLimitModal from './GuestLimitModal';

import type {
  QueueItem,
  ConversionConfig,
  OutputFormat,
} from '@/lib/types';
import {
  DEFAULT_CONFIG,
  OUTPUT_FORMAT_LABELS,
  GUEST_LIMIT,
} from '@/lib/types';

// ─── Accepted MIME types ──────────────────────────────────────────────────────
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
  'image/bmp':  ['.bmp'],
  'image/gif':  ['.gif'],
  'image/x-icon': ['.ico'],
  'image/svg+xml': ['.svg'],
  'image/tiff': ['.tiff', '.tif'],
  'image/heic': ['.heic'],
  'image/jxl':  ['.jxl'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ConverterDashboard() {
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';

  const { executeRecaptcha } = useGoogleReCaptcha();

  // Queue
  const [queue, setQueue]             = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Conversion config
  const [config, setConfig] = useState<ConversionConfig>(DEFAULT_CONFIG);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Guest state
  const [guestConversions, setGuestConversions] = useState(0);
  const [showLimitModal, setShowLimitModal]     = useState(false);

  // Sync guest count on mount & after auth
  useEffect(() => {
    if (!isAuthenticated) {
      const state = getGuestState();
      setGuestConversions(state.conversionCount);
    } else {
      // User just signed in — reset guest counter
      resetGuestCount();
      setGuestConversions(0);
    }
  }, [isAuthenticated]);

  // ── File drop handler ────────────────────────────────────────────────────
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newItems: QueueItem[] = acceptedFiles.map((file) => ({
        id:              uid(),
        file,
        status:          'pending',
        previewUrl:      URL.createObjectURL(file),
        outputBlob:      null,
        outputUrl:       null,
        outputFilename:  buildOutputFilename(file.name, config.outputFormat),
        errorMessage:    null,
        originalSize:    file.size,
        convertedSize:   null,
      }));
      setQueue((prev) => [...prev, ...newItems]);
    },
    [config.outputFormat],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:   ACCEPTED_TYPES,
    maxFiles: 50,
    disabled: isProcessing,
  });

  // ── Remove single item from queue ────────────────────────────────────────
  const removeItem = useCallback((id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item?.outputUrl)  URL.revokeObjectURL(item.outputUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // ── Clear entire queue ───────────────────────────────────────────────────
  const clearQueue = useCallback(() => {
    setQueue((prev) => {
      prev.forEach((i) => {
        if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
        if (i.outputUrl)  URL.revokeObjectURL(i.outputUrl);
      });
      return [];
    });
  }, []);

  // ── Update a single queue item ───────────────────────────────────────────
  const updateItem = useCallback(
    (id: string, patch: Partial<QueueItem>) =>
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    [],
  );

  // ── Main conversion runner ───────────────────────────────────────────────
  const runConversion = useCallback(async () => {
    const pending = queue.filter((i) => i.status === 'pending');
    if (pending.length === 0) return;

    // Guest limit check
    if (!isAuthenticated) {
      const { conversionCount } = getGuestState();
      if (conversionCount >= GUEST_LIMIT) {
        setShowLimitModal(true);
        return;
      }
      const remaining = GUEST_LIMIT - conversionCount;
      if (pending.length > remaining) {
        // Notify — only process what's left in the allowance
        alert(
          `You have ${remaining} free conversion${remaining !== 1 ? 's' : ''} remaining. ` +
          `Sign in with Google for unlimited access.`,
        );
      }
    }

    // reCAPTCHA check
    if (executeRecaptcha) {
      try {
        const token = await executeRecaptcha('convert_batch');
        const res   = await fetch('/api/recaptcha', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token }),
        });
        const result = await res.json() as { success: boolean };
        if (!result.success) {
          alert('reCAPTCHA verification failed. Please try again.');
          return;
        }
      } catch {
        // Non-blocking — if reCAPTCHA key is not set yet, skip check
        console.warn('[reCAPTCHA] Token check failed or key not configured.');
      }
    }

    setIsProcessing(true);

    const toProcess = isAuthenticated
      ? pending
      : pending.slice(0, Math.max(0, GUEST_LIMIT - guestConversions));

    let processedCount = 0;

    for (const item of toProcess) {
      // Re-check guest limit during batch
      if (!isAuthenticated) {
        const live = getGuestState();
        if (live.limitReached) {
          setShowLimitModal(true);
          break;
        }
      }

      updateItem(item.id, { status: 'processing' });

      try {
        const blob     = await convertImage(item.file, config);
        const outputUrl = URL.createObjectURL(blob);
        const filename  = buildOutputFilename(item.file.name, config.outputFormat);

        updateItem(item.id, {
          status:        'done',
          outputBlob:    blob,
          outputUrl,
          outputFilename: filename,
          convertedSize: blob.size,
        });

        if (!isAuthenticated) {
          const state = incrementGuestCount();
          setGuestConversions(state.conversionCount);
        }

        processedCount++;
      } catch (err) {
        updateItem(item.id, {
          status:       'error',
          errorMessage: err instanceof Error ? err.message : 'Conversion failed',
        });
      }
    }

    setIsProcessing(false);
  }, [queue, config, isAuthenticated, guestConversions, executeRecaptcha, updateItem]);

  // ── Download single item ────────────────────────────────────────────────
  const downloadItem = useCallback((item: QueueItem) => {
    if (item.outputBlob) {
      downloadBlob(item.outputBlob, item.outputFilename);
    }
  }, []);

  // ── Download all done items ─────────────────────────────────────────────
  const downloadAll = useCallback(() => {
    queue
      .filter((i) => i.status === 'done' && i.outputBlob)
      .forEach((i) => downloadBlob(i.outputBlob!, i.outputFilename));
  }, [queue]);

  // ── Derived state ────────────────────────────────────────────────────────
  const pendingCount    = queue.filter((i) => i.status === 'pending').length;
  const doneCount       = queue.filter((i) => i.status === 'done').length;
  const errorCount      = queue.filter((i) => i.status === 'error').length;
  const guestRemaining  = Math.max(0, GUEST_LIMIT - guestConversions);
  const hasQueue        = queue.length > 0;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {showLimitModal && (
        <GuestLimitModal onClose={() => setShowLimitModal(false)} />
      )}

      <div className="dashboard">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="dashboard-hero">
          <h1 className="hero-title">
            Convert Images{' '}
            <span className="hero-accent">Instantly</span>
          </h1>
          <p className="hero-sub">
            Client-side processing — your files never leave your device.
            Supports JPEG, PNG, and WebP.
          </p>

          {/* Guest counter pill */}
          {!isAuthenticated && (
            <div className="guest-counter-pill">
              <Zap size={13} />
              {guestRemaining > 0
                ? `${guestRemaining} free conversion${guestRemaining !== 1 ? 's' : ''} remaining`
                : 'Free limit reached — sign in to continue'}
            </div>
          )}
        </div>

        {/* ── Settings bar ─────────────────────────────────────────────── */}
        <div className="settings-bar">
          <button
            className="settings-toggle"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
            id="settings-toggle-btn"
          >
            <Settings2 size={15} />
            Conversion settings
            <ChevronDown
              size={13}
              className={`settings-chevron ${settingsOpen ? 'rotated' : ''}`}
            />
          </button>

          {settingsOpen && (
            <div className="settings-panel">
              {/* Output format */}
              <div className="setting-group">
                <label className="setting-label" htmlFor="output-format-select">
                  Output format
                </label>
                <div className="format-options">
                  {(Object.keys(OUTPUT_FORMAT_LABELS) as OutputFormat[]).map(
                    (fmt) => (
                      <button
                        key={fmt}
                        id={`fmt-${fmt.split('/')[1]}`}
                        className={`format-btn ${config.outputFormat === fmt ? 'active' : ''}`}
                        onClick={() =>
                          setConfig((c) => ({ ...c, outputFormat: fmt }))
                        }
                      >
                        {OUTPUT_FORMAT_LABELS[fmt]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Quality slider (hidden for PNG) */}
              {config.outputFormat !== 'image/png' && (
                <div className="setting-group">
                  <label className="setting-label" htmlFor="quality-slider">
                    Quality —{' '}
                    <span className="setting-value">
                      {Math.round(config.quality * 100)}%
                    </span>
                  </label>
                  <input
                    id="quality-slider"
                    type="range"
                    min={10}
                    max={100}
                    value={Math.round(config.quality * 100)}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        quality: parseInt(e.target.value, 10) / 100,
                      }))
                    }
                    className="quality-slider"
                  />
                </div>
              )}

              {/* Max dimensions */}
              <div className="setting-group setting-group--row">
                <div className="setting-field">
                  <label className="setting-label" htmlFor="max-width-input">
                    Max width (px)
                  </label>
                  <input
                    id="max-width-input"
                    type="number"
                    placeholder="None"
                    min={1}
                    value={config.maxWidthPx ?? ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        maxWidthPx: e.target.value ? parseInt(e.target.value, 10) : null,
                      }))
                    }
                    className="setting-input"
                  />
                </div>
                <div className="setting-field">
                  <label className="setting-label" htmlFor="max-height-input">
                    Max height (px)
                  </label>
                  <input
                    id="max-height-input"
                    type="number"
                    placeholder="None"
                    min={1}
                    value={config.maxHeightPx ?? ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        maxHeightPx: e.target.value ? parseInt(e.target.value, 10) : null,
                      }))
                    }
                    className="setting-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Drop zone ────────────────────────────────────────────────── */}
        <div
          {...getRootProps()}
          id="file-drop-zone"
          className={`drop-zone ${isDragActive ? 'drag-active' : ''} ${isProcessing ? 'disabled' : ''}`}
          aria-label="File drop zone"
        >
          <input {...getInputProps()} id="file-input" aria-label="File input" />
          <div className="drop-zone-content">
            <div className="drop-icon-ring">
              <Upload size={28} className="drop-icon" />
            </div>
            {isDragActive ? (
              <p className="drop-text-active">Release to add files…</p>
            ) : (
              <>
                <p className="drop-text">
                  Drag &amp; drop images here, or{' '}
                  <span className="drop-text-link">browse files</span>
                </p>
                <p className="drop-hint">JPEG · PNG · WebP · AVIF · BMP · GIF · ICO · SVG · TIFF · HEIC · JXL</p>
              </>
            )}
          </div>
        </div>

        {/* ── Queue ────────────────────────────────────────────────────── */}
        {hasQueue && (
          <div className="queue-section">
            {/* Queue header */}
            <div className="queue-header">
              <div className="queue-stats">
                <span className="stat-chip pending">{pendingCount} pending</span>
                {doneCount   > 0 && <span className="stat-chip done">{doneCount} done</span>}
                {errorCount  > 0 && <span className="stat-chip error">{errorCount} errors</span>}
              </div>
              <div className="queue-actions">
                {doneCount > 0 && (
                  <button
                    id="download-all-btn"
                    className="btn-secondary btn-sm"
                    onClick={downloadAll}
                  >
                    <Download size={13} />
                    Download all
                  </button>
                )}
                <button
                  id="clear-queue-btn"
                  className="btn-ghost btn-sm"
                  onClick={clearQueue}
                  disabled={isProcessing}
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              </div>
            </div>

            {/* Queue items */}
            <div className="queue-list">
              {queue.map((item) => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onDownload={downloadItem}
                />
              ))}
            </div>

            {/* Convert button */}
            {pendingCount > 0 && (
              <div className="convert-action">
                <button
                  id="convert-btn"
                  className="btn-primary btn-convert"
                  onClick={runConversion}
                  disabled={isProcessing || (!isAuthenticated && guestRemaining === 0)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={17} className="spin" />
                      Converting…
                    </>
                  ) : (
                    <>
                      Convert {pendingCount} image{pendingCount !== 1 ? 's' : ''}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                {!isAuthenticated && guestRemaining === 0 && (
                  <p className="convert-limit-note">
                    Free limit reached.{' '}
                    <button
                      className="inline-link"
                      onClick={() => setShowLimitModal(true)}
                    >
                      Sign in to continue
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!hasQueue && (
          <div className="empty-state">
            <ImageIcon size={42} className="empty-icon" />
            <p className="empty-text">No images added yet</p>
            <p className="empty-hint">
              Drop files above to get started
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Queue Item Card ──────────────────────────────────────────────────────────

interface QueueItemCardProps {
  item:       QueueItem;
  onRemove:   (id: string) => void;
  onDownload: (item: QueueItem) => void;
}

function QueueItemCard({ item, onRemove, onDownload }: QueueItemCardProps) {
  const savingsPercent =
    item.convertedSize != null && item.originalSize > 0
      ? Math.round(
          ((item.originalSize - item.convertedSize) / item.originalSize) * 100,
        )
      : null;

  return (
    <div className={`queue-card status-${item.status}`} id={`queue-item-${item.id}`}>
      {/* Source thumbnail */}
      {item.previewUrl && (
        <div className="card-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.previewUrl} alt={item.file.name} className="thumb-img" />
        </div>
      )}

      {/* Info */}
      <div className="card-info">
        <p className="card-filename">{item.file.name}</p>
        <p className="card-meta">
          {formatBytes(item.originalSize)}
          {item.convertedSize != null && (
            <>
              {' → '}
              <span className="card-size-converted">{formatBytes(item.convertedSize)}</span>
              {savingsPercent !== null && savingsPercent > 0 && (
                <span className="card-savings"> −{savingsPercent}%</span>
              )}
            </>
          )}
          {item.errorMessage && (
            <span className="card-error"> · {item.errorMessage}</span>
          )}
        </p>
      </div>

      {/* Status + actions */}
      <div className="card-actions">
        {item.status === 'pending' && (
          <span className="status-badge pending">Pending</span>
        )}
        {item.status === 'processing' && (
          <Loader2 size={16} className="spin status-spinner" aria-label="Processing" />
        )}
        {item.status === 'done' && (
          <>
            <CheckCircle size={16} className="status-done-icon" />
            {item.outputUrl && (
              /* Preview thumbnail for converted */
              <a
                href={item.outputUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-preview-link"
                aria-label="Preview converted image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.outputUrl}
                  alt="Preview"
                  className="card-output-thumb"
                />
              </a>
            )}
            <button
              className="btn-icon"
              onClick={() => onDownload(item)}
              aria-label={`Download ${item.outputFilename}`}
              id={`download-${item.id}`}
            >
              <Download size={15} />
            </button>
          </>
        )}
        {item.status === 'error' && (
          <XCircle size={16} className="status-error-icon" aria-label="Error" />
        )}

        <button
          className="btn-icon btn-icon--danger"
          onClick={() => onRemove(item.id)}
          disabled={item.status === 'processing'}
          aria-label={`Remove ${item.file.name}`}
          id={`remove-${item.id}`}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
