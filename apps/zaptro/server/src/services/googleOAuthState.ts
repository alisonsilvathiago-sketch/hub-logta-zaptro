import crypto from 'node:crypto';

export type GoogleOAuthStatePayload = {
  userId: string;
  companyId: string | null;
  returnTo: string;
  ts: number;
};

export function signGoogleOAuthState(secret: string, payload: GoogleOAuthStatePayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyGoogleOAuthState(secret: string, state: string): GoogleOAuthStatePayload | null {
  const [body, sig] = state.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as GoogleOAuthStatePayload;
    if (!payload.userId || !payload.ts) return null;
    if (Date.now() - payload.ts > 15 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
