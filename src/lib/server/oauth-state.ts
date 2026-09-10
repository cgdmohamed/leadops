import 'server-only';
import { cookies } from 'next/headers';
import { tokenHash, newToken } from './password';

const GOOGLE_OAUTH_STATE_COOKIE = 'leadops_google_oauth_state';

export function safeRedirect(value: string | null | undefined): string {
  if (value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  return '/data-sync';
}

export async function createGoogleOAuthState(nextUrl: string) {
  const state = newToken();
  const payload = JSON.stringify({ stateHash: tokenHash(state), nextUrl: safeRedirect(nextUrl) });
  (await cookies()).set(GOOGLE_OAUTH_STATE_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/integrations/google',
    maxAge: 600,
  });
  return state;
}

export async function consumeGoogleOAuthState(state: string | null) {
  const jar = await cookies();
  const stored = jar.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  jar.delete(GOOGLE_OAUTH_STATE_COOKIE);
  if (!state || !stored) return null;

  try {
    const parsed = JSON.parse(stored) as { stateHash?: string; nextUrl?: string };
    if (parsed.stateHash !== tokenHash(state)) return null;
    return { nextUrl: safeRedirect(parsed.nextUrl) };
  } catch {
    return null;
  }
}
