import { api } from '@/lib/server/api';
import { getGoogleAuthUrl } from '@/lib/integrations/google';
import { createGoogleOAuthState } from '@/lib/server/oauth-state';

export async function GET(request: Request) {
  return api(request, async () => {
    const state = await createGoogleOAuthState('/data-sync');
    return { url: await getGoogleAuthUrl(state) };
  });
}
