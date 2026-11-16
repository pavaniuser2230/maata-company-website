import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/database.ts';
import { writeAuditLog } from '../auth/security.ts';
import {
  getClientIp,
  requireAuth,
  requireRoleOrPermission,
  type AdminRequest,
} from '../middleware/auth.ts';

export const adminCmsRouter = Router();

adminCmsRouter.use(requireAuth);

// 1. Dashboard Overview (All authenticated roles; feedback list masked if content_manager)
adminCmsRouter.get('/overview', (req: AdminRequest, res) => {
  const db = getDb();
  const role = req.adminUser!.role;

  const publishedArticles = (
    db.prepare("SELECT COUNT(*) as c FROM articles WHERE status = 'published'").get() as {
      c: number;
    }
  ).c;
  const draftArticles = (
    db
      .prepare("SELECT COUNT(*) as c FROM articles WHERE status IN ('draft', 'scheduled', 'unpublished')")
      .get() as { c: number }
  ).c;
  const activeAnnouncements = (
    db.prepare("SELECT COUNT(*) as c FROM announcements WHERE status IN ('published', 'scheduled')").get() as {
      c: number;
    }
  ).c;
  const pendingEnquiries = (
    db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'pending'").get() as {
      c: number;
    }
  ).c;

  const recentActivity = db
    .prepare(`
      SELECT id, actor_email, actor_role, action, resource_type, resource_id, created_at
      FROM audit_logs
      ORDER BY datetime(created_at) DESC
      LIMIT 8
    `)
    .all();

  const canViewFeedback =
    role === 'super_admin' ||
    role === 'support_manager' ||
    req.adminUser!.permissions.includes('leadership.enquiries');
  const recentFeedback = canViewFeedback
    ? db
        .prepare(`
          SELECT id, type, full_name, subject_context, message, status, created_at
          FROM enquiries
          WHERE type = 'feedback'
          ORDER BY datetime(created_at) DESC
          LIMIT 5
        `)
        .all()
    : [];

  res.json({
    metrics: {
      publishedArticles,
      draftArticles,
      activeAnnouncements,
      pendingEnquiries,
    },
    recentActivity,
    recentFeedback,
    canViewFeedback,
  });
});

// 2. Company Content Management (Super Admin + Content Manager)
const COMPANY_KEYS = [
  'about',
  'story',
  'founders',
  'vision_mission',
  'journey',
  'careers',
  'contact',
] as const;

adminCmsRouter.get(
  '/company',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (_req, res) => {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT section_key, title, draft_json, published_json, status, updated_by, updated_at, published_at
        FROM company_sections
        ORDER BY section_key ASC
      `)
      .all() as any[];

    res.json({
      sections: rows.map((r) => ({
        sectionKey: r.section_key,
        title: r.title,
        draftData: JSON.parse(r.draft_json),
        publishedData: r.published_json ? JSON.parse(r.published_json) : null,
        status: r.status,
        updatedBy: r.updated_by,
        updatedAt: r.updated_at,
        publishedAt: r.published_at,
      })),
    });
  }
);

const updateSectionSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  data: z.unknown(),
});

adminCmsRouter.put(
  '/company/:key',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const key = req.params.key;
    if (!COMPANY_KEYS.includes(key as any)) {
      res.status(400).json({ error: 'Unknown company section key.' });
      return;
    }

    const parsed = updateSectionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid section payload.' });
      return;
    }

    const db = getDb();
    const existing = db
      .prepare('SELECT section_key, title FROM company_sections WHERE section_key = ?')
      .get(key) as { section_key: string; title: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Company section not found.' });
      return;
    }

    const nextTitle = parsed.data.title || existing.title;
    const draftJson = JSON.stringify(parsed.data.data);

    db.prepare(`
      UPDATE company_sections
      SET title = ?, draft_json = ?, updated_by = ?, updated_at = datetime('now')
      WHERE section_key = ?
    `).run(nextTitle, draftJson, req.adminUser!.email, key);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'COMPANY_SECTION_DRAFT_SAVED',
      resourceType: 'company_sections',
      resourceId: key,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, sectionKey: key });
  }
);

adminCmsRouter.post(
  '/company/:key/publish',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const key = req.params.key;
    const db = getDb();
    const row = db
      .prepare('SELECT draft_json FROM company_sections WHERE section_key = ?')
      .get(key) as { draft_json: string } | undefined;

    if (!row) {
      res.status(404).json({ error: 'Company section not found.' });
      return;
    }

    db.prepare(`
      UPDATE company_sections
      SET published_json = draft_json, status = 'published', updated_by = ?,
          updated_at = datetime('now'), published_at = datetime('now')
      WHERE section_key = ?
    `).run(req.adminUser!.email, key);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'COMPANY_SECTION_PUBLISHED',
      resourceType: 'company_sections',
      resourceId: key,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, status: 'published' });
  }
);

adminCmsRouter.post(
  '/company/:key/unpublish',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const key = req.params.key;
    const db = getDb();
    const result = db
      .prepare(`
        UPDATE company_sections
        SET status = 'draft', updated_by = ?, updated_at = datetime('now')
        WHERE section_key = ?
      `)
      .run(req.adminUser!.email, key);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Company section not found.' });
      return;
    }

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'COMPANY_SECTION_UNPUBLISHED',
      resourceType: 'company_sections',
      resourceId: key,
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, status: 'draft' });
  }
);

// 3. News & Articles CMS (Super Admin + Content Manager)
const articleSchema = z.object({
  title: z.string().trim().min(3).max(220),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  coverImageUrl: z.string().trim().max(500).optional().default(''),
  shortSummary: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20).max(50000),
  author: z.string().trim().min(2).max(120),
  category: z.enum([
    'Announcements',
    'Product Updates',
    'Company News',
    'Articles & Insights',
    'Featured Stories',
  ]),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  seoTitle: z.string().trim().max(180).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
  publishAt: z.string().trim().nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'unpublished']),
});

adminCmsRouter.get(
  '/articles',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req, res) => {
    const db = getDb();
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(title LIKE ? OR slug LIKE ? OR author LIKE ?)');
      const pat = `%${search}%`;
      params.push(pat, pat, pat);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (
      db.prepare(`SELECT COUNT(*) as c FROM articles ${where}`).get(...params) as { c: number }
    ).c;

    const rows = db
      .prepare(`
        SELECT * FROM articles ${where}
        ORDER BY datetime(updated_at) DESC
        LIMIT ? OFFSET ?
      `)
      .all(...params, limit, offset) as any[];

    res.json({
      items: rows.map((r) => ({
        ...r,
        tags: JSON.parse(r.tags_json || '[]'),
      })),
      total,
      page,
      limit,
    });
  }
);

adminCmsRouter.post(
  '/articles',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const parsed = articleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid article fields.' });
      return;
    }

    const data = parsed.data;
    const db = getDb();
    const slugTaken = db.prepare('SELECT id FROM articles WHERE slug = ?').get(data.slug);
    if (slugTaken) {
      res.status(409).json({ error: 'An article with this slug already exists.' });
      return;
    }

    const id = `art-${crypto.randomUUID().slice(0, 12)}`;
    const effectivePublishAt =
      data.status === 'published' && !data.publishAt
        ? new Date().toISOString()
        : data.publishAt || null;

    db.prepare(`
      INSERT INTO articles (
        id, title, slug, cover_image_url, short_summary, content, author, category,
        tags_json, seo_title, seo_description, publish_at, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.title,
      data.slug,
      data.coverImageUrl,
      data.shortSummary,
      data.content,
      data.author,
      data.category,
      JSON.stringify(data.tags),
      data.seoTitle,
      data.seoDescription,
      effectivePublishAt,
      data.status,
      req.adminUser!.email,
      req.adminUser!.email
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: `ARTICLE_CREATED_${data.status.toUpperCase()}`,
      resourceType: 'articles',
      resourceId: id,
      details: { title: data.title, slug: data.slug },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({ id, slug: data.slug, status: data.status });
  }
);

adminCmsRouter.put(
  '/articles/:id',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const parsed = articleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid article fields.' });
      return;
    }

    const data = parsed.data;
    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM articles WHERE id = ?')
      .get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    const slugCollision = db
      .prepare('SELECT id FROM articles WHERE slug = ? AND id != ?')
      .get(data.slug, req.params.id);
    if (slugCollision) {
      res.status(409).json({ error: 'Another article already uses this slug.' });
      return;
    }

    const effectivePublishAt =
      data.status === 'published' && !data.publishAt
        ? new Date().toISOString()
        : data.publishAt || null;

    db.prepare(`
      UPDATE articles
      SET title = ?, slug = ?, cover_image_url = ?, short_summary = ?, content = ?,
          author = ?, category = ?, tags_json = ?, seo_title = ?, seo_description = ?,
          publish_at = ?, status = ?, updated_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.title,
      data.slug,
      data.coverImageUrl,
      data.shortSummary,
      data.content,
      data.author,
      data.category,
      JSON.stringify(data.tags),
      data.seoTitle,
      data.seoDescription,
      effectivePublishAt,
      data.status,
      req.adminUser!.email,
      req.params.id
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: `ARTICLE_UPDATED_${data.status.toUpperCase()}`,
      resourceType: 'articles',
      resourceId: req.params.id,
      details: { title: data.title },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, id: req.params.id, status: data.status });
  }
);

adminCmsRouter.delete(
  '/articles/:id',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const db = getDb();
    const row = db
      .prepare('SELECT title FROM articles WHERE id = ?')
      .get(req.params.id) as { title: string } | undefined;

    if (!row) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'ARTICLE_DELETED',
      resourceType: 'articles',
      resourceId: req.params.id,
      details: { title: row.title },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true });
  }
);

// 4. Announcements, Product Updates & Website Notification Banners (Super Admin + Content Manager)
const announcementSchema = z.object({
  kind: z.enum([
    'company_announcement',
    'product_update',
    'new_feature',
    'service_notification',
    'important_notice',
  ]),
  title: z.string().trim().min(3).max(200),
  summary: z.string().trim().min(5).max(500),
  body: z.string().trim().max(10000).optional().default(''),
  imageUrl: z.string().trim().max(500).optional().default(''),
  isPinned: z.boolean().optional().default(false),
  visibility: z.enum(['public', 'hidden']).optional().default('public'),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  showAsBanner: z.boolean().optional().default(false),
  publishAt: z.string().trim().nullable().optional(),
  startsAt: z.string().trim().nullable().optional(),
  expiresAt: z.string().trim().nullable().optional(),
});

adminCmsRouter.get(
  '/announcements',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req, res) => {
    const db = getDb();
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const where = status && status !== 'all' ? 'WHERE status = ?' : '';
    const params = status && status !== 'all' ? [status] : [];

    const items = db
      .prepare(`
        SELECT * FROM announcements ${where}
        ORDER BY is_pinned DESC, datetime(updated_at) DESC
      `)
      .all(...params);

    res.json({ items });
  }
);

adminCmsRouter.post(
  '/announcements',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid announcement payload.' });
      return;
    }

    const d = parsed.data;
    const db = getDb();
    const id = `ann-${crypto.randomUUID().slice(0, 12)}`;
    const publishAt =
      d.status === 'published' && !d.publishAt ? new Date().toISOString() : d.publishAt || null;

    db.prepare(`
      INSERT INTO announcements (
        id, kind, title, summary, body, image_url, is_pinned, visibility, status,
        show_as_banner, publish_at, starts_at, expires_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      d.kind,
      d.title,
      d.summary,
      d.body,
      d.imageUrl,
      d.isPinned ? 1 : 0,
      d.visibility,
      d.status,
      d.showAsBanner ? 1 : 0,
      publishAt,
      d.startsAt || null,
      d.expiresAt || null,
      req.adminUser!.email,
      req.adminUser!.email
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: `ANNOUNCEMENT_CREATED_${d.status.toUpperCase()}`,
      resourceType: 'announcements',
      resourceId: id,
      details: { title: d.title, kind: d.kind },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({ id, status: d.status });
  }
);

adminCmsRouter.put(
  '/announcements/:id',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid announcement payload.' });
      return;
    }

    const d = parsed.data;
    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM announcements WHERE id = ?')
      .get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    const publishAt =
      d.status === 'published' && !d.publishAt ? new Date().toISOString() : d.publishAt || null;

    db.prepare(`
      UPDATE announcements
      SET kind = ?, title = ?, summary = ?, body = ?, image_url = ?, is_pinned = ?,
          visibility = ?, status = ?, show_as_banner = ?, publish_at = ?,
          starts_at = ?, expires_at = ?, updated_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      d.kind,
      d.title,
      d.summary,
      d.body,
      d.imageUrl,
      d.isPinned ? 1 : 0,
      d.visibility,
      d.status,
      d.showAsBanner ? 1 : 0,
      publishAt,
      d.startsAt || null,
      d.expiresAt || null,
      req.adminUser!.email,
      req.params.id
    );

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: `ANNOUNCEMENT_UPDATED_${d.status.toUpperCase()}`,
      resourceType: 'announcements',
      resourceId: req.params.id,
      details: { title: d.title },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, id: req.params.id });
  }
);

adminCmsRouter.delete(
  '/announcements/:id',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const db = getDb();
    const row = db
      .prepare('SELECT title FROM announcements WHERE id = ?')
      .get(req.params.id) as { title: string } | undefined;

    if (!row) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'ANNOUNCEMENT_DELETED',
      resourceType: 'announcements',
      resourceId: req.params.id,
      details: { title: row.title },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true });
  }
);

// 5. Multilingual CMS Translations (Super Admin + Content Manager)
const TRANSLATION_ENTITY_TYPES = ['company_section', 'article', 'announcement', 'media_asset'] as const;
const TRANSLATION_LOCALES = ['te', 'hi', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa'] as const;

type TranslationEntityType = (typeof TRANSLATION_ENTITY_TYPES)[number];
type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

function isValidEntityType(value: unknown): value is TranslationEntityType {
  return typeof value === 'string' && TRANSLATION_ENTITY_TYPES.includes(value as any);
}

function isValidTranslationLocale(value: unknown): value is TranslationLocale {
  return typeof value === 'string' && TRANSLATION_LOCALES.includes(value as any);
}

adminCmsRouter.get(
  '/translations/summary',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req, res) => {
    const entityType = req.query.entityType;
    if (!isValidEntityType(entityType)) {
      res.status(400).json({ error: 'Invalid translation entityType.' });
      return;
    }

    const db = getDb();
    const rows = db
      .prepare(`
        SELECT entity_id, locale, status
        FROM cms_translations
        WHERE entity_type = ?
      `)
      .all(entityType) as { entity_id: string; locale: string; status: 'draft' | 'published' }[];

    const summary: Record<
      string,
      {
        publishedCount: number;
        draftCount: number;
        publishedLocales: string[];
        draftLocales: string[];
      }
    > = {};

    for (const row of rows) {
      if (!summary[row.entity_id]) {
        summary[row.entity_id] = {
          publishedCount: 0,
          draftCount: 0,
          publishedLocales: [],
          draftLocales: [],
        };
      }
      if (row.status === 'published') {
        summary[row.entity_id].publishedCount += 1;
        summary[row.entity_id].publishedLocales.push(row.locale);
      } else {
        summary[row.entity_id].draftCount += 1;
        summary[row.entity_id].draftLocales.push(row.locale);
      }
    }

    res.json({ entityType, totalTargetLocales: TRANSLATION_LOCALES.length, summary });
  }
);

adminCmsRouter.get(
  '/translations',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req, res) => {
    const entityType = req.query.entityType;
    const entityId = typeof req.query.entityId === 'string' ? req.query.entityId.trim() : '';

    if (!isValidEntityType(entityType) || !entityId) {
      res.status(400).json({ error: 'Valid entityType and entityId are required.' });
      return;
    }

    const db = getDb();
    const rows = db
      .prepare(`
        SELECT locale, draft_json, published_json, status, updated_by, updated_at, published_at
        FROM cms_translations
        WHERE entity_type = ? AND entity_id = ?
      `)
      .all(entityType, entityId) as {
        locale: string;
        draft_json: string;
        published_json: string | null;
        status: 'draft' | 'published';
        updated_by: string | null;
        updated_at: string;
        published_at: string | null;
      }[];

    const translations: Record<string, unknown> = {};
    for (const row of rows) {
      let draftData: unknown = null;
      let publishedData: unknown = null;
      try {
        draftData = JSON.parse(row.draft_json);
      } catch {
        draftData = null;
      }
      try {
        publishedData = row.published_json ? JSON.parse(row.published_json) : null;
      } catch {
        publishedData = null;
      }
      translations[row.locale] = {
        locale: row.locale,
        draftData,
        publishedData,
        status: row.status,
        hasUnpublishedChanges:
          row.status === 'published' && row.published_json !== row.draft_json,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
        publishedAt: row.published_at,
      };
    }

    res.json({ entityType, entityId, translations });
  }
);

const translationDraftSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

adminCmsRouter.put(
  '/translations/:entityType/:entityId/:locale',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const { entityType, entityId, locale } = req.params;
    if (!isValidEntityType(entityType) || !entityId || !isValidTranslationLocale(locale)) {
      res.status(400).json({ error: 'Invalid translation target parameters.' });
      return;
    }

    const parsed = translationDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid translation data payload.' });
      return;
    }

    const db = getDb();
    const draftJson = JSON.stringify(parsed.data.data);

    db.prepare(`
      INSERT INTO cms_translations (
        entity_type, entity_id, locale, draft_json, published_json, status, updated_by, updated_at
      ) VALUES (?, ?, ?, ?, NULL, 'draft', ?, datetime('now'))
      ON CONFLICT(entity_type, entity_id, locale) DO UPDATE SET
        draft_json = excluded.draft_json,
        updated_by = excluded.updated_by,
        updated_at = datetime('now')
    `).run(entityType, entityId, locale, draftJson, req.adminUser!.email);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'TRANSLATION_DRAFT_SAVED',
      resourceType: 'cms_translations',
      resourceId: `${entityType}:${entityId}:${locale}`,
      details: { entityType, entityId, locale },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, entityType, entityId, locale });
  }
);

adminCmsRouter.post(
  '/translations/:entityType/:entityId/:locale/publish',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const { entityType, entityId, locale } = req.params;
    if (!isValidEntityType(entityType) || !entityId || !isValidTranslationLocale(locale)) {
      res.status(400).json({ error: 'Invalid translation target parameters.' });
      return;
    }

    const db = getDb();
    const existing = db
      .prepare(`
        SELECT draft_json
        FROM cms_translations
        WHERE entity_type = ? AND entity_id = ? AND locale = ?
      `)
      .get(entityType, entityId, locale) as { draft_json: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Save a translation draft before publishing.' });
      return;
    }

    db.prepare(`
      UPDATE cms_translations
      SET published_json = draft_json,
          status = 'published',
          updated_by = ?,
          updated_at = datetime('now'),
          published_at = datetime('now')
      WHERE entity_type = ? AND entity_id = ? AND locale = ?
    `).run(req.adminUser!.email, entityType, entityId, locale);

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'TRANSLATION_PUBLISHED',
      resourceType: 'cms_translations',
      resourceId: `${entityType}:${entityId}:${locale}`,
      details: { entityType, entityId, locale },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, status: 'published' });
  }
);

adminCmsRouter.post(
  '/translations/:entityType/:entityId/:locale/unpublish',
  requireRoleOrPermission(['super_admin', 'content_manager'], 'leadership.publishing'),
  (req: AdminRequest, res) => {
    const { entityType, entityId, locale } = req.params;
    if (!isValidEntityType(entityType) || !entityId || !isValidTranslationLocale(locale)) {
      res.status(400).json({ error: 'Invalid translation target parameters.' });
      return;
    }

    const db = getDb();
    const result = db
      .prepare(`
        UPDATE cms_translations
        SET status = 'draft',
            updated_by = ?,
            updated_at = datetime('now')
        WHERE entity_type = ? AND entity_id = ? AND locale = ?
      `)
      .run(req.adminUser!.email, entityType, entityId, locale);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Translation not found.' });
      return;
    }

    writeAuditLog(db, {
      actorUserId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'TRANSLATION_UNPUBLISHED',
      resourceType: 'cms_translations',
      resourceId: `${entityType}:${entityId}:${locale}`,
      details: { entityType, entityId, locale },
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, status: 'draft' });
  }
);

