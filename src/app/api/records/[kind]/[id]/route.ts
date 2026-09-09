import { z } from 'zod';
import { api, body, admin, ApiError } from '@/lib/server/api';
import { db, transaction } from '@/lib/server/db';
import { kindSchema, schemas, recordInput } from '@/lib/server/validation';

type Context = { params: Promise<{ kind: string; id: string }> };
export async function GET(request: Request, context: Context) {
  return api(request, async user => {
    const params = await context.params;
    const { rows } = await db().query('SELECT id,data,owner_id AS "ownerId",version,created_at AS "createdAt",updated_at AS "updatedAt" FROM records WHERE workspace_id=$1 AND kind=$2 AND id=$3 AND ($4::boolean OR owner_id=$5)', [user.activeWorkspace, kindSchema.parse(params.kind), z.uuid().parse(params.id), user.role === 'admin', user.id]);
    if (!rows[0]) throw new ApiError(404, 'Record not found');
    return rows[0];
  });
}
export async function PUT(request: Request, context: Context) {
  return api(request, async user => {
    const params = await context.params;
    const kind = kindSchema.parse(params.kind);
    const id = z.uuid().parse(params.id);
    if (['campaigns','assignment-rules'].includes(kind)) admin(user);
    const input = recordInput.extend({ version: z.number().int().positive() }).parse(await body(request));
    const data = schemas[kind].strict().parse(input.data);
    return transaction(async client => {
      const current = await client.query('SELECT * FROM records WHERE workspace_id=$1 AND kind=$2 AND id=$3 AND ($4::boolean OR owner_id=$5) FOR UPDATE', [user.activeWorkspace, kind, id, user.role === 'admin', user.id]);
      if (!current.rowCount) throw new ApiError(404, 'Record not found');
      if (current.rows[0].version !== input.version) throw new ApiError(409, 'Record changed. Reload and retry.');
      const owner = user.role === 'admin' && input.ownerId !== undefined ? input.ownerId : current.rows[0].owner_id;
      if (owner && !(await client.query('SELECT 1 FROM memberships WHERE workspace_id=$1 AND user_id=$2', [user.activeWorkspace, owner])).rowCount) throw new ApiError(400, 'Invalid owner');
      for (const [field, relatedKind] of [['leadId','leads'],['campaignId','campaigns']] as const) {
        const relatedId = (data as Record<string, unknown>)[field];
        if (relatedId && !(await client.query('SELECT 1 FROM records WHERE workspace_id=$1 AND kind=$2 AND id=$3 AND ($4::boolean OR owner_id=$5)', [user.activeWorkspace, relatedKind, relatedId, user.role === 'admin', user.id])).rowCount) throw new ApiError(400, `Invalid ${field}`);
      }
      const result = await client.query('UPDATE records SET data=$1,owner_id=$2,version=version+1,updated_at=now() WHERE id=$3 RETURNING id,data,version', [JSON.stringify(data), owner, id]);
      await client.query('INSERT INTO audit_events(workspace_id,actor_id,action,entity_id) VALUES($1,$2,$3,$4)', [user.activeWorkspace, user.id, `${kind}.updated`, id]);
      return result.rows[0];
    });
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(request, async user => {
    admin(user);
    const params = await context.params;
    const kind = kindSchema.parse(params.kind);
    const id = z.uuid().parse(params.id);
    return transaction(async client => {
      const related = await client.query('SELECT 1 FROM records WHERE workspace_id=$1 AND (data->>\'leadId\'=$2 OR data->>\'campaignId\'=$2) LIMIT 1', [user.activeWorkspace, id]);
      if (related.rowCount) throw new ApiError(409, 'Remove linked records first');
      const result = await client.query('DELETE FROM records WHERE workspace_id=$1 AND kind=$2 AND id=$3', [user.activeWorkspace, kind, id]);
      if (!result.rowCount) throw new ApiError(404, 'Record not found');
      await client.query('INSERT INTO audit_events(workspace_id,actor_id,action,entity_id) VALUES($1,$2,$3,$4)', [user.activeWorkspace, user.id, `${kind}.deleted`, id]);
      return { success: true };
    });
  });
}
