import { api, admin } from '@/lib/server/api';
import { db } from '@/lib/server/db';

export async function GET(request: Request) {
  return api(request, async user => {
    admin(user);
    const { rows } = await db().query(`SELECT a.id,a.action,a.entity_id AS "entityId",a.created_at AS "createdAt",
      coalesce(u.name,'System') AS "userName"
      FROM audit_events a LEFT JOIN users u ON u.id=a.actor_id
      WHERE a.workspace_id=$1 ORDER BY a.created_at DESC LIMIT 50`, [user.activeWorkspace]);
    return rows;
  });
}
