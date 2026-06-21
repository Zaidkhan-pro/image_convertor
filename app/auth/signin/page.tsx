'use client';

/**
 * app/auth/signin/page.tsx
 * Custom sign-in page for NextAuth.
 */

import { signIn } from 'next-auth/react';
import { Aperture } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <Aperture size={26} style={{ color: 'var(--primary-light)' }} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Pixel<span style={{ color: 'var(--primary-light)' }}>Shift</span>
          </span>
        </div>

        <h1>Welcome back</h1>
        <p>Sign in to unlock unlimited image conversions</p>

        <button
          id="google-signin-btn"
          className="auth-google-btn"
          onClick={() => signIn('google', { callbackUrl: '/' })}
        >
          {/* Google SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5C34.8 43.5 43.5 34.8 43.5 24c0-1.4-.2-2.7-.5-4h.6z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4.5 24 4.5c-7.7 0-14.4 4.4-17.7 10.2z"/>
            <path fill="#4CAF50" d="M24 43.5c5.2 0 10-1.9 13.6-5l-6.3-5.3C29.3 34.9 26.8 36 24 36c-5.1 0-9.5-3-11.3-7.3l-6.6 5.1C9.6 39.1 16.3 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.5 24c0-1.4-.2-2.7-.5-4H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.7l6.3 5.3C40.8 35.6 43.5 30.2 43.5 24z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
