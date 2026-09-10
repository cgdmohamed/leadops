import { Pool } from 'pg';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const SEED_ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const SEED_ADMIN_NAME = (process.env.SEED_ADMIN_NAME ?? process.env.ADMIN_NAME ?? '').trim();
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? '';
const SEED_WORKSPACE_NAME = (process.env.SEED_WORKSPACE_NAME ?? 'LeadOps').trim();
const SEED_WORKSPACE_CURRENCY = (process.env.SEED_WORKSPACE_CURRENCY ?? 'USD').trim().toUpperCase();
const SEED_WORKSPACE_TIMEZONE = (process.env.SEED_WORKSPACE_TIMEZONE ?? 'UTC').trim();

if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_NAME || SEED_ADMIN_PASSWORD.length < 12) {
  console.error('Seed requires SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, and SEED_ADMIN_PASSWORD with at least 12 characters');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = (await derive(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const user = await client.query(
      `INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3)
       ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash
       RETURNING id`,
      [SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, await hashPassword(SEED_ADMIN_PASSWORD)]
    );
    const userId = user.rows[0].id;

    const existingWorkspace = await client.query(
      `SELECT w.id FROM workspaces w
       JOIN memberships m ON m.workspace_id=w.id
       WHERE m.user_id=$1 AND w.name=$2
       LIMIT 1`,
      [userId, SEED_WORKSPACE_NAME]
    );

    const workspaceId = existingWorkspace.rows[0]?.id ?? (await client.query(
      'INSERT INTO workspaces(name,currency,timezone) VALUES($1,$2,$3) RETURNING id',
      [SEED_WORKSPACE_NAME, SEED_WORKSPACE_CURRENCY, SEED_WORKSPACE_TIMEZONE]
    )).rows[0].id;

    await client.query(
      `INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'admin')
       ON CONFLICT(workspace_id,user_id) DO UPDATE SET role='admin'`,
      [workspaceId, userId]
    );
    await client.query('UPDATE sessions SET workspace_id=$1 WHERE user_id=$2', [workspaceId, userId]);
    await client.query('INSERT INTO audit_events(workspace_id,actor_id,action) VALUES($1,$2,$3)', [workspaceId, userId, 'seed.admin_ready']);

    await client.query('COMMIT');
    console.log(`Seed completed: admin ${SEED_ADMIN_EMAIL}, workspace ${SEED_WORKSPACE_NAME}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
