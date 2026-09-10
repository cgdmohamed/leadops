import 'server-only';
import { cookies } from 'next/headers';
import { tokenHash, newToken } from './password';
import type { Platform } from '@/lib/types';

const OAUTH_STATE_COOKIE_PREFIX = 'leadops_oauth_state_';

export function safeRedirect(value: string | null | undefined): string {
  if (value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  return '/data-sync';
}

export async function createOAuthState(platform: Platform, nextUrl: string) {
  const state = newToken();
  const payload = JSON.stringify({ stateHash: tokenHash(state), nextUrl: safeRedirect(nextUrl) });
  (await cookies()).set(`${OAUTH_STATE_COOKIE_PREFIX}${platform}`, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/api/integrations/${platform}`,
    maxAge: 600,
  });
  return state;
}

export async function consumeOAuthState(platform: Platform, state: string | null) {
  const jar = await cookies();
  const cookieName = `${OAUTH_STATE_COOKIE_PREFIX}${platform}`;
  const stored = jar.get(cookieName)?.value;
  jar.delete(cookieName);
  if (!state || !stored) return null;

  try {
    const parsed = JSON.parse(stored) as { stateHash?: string; nextUrl?: string };
    if (parsed.stateHash !== tokenHash(state)) return null;
    return { nextUrl: safeRedirect(parsed.nextUrl) };
  } catch {
    return null;
  }
}
