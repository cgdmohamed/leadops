import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, hex] = encoded.split(':');
  if (algorithm !== 'scrypt' || !salt || !hex || hex.length !== 128) return false;
  const key = await derive(password, salt, 64) as Buffer;
  const expected = Buffer.from(hex, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}
