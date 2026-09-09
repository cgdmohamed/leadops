import { cookies } from 'next/headers';
import { z } from 'zod';
import { api, body, ApiError } from '@/lib/server/api';
import { db, transaction } from '@/lib/server/db';
import { workspaceSchema } from '@/lib/server/validation';
import { SESSION_COOKIE } from '@/lib/server/session';
import { tokenHash } from '@/lib/server/password';

export async function GET(request: Request) {
  return api(request, async user => (await db().query('SELECT w.id,w.name,w.currency,w.timezone,m.role FROM workspaces w JOIN memberships m ON m.workspace_id=w.id WHERE m.user_id=$1 ORDER BY w.created_at', [user.id])).rows);
}
export async function POST(request: Request) {
  return api(request, async user => {
    const input = workspaceSchema.parse(await body(request));
    return transaction(async client => {
      const { rows } = await client.query('INSERT INTO workspaces(name,currency,timezone) VALUES($1,$2,$3) RETURNING id,name,currency,timezone', [input.name, input.currency, input.timezone]);
      await client.query('INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,\'admin\')', [rows[0].id, user.id]);
      return rows[0];
    });
  });
}
export async function PATCH(request: Request) {
  return api(request, async user => {
    const { workspaceId } = z.object({ workspaceId: z.uuid() }).strict().parse(await body(request));
    const token = (await cookies()).get(SESSION_COOKIE)!.value;
    const result = await db().query(`UPDATE sessions SET workspace_id=$1 WHERE token_hash=$2 AND user_id=$3
      AND EXISTS(SELECT 1 FROM memberships WHERE workspace_id=$1 AND user_id=$3)`, [workspaceId, tokenHash(token), user.id]);
    if (!result.rowCount) throw new ApiError(403, 'Workspace access denied');
    return { success: true };
  });
}
