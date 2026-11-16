import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.ts';
import { getDb } from '../db/database.ts';
import {
  resolveLeadershipRole,
  hashPassword,
  isStrongPassword,
  writeAuditLog,
} from '../auth/security.ts';
import {
  createRateLimiter,
  getClientIp,
  requireAuth,
  requireRole,
  requireRoleOrPermission,
  type AdminRequest,
} from '../middleware/auth.ts';

export const adminOpsRouter = Router();
adminOpsRouter.use(requireAuth);

fs.mkdirSync(env.mediaStorageDir, { recursive: true });

const uploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 40,
  message: 'Too many upload requests. Please try again shortly.',
});

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_EXTENSIONS[file.mimetype]) {
      cb(new Error('Only PNG, JPEG, and WebP images are permitted.'));
      return;
    }
    cb(null, true);
  },
});

function hasValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

// 1. Media Library (Super Admin + Content Manager)
adminOpsRouter.get(
  '/media',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req, res) => {
    const db = getDb();
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const conditions: string[] = [];
    const params: string[] = [];
    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(original_name LIKE ? OR alt_text LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const items = db
      .prepare(
        `SELECT * FROM media_assets ${where}
         ORDER BY CASE WHEN category = 'founder_gallery' THEN 0 ELSE 1 END,
                  display_order ASC, is_protected DESC, datetime(created_at) DESC`
      )
      .all(...params);

    res.json({ items });
  }
);

const MEDIA_CATEGORY_ENUM = z.enum([
  'company_logo',
  'founder_photo',
  'founder_gallery',
  'product_screenshot',
  'article_cover',
  'banner',
  'approved_media',
]);

const mediaMetaSchema = z.object({
  category: MEDIA_CATEGORY_ENUM,
  altText: z.string().trim().min(2, 'Alt text is required for accessibility').max(250),
  caption: z.string().trim().max(300).optional().default(''),
  focalPosition: z.string().trim().max(40).optional().default('50% 25%'),
  displayOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

adminOpsRouter.post(
  '/media',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  uploadLimiter,
  upload.single('file'),
  (req: AdminRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required.' });
      return;
    }

    if (!hasValidImageMagicBytes(req.file.buffer, req.file.mimetype)) {
      res.status(400).json({ error: 'Uploaded file signature does not match a valid image.' });
      return;
    }

    const parsed = mediaMetaSchema.safeParse({
      category: req.body?.category || 'approved_media',
      altText: req.body?.altText || req.file.originalname,
      caption: req.body?.caption ?? '',
      focalPosition: req.body?.focalPosition || '50% 25%',
      displayOrder:
        req.body?.displayOrder !== undefined && req.body?.displayOrder !== ''
          ? req.body.displayOrder
          : undefined,
    });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid media metadata.' });
      return;
    }

    const ext = ALLOWED_MIME_EXTENSIONS[req.file.mimetype];
    const filename = `${crypto.randomUUID()}${ext}`;
    const destPath = path.join(env.mediaStorageDir, filename);
    fs.writeFileSync(destPath, req.file.buffer);

    const id = `media-${crypto.randomUUID().slice(0, 12)}`;
    const url = `/media/${filename}`;
    const db = getDb();

    let displayOrder = parsed.data.displayOrder;
    if (displayOrder === undefined) {
      if (parsed.data.category === 'founder_gallery') {
        const maxRow = db
          .prepare("SELECT COALESCE(MAX(display_order), 0) as max_order FROM media_assets WHERE category = 'founder_gallery'")
          .get() as { max_order: number };
        displayOrder = Number(maxRow?.max_order || 0) + 1;
      } else {
        displayOrder = 0;
      }
    }

    db.prepare(`
      INSERT INTO media_assets (
        id, filename, original_name, mime_type, size_bytes, url, category,
        alt_text, focal_position, caption, display_order, is_protected, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      filename,
      req.file.originalname.slice(0, 160),
      req.file.mimetype,
      req.file.size,
      url,
      parsed.data.category,
      parsed.data.altText,
      parsed.data.focalPosition || '50% 25%',
      parsed.data.caption || '',
      displayOrder,
      req.adminUser!.email
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'MEDIA_UPLOADED',
      resourceType: 'media_assets',
      resourceId: id,
      details: { filename, category: parsed.data.category },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      id,
      url,
      filename,
      category: parsed.data.category,
      alt_text: parsed.data.altText,
      caption: parsed.data.caption,
      focal_position: parsed.data.focalPosition,
      display_order: displayOrder,
    });
  }
);

const mediaUpdateSchema = z.object({
  altText: z.string().trim().min(2).max(250),
  category: MEDIA_CATEGORY_ENUM,
  caption: z.string().trim().max(300).optional(),
  focalPosition: z.string().trim().max(40).optional(),
  displayOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

adminOpsRouter.put(
  '/media/:id',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const parsed = mediaUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid media metadata.' });
      return;
    }

    const db = getDb();
    const row = db
      .prepare('SELECT id, is_protected, category, caption, focal_position, display_order FROM media_assets WHERE id = ?')
      .get(req.params.id) as
      | {
          id: string;
          is_protected: number;
          category: string;
          caption: string;
          focal_position: string;
          display_order: number;
        }
      | undefined;

    if (!row) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }

    const nextCategory = row.is_protected === 1 ? row.category : parsed.data.category;
    const nextCaption = parsed.data.caption !== undefined ? parsed.data.caption : row.caption;
    const nextFocalPosition =
      parsed.data.focalPosition !== undefined && parsed.data.focalPosition !== ''
        ? parsed.data.focalPosition
        : row.focal_position;
    const nextDisplayOrder =
      parsed.data.displayOrder !== undefined ? parsed.data.displayOrder : row.display_order;

    db.prepare(`
      UPDATE media_assets
      SET alt_text = ?, category = ?, caption = ?, focal_position = ?, display_order = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      parsed.data.altText,
      nextCategory,
      nextCaption,
      nextFocalPosition,
      nextDisplayOrder,
      req.params.id
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'MEDIA_METADATA_UPDATED',
      resourceType: 'media_assets',
      resourceId: req.params.id,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true });
  }
);

adminOpsRouter.post(
  '/media/:id/replace',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  uploadLimiter,
  upload.single('file'),
  (req: AdminRequest, res) => {
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM media_assets WHERE id = ?')
      .get(req.params.id) as any;

    if (!existing) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }

    if (existing.is_protected === 1 && existing.category === 'company_logo') {
      res.status(403).json({
        error: 'The original MAATA logo is protected and cannot be overwritten from the CMS.',
      });
      return;
    }

    if (!req.file || !hasValidImageMagicBytes(req.file.buffer, req.file.mimetype)) {
      res.status(400).json({ error: 'A valid PNG, JPEG, or WebP replacement image is required.' });
      return;
    }

    const ext = ALLOWED_MIME_EXTENSIONS[req.file.mimetype];
    const nextFilename = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(env.mediaStorageDir, nextFilename), req.file.buffer);
    const nextUrl = `/media/${nextFilename}`;

    if (existing.url?.startsWith('/media/')) {
      const oldPath = path.join(env.mediaStorageDir, path.basename(existing.url));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    db.prepare(`
      UPDATE media_assets
      SET filename = ?, original_name = ?, mime_type = ?, size_bytes = ?, url = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      nextFilename,
      req.file.originalname.slice(0, 160),
      req.file.mimetype,
      req.file.size,
      nextUrl,
      req.params.id
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'MEDIA_REPLACED',
      resourceType: 'media_assets',
      resourceId: req.params.id,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, url: nextUrl });
  }
);

adminOpsRouter.delete(
  '/media/:id',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM media_assets WHERE id = ?')
      .get(req.params.id) as any;

    if (!row) {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }

    if (row.is_protected === 1) {
      res.status(403).json({
        error: 'Protected official MAATA brand assets cannot be deleted.',
      });
      return;
    }

    const inUseArticle = db
      .prepare('SELECT id FROM articles WHERE cover_image_url = ? LIMIT 1')
      .get(row.url);
    const inUseAnnouncement = db
      .prepare('SELECT id FROM announcements WHERE image_url = ? LIMIT 1')
      .get(row.url);

    if (inUseArticle || inUseAnnouncement) {
      res.status(409).json({
        error: 'This image is currently used by an article or announcement. Replace it there before deleting.',
      });
      return;
    }

    if (row.url?.startsWith('/media/')) {
      const filePath = path.join(env.mediaStorageDir, path.basename(row.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM media_assets WHERE id = ?').run(req.params.id);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'MEDIA_DELETED',
      resourceType: 'media_assets',
      resourceId: req.params.id,
      details: { originalName: row.original_name },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true });
  }
);

// 2. Enquiry & Feedback Management (Super Admin + Support Manager ONLY)
adminOpsRouter.get(
  '/enquiries',
  requireRoleOrPermission(['super_admin', 'support_manager'], 'leadership.enquiries'),
  (req, res) => {
    const db = getDb();
    const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR organisation LIKE ? OR message LIKE ? OR id LIKE ?)');
      const pat = `%${search}%`;
      params.push(pat, pat, pat, pat, pat);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (
      db.prepare(`SELECT COUNT(*) as c FROM enquiries ${where}`).get(...params) as { c: number }
    ).c;

    const items = db
      .prepare(`
        SELECT * FROM enquiries ${where}
        ORDER BY datetime(created_at) DESC
        LIMIT ? OFFSET ?
      `)
      .all(...params, limit, offset);

    res.json({ items, total, page, limit });
  }
);

adminOpsRouter.get(
  '/enquiries/export',
  requireRoleOrPermission(['super_admin', 'support_manager'], 'leadership.enquiries'),
  (req: AdminRequest, res) => {
    const db = getDb();
    const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';
    const where = type && type !== 'all' ? 'WHERE type = ?' : '';
    const params = type && type !== 'all' ? [type] : [];

    const rows = db
      .prepare(`
        SELECT id, type, full_name, email, organisation, subject_context, status, created_at, resolved_at
        FROM enquiries ${where}
        ORDER BY datetime(created_at) DESC
      `)
      .all(...params) as any[];

    const header = ['ID', 'Type', 'Name', 'Email', 'Organisation', 'Context', 'Status', 'Created At', 'Resolved At'];
    const csvLines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.id,
          r.type,
          r.full_name,
          r.email,
          r.organisation,
          r.subject_context,
          r.status,
          r.created_at,
          r.resolved_at || '',
        ]
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'ENQUIRIES_CSV_EXPORTED',
      resourceType: 'enquiries',
      details: { count: rows.length, filterType: type || 'all' },
      ipAddress: getClientIp(req),
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="maata-enquiries.csv"');
    res.send(csvLines.join('\n'));
  }
);

const updateEnquirySchema = z.object({
  status: z.enum(['pending', 'in_review', 'resolved', 'archived']),
  internalNotes: z.string().trim().max(4000).optional().default(''),
});

adminOpsRouter.patch(
  '/enquiries/:id',
  requireRoleOrPermission(['super_admin', 'support_manager'], 'leadership.enquiries'),
  (req: AdminRequest, res) => {
    const parsed = updateEnquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid enquiry update.' });
      return;
    }

    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM enquiries WHERE id = ?')
      .get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }

    const isResolved = parsed.data.status === 'resolved';
    db.prepare(`
      UPDATE enquiries
      SET status = ?, internal_notes = ?,
          resolved_by = CASE WHEN ? THEN ? ELSE resolved_by END,
          resolved_at = CASE WHEN ? THEN datetime('now') ELSE resolved_at END,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      parsed.data.status,
      parsed.data.internalNotes,
      isResolved ? 1 : 0,
      req.adminUser!.email,
      isResolved ? 1 : 0,
      req.params.id
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: `ENQUIRY_STATUS_${parsed.data.status.toUpperCase()}`,
      resourceType: 'enquiries',
      resourceId: req.params.id,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, status: parsed.data.status });
  }
);

// 3. Admin Users, Roles & Audit Logs (Super Admin ONLY)
adminOpsRouter.get('/users', requireRole(['super_admin']), (_req, res) => {
  const db = getDb();
  const users = db
    .prepare(`
      SELECT id, name, email, role, leadership_role, mfa_enabled, is_active, last_login_at, created_at, updated_at
      FROM admin_users
      ORDER BY created_at ASC
    `)
    .all();
  res.json({ items: users });
});

const createAdminUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  password: z.string().min(10).max(128),
  role: z.enum(['super_admin', 'founder', 'ceo', 'content_manager', 'support_manager']),
  leadershipRole: z.enum(['founder', 'ceo', 'none']).optional(),
});

adminOpsRouter.post('/users', requireRole(['super_admin']), (req: AdminRequest, res) => {
  const parsed = createAdminUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid user details.' });
    return;
  }

  const strength = isStrongPassword(parsed.data.password);
  if (!strength.valid) {
    res.status(400).json({ error: strength.reason });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  const exists = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email);
  if (exists) {
    res.status(409).json({ error: 'An administrator with this email already exists.' });
    return;
  }

  const effectiveLeadershipRole = resolveLeadershipRole(
    parsed.data.role,
    parsed.data.leadershipRole || 'none'
  );
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO admin_users (id, name, email, password_hash, role, leadership_role, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    parsed.data.name,
    email,
    hashPassword(parsed.data.password),
    parsed.data.role,
    effectiveLeadershipRole
  );

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: 'ADMIN_USER_CREATED',
    resourceType: 'admin_users',
    resourceId: id,
    details: { email, role: parsed.data.role, leadershipRole: effectiveLeadershipRole },
    ipAddress: getClientIp(req),
  });

  res.status(201).json({
    id,
    name: parsed.data.name,
    email,
    role: parsed.data.role,
    leadership_role: effectiveLeadershipRole,
    is_active: 1,
  });
});

const patchAdminUserSchema = z.object({
  role: z.enum(['super_admin', 'founder', 'ceo', 'content_manager', 'support_manager']).optional(),
  leadershipRole: z.enum(['founder', 'ceo', 'none']).optional(),
  isActive: z.boolean().optional(),
});

adminOpsRouter.patch('/users/:id', requireRole(['super_admin']), (req: AdminRequest, res) => {
  const parsed = patchAdminUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid user update payload.' });
    return;
  }

  const db = getDb();
  const target = db
    .prepare('SELECT id, email, role, leadership_role, is_active FROM admin_users WHERE id = ?')
    .get(req.params.id) as
    | { id: string; email: string; role: string; leadership_role: string; is_active: number }
    | undefined;

  if (!target) {
    res.status(404).json({ error: 'Administrator not found.' });
    return;
  }

  if (
    target.id === req.adminUser!.id &&
    (parsed.data.isActive === false ||
      (parsed.data.role && parsed.data.role !== 'super_admin'))
  ) {
    res.status(400).json({ error: 'You cannot deactivate or demote your own active Super Admin session.' });
    return;
  }

  const nextRole = (parsed.data.role ?? target.role) as any;
  const nextLeadershipRole = resolveLeadershipRole(
    nextRole,
    parsed.data.leadershipRole ?? target.leadership_role
  );
  const nextActive =
    parsed.data.isActive !== undefined ? (parsed.data.isActive ? 1 : 0) : target.is_active;

  db.prepare(`
    UPDATE admin_users
    SET role = ?, leadership_role = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(nextRole, nextLeadershipRole, nextActive, req.params.id);

  if (nextActive === 0) {
    db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').run(req.params.id);
  }

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: 'ADMIN_USER_UPDATED',
    resourceType: 'admin_users',
    resourceId: req.params.id,
    details: { email: target.email, nextRole, nextLeadershipRole, nextActive },
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true, role: nextRole, leadership_role: nextLeadershipRole, is_active: nextActive });
});

adminOpsRouter.get('/audit-logs', requireRole(['super_admin']), (req, res) => {
  const db = getDb();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 40)));
  const items = db
    .prepare(`
      SELECT * FROM audit_logs
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `)
    .all(limit);
  res.json({ items });
});
