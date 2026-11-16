import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { getDb } from '../db/database.ts';
import {
  canAccessLeadershipPortal,
  getEffectivePermissions,
  hashToken,
  resolveLeadershipRole,
  type AdminRole,
  type LeadershipRole,
  type PermissionKey,
} from '../auth/security.ts';

export const SESSION_COOKIE_NAME = 'maata_admin_session';

export function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const xfProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  if (xfProto.split(',').some((proto) => proto.trim() === 'https')) return true;
  const origin = String(req.headers.origin || '').toLowerCase();
  if (origin.startsWith('https://')) return true;
  const referer = String(req.headers.referer || '').toLowerCase();
  if (referer.startsWith('https://')) return true;
  return false;
}

export function getSessionCookieOptions(req: Request): CookieOptions & { partitioned?: boolean } {
  const https = isHttpsRequest(req);
  if (https) {
    return {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      partitioned: true,
      path: '/',
    };
  }
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  };
}

export function issueSessionCookie(req: Request, res: Response, rawToken: string): void {
  const maxAgeMs = env.sessionTtlHours * 60 * 60 * 1000;
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    ...getSessionCookieOptions(req),
    maxAge: maxAgeMs,
  });
}

export function clearSessionCookie(req: Request, res: Response): void {
  const opts = getSessionCookieOptions(req);
  res.clearCookie(SESSION_COOKIE_NAME, opts);
  // Also clear legacy unpartitioned cookie path in case one exists from an older build
  if (opts.sameSite === 'none') {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  }
}

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  leadershipRole: LeadershipRole;
  mfaEnabled: boolean;
  permissions: PermissionKey[];
}

export interface AdminRequest extends Request {
  adminUser?: AuthenticatedAdmin;
  sessionTokenHash?: string;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Sliding-window rate limiter to protect auth and public submission endpoints.
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message: string;
}) {
  const hits = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.path}:${getClientIp(req)}`;
    const now = Date.now();
    const cutoff = now - options.windowMs;
    const recent = (hits.get(key) || []).filter((t) => t > cutoff);

    if (recent.length >= options.maxRequests) {
      res.status(429).json({ error: options.message });
      return;
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

export function requireAuth(req: AdminRequest, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Cookie');

  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!rawToken || typeof rawToken !== 'string') {
    res.status(401).json({
      error: 'Authentication required. Please sign in to continue.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const db = getDb();
  const tokenHash = hashToken(rawToken);
  const row = db
    .prepare(`
      SELECT
        s.token_hash,
        s.expires_at,
        u.id,
        u.name,
        u.email,
        u.role,
        u.leadership_role,
        u.custom_permissions,
        u.permissions_json,
        u.mfa_enabled,
        u.is_active
      FROM admin_sessions s
      JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = ?
    `)
    .get(tokenHash) as
    | {
        token_hash: string;
        expires_at: string;
        id: string;
        name: string;
        email: string;
        role: AdminRole;
        leadership_role: string;
        custom_permissions: number;
        permissions_json: string;
        mfa_enabled: number;
        is_active: number;
      }
    | undefined;

  if (!row) {
    clearSessionCookie(req, res);
    res.status(401).json({
      error: 'Your session has expired or is no longer valid. Please sign in again.',
      code: 'SESSION_EXPIRED',
    });
    return;
  }

  if (Date.parse(row.expires_at) <= Date.now()) {
    db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
    clearSessionCookie(req, res);
    res.status(401).json({
      error: 'Your session has expired. Please sign in again.',
      code: 'SESSION_EXPIRED',
    });
    return;
  }

  if (row.is_active !== 1) {
    res.status(403).json({
      error: 'This account has been deactivated.',
      code: 'ACCOUNT_INACTIVE',
    });
    return;
  }

  req.adminUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    leadershipRole: resolveLeadershipRole(row.role, row.leadership_role),
    mfaEnabled: row.mfa_enabled === 1,
    permissions: getEffectivePermissions(row.role, row.custom_permissions, row.permissions_json),
  };
  req.sessionTokenHash = tokenHash;
  next();
}

export function requireRole(allowedRoles: readonly AdminRole[]) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.adminUser.role)) {
      res.status(403).json({
        error: 'Insufficient permissions for this action.',
        requiredRoles: allowedRoles,
        currentRole: req.adminUser.role,
      });
      return;
    }
    next();
  };
}

export function requireRoleOrPermission(
  allowedRoles: readonly AdminRole[],
  permission: PermissionKey
) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (
      allowedRoles.includes(req.adminUser.role) ||
      req.adminUser.permissions.includes(permission)
    ) {
      next();
      return;
    }
    res.status(403).json({
      error: 'Insufficient permissions for this action.',
      requiredPermission: permission,
      currentRole: req.adminUser.role,
    });
  };
}

export function requireLeadershipAccess(req: AdminRequest, res: Response, next: NextFunction): void {
  if (!req.adminUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (!canAccessLeadershipPortal(req.adminUser.role, req.adminUser.leadershipRole)) {
    res.status(403).json({
      error: 'Private Leadership Portal access is restricted to authorised leadership accounts.',
    });
    return;
  }
  next();
}

export function requirePermission(permission: PermissionKey) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (
      req.adminUser.role === 'super_admin' ||
      req.adminUser.permissions.includes(permission)
    ) {
      next();
      return;
    }
    res.status(403).json({
      error: `Missing required permission: ${permission}`,
    });
  };
}
