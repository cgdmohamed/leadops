"use server";
import { z } from 'zod';
import { db, transaction } from '@/lib/server/db';
import { rateLimit, readSession } from '@/lib/server/session';
import { hashPassword, newToken, tokenHash } from '@/lib/server/password';
import { sendAccountMail } from '@/lib/server/mail';

export async function requestPasswordReset(email: string) {
  const parsed = z.email().max(254).transform(v => v.toLowerCase()).safeParse(email);
  if (!parsed.success) return { success: false, error: 'Enter a valid email' };
  try {
    if (!await rateLimit('reset:global', 100) || !await rateLimit(`reset:${parsed.data}`, 3)) return { success: true };
    const user = await db().query('SELECT id FROM users WHERE email=$1', [parsed.data]);
    if (user.rowCount) {
      const token = newToken();
      await db().query('INSERT INTO account_tokens(token_hash,purpose,email,expires_at) VALUES($1,\'reset\',$2,now()+interval \'30 minutes\')', [tokenHash(token),parsed.data]);
      await sendAccountMail(parsed.data, 'reset', token);
    }
    return { success: true };
  } catch { console.error('Password reset delivery failed'); return { success: true }; }
}
export async function resetPassword(token: string, password: string) {
  if (!z.string().min(12).max(128).safeParse(password).success || !z.string().length(43).safeParse(token).success) return { success: false, error: 'Invalid link or password. Use 12–128 characters.' };
  try {
    if (!await rateLimit('reset:consume', 100)) return { success: false, error: 'Try again later' };
    const hash = await hashPassword(password);
    await transaction(async client => {
      const { rows } = await client.query('DELETE FROM account_tokens WHERE token_hash=$1 AND purpose=\'reset\' AND expires_at>now() RETURNING email', [tokenHash(token)]);
      if (!rows[0]) throw new Error('Expired token');
      const user = await client.query('UPDATE users SET password_hash=$1 WHERE email=$2 RETURNING id', [hash, rows[0].email]);
      await client.query('DELETE FROM sessions WHERE user_id=$1', [user.rows[0].id]);
      await client.query('DELETE FROM account_tokens WHERE email=$1 AND purpose=\'reset\'', [rows[0].email]);
    });
    return { success: true };
  } catch { return { success: false, error: 'Reset link is invalid or expired' }; }
}
export async function acceptInvitation(token: string) {
  const user = await readSession();
  if (!user) return { success: false, error: 'Sign in or create an account first, then reopen this invitation.' };
  if (!z.string().length(43).safeParse(token).success) return { success: false, error: 'Invalid invitation' };
  try {
    await transaction(async client => {
      const { rows } = await client.query('DELETE FROM account_tokens WHERE token_hash=$1 AND purpose=\'invite\' AND email=$2 AND expires_at>now() RETURNING workspace_id,role', [tokenHash(token), user.email]);
      if (!rows[0]) throw new Error('Invalid invitation');
      await client.query('INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [rows[0].workspace_id,user.id,rows[0].role]);
      await client.query('INSERT INTO audit_events(workspace_id,actor_id,action) VALUES($1,$2,\'invitation.accepted\')', [rows[0].workspace_id,user.id]);
    });
    return { success: true };
  } catch { return { success: false, error: 'Invitation is invalid, expired, or belongs to a different email.' }; }
}
