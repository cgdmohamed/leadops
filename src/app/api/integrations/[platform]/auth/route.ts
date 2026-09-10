import { z } from 'zod';
import { api, admin } from '@/lib/server/api';
import { createOAuthState } from '@/lib/server/oauth-state';
import { getPlatformAuthUrl } from '@/lib/integrations/oauth';

const platformSchema = z.enum(['meta', 'google', 'tiktok', 'snapchat']);

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  return api(request, async user => {
    admin(user);
    const { platform } = z.object({ platform: platformSchema }).parse(await params);
    const state = await createOAuthState(platform, '/data-sync');
    return { url: getPlatformAuthUrl(platform, state) };
  });
}
