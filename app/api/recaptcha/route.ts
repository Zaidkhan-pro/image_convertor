/**
 * app/api/recaptcha/route.ts
 * Server-side reCAPTCHA v3 token verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { RecaptchaVerifyResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json() as { token?: string };
    const token = body?.token;

    if (!token) {
      return NextResponse.json<RecaptchaVerifyResult>(
        { success: false, errorCodes: ['missing-input-response'] },
        { status: 400 },
      );
    }

    const secret   = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      console.error('[reCAPTCHA] RECAPTCHA_SECRET_KEY is not set.');
      return NextResponse.json<RecaptchaVerifyResult>(
        { success: false, errorCodes: ['server-misconfiguration'] },
        { status: 500 },
      );
    }

    const params = new URLSearchParams({ secret, response: token });
    const googleRes = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      { method: 'POST', body: params },
    );

    const data = await googleRes.json() as {
      success: boolean;
      score?: number;
      action?: string;
      'error-codes'?: string[];
    };

    return NextResponse.json<RecaptchaVerifyResult>({
      success:    data.success && (data.score ?? 1) >= 0.5,
      score:      data.score,
      action:     data.action,
      errorCodes: data['error-codes'],
    });
  } catch (err) {
    console.error('[reCAPTCHA] Verification error:', err);
    return NextResponse.json<RecaptchaVerifyResult>(
      { success: false, errorCodes: ['internal-error'] },
      { status: 500 },
    );
  }
}
