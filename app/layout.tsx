/**
 * app/layout.tsx
 * Root layout — wraps everything with auth + reCAPTCHA providers.
 */

import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar    from '@/components/Navbar';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title:       'PixelShift — Instant Image Converter',
  description:
    'Convert JPEG, PNG, and WebP images instantly in your browser. ' +
    'Zero uploads, zero server load — 100% private, client-side processing.',
  keywords:    ['image converter', 'webp converter', 'jpeg to png', 'online image tool'],
  openGraph: {
    title:       'PixelShift — Instant Image Converter',
    description: 'Convert images client-side in seconds. No uploads required.',
    type:        'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b1326" />
      </head>
      <body>
        <Providers>
          <div className="app-shell">
            <Navbar />
            <main className="page-content">
              {children}
            </main>
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
