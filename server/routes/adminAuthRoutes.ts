import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.ts';
import { getDb } from '../db/database.ts';
import {
  decryptSecret,
  generateOpaqueToken,
  getEffectivePermissions,
  hashPassword,
  hashToken,
  isStrongPassword,
  resolveLeadershipRole,
  verifyPassword,
  verifyTotpCode,
  writeAuditLog,
  type AdminRole,
} from '../auth/security.ts';
import {
  clearSessionCookie,
  createRateLimiter,
  getClientIp,
  issueSessionCookie,
  requireAuth,
  type AdminRequest,
} from '../middleware/auth.ts';

export const adminAuthRouter = Router();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many authentication attempts. Please wait before trying again.',
});

adminAuthRouter.get('/setup-status', (_req, res) => {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) as c FROM admin_users WHERE role = 'super_admin'")
    .get() as { c: number };
  res.json({ needsInitialSetup: row.c === 0 });
});

const initialSetupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  password: z.string().min(10).max(128),
  leadershipRole: z.enum(['founder', 'ceo', 'none']).optional(),
});

adminAuthRouter.post('/setup-initial-admin', authLimiter, (req, res) => {
  const db = getDb();
  const existingCount = db
    .prepare("SELECT COUNT(*) as c FROM admin_users WHERE role = 'super_admin'")
    .get() as { c: number };

  if (existingCount.c > 0) {
    res.status(403).json({ error: 'Initial Super Admin account has already been configured.' });
    return;
  }

  const parsed = initialSetupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid setup data.' });
    return;
  }

  const strength = isStrongPassword(parsed.data.password);
  if (!strength.valid) {
    res.status(400).json({ error: strength.reason });
    return;
  }

  const userId = crypto.randomUUID();
  const email = parsed.data.email.toLowerCase();
  const leadershipRole =
    parsed.data.leadershipRole || (/pavani/i.test(parsed.data.name) ? 'ceo' : 'none');
  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.sessionTtlHours * 3600 * 1000).toISOString();

  db.exec('BEGIN');
  try {
    db.prepare(`
      INSERT INTO admin_users (id, name, email, password_hash, role, leadership_role, is_active, last_login_at)
      VALUES (?, ?, ?, ?, 'super_admin', ?, 1, datetime('now'))
    `).run(userId, parsed.data.name, email, hashPassword(parsed.data.password), leadershipRole);

    db.prepare(`
      INSERT INTO admin_sessions (token_hash, user_id, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      hashToken(rawToken),
      userId,
      expiresAt,
      getClientIp(req),
      String(req.headers['user-agent'] || '').slice(0, 250)
    );

    writeAuditLog(db, {
      actorUserId: userId,
      actorEmail: email,
      actorRole: 'super_admin',
      action: 'INITIAL_SUPER_ADMIN_SETUP',
      resourceType: 'admin_users',
      resourceId: userId,
      details: { leadershipRole },
      ipAddress: getClientIp(req),
    });

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  issueSessionCookie(req, res, rawToken);
  res.status(201).json({
    user: {
      id: userId,
      name: parsed.data.name,
      email,
      role: 'super_admin' as AdminRole,
      leadershipRole,
      mfaEnabled: false,
      permissions: getEffectivePermissions('super_admin', 0, '[]'),
    },
  });
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  totpCode: z.string().trim().optional(),
});

adminAuthRouter.post('/login', authLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid email and password are required.' });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  const user = db
    .prepare(`
      SELECT
        id, name, email, password_hash, role, leadership_role,
        custom_permissions, permissions_json, mfa_enabled, mfa_secret_enc, is_active
      FROM admin_users
      WHERE email = ?
    `)
    .get(email) as
    | {
        id: string;
        name: string;
        email: string;
        password_hash: string;
        role: AdminRole;
        leadership_role: string;
        custom_permissions: number;
        permissions_json: string;
        mfa_enabled: number;
        mfa_secret_enc: string;
        is_active: number;
      }
    | undefined;

  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    writeAuditLog(db, {
      actorUserId: user?.id ?? null,
      actorEmail: email,
      actorRole: user?.role ?? 'unknown',
      action: 'ADMIN_LOGIN_FAILED',
      resourceType: 'admin_sessions',
      details: { reason: 'invalid_credentials' },
      ipAddress: getClientIp(req),
    });
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.is_active !== 1) {
    writeAuditLog(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ADMIN_LOGIN_FAILED',
      resourceType: 'admin_sessions',
      resourceId: user.id,
      details: { reason: 'account_inactive' },
      ipAddress: getClientIp(req),
    });
    res.status(403).json({ error: 'This administrator account is currently inactive.' });
    return;
  }

  if (user.mfa_enabled === 1 && user.mfa_secret_enc) {
    if (!parsed.data.totpCode) {
      res.status(200).json({
        mfaRequired: true,
        message: 'Two-factor verification code required.',
      });
      return;
    }
    const secret = decryptSecret(user.mfa_secret_enc);
    if (!secret || !verifyTotpCode(secret, parsed.data.totpCode)) {
      writeAuditLog(db, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'ADMIN_LOGIN_FAILED',
        resourceType: 'admin_sessions',
        resourceId: user.id,
        details: { reason: 'invalid_mfa_code' },
        ipAddress: getClientIp(req),
      });
      res.status(401).json({ error: 'Invalid two-factor authentication code.' });
      return;
    }
  }

  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.sessionTtlHours * 3600 * 1000).toISOString();

  db.prepare("DELETE FROM admin_sessions WHERE datetime(expires_at) <= datetime('now')").run();

  db.prepare(`
    INSERT INTO admin_sessions (token_hash, user_id, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    hashToken(rawToken),
    user.id,
    expiresAt,
    getClientIp(req),
    String(req.headers['user-agent'] || '').slice(0, 250)
  );

  db.prepare("UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  writeAuditLog(db, {
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ADMIN_LOGIN',
    resourceType: 'admin_sessions',
    resourceId: user.id,
    details: { mfaUsed: user.mfa_enabled === 1 },
    ipAddress: getClientIp(req),
  });

  issueSessionCookie(req, res, rawToken);
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      leadershipRole: resolveLeadershipRole(user.role, user.leadership_role),
      mfaEnabled: user.mfa_enabled === 1,
      permissions: getEffectivePermissions(user.role, user.custom_permissions, user.permissions_json),
    },
  });
});

adminAuthRouter.post('/logout', requireAuth, (req: AdminRequest, res) => {
  const db = getDb();
  if (req.sessionTokenHash) {
    db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(req.sessionTokenHash);
  }
  if (req.adminUser) {
    writeAuditLog(db, {
      actorUserId: req.adminUser.id,
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'ADMIN_LOGOUT',
      resourceType: 'admin_sessions',
      resourceId: req.adminUser.id,
      ipAddress: getClientIp(req),
    });
  }
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

adminAuthRouter.get('/me', requireAuth, (req: AdminRequest, res) => {
  res.json({ user: req.adminUser });
});

const forgotSchema = z.object({
  email: z.string().trim().email(),
});

adminAuthRouter.post('/forgot-password', authLimiter, (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please provide a valid administrator email.' });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  const user = db
    .prepare('SELECT id, email, role, is_active FROM admin_users WHERE email = ?')
    .get(email) as { id: string; email: string; role: string; is_active: number } | undefined;

  let devPreviewToken: string | undefined;

  if (user && user.is_active === 1) {
    const rawResetToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO password_resets (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), user.id, hashToken(rawResetToken), expiresAt);

    writeAuditLog(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'password_resets',
      resourceId: user.id,
      ipAddress: getClientIp(req),
    });

    if (env.allowDevResetPreview) {
      devPreviewToken = rawResetToken;
    }
  }

  res.json({
    message:
      'If an active administrator account matches that email, a password reset token has been generated (valid for 30 minutes).',
    ...(devPreviewToken ? { devPreviewToken } : {}),
  });
});

const resetSchema = z.object({
  token: z.string().trim().min(16),
  newPassword: z.string().min(10).max(128),
});

adminAuthRouter.post('/reset-password', authLimiter, (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid reset token and strong password are required.' });
    return;
  }

  const strength = isStrongPassword(parsed.data.newPassword);
  if (!strength.valid) {
    res.status(400).json({ error: strength.reason });
    return;
  }

  const db = getDb();
  const tokenHash = hashToken(parsed.data.token);

  const resetRow = db
    .prepare(`
      SELECT r.id, r.user_id, r.expires_at, r.used_at, u.email, u.role
      FROM password_resets r
      JOIN admin_users u ON u.id = r.user_id
      WHERE r.token_hash = ?
    `)
    .get(tokenHash) as
    | {
        id: string;
        user_id: string;
        expires_at: string;
        used_at: string | null;
        email: string;
        role: string;
      }
    | undefined;

  if (!resetRow || resetRow.used_at || Date.parse(resetRow.expires_at) <= Date.now()) {
    res.status(400).json({ error: 'Reset token is invalid or has expired.' });
    return;
  }

  db.exec('BEGIN');
  try {
    db.prepare(`
      UPDATE admin_users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(hashPassword(parsed.data.newPassword), resetRow.user_id);

    db.prepare(`
      UPDATE password_resets
      SET used_at = datetime('now')
      WHERE id = ?
    `).run(resetRow.id);

    db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').run(resetRow.user_id);

    writeAuditLog(db, {
      actorUserId: resetRow.user_id,
      actorEmail: resetRow.email,
      actorRole: resetRow.role,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'admin_users',
      resourceId: resetRow.user_id,
      ipAddress: getClientIp(req),
    });

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  res.json({ message: 'Password updated successfully. Please sign in with your new password.' });
});
