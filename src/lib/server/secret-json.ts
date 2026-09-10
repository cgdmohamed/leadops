import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1:';

function key() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error('INTEGRATION_ENCRYPTION_KEY is required for integration credentials');
  return createHash('sha256').update(secret).digest();
}

export function encryptJson(value: Record<string, unknown>): Record<string, string> {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { value: `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString('base64url')}` };
}

export function isEncryptedJson(value: unknown): boolean {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).value === 'string' &&
    ((value as Record<string, unknown>).value as string).startsWith(PREFIX)
  );
}

export function decryptJson(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const encrypted = record.value;
  if (typeof encrypted !== 'string' || !encrypted.startsWith(PREFIX)) return record;

  const payload = Buffer.from(encrypted.slice(PREFIX.length), 'base64url');
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const data = payload.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'));
}
