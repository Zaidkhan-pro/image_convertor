'use client';

/**
 * app/auth/error/page.tsx
 * Auth error page — shown when OAuth flow fails.
 */

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:  'Server configuration error. Please contact support.',
  AccessDenied:   'Access was denied. Please try again.',
  Verification:   'Token verification failed. The link may have expired.',
  Default:        'An unexpected error occurred during sign-in.',
};

function ErrorContent() {
  const params  = useSearchParams();
  const error   = params.get('error') ?? 'Default';
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <AlertTriangle size={40} style={{ color: 'var(--error)' }} />
        </div>
        <h1>Sign-in Error</h1>
        <p>{message}</p>
        <button
          id="retry-signin-btn"
          className="auth-google-btn"
          onClick={() => signIn('google', { callbackUrl: '/' })}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card"><p>Loading…</p></div></div>}>
      <ErrorContent />
    </Suspense>
  );
}
