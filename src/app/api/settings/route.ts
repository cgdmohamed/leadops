import { z } from 'zod';
import { api, body, admin } from '@/lib/server/api';
import { db, transaction } from '@/lib/server/db';
import { workspaceSchema } from '@/lib/server/validation';

export async function GET(request: Request) {
  return api(request, async user => (await db().query('SELECT id,name,currency,timezone,settings FROM workspaces WHERE id=$1', [user.activeWorkspace])).rows[0]);
}
export async function PATCH(request: Request) {
  return api(request, async user => {
    admin(user);
    const input = workspaceSchema.partial().extend({ revenueCurrency: z.string().trim().min(1).max(32).transform(v => v.toUpperCase()).optional() }).strict().parse(await body(request));
    return transaction(async client => {
      const { rows } = await client.query(`UPDATE workspaces SET name=coalesce($2,name),currency=coalesce($3,currency),timezone=coalesce($4,timezone),
        settings=settings || $5::jsonb WHERE id=$1 RETURNING id,name,currency,timezone,settings`, [user.activeWorkspace, input.name, input.currency, input.timezone, JSON.stringify(input.revenueCurrency ? { revenueCurrency: input.revenueCurrency } : {})]);
      await client.query('INSERT INTO audit_events(workspace_id,actor_id,action) VALUES($1,$2,\'settings.updated\')', [user.activeWorkspace,user.id]);
      return rows[0];
    });
  });
}
