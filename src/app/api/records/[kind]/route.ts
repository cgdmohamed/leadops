import { z } from 'zod';
import { api, body, admin, ApiError } from '@/lib/server/api';
import { db, transaction } from '@/lib/server/db';
import { kindSchema, schemas, recordInput } from '@/lib/server/validation';

type Context = { params: Promise<{ kind: string }> };
export async function GET(request: Request, context: Context) {
  return api(request, async user => {
    const kind = kindSchema.parse((await context.params).kind);
    const url = new URL(request.url);
    const limit = z.coerce.number().int().min(1).max(100).parse(url.searchParams.get('limit') ?? 50);
    const offset = z.coerce.number().int().min(0).max(100000).parse(url.searchParams.get('offset') ?? 0);
    const { rows } = await db().query(`SELECT id,data,owner_id AS "ownerId",version,created_at AS "createdAt",updated_at AS "updatedAt"
      FROM records WHERE workspace_id=$1 AND kind=$2 AND ($3::boolean OR owner_id=$4)
      ORDER BY created_at DESC,id LIMIT $5 OFFSET $6`, [user.activeWorkspace, kind, user.role === 'admin', user.id, limit, offset]);
    return { items: rows, limit, offset };
  });
}
export async function POST(request: Request, context: Context) {
  return api(request, async user => {
    const kind = kindSchema.parse((await context.params).kind);
    if (['campaigns','assignment-rules'].includes(kind)) admin(user);
    const input = recordInput.parse(await body(request));
    const data = schemas[kind].passthrough().parse(input.data);
    const owner = user.role === 'admin' ? input.ownerId ?? user.id : user.id;
    return transaction(async client => {
      for (const [field, relatedKind] of [['leadId','leads'],['campaignId','campaigns']] as const) {
        const id = (data as Record<string, unknown>)[field];
        if (id && !(await client.query('SELECT 1 FROM records WHERE workspace_id=$1 AND kind=$2 AND id=$3 AND ($4::boolean OR owner_id=$5)', [user.activeWorkspace, relatedKind, id, user.role === 'admin', user.id])).rowCount) throw new ApiError(400, `Invalid ${field}`);
      }
      if (!(await client.query('SELECT 1 FROM memberships WHERE workspace_id=$1 AND user_id=$2', [user.activeWorkspace, owner])).rowCount) throw new ApiError(400, 'Invalid owner');
      const { rows } = await client.query(`INSERT INTO records(workspace_id,kind,owner_id,data) VALUES($1,$2,$3,$4)
        RETURNING id,data,owner_id AS "ownerId",version,created_at AS "createdAt",updated_at AS "updatedAt"`, [user.activeWorkspace, kind, owner, JSON.stringify(data)]);
      await client.query('INSERT INTO audit_events(workspace_id,actor_id,action,entity_id) VALUES($1,$2,$3,$4)', [user.activeWorkspace, user.id, `${kind}.created`, rows[0].id]);
      return rows[0];
    });
  });
}
