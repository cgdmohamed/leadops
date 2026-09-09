"use server";

import { z } from 'zod';
import { db, transaction } from '@/lib/server/db';
import { createSession, readSession, revokeSession, rateLimit } from '@/lib/server/session';
import { hashPassword, verifyPassword } from '@/lib/server/password';

const credentials = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(128) });
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const parsed = credentials.safeParse({ email, password });
  if (!parsed.success) return { success: false, error: 'Invalid email or password' };
  try {
    if (!await rateLimit(`login:${parsed.data.email}`)) return { success: false, error: 'Too many attempts. Try again in 15 minutes.' };
    const { rows } = await db().query('SELECT * FROM users WHERE email=$1', [parsed.data.email]);
    const user = rows[0];
    // Perform an equivalent password derivation for unknown accounts.
    const fallback = `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
    const valid = await verifyPassword(password, user?.password_hash ?? fallback);
    if (!user || !valid) return { success: false, error: 'Invalid email or password' };
    const membership = await db().query('SELECT workspace_id FROM memberships WHERE user_id=$1 ORDER BY workspace_id LIMIT 1', [user.id]);
    if (!membership.rowCount) return { success: false, error: 'No workspace membership found' };
    await createSession(user.id, membership.rows[0].workspace_id);
    return { success: true };
  } catch {
    console.error('Sign-in failed');
    return { success: false, error: 'Unable to sign in. Please try again.' };
  }
}
export async function signUp(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
  const parsed = credentials.extend({ password: z.string().min(12).max(128), name: z.string().trim().min(1).max(100) }).safeParse({ email, password, name });
  if (!parsed.success) return { success: false, error: 'Provide a valid email, name, and password of 12–128 characters.' };
  if (process.env.ALLOW_SIGNUP !== 'true') return { success: false, error: 'Registration is disabled. Contact your administrator.' };
  try {
    if (!await rateLimit('registration', 30)) return { success: false, error: 'Registration temporarily unavailable. Try later.' };
    const hash = await hashPassword(password);
    const result = await transaction(async client => {
      const user = await client.query('INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id', [parsed.data.email, parsed.data.name, hash]);
      const workspace = await client.query('INSERT INTO workspaces(name) VALUES($1) RETURNING id', [`${parsed.data.name}'s workspace`]);
      await client.query('INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,\'admin\')', [workspace.rows[0].id, user.rows[0].id]);
      return { user: user.rows[0].id, workspace: workspace.rows[0].id };
    });
    await createSession(result.user, result.workspace);
    return { success: true };
  } catch {
    return { success: false, error: 'Unable to create account. Check your details or sign in.' };
  }
}
export async function signOut() { await revokeSession(); }
export async function getSession() { return readSession(); }
export async function requireAuth() {
  const user = await readSession();
  if (!user) throw new Error('Unauthorized');
  return user;
}
