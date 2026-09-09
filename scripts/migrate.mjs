import { readFile, readdir } from 'node:fs/promises';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString });
const client = await pool.connect();
try {
  await client.query('SELECT pg_advisory_lock(72941021)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const directory = new URL('../db/migrations/', import.meta.url);
  for (const name of (await readdir(directory)).filter((n) => n.endsWith('.sql')).sort()) {
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
    if (applied.rowCount) continue;
    await client.query('BEGIN');
    try {
      await client.query(await readFile(new URL(name, directory), 'utf8'));
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.query('SELECT pg_advisory_unlock(72941021)');
  client.release();
  await pool.end();
}