'use client';

/**
 * components/GuestLimitModal.tsx
 * Overlay shown when an unauthenticated user exceeds their 5-conversion limit.
 */

import React from 'react';
import { signIn } from 'next-auth/react';
import { Zap, Lock, CheckCircle2, X } from 'lucide-react';

interface GuestLimitModalProps {
  onClose: () => void;
}

const PERKS = [
  'Unlimited conversions, forever free',
  'Batch convert up to 50 images at once',
  'Priority processing queue',
  'Full conversion history',
];

export default function GuestLimitModal({ onClose }: GuestLimitModalProps) {
  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    /* Backdrop */
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div className="modal-panel">
        {/* Close button */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Icon + headline */}
        <div className="modal-icon-wrap">
          <Lock size={32} className="modal-icon" />
        </div>

        <h2 id="modal-title" className="modal-title">
          You&apos;ve used your 5 free conversions
        </h2>
        <p className="modal-subtitle">
          Sign in with Google to unlock{' '}
          <span className="modal-accent">unlimited free processing</span> — no
          subscription, no credit card.
        </p>

        {/* Perk list */}
        <ul className="modal-perks">
          {PERKS.map((perk) => (
            <li key={perk} className="modal-perk-item">
              <CheckCircle2 size={16} className="perk-check" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          id="sign-in-google-btn"
          className="btn-primary modal-cta"
          onClick={handleSignIn}
        >
          <Zap size={18} />
          Continue with Google
        </button>

        <p className="modal-footer-note">
          We only request your name and profile picture.
        </p>
      </div>
    </div>
  );
}
