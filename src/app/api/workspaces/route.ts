import { cookies } from 'next/headers';
import { z } from 'zod';
import { api, body, admin, ApiError } from '@/lib/server/api';
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
export async function DELETE(request: Request) {
  return api(request, async user => {
    admin(user);
    const { workspaceId } = z.object({ workspaceId: z.uuid() }).strict().parse(await body(request));
    return transaction(async client => {
      const owned = await client.query('SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2 FOR UPDATE', [workspaceId, user.id]);
      if (!owned.rowCount) throw new ApiError(404, 'Workspace not found');
      if (owned.rows[0].role !== 'admin') throw new ApiError(403, 'Administrator access required');

      const remaining = await client.query(`SELECT w.id FROM workspaces w
        JOIN memberships m ON m.workspace_id=w.id
        WHERE m.user_id=$1 AND w.id<>$2 ORDER BY w.created_at LIMIT 1`, [user.id, workspaceId]);
      if (!remaining.rowCount) throw new ApiError(409, 'Create or switch to another workspace before deleting this one');

      await client.query('DELETE FROM workspaces WHERE id=$1', [workspaceId]);
      if (workspaceId === user.activeWorkspace) {
        const token = (await cookies()).get(SESSION_COOKIE)?.value;
        if (token) {
          await client.query('UPDATE sessions SET workspace_id=$1 WHERE token_hash=$2 AND user_id=$3', [remaining.rows[0].id, tokenHash(token), user.id]);
        }
      }
      return { success: true, activeWorkspace: workspaceId === user.activeWorkspace ? remaining.rows[0].id : user.activeWorkspace };
    });
  });
}
