import 'server-only';
import { Pool, type PoolClient } from 'pg';

const globalDb = globalThis as unknown as { leadopsPool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!globalDb.leadopsPool) {
    globalDb.leadopsPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      statement_timeout: 15000,
    });
    globalDb.leadopsPool.on('error', () => console.error('PostgreSQL pool connection error'));
  }
  return globalDb.leadopsPool;
}
export async function transaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
