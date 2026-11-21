import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.ts';
import { getDb } from '../db/database.ts';
import {
  ALL_PERMISSIONS,
  getEffectivePermissions,
  hashPassword,
  isStrongPassword,
  resolveLeadershipRole,
  writeAuditLog,
  type AdminRole,
  type PermissionKey,
} from '../auth/security.ts';
import {
  getClientIp,
  requireAuth,
  requireLeadershipAccess,
  requirePermission,
  requireRole,
  type AdminRequest,
} from '../middleware/auth.ts';

export const leadershipRouter = Router();

leadershipRouter.use(requireAuth, requireLeadershipAccess);

fs.mkdirSync(env.leadershipDocsDir, { recursive: true });

const ALLOWED_DOC_MIMES: Record<string, string> = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'text/csv': '.csv',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_DOC_MIMES[file.mimetype]) {
      cb(new Error('Allowed confidential attachments: PDF, TXT, MD, CSV, PNG, JPEG, or WebP.'));
      return;
    }
    cb(null, true);
  },
});

// 1. Executive Company Overview
leadershipRouter.get('/overview', requirePermission('leadership.overview'), (req: AdminRequest, res) => {
  const db = getDb();
  const perms = new Set(req.adminUser!.permissions);
  const isSuper = req.adminUser!.role === 'super_admin';

  const workSummary = db
    .prepare(`
      SELECT domain, status, COUNT(*) as count
      FROM leadership_work_items
      GROUP BY domain, status
    `)
    .all() as { domain: string; status: string; count: number }[];

  const reportsCount = (
    db.prepare('SELECT COUNT(*) as c FROM leadership_reports').get() as { c: number }
  ).c;
  const documentsCount = (
    db.prepare('SELECT COUNT(*) as c FROM leadership_documents').get() as { c: number }
  ).c;
  const publishedArticles = (
    db.prepare("SELECT COUNT(*) as c FROM articles WHERE status = 'published'").get() as { c: number }
  ).c;
  const activeAnnouncements = (
    db.prepare("SELECT COUNT(*) as c FROM announcements WHERE status IN ('published', 'scheduled')").get() as {
      c: number;
    }
  ).c;
  const pendingEnquiries = (
    db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'pending'").get() as { c: number }
  ).c;
  const partnershipEnquiries = (
    db
      .prepare("SELECT COUNT(*) as c FROM enquiries WHERE type IN ('business', 'partnership') AND status IN ('pending', 'in_review')")
      .get() as { c: number }
  ).c;

  const recentWorkItems = db
    .prepare(`
      SELECT id, domain, title, category, owner_name, priority, status, progress_pct, updated_at
      FROM leadership_work_items
      ORDER BY datetime(updated_at) DESC
      LIMIT 6
    `)
    .all();

  const recentReports =
    isSuper || perms.has('leadership.reports.read')
      ? db
          .prepare(`
            SELECT id, title, report_type, period_label, author_name, status, updated_at
            FROM leadership_reports
            ORDER BY datetime(updated_at) DESC
            LIMIT 4
          `)
          .all()
      : [];

  const recentAudit = db
    .prepare(`
      SELECT id, actor_email, actor_role, action, resource_type, resource_id, details_json, ip_address, created_at
      FROM audit_logs
      ORDER BY datetime(created_at) DESC
      LIMIT 10
    `)
    .all();

  res.json({
    metrics: {
      reportsCount,
      documentsCount,
      publishedArticles,
      activeAnnouncements,
      pendingEnquiries,
      partnershipEnquiries,
      workSummary,
    },
    recentWorkItems,
    recentReports,
    recentAudit,
  });
});

// 2. Product & Development Progress / Marketing & Promotions / App Testing & Feature Updates
const WORK_DOMAIN_PERM: Record<'product' | 'marketing' | 'testing', { read: PermissionKey; write: PermissionKey }> = {
  product: { read: 'leadership.product.read', write: 'leadership.product.write' },
  marketing: { read: 'leadership.marketing.read', write: 'leadership.marketing.write' },
  testing: { read: 'leadership.testing.read', write: 'leadership.testing.write' },
};

leadershipRouter.get('/work-items', (req: AdminRequest, res) => {
  const domain = typeof req.query.domain === 'string' ? req.query.domain.trim() : '';
  if (domain !== 'product' && domain !== 'marketing' && domain !== 'testing') {
    res.status(400).json({ error: 'Valid domain (product, marketing, or testing) is required.' });
    return;
  }

  const requiredPerm = WORK_DOMAIN_PERM[domain].read;
  if (req.adminUser!.role !== 'super_admin' && !req.adminUser!.permissions.includes(requiredPerm)) {
    res.status(403).json({ error: `Missing permission: ${requiredPerm}` });
    return;
  }

  const db = getDb();
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const where = status && status !== 'all' ? 'WHERE domain = ? AND status = ?' : 'WHERE domain = ?';
  const params = status && status !== 'all' ? [domain, status] : [domain];

  const items = db
    .prepare(`
      SELECT * FROM leadership_work_items
      ${where}
      ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        datetime(updated_at) DESC
    `)
    .all(...params);

  res.json({ items });
});

const workItemSchema = z.object({
  domain: z.enum(['product', 'marketing', 'testing']),
  title: z.string().trim().min(3).max(200),
  category: z.string().trim().max(100).optional().default(''),
  summary: z.string().trim().max(2000).optional().default(''),
  ownerName: z.string().trim().max(120).optional().default(''),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  status: z.enum(['planned', 'in_progress', 'in_review', 'completed', 'blocked']).optional().default('planned'),
  progressPct: z.number().int().min(0).max(100).optional().default(0),
  targetDate: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(4000).optional().default(''),
});

leadershipRouter.post('/work-items', (req: AdminRequest, res) => {
  const parsed = workItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid work item data.' });
    return;
  }

  const d = parsed.data;
  const requiredPerm = WORK_DOMAIN_PERM[d.domain].write;
  if (req.adminUser!.role !== 'super_admin' && !req.adminUser!.permissions.includes(requiredPerm)) {
    res.status(403).json({ error: `Missing permission: ${requiredPerm}` });
    return;
  }

  const id = `lw-${crypto.randomUUID().slice(0, 12)}`;
  const db = getDb();
  db.prepare(`
    INSERT INTO leadership_work_items (
      id, domain, title, category, summary, owner_name, priority, status, progress_pct, target_date, notes, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    d.domain,
    d.title,
    d.category,
    d.summary,
    d.ownerName || req.adminUser!.name,
    d.priority,
    d.status,
    d.progressPct,
    d.targetDate || null,
    d.notes,
    req.adminUser!.email,
    req.adminUser!.email
  );

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: `LEADERSHIP_${d.domain.toUpperCase()}_ITEM_CREATED`,
    resourceType: 'leadership_work_items',
    resourceId: id,
    details: { title: d.title },
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ id });
});

leadershipRouter.put('/work-items/:id', (req: AdminRequest, res) => {
  const db = getDb();
  const existing = db
    .prepare('SELECT id, domain FROM leadership_work_items WHERE id = ?')
    .get(req.params.id) as { id: string; domain: 'product' | 'marketing' | 'testing' } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Leadership tracker item not found.' });
    return;
  }

  const requiredPerm = WORK_DOMAIN_PERM[existing.domain].write;
  if (req.adminUser!.role !== 'super_admin' && !req.adminUser!.permissions.includes(requiredPerm)) {
    res.status(403).json({ error: `Missing permission: ${requiredPerm}` });
    return;
  }

  const parsed = workItemSchema.safeParse({ ...req.body, domain: existing.domain });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid update payload.' });
    return;
  }

  const d = parsed.data;
  db.prepare(`
    UPDATE leadership_work_items
    SET title = ?, category = ?, summary = ?, owner_name = ?, priority = ?, status = ?,
        progress_pct = ?, target_date = ?, notes = ?, updated_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    d.title,
    d.category,
    d.summary,
    d.ownerName || req.adminUser!.name,
    d.priority,
    d.status,
    d.progressPct,
    d.targetDate || null,
    d.notes,
    req.adminUser!.email,
    req.params.id
  );

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: `LEADERSHIP_${existing.domain.toUpperCase()}_ITEM_UPDATED`,
    resourceType: 'leadership_work_items',
    resourceId: req.params.id,
    details: { title: d.title, status: d.status },
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});

leadershipRouter.delete('/work-items/:id', (req: AdminRequest, res) => {
  const db = getDb();
  const existing = db
    .prepare('SELECT id, domain, title FROM leadership_work_items WHERE id = ?')
    .get(req.params.id) as { id: string; domain: 'product' | 'marketing' | 'testing'; title: string } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }

  const requiredPerm = WORK_DOMAIN_PERM[existing.domain].write;
  if (req.adminUser!.role !== 'super_admin' && !req.adminUser!.permissions.includes(requiredPerm)) {
    res.status(403).json({ error: `Missing permission: ${requiredPerm}` });
    return;
  }

  db.prepare('DELETE FROM leadership_work_items WHERE id = ?').run(req.params.id);

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: `LEADERSHIP_${existing.domain.toUpperCase()}_ITEM_DELETED`,
    resourceType: 'leadership_work_items',
    resourceId: req.params.id,
    details: { title: existing.title },
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});

// 3. Business Reports
leadershipRouter.get('/reports', requirePermission('leadership.reports.read'), (_req, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM leadership_reports ORDER BY datetime(updated_at) DESC')
    .all() as any[];

  res.json({
    items: rows.map((r) => ({
      ...r,
      metrics: JSON.parse(r.metrics_json || '[]'),
    })),
  });
});

const reportSchema = z.object({
  title: z.string().trim().min(3).max(200),
  reportType: z.enum([
    'executive_summary',
    'operations',
    'merchant_growth',
    'financial',
    'product_metrics',
  ]),
  periodLabel: z.string().trim().max(80).optional().default(''),
  summary: z.string().trim().min(5).max(5000),
  metrics: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(80),
        note: z.string().trim().max(140).optional().default(''),
      })
    )
    .max(12)
    .optional()
    .default([]),
  highlights: z.string().trim().max(8000).optional().default(''),
  authorName: z.string().trim().max(120).optional().default(''),
  status: z.enum(['draft', 'final']).optional().default('final'),
});

leadershipRouter.post('/reports', requirePermission('leadership.reports.write'), (req: AdminRequest, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid report payload.' });
    return;
  }

  const d = parsed.data;
  const id = `rep-${crypto.randomUUID().slice(0, 12)}`;
  const db = getDb();

  db.prepare(`
    INSERT INTO leadership_reports (
      id, title, report_type, period_label, summary, metrics_json, highlights, author_name, status, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    d.title,
    d.reportType,
    d.periodLabel,
    d.summary,
    JSON.stringify(d.metrics),
    d.highlights,
    d.authorName || req.adminUser!.name,
    d.status,
    req.adminUser!.email,
    req.adminUser!.email
  );

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: 'LEADERSHIP_REPORT_CREATED',
    resourceType: 'leadership_reports',
    resourceId: id,
    details: { title: d.title },
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ id });
});

leadershipRouter.put('/reports/:id', requirePermission('leadership.reports.write'), (req: AdminRequest, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid report payload.' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM leadership_reports WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  const d = parsed.data;
  db.prepare(`
    UPDATE leadership_reports
    SET title = ?, report_type = ?, period_label = ?, summary = ?, metrics_json = ?,
        highlights = ?, author_name = ?, status = ?, updated_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    d.title,
    d.reportType,
    d.periodLabel,
    d.summary,
    JSON.stringify(d.metrics),
    d.highlights,
    d.authorName || req.adminUser!.name,
    d.status,
    req.adminUser!.email,
    req.params.id
  );

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: 'LEADERSHIP_REPORT_UPDATED',
    resourceType: 'leadership_reports',
    resourceId: req.params.id,
    details: { title: d.title },
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});

leadershipRouter.delete('/reports/:id', requirePermission('leadership.reports.write'), (req: AdminRequest, res) => {
  const db = getDb();
  const existing = db
    .prepare('SELECT title FROM leadership_reports WHERE id = ?')
    .get(req.params.id) as { title: string } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  db.prepare('DELETE FROM leadership_reports WHERE id = ?').run(req.params.id);

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: 'LEADERSHIP_REPORT_DELETED',
    resourceType: 'leadership_reports',
    resourceId: req.params.id,
    details: { title: existing.title },
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});

// 4. Confidential Company Documents (Strictly protected behind auth; never publicly exposed)
leadershipRouter.get('/documents', requirePermission('leadership.documents.read'), (_req, res) => {
  const db = getDb();
  const items = db
    .prepare('SELECT * FROM leadership_documents ORDER BY datetime(updated_at) DESC')
    .all();
  res.json({ items });
});

const documentSchema = z.object({
  title: z.string().trim().min(3).max(200),
  category: z.enum([
    'governance',
    'strategy',
    'product_spec',
    'marketing_plan',
    'legal_compliance',
    'financial',
    'meeting_notes',
  ]),
  summary: z.string().trim().max(1000).optional().default(''),
  content: z.string().trim().max(25000).optional().default(''),
  classification: z.enum(['leadership_only', 'executive_confidential']).optional().default('leadership_only'),
});

leadershipRouter.post(
  '/documents',
  requirePermission('leadership.documents.write'),
  docUpload.single('file'),
  (req: AdminRequest, res) => {
    const parsed = documentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid document details.' });
      return;
    }

    let attachmentFilename = '';
    let attachmentOriginalName = '';
    let attachmentMime = '';
    let attachmentSize = 0;

    if (req.file) {
      const ext = ALLOWED_DOC_MIMES[req.file.mimetype] || '.bin';
      attachmentFilename = `${crypto.randomUUID()}${ext}`;
      attachmentOriginalName = req.file.originalname.slice(0, 160);
      attachmentMime = req.file.mimetype;
      attachmentSize = req.file.size;
      fs.writeFileSync(path.join(env.leadershipDocsDir, attachmentFilename), req.file.buffer);
    }

    const id = `doc-${crypto.randomUUID().slice(0, 12)}`;
    const d = parsed.data;
    const db = getDb();

    db.prepare(`
      INSERT INTO leadership_documents (
        id, title, category, summary, content, attachment_filename, attachment_original_name,
        attachment_mime, attachment_size, classification, uploaded_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      d.title,
      d.category,
      d.summary,
      d.content,
      attachmentFilename,
      attachmentOriginalName,
      attachmentMime,
      attachmentSize,
      d.classification,
      req.adminUser!.email,
      req.adminUser!.email
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'LEADERSHIP_DOCUMENT_CREATED',
      resourceType: 'leadership_documents',
      resourceId: id,
      details: { title: d.title, hasAttachment: Boolean(attachmentFilename) },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({ id });
  }
);

leadershipRouter.get(
  '/documents/:id/download',
  requirePermission('leadership.documents.read'),
  (req: AdminRequest, res) => {
    const db = getDb();
    const doc = db
      .prepare('SELECT * FROM leadership_documents WHERE id = ?')
      .get(req.params.id) as any;

    if (!doc || !doc.attachment_filename) {
      res.status(404).json({ error: 'Document attachment not found.' });
      return;
    }

    const safeBase = path.basename(doc.attachment_filename);
    const fullPath = path.join(env.leadershipDocsDir, safeBase);
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Stored attachment file missing on disk.' });
      return;
    }

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'LEADERSHIP_DOCUMENT_DOWNLOADED',
      resourceType: 'leadership_documents',
      resourceId: req.params.id,
      ipAddress: getClientIp(req),
    });

    res.download(fullPath, doc.attachment_original_name || safeBase);
  }
);

leadershipRouter.delete(
  '/documents/:id',
  requirePermission('leadership.documents.write'),
  (req: AdminRequest, res) => {
    const db = getDb();
    const doc = db
      .prepare('SELECT title, attachment_filename FROM leadership_documents WHERE id = ?')
      .get(req.params.id) as { title: string; attachment_filename: string } | undefined;

    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    if (doc.attachment_filename) {
      const fullPath = path.join(env.leadershipDocsDir, path.basename(doc.attachment_filename));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    db.prepare('DELETE FROM leadership_documents WHERE id = ?').run(req.params.id);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'LEADERSHIP_DOCUMENT_DELETED',
      resourceType: 'leadership_documents',
      resourceId: req.params.id,
      details: { title: doc.title },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true });
  }
);

// 5. Login History & Security Audit (Super Admin sees all; Leadership sees own sign-in attempts)
leadershipRouter.get('/login-history', (req: AdminRequest, res) => {
  const db = getDb();
  const isSuper = req.adminUser!.role === 'super_admin';
  const rows = isSuper
    ? db
        .prepare(`
          SELECT id, actor_user_id, actor_email, actor_role, action, details_json, ip_address, created_at
          FROM audit_logs
          WHERE action LIKE '%LOGIN%' OR action LIKE '%LOGOUT%' OR action LIKE '%MFA%' OR action LIKE '%PASSWORD%'
          ORDER BY datetime(created_at) DESC
          LIMIT 40
        `)
        .all()
    : db
        .prepare(`
          SELECT id, actor_user_id, actor_email, actor_role, action, details_json, ip_address, created_at
          FROM audit_logs
          WHERE (actor_user_id = ? OR actor_email = ?)
            AND (action LIKE '%LOGIN%' OR action LIKE '%LOGOUT%' OR action LIKE '%MFA%' OR action LIKE '%PASSWORD%')
          ORDER BY datetime(created_at) DESC
          LIMIT 25
        `)
        .all(req.adminUser!.id, req.adminUser!.email);

  res.json({ items: rows });
});

// 6. Leadership Role & Permission Management (Super Admin ONLY)
leadershipRouter.get('/team', requireRole(['super_admin']), (_req, res) => {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT id, name, email, role, leadership_role, custom_permissions, permissions_json, mfa_enabled, is_active, last_login_at, created_at
      FROM admin_users
      ORDER BY created_at ASC
    `)
    .all() as any[];

  res.json({
    availablePermissions: ALL_PERMISSIONS,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      leadershipRole: resolveLeadershipRole(r.role, r.leadership_role),
      customPermissions: r.custom_permissions === 1,
      permissions: getEffectivePermissions(r.role, r.custom_permissions, r.permissions_json),
      mfaEnabled: r.mfa_enabled === 1,
      isActive: r.is_active === 1,
      lastLoginAt: r.last_login_at,
      createdAt: r.created_at,
    })),
  });
});

const createTeamUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  password: z.string().min(10).max(128),
  role: z.enum([
    'super_admin',
    'founder',
    'ceo',
    'director',
    'executive',
    'administrator',
    'content_manager',
    'support_manager',
  ]),
  leadershipRole: z
    .enum(['super_admin', 'founder', 'ceo', 'director', 'executive', 'administrator', 'none'])
    .optional(),
});

leadershipRouter.post('/team', requireRole(['super_admin']), (req: AdminRequest, res) => {
  const parsed = createTeamUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid account details.' });
    return;
  }

  const strength = isStrongPassword(parsed.data.password);
  if (!strength.valid) {
    res.status(400).json({ error: strength.reason });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  if (db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email)) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const id = crypto.randomUUID();
  const defaultLeadershipForSuper = parsed.data.role === 'super_admin' ? 'super_admin' : 'none';
  const effectiveLeadershipRole = resolveLeadershipRole(
    parsed.data.role,
    parsed.data.leadershipRole || defaultLeadershipForSuper
  );

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
    action: 'LEADERSHIP_ACCOUNT_CREATED',
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
    leadershipRole: effectiveLeadershipRole,
  });
});

const patchTeamUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z
    .enum([
      'super_admin',
      'founder',
      'ceo',
      'director',
      'executive',
      'administrator',
      'content_manager',
      'support_manager',
    ])
    .optional(),
  leadershipRole: z
    .enum(['super_admin', 'founder', 'ceo', 'director', 'executive', 'administrator', 'none'])
    .optional(),
  customPermissions: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

leadershipRouter.patch('/team/:id', requireRole(['super_admin']), (req: AdminRequest, res) => {
  const parsed = patchTeamUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid account update payload.' });
    return;
  }

  const db = getDb();
  const target = db
    .prepare('SELECT id, name, email, role, leadership_role, custom_permissions, permissions_json, is_active FROM admin_users WHERE id = ?')
    .get(req.params.id) as
    | {
        id: string;
        name: string;
        email: string;
        role: AdminRole;
        leadership_role: string;
        custom_permissions: number;
        permissions_json: string;
        is_active: number;
      }
    | undefined;

  if (!target) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  if (
    target.id === req.adminUser!.id &&
    (parsed.data.isActive === false || (parsed.data.role && parsed.data.role !== 'super_admin'))
  ) {
    res.status(400).json({ error: 'Cannot demote or deactivate your own active Super Admin session.' });
    return;
  }

  const nextName = parsed.data.name ?? target.name;
  const nextRole = (parsed.data.role ?? target.role) as AdminRole;
  const nextLeadershipRole = resolveLeadershipRole(
    nextRole,
    parsed.data.leadershipRole ?? target.leadership_role
  );
  const nextCustom =
    parsed.data.customPermissions !== undefined
      ? parsed.data.customPermissions
        ? 1
        : 0
      : target.custom_permissions;

  const filteredPermissions = parsed.data.permissions
    ? parsed.data.permissions.filter(
        (p) => p !== 'system.admin' && (ALL_PERMISSIONS as readonly string[]).includes(p)
      )
    : JSON.parse(target.permissions_json || '[]');

  const nextActive =
    parsed.data.isActive !== undefined ? (parsed.data.isActive ? 1 : 0) : target.is_active;

  db.prepare(`
    UPDATE admin_users
    SET name = ?, role = ?, leadership_role = ?, custom_permissions = ?, permissions_json = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    nextName,
    nextRole,
    nextLeadershipRole,
    nextCustom,
    JSON.stringify(filteredPermissions),
    nextActive,
    req.params.id
  );

  if (nextActive === 0) {
    db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').run(req.params.id);
  }

  writeAuditLog(db, {
    actorUserId: req.adminUser!.id,
    actorEmail: req.adminUser!.email,
    actorRole: req.adminUser!.role,
    action: 'LEADERSHIP_PERMISSIONS_UPDATED',
    resourceType: 'admin_users',
    resourceId: req.params.id,
    details: {
      email: target.email,
      nextName,
      nextRole,
      nextLeadershipRole,
      nextCustom: nextCustom === 1,
      nextActive,
    },
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
});
