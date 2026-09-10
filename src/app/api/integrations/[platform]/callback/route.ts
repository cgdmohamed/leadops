import { z } from 'zod';
import { db } from '@/lib/server/db';
import { readSession } from '@/lib/server/session';
import { consumeOAuthState } from '@/lib/server/oauth-state';
import { encryptJson } from '@/lib/server/secret-json';
import { exchangePlatformCode } from '@/lib/integrations/oauth';
import type { Platform } from '@/lib/types';

const platformSchema = z.enum(['meta', 'google', 'tiktok', 'snapchat']);

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const url = new URL(request.url);
  const base = process.env.APP_URL ?? request.url;
  let platform: Platform = 'google';

  try {
    platform = platformSchema.parse((await params).platform);
    const state = await consumeOAuthState(platform, url.searchParams.get('state'));
    if (!state) throw new Error('Invalid OAuth state');

    const user = await readSession();
    if (!user) return Response.redirect(new URL('/sign-in', base).toString());
    if (user.role !== 'admin') return Response.redirect(new URL(state.nextUrl, base).toString());

    const code = url.searchParams.get('code') ?? url.searchParams.get('auth_code');
    if (!code) throw new Error('Missing authorization code');

    const result = await exchangePlatformCode(platform, code);
    await db().query(`INSERT INTO platform_connections(workspace_id,platform,display_name,status,credentials,account_id)
      VALUES($1,$2,$3,'connected',$4,$5)
      ON CONFLICT (workspace_id,platform) DO UPDATE SET display_name=EXCLUDED.display_name,credentials=EXCLUDED.credentials,status='connected',account_id=EXCLUDED.account_id,last_error=NULL,updated_at=now()`,
      [user.activeWorkspace, platform, result.displayName, JSON.stringify(encryptJson(result.credentials)), result.accountId]);

    return Response.redirect(new URL(`${state.nextUrl}?connected=${platform}`, base).toString());
  } catch (error) {
    const message = (error as Error).message;
    return Response.redirect(new URL(`/data-sync?error=${encodeURIComponent(message)}&platform=${encodeURIComponent(platform)}`, base).toString());
  }
}
