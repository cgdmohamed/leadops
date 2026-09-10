import { z } from 'zod';
import { api, admin, body, ApiError } from '@/lib/server/api';
import { db, transaction } from '@/lib/server/db';
import { newToken, tokenHash } from '@/lib/server/password';
import { rateLimit } from '@/lib/server/session';
import { sendAccountMail } from '@/lib/server/mail';

export async function GET(request: Request) {
  return api(request, async user => {
    admin(user);
    return (await db().query(`SELECT u.id,u.name,u.email,m.role,
      (SELECT count(*)::int FROM records r WHERE r.workspace_id=m.workspace_id AND r.owner_id=u.id AND kind='leads') AS "assignedLeads",
      (SELECT count(*)::int FROM records r WHERE r.workspace_id=m.workspace_id AND r.owner_id=u.id AND kind='opportunities' AND data->>'stage'='closed_won') AS "wonDeals"
      FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=$1 ORDER BY u.name`, [user.activeWorkspace])).rows.map(row => ({ ...row, winRate: row.assignedLeads ? Math.round(row.wonDeals / row.assignedLeads * 100) : 0 }));
  });
}
export async function POST(request: Request) {
  return api(request, async user => {
    admin(user);
    const input = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()), role: z.enum(['admin','agent']) }).strict().parse(await body(request));
    if (!await rateLimit(`invite:${user.activeWorkspace}`, 30)) throw new ApiError(429, 'Too many invitations');
    const token = newToken();
    await db().query('INSERT INTO account_tokens(token_hash,purpose,email,workspace_id,role,expires_at) VALUES($1,\'invite\',$2,$3,$4,now()+interval \'7 days\')', [tokenHash(token),input.email,user.activeWorkspace,input.role]);
    const inviteUrl = new URL('/accept-invite', process.env.APP_URL ?? request.url);
    inviteUrl.hash = new URLSearchParams({ token }).toString();
    try {
      await sendAccountMail(input.email, 'invite', token);
      return { success: true, emailSent: true };
    } catch {
      return { success: true, emailSent: false, inviteLink: inviteUrl.toString() };
    }
  });
}
export async function PATCH(request: Request) {
  return api(request, async user => {
    admin(user);
    const input = z.object({ id: z.uuid(), role: z.enum(['admin','agent']) }).strict().parse(await body(request));
    return transaction(async client => {
      await client.query('SELECT id FROM workspaces WHERE id=$1 FOR UPDATE', [user.activeWorkspace]);
      if (input.role === 'agent') {
        const admins = await client.query('SELECT user_id FROM memberships WHERE workspace_id=$1 AND role=\'admin\'', [user.activeWorkspace]);
        if (admins.rows.length === 1 && admins.rows[0].user_id === input.id) throw new ApiError(409, 'Workspace must retain an administrator');
      }
      const changed = await client.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3', [input.role,user.activeWorkspace,input.id]);
      if (!changed.rowCount) throw new ApiError(404, 'Member not found');
      await client.query('INSERT INTO audit_events(workspace_id,actor_id,action,entity_id) VALUES($1,$2,\'member.role_updated\',$3)', [user.activeWorkspace,user.id,input.id]);
      return { success: true };
    });
  });
}
export async function DELETE(request: Request) {
  return api(request, async user => {
    admin(user);
    const { id } = z.object({ id: z.uuid() }).strict().parse(await body(request));
    if (id === user.id) throw new ApiError(409, 'You cannot remove yourself');
    return transaction(async client => {
      await client.query('SELECT id FROM workspaces WHERE id=$1 FOR UPDATE', [user.activeWorkspace]);
      await client.query('UPDATE records SET owner_id=$1 WHERE workspace_id=$2 AND owner_id=$3', [user.id,user.activeWorkspace,id]);
      const changed = await client.query('DELETE FROM memberships WHERE workspace_id=$1 AND user_id=$2', [user.activeWorkspace,id]);
      if (!changed.rowCount) throw new ApiError(404, 'Member not found');
      await client.query('INSERT INTO audit_events(workspace_id,actor_id,action,entity_id) VALUES($1,$2,\'member.removed\',$3)', [user.activeWorkspace,user.id,id]);
      return { success: true };
    });
  });
}
