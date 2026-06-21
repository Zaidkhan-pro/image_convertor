'use client';

/**
 * components/Providers.tsx
 * Wraps the app with NextAuth SessionProvider and reCAPTCHA v3 Provider.
 */

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import type { Session } from 'next-auth';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function Providers({ children, session }: ProvidersProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

  return (
    <SessionProvider session={session}>
      <GoogleReCaptchaProvider
        reCaptchaKey={siteKey}
        scriptProps={{ async: true, defer: true, appendTo: 'head' }}
      >
        {children}
      </GoogleReCaptchaProvider>
    </SessionProvider>
  );
}
