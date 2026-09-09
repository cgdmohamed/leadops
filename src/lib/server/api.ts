import 'server-only';
import { z } from 'zod';
import { readSession } from './session';
import type { User } from '@/lib/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = process.env.APP_URL;
  if (!expected) throw new ApiError(503, 'Application URL is not configured');
  if (origin !== new URL(expected).origin) throw new ApiError(403, 'Invalid request origin');
}
export async function body(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Request body is required');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 65536) { await reader.cancel(); throw new ApiError(413, 'Request body too large'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ApiError(400, 'Invalid JSON'); }
}
export function admin(user: User) {
  if (user.role !== 'admin') throw new ApiError(403, 'Administrator access required');
}
export async function api(request: Request, run: (user: User) => Promise<unknown>) {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) assertOrigin(request);
    const user = await readSession();
    if (!user) throw new ApiError(401, 'Authentication required');
    return Response.json(await run(user), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: 'Invalid input', issues: error.issues.map(i => ({ path: i.path, message: i.message })) }, { status: 400 });
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
    console.error('API request failed', { method: request.method, path: new URL(request.url).pathname, code: (error as { code?: string })?.code });
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
