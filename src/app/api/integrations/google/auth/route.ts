import { api } from '@/lib/server/api';
import { getGoogleAuthUrl } from '@/lib/integrations/google';

export async function GET(request: Request) {
  return api(request, async () => ({
    url: await getGoogleAuthUrl('/data-sync'),
  }));
}