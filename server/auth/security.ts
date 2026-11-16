import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.ts';

export type AdminRole =
  | 'super_admin'
  | 'founder'
  | 'ceo'
  | 'content_manager'
  | 'support_manager';

export type LeadershipRole = 'founder' | 'ceo' | 'none';

export const ADMIN_ROLES: readonly AdminRole[] = [
  'super_admin',
  'founder',
  'ceo',
  'content_manager',
  'support_manager',
] as const;

export const LEADERSHIP_SELECTABLE_ROLES: readonly ('founder' | 'ceo')[] = [
  'founder',
  'ceo',
] as const;

export type PermissionKey =
  | 'leadership.overview'
  | 'leadership.product.read'
  | 'leadership.product.write'
  | 'leadership.marketing.read'
  | 'leadership.marketing.write'
  | 'leadership.testing.read'
  | 'leadership.testing.write'
  | 'leadership.reports.read'
  | 'leadership.reports.write'
  | 'leadership.documents.read'
  | 'leadership.documents.write'
  | 'leadership.publishing'
  | 'leadership.enquiries'
  | 'leadership.settings.security'
  | 'system.admin';

export const ALL_PERMISSIONS: readonly PermissionKey[] = [
  'leadership.overview',
  'leadership.product.read',
  'leadership.product.write',
  'leadership.marketing.read',
  'leadership.marketing.write',
  'leadership.testing.read',
  'leadership.testing.write',
  'leadership.reports.read',
  'leadership.reports.write',
  'leadership.documents.read',
  'leadership.documents.write',
  'leadership.publishing',
  'leadership.enquiries',
  'leadership.settings.security',
  'system.admin',
] as const;

export const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, readonly PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS,
  ceo: [
    'leadership.overview',
    'leadership.product.read',
    'leadership.product.write',
    'leadership.marketing.read',
    'leadership.marketing.write',
    'leadership.testing.read',
    'leadership.testing.write',
    'leadership.reports.read',
    'leadership.reports.write',
    'leadership.documents.read',
    'leadership.documents.write',
    'leadership.publishing',
    'leadership.enquiries',
    'leadership.settings.security',
  ],
  founder: [
    'leadership.overview',
    'leadership.product.read',
    'leadership.marketing.read',
    'leadership.testing.read',
    'leadership.reports.read',
    'leadership.reports.write',
    'leadership.documents.read',
    'leadership.documents.write',
    'leadership.enquiries',
    'leadership.settings.security',
  ],
  content_manager: [],
  support_manager: [],
};

export function resolveLeadershipRole(role: AdminRole, storedLeadershipRole?: string | null): LeadershipRole {
  if (role === 'founder') return 'founder';
  if (role === 'ceo') return 'ceo';
  if (role === 'super_admin') {
    if (storedLeadershipRole === 'founder' || storedLeadershipRole === 'ceo') {
      return storedLeadershipRole;
    }
    return 'none';
  }
  return 'none';
}

export function isAuthorisedForLeadershipSelection(
  role: AdminRole,
  storedLeadershipRole: string | null | undefined,
  selectedRole: 'founder' | 'ceo'
): boolean {
  if (role === 'content_manager' || role === 'support_manager') {
    return false;
  }
  const resolved = resolveLeadershipRole(role, storedLeadershipRole);
  return resolved === selectedRole;
}

export function canAccessLeadershipPortal(role: AdminRole, storedLeadershipRole?: string | null): boolean {
  if (role === 'founder' || role === 'ceo') return true;
  if (role === 'super_admin') {
    const resolved = resolveLeadershipRole(role, storedLeadershipRole);
    return resolved === 'founder' || resolved === 'ceo';
  }
  return false;
}

export function getEffectivePermissions(
  role: AdminRole,
  customPermissions: number | boolean,
  permissionsJson?: string | null
): PermissionKey[] {
  if (role === 'super_admin') {
    return [...ALL_PERMISSIONS];
  }
  if (role === 'content_manager' || role === 'support_manager') {
    return [];
  }
  if (customPermissions === 1 || customPermissions === true) {
    try {
      const parsed = JSON.parse(permissionsJson || '[]');
      if (Array.isArray(parsed)) {
        const validSet = new Set<PermissionKey>(['leadership.overview', 'leadership.settings.security']);
        for (const item of parsed) {
          if (
            typeof item === 'string' &&
            item !== 'system.admin' &&
            (ALL_PERMISSIONS as readonly string[]).includes(item)
          ) {
            validSet.add(item as PermissionKey);
          }
        }
        return Array.from(validSet);
      }
    } catch {
      // Fall back to role defaults if malformed JSON
    }
  }
  return [...(ROLE_DEFAULT_PERMISSIONS[role] || [])];
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const expectedBuf = Buffer.from(keyHex, 'hex');
  const actualBuf = crypto.scryptSync(password, salt, 64);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export function isStrongPassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < 10) {
    return { valid: false, reason: 'Password must be at least 10 characters long.' };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      reason: 'Password must include uppercase, lowercase, and numeric characters.',
    };
  }
  return { valid: true };
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(rawToken: string): string {
  return crypto
    .createHmac('sha256', env.sessionSecret)
    .update(rawToken)
    .digest('hex');
}

// --- Optional TOTP (RFC 6238) Second Factor Helpers ---

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(byteLength = 20): string {
  const bytes = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i += 1) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function decodeBase32(secret: string): Buffer {
  const normalized = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < normalized.length; i += 1) {
    const idx = BASE32_ALPHABET.indexOf(normalized[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpCode(base32Secret: string, timestampMs = Date.now()): string {
  const key = decodeBase32(base32Secret);
  const counter = Math.floor(timestampMs / 30000);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  msg.writeUInt32BE(counter >>> 0, 4);

  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

export function verifyTotpCode(base32Secret: string, submittedCode: string, windowSteps = 1): boolean {
  const clean = submittedCode.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const now = Date.now();
  const submittedBuf = Buffer.from(clean, 'utf8');
  for (let step = -windowSteps; step <= windowSteps; step += 1) {
    const candidate = generateTotpCode(base32Secret, now + step * 30000);
    const candidateBuf = Buffer.from(candidate, 'utf8');
    if (candidateBuf.length === submittedBuf.length && crypto.timingSafeEqual(candidateBuf, submittedBuf)) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(email: string, base32Secret: string): string {
  const label = encodeURIComponent(`MAATA Leadership:${email}`);
  const issuer = encodeURIComponent('MAATA Technologies');
  return `otpauth://totp/${label}?secret=${base32Secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

function getMfaKey(): Buffer {
  return crypto.createHash('sha256').update(`maata-mfa-v1:${env.sessionSecret}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMfaKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(cipherText: string): string {
  const parts = cipherText.split(':');
  if (parts.length !== 3) return '';
  const [ivHex, tagHex, encHex] = parts;
  if (!ivHex || !tagHex || !encHex) return '';
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getMfaKey(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export function writeAuditLog(
  db: DatabaseSync,
  entry: {
    actorUserId?: string | null;
    actorEmail: string;
    actorRole: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      id, actor_user_id, actor_email, actor_role, action,
      resource_type, resource_id, details_json, ip_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    crypto.randomUUID(),
    entry.actorUserId ?? null,
    entry.actorEmail,
    entry.actorRole,
    entry.action,
    entry.resourceType,
    entry.resourceId ?? '',
    JSON.stringify(entry.details ?? {}),
    entry.ipAddress ?? ''
  );
}
