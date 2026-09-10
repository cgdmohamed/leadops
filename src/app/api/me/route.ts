import { z } from 'zod';
import { cookies } from 'next/headers';
import { api, body, ApiError } from '@/lib/server/api';
import { transaction } from '@/lib/server/db';
import { hashPassword, tokenHash, verifyPassword } from '@/lib/server/password';
import { SESSION_COOKIE } from '@/lib/server/session';

export async function GET(request: Request) {
  return api(request, async user => user);
}

export async function PATCH(request: Request) {
  return api(request, async user => {
    const input = z.object({
      name: z.string().trim().min(1).max(100).optional(),
      email: z.email().max(254).transform(v => v.toLowerCase()).optional(),
      currentPassword: z.string().min(1).max(128).optional(),
      newPassword: z.string().min(12).max(128).optional(),
    }).strict().parse(await body(request));

    return transaction(async client => {
      if (input.newPassword) {
        if (!input.currentPassword) throw new ApiError(400, 'Current password is required');
        const { rows } = await client.query('SELECT password_hash FROM users WHERE id=$1', [user.id]);
        if (!rows[0] || !await verifyPassword(input.currentPassword, rows[0].password_hash)) {
          throw new ApiError(403, 'Current password is incorrect');
        }
        await client.query('UPDATE users SET password_hash=$2 WHERE id=$1', [user.id, await hashPassword(input.newPassword)]);
        const token = (await cookies()).get(SESSION_COOKIE)?.value;
        if (token) await client.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2', [user.id, tokenHash(token)]);
      }

      if (input.name || input.email) {
        try {
          await client.query('UPDATE users SET name=coalesce($2,name), email=coalesce($3,email) WHERE id=$1', [user.id, input.name, input.email]);
        } catch (error) {
          if ((error as { code?: string }).code === '23505') throw new ApiError(409, 'Email is already in use');
          throw error;
        }
      }

      return (await client.query('SELECT id,email,name FROM users WHERE id=$1', [user.id])).rows[0];
    });
  });
}
