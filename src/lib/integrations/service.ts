import 'server-only';
import { db, transaction } from '@/lib/server/db';
import { getClient } from '@/lib/integrations';
import { decryptJson, encryptJson, isEncryptedJson } from '@/lib/server/secret-json';

export async function syncPlatform(workspaceId: string, platform: string): Promise<{ campaigns: number; leads: number }> {
  const connection = await db().query('SELECT * FROM platform_connections WHERE workspace_id=$1 AND platform=$2 AND status<>$3', [workspaceId, platform, 'disconnected']);
  if (!connection.rowCount) throw new Error(`${platform} is not connected`);
  const client = getClient(platform);
  if (!client) throw new Error(`No client for ${platform}`);

  const runId = (await db().query("INSERT INTO sync_runs(workspace_id,platform,status) VALUES($1,$2,'running') RETURNING id", [workspaceId, platform])).rows[0].id;
  try {
    const credentials = decryptJson(connection.rows[0].credentials);
    if (!isEncryptedJson(connection.rows[0].credentials)) {
      await db().query('UPDATE platform_connections SET credentials=$3,updated_at=now() WHERE workspace_id=$1 AND platform=$2', [
        workspaceId,
        platform,
        JSON.stringify(encryptJson(credentials)),
      ]);
    }
    const since = connection.rows[0].last_sync ?? undefined;
    const [campaigns, leads] = await Promise.all([
      client.fetchCampaigns(credentials),
      client.fetchLeads(credentials, since ? new Date(since) : undefined),
    ]);

    await transaction(async client => {
      const existing = (await client.query('SELECT id,data->>\'externalId\' AS external_id FROM records WHERE workspace_id=$1 AND kind=\'campaigns\' AND data->>\'platform\'=$2', [workspaceId, platform])).rows;

      for (const c of campaigns) {
        const match = existing.find(e => e.external_id === c.externalId);
        const payload = {
          name: c.name,
          platform: c.platform,
          externalId: c.externalId,
          status: c.status,
          spend: c.spend,
          impressions: c.impressions,
          clicks: c.clicks,
          leads: c.leads,
          startDate: c.startDate,
          endDate: c.endDate,
        };
        if (match) {
          await client.query('UPDATE records SET data=$3,updated_at=now() WHERE id=$1 AND workspace_id=$2', [match.id, workspaceId, JSON.stringify(payload)]);
        } else {
          const admin = (await client.query('SELECT user_id FROM memberships WHERE workspace_id=$1 AND role=\'admin\' LIMIT 1', [workspaceId])).rows[0]?.user_id;
          await client.query('INSERT INTO records(workspace_id,kind,owner_id,data) VALUES($1,\'campaigns\',$2,$3)', [workspaceId, admin ?? null, JSON.stringify(payload)]);
        }
      }

      for (const l of leads) {
        await client.query(`INSERT INTO records(workspace_id,kind,data) VALUES($1,'leads',$2)`, [workspaceId, JSON.stringify({ name: l.name, email: l.email, phone: l.phone, company: l.company, platform, source: `${platform} lead`, campaignExternalId: l.campaignExternalId, status: 'new', createdAt: l.createdAt, syncedFrom: 'integration' })]);
      }

      await client.query('UPDATE platform_connections SET last_sync=now(),last_error=NULL,updated_at=now() WHERE workspace_id=$1 AND platform=$2', [workspaceId, platform]);
    });

    await db().query("UPDATE sync_runs SET status='succeeded',finished_at=now() WHERE id=$1", [runId]);
    return { campaigns: campaigns.length, leads: leads.length };
  } catch (error) {
    await db().query("UPDATE sync_runs SET status='failed',finished_at=now(),error=$2 WHERE id=$1", [runId, (error as Error).message]);
    await db().query("UPDATE platform_connections SET status='connected',last_error=$2,updated_at=now() WHERE workspace_id=$1 AND platform=$3", [workspaceId, (error as Error).message, platform]);
    throw error;
  }
}

export async function getConnections(workspaceId: string) {
  const { rows } = await db().query(`SELECT platform,display_name,
    CASE WHEN status='disconnected' THEN 'disconnected' ELSE 'connected' END AS status,
    account_id,last_sync,last_error
    FROM platform_connections WHERE workspace_id=$1 ORDER BY platform`, [workspaceId]);
  return rows;
}

export async function getSyncHistory(workspaceId: string, limit = 20) {
  const { rows } = await db().query('SELECT id,platform,status,started_at,finished_at,error FROM sync_runs WHERE workspace_id=$1 ORDER BY started_at DESC LIMIT $2', [workspaceId, limit]);
  return rows;
}
