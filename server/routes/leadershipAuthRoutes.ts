import { Router } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { env } from '../config/env.ts';
import { getDb } from '../db/database.ts';
import {
  buildOtpAuthUri,
  canAccessLeadershipPortal,
  decryptSecret,
  encryptSecret,
  generateBase32Secret,
  generateOpaqueToken,
  getEffectivePermissions,
  hashPassword,
  hashToken,
  isAuthorisedForLeadershipSelection,
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
  requireLeadershipAccess,
  type AdminRequest,
} from '../middleware/auth.ts';
import { getInitialSetupState } from './adminAuthRoutes.ts';

export const leadershipAuthRouter = Router();

const leadershipAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 25,
  message: 'Too many Private Leadership Access attempts. Please wait before trying again.',
});

leadershipAuthRouter.get('/setup-status', (_req, res) => {
  res.json(getInitialSetupState());
});

const leadershipLoginSchema = z.object({
  selectedRole: z.enum([
    'super_admin',
    'founder',
    'ceo',
    'director',
    'executive',
    'administrator',
  ]),
  email: z.string().trim().email(),
  password: z.string().min(1),
  totpCode: z.string().trim().optional(),
});

leadershipAuthRouter.post('/login', leadershipAuthLimiter, (req, res) => {
  const parsed = leadershipLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Select a leadership role and enter valid credentials.' });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  const { selectedRole } = parsed.data;
  const ip = getClientIp(req);

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
      action: 'LEADERSHIP_LOGIN_FAILED',
      resourceType: 'leadership_sessions',
      details: { selectedRole, reason: 'invalid_credentials' },
      ipAddress: ip,
    });
    res.status(401).json({ error: 'Invalid credentials for Private Leadership Access.' });
    return;
  }

  if (user.is_active !== 1) {
    writeAuditLog(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LEADERSHIP_LOGIN_FAILED',
      resourceType: 'leadership_sessions',
      resourceId: user.id,
      details: { selectedRole, reason: 'account_inactive' },
      ipAddress: ip,
    });
    res.status(403).json({ error: 'This executive account is currently inactive.' });
    return;
  }

  // Strictly enforce server-side role authorization: prevent selecting an unauthorised role
  if (!isAuthorisedForLeadershipSelection(user.role, user.leadership_role, selectedRole)) {
    writeAuditLog(db, {
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LEADERSHIP_LOGIN_FAILED',
      resourceType: 'leadership_sessions',
      resourceId: user.id,
      details: {
        selectedRole,
        actualRole: user.role,
        assignedLeadershipRole: user.leadership_role,
        reason: 'role_not_authorised',
      },
      ipAddress: ip,
    });
    res.status(403).json({
      error: 'Your verified account is not authorised for the selected leadership role.',
    });
    return;
  }

  // Verify optional second factor (TOTP) only after password and role authorization succeed
  if (user.mfa_enabled === 1 && user.mfa_secret_enc) {
    if (!parsed.data.totpCode) {
      res.status(200).json({
        mfaRequired: true,
        message: 'Enter the 6-digit verification code from your authenticator app.',
      });
      return;
    }

    const secret = decryptSecret(user.mfa_secret_enc);
    if (!secret || !verifyTotpCode(secret, parsed.data.totpCode)) {
      writeAuditLog(db, {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'LEADERSHIP_LOGIN_FAILED',
        resourceType: 'leadership_sessions',
        resourceId: user.id,
        details: { selectedRole, reason: 'invalid_mfa_code' },
        ipAddress: ip,
      });
      res.status(401).json({ error: 'Invalid two-factor verification code.' });
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
    ip,
    String(req.headers['user-agent'] || '').slice(0, 250)
  );

  db.prepare("UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  writeAuditLog(db, {
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'LEADERSHIP_LOGIN_SUCCESS',
    resourceType: 'leadership_sessions',
    resourceId: user.id,
    details: { selectedRole, mfaUsed: user.mfa_enabled === 1 },
    ipAddress: ip,
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

leadershipAuthRouter.post('/logout', requireAuth, (req: AdminRequest, res) => {
  const db = getDb();
  if (req.sessionTokenHash) {
    db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(req.sessionTokenHash);
  }
  if (req.adminUser) {
    writeAuditLog(db, {
      actorUserId: req.adminUser.id,
      actorEmail: req.adminUser.email,
      actorRole: req.adminUser.role,
      action: 'LEADERSHIP_LOGOUT',
      resourceType: 'leadership_sessions',
      resourceId: req.adminUser.id,
      ipAddress: getClientIp(req),
    });
  }
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

leadershipAuthRouter.get('/me', requireAuth, (req: AdminRequest, res) => {
  if (!req.adminUser || !canAccessLeadershipPortal(req.adminUser.role, req.adminUser.leadershipRole)) {
    res.status(403).json({
      error: 'Private Leadership Portal access is restricted to authorised leadership accounts.',
    });
    return;
  }
  res.json({ user: req.adminUser });
});

const passwordConfirmSchema = z.object({
  currentPassword: z.string().min(1),
});

leadershipAuthRouter.post(
  '/mfa/setup',
  requireAuth,
  requireLeadershipAccess,
  leadershipAuthLimiter,
  async (req: AdminRequest, res) => {
    const parsed = passwordConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Current password is required to configure 2FA.' });
      return;
    }

    const db = getDb();
    const row = db
      .prepare('SELECT password_hash, email FROM admin_users WHERE id = ?')
      .get(req.adminUser!.id) as { password_hash: string; email: string } | undefined;

    if (!row || !verifyPassword(parsed.data.currentPassword, row.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const secret = generateBase32Secret(20);
    const otpauthUri = buildOtpAuthUri(row.email, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUri, { width: 200, margin: 1 });

    db.prepare(`
      UPDATE admin_users
      SET pending_mfa_secret_enc = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(encryptSecret(secret), req.adminUser!.id);

    res.json({
      secret,
      otpauthUri,
      qrDataUrl,
    });
  }
);

const mfaEnableSchema = z.object({
  totpCode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit authenticator code.'),
});

leadershipAuthRouter.post(
  '/mfa/enable',
  requireAuth,
  requireLeadershipAccess,
  leadershipAuthLimiter,
  (req: AdminRequest, res) => {
    const parsed = mfaEnableSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid verification code.' });
      return;
    }

    const db = getDb();
    const row = db
      .prepare('SELECT pending_mfa_secret_enc FROM admin_users WHERE id = ?')
      .get(req.adminUser!.id) as { pending_mfa_secret_enc: string } | undefined;

    const secret = row?.pending_mfa_secret_enc ? decryptSecret(row.pending_mfa_secret_enc) : '';
    if (!secret) {
      res.status(400).json({ error: 'No pending two-factor setup found. Start setup again.' });
      return;
    }

    if (!verifyTotpCode(secret, parsed.data.totpCode)) {
      res.status(400).json({ error: 'Verification code did not match. Please check your authenticator clock.' });
      return;
    }

    db.prepare(`
      UPDATE admin_users
      SET mfa_enabled = 1, mfa_secret_enc = pending_mfa_secret_enc, pending_mfa_secret_enc = '', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.adminUser!.id);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'LEADERSHIP_MFA_ENABLED',
      resourceType: 'admin_users',
      resourceId: req.adminUser!.id,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, mfaEnabled: true });
  }
);

leadershipAuthRouter.post(
  '/mfa/disable',
  requireAuth,
  requireLeadershipAccess,
  leadershipAuthLimiter,
  (req: AdminRequest, res) => {
    const parsed = passwordConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Current password is required to disable 2FA.' });
      return;
    }

    const db = getDb();
    const row = db
      .prepare('SELECT password_hash FROM admin_users WHERE id = ?')
      .get(req.adminUser!.id) as { password_hash: string } | undefined;

    if (!row || !verifyPassword(parsed.data.currentPassword, row.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    db.prepare(`
      UPDATE admin_users
      SET mfa_enabled = 0, mfa_secret_enc = '', pending_mfa_secret_enc = '', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.adminUser!.id);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'LEADERSHIP_MFA_DISABLED',
      resourceType: 'admin_users',
      resourceId: req.adminUser!.id,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, mfaEnabled: false });
  }
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
});

leadershipAuthRouter.post(
  '/change-password',
  requireAuth,
  requireLeadershipAccess,
  leadershipAuthLimiter,
  (req: AdminRequest, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Current and new password are required.' });
      return;
    }

    const strength = isStrongPassword(parsed.data.newPassword);
    if (!strength.valid) {
      res.status(400).json({ error: strength.reason });
      return;
    }

    const db = getDb();
    const row = db
      .prepare('SELECT password_hash FROM admin_users WHERE id = ?')
      .get(req.adminUser!.id) as { password_hash: string } | undefined;

    if (!row || !verifyPassword(parsed.data.currentPassword, row.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    db.prepare(`
      UPDATE admin_users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(hashPassword(parsed.data.newPassword), req.adminUser!.id);

    // Revoke all other active sessions except current one
    if (req.sessionTokenHash) {
      db.prepare('DELETE FROM admin_sessions WHERE user_id = ? AND token_hash != ?').run(
        req.adminUser!.id,
        req.sessionTokenHash
      );
    }

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'LEADERSHIP_PASSWORD_CHANGED',
      resourceType: 'admin_users',
      resourceId: req.adminUser!.id,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, message: 'Password updated and other active sessions revoked.' });
  }
);
