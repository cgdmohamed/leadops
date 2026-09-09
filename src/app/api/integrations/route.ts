import { z } from 'zod';
import { api, body, admin } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { syncPlatform, getConnections, getSyncHistory } from '@/lib/integrations/service';

const platformSchema = z.enum(['meta', 'google', 'tiktok', 'snapchat']);

export async function GET(request: Request) {
  return api(request, async user => ({
    connections: await getConnections(user.activeWorkspace),
    history: await getSyncHistory(user.activeWorkspace),
  }));
}

export async function POST(request: Request) {
  return api(request, async user => {
    admin(user);
    const { platform, credentials } = z.object({
      platform: platformSchema,
      credentials: z.record(z.string(), z.unknown()).optional(),
    }).strict().parse(await body(request));

    if (credentials) {
      await db().query(`INSERT INTO platform_connections(workspace_id,platform,display_name,status,credentials,account_id)
        VALUES($1,$2,$3,'connected',$4,$5)
        ON CONFLICT (workspace_id,platform) DO UPDATE SET credentials=EXCLUDED.credentials,status='connected',last_error=NULL,updated_at=now()`,
        [user.activeWorkspace, platform, platform, JSON.stringify(credentials), credentials.adAccountId ?? credentials.customerId ?? credentials.advertiserId ?? null]);
      return { success: true };
    }

    // No credentials provided => trigger a sync for the existing connection
    const result = await syncPlatform(user.activeWorkspace, platform);
    return { success: true, ...result };
  });
}

export async function DELETE(request: Request) {
  return api(request, async user => {
    admin(user);
    const { platform } = z.object({ platform: platformSchema }).strict().parse(await body(request));
    await db().query('UPDATE platform_connections SET status=\'disconnected\',updated_at=now() WHERE workspace_id=$1 AND platform=$2', [user.activeWorkspace, platform]);
    return { success: true };
  });
}