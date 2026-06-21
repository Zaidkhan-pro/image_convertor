/**
 * lib/guestTracker.ts
 * LocalStorage-backed conversion counter for unauthenticated users.
 */

import { GUEST_LIMIT, GUEST_STORAGE_KEY, type GuestState } from './types';

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getGuestState(): GuestState {
  if (typeof window === 'undefined') {
    return { conversionCount: 0, limitReached: false };
  }

  try {
    const raw   = localStorage.getItem(GUEST_STORAGE_KEY);
    const count = raw ? parseInt(raw, 10) : 0;
    const safe  = isNaN(count) ? 0 : Math.max(0, count);
    return {
      conversionCount: safe,
      limitReached: safe >= GUEST_LIMIT,
    };
  } catch {
    return { conversionCount: 0, limitReached: false };
  }
}

// ─── Increment ────────────────────────────────────────────────────────────────

/**
 * Increment conversion count by `n` (default 1).
 * Returns the updated GuestState.
 */
export function incrementGuestCount(n = 1): GuestState {
  if (typeof window === 'undefined') {
    return { conversionCount: 0, limitReached: false };
  }

  try {
    const current = getGuestState().conversionCount;
    const next    = current + n;
    localStorage.setItem(GUEST_STORAGE_KEY, String(next));
    return {
      conversionCount: next,
      limitReached: next >= GUEST_LIMIT,
    };
  } catch {
    return { conversionCount: 0, limitReached: false };
  }
}

// ─── Reset (called after sign-in) ─────────────────────────────────────────────

export function resetGuestCount(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // Silently ignore storage errors
  }
}

// ─── Remaining ───────────────────────────────────────────────────────────────

export function remainingConversions(): number {
  const { conversionCount } = getGuestState();
  return Math.max(0, GUEST_LIMIT - conversionCount);
}
