import 'server-only';
import { cookies } from 'next/headers';
import { db } from './db';
import { newToken, tokenHash } from './password';
import type { User } from '@/lib/types';

export const SESSION_COOKIE = 'leadops_session';
export async function createSession(userId: string, workspaceId: string) {
  const token = newToken();
  await db().query('INSERT INTO sessions(token_hash,user_id,workspace_id,expires_at) VALUES($1,$2,$3,now()+interval \'7 days\')', [tokenHash(token), userId, workspaceId]);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
}
export async function readSession(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;
  const { rows } = await db().query(`SELECT u.id,u.email,u.name,m.role,s.workspace_id AS "activeWorkspace",
    ARRAY(SELECT workspace_id::text FROM memberships WHERE user_id=u.id) AS workspaces
    FROM sessions s JOIN users u ON u.id=s.user_id
    JOIN memberships m ON m.user_id=u.id AND m.workspace_id=s.workspace_id
    WHERE s.token_hash=$1 AND s.expires_at>now()`, [tokenHash(token)]);
  return rows[0] ?? null;
}
export async function revokeSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db().query('DELETE FROM sessions WHERE token_hash=$1', [tokenHash(token)]);
  jar.delete(SESSION_COOKIE);
  jar.delete('demo_session');
}
export async function rateLimit(key: string, maximum = 10) {
  const { rows } = await db().query(`INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,now()+interval '15 minutes')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END,
    expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.expires_at END RETURNING count`, [tokenHash(key)]);
  return rows[0].count <= maximum;
}
