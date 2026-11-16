import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/database.ts';
import { createRateLimiter } from '../middleware/auth.ts';

export const publicRouter = Router();

const TARGET_LOCALES = new Set(['te', 'hi', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa']);

function parseTargetLocale(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  return TARGET_LOCALES.has(trimmed) ? trimmed : null;
}

const enquiryLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 25,
  message: 'Too many submissions from this address. Please try again in a few minutes.',
});

const PUBLIC_ARTICLE_FILTER = `
  (status = 'published' OR (status = 'scheduled' AND publish_at IS NOT NULL AND datetime(publish_at) <= datetime('now')))
`;

const PUBLIC_ANNOUNCEMENT_FILTER = `
  visibility = 'public'
  AND (status = 'published' OR (status = 'scheduled' AND publish_at IS NOT NULL AND datetime(publish_at) <= datetime('now')))
  AND (starts_at IS NULL OR starts_at = '' OR datetime(starts_at) <= datetime('now'))
  AND (expires_at IS NULL OR expires_at = '' OR datetime(expires_at) > datetime('now'))
`;

function loadPublishedTranslationMap(
  locale: string,
  entityType: 'company_section' | 'article' | 'announcement' | 'media_asset'
): Record<string, any> {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT entity_id, published_json
      FROM cms_translations
      WHERE entity_type = ? AND locale = ? AND status = 'published' AND published_json IS NOT NULL
    `)
    .all(entityType, locale) as { entity_id: string; published_json: string }[];

  const map: Record<string, any> = {};
  for (const row of rows) {
    try {
      map[row.entity_id] = JSON.parse(row.published_json);
    } catch {
      // Ignore malformed translation payload
    }
  }
  return map;
}

function applyArticleTranslation(article: Record<string, unknown>, tr: any): Record<string, unknown> {
  if (!tr || typeof tr !== 'object') return article;
  return {
    ...article,
    title: typeof tr.title === 'string' && tr.title.trim() ? tr.title : article.title,
    short_summary:
      typeof tr.shortSummary === 'string' && tr.shortSummary.trim()
        ? tr.shortSummary
        : typeof tr.short_summary === 'string' && tr.short_summary.trim()
        ? tr.short_summary
        : article.short_summary,
    content: typeof tr.content === 'string' && tr.content.trim() ? tr.content : article.content,
    author: typeof tr.author === 'string' && tr.author.trim() ? tr.author : article.author,
    seo_title:
      typeof tr.seoTitle === 'string' && tr.seoTitle.trim()
        ? tr.seoTitle
        : article.seo_title,
    seo_description:
      typeof tr.seoDescription === 'string' && tr.seoDescription.trim()
        ? tr.seoDescription
        : article.seo_description,
    tags: Array.isArray(tr.tags) && tr.tags.length > 0 ? tr.tags.map(String) : article.tags,
  };
}

function applyAnnouncementTranslation(ann: Record<string, unknown>, tr: any): Record<string, unknown> {
  if (!tr || typeof tr !== 'object') return ann;
  return {
    ...ann,
    title: typeof tr.title === 'string' && tr.title.trim() ? tr.title : ann.title,
    summary: typeof tr.summary === 'string' && tr.summary.trim() ? tr.summary : ann.summary,
    body: typeof tr.body === 'string' && tr.body.trim() ? tr.body : ann.body,
  };
}

publicRouter.get('/bootstrap', (req, res) => {
  const db = getDb();
  const targetLocale = parseTargetLocale(req.query.lang);

  const sectionRows = db
    .prepare(`
      SELECT section_key, title, published_json, published_at
      FROM company_sections
      WHERE status = 'published' AND published_json IS NOT NULL
    `)
    .all() as {
      section_key: string;
      title: string;
      published_json: string;
      published_at: string | null;
    }[];

  const companySections: Record<string, unknown> = {};
  for (const row of sectionRows) {
    try {
      companySections[row.section_key] = JSON.parse(row.published_json);
    } catch {
      // Skip malformed entry safely
    }
  }

  const articles = db
    .prepare(`
      SELECT id, title, slug, cover_image_url, short_summary, content, author,
             category, tags_json, seo_title, seo_description, publish_at, updated_at
      FROM articles
      WHERE ${PUBLIC_ARTICLE_FILTER}
      ORDER BY datetime(COALESCE(publish_at, created_at)) DESC
      LIMIT 24
    `)
    .all() as Record<string, unknown>[];

  const announcements = db
    .prepare(`
      SELECT id, kind, title, summary, body, image_url, is_pinned, show_as_banner,
             publish_at, starts_at, expires_at
      FROM announcements
      WHERE ${PUBLIC_ANNOUNCEMENT_FILTER}
      ORDER BY is_pinned DESC, datetime(COALESCE(publish_at, created_at)) DESC
      LIMIT 20
    `)
    .all();

  const banners = announcements.filter((a: any) => Number(a.show_as_banner) === 1);

  const founderGallery = db
    .prepare(`
      SELECT id, url, original_name, alt_text, caption, focal_position, display_order
      FROM media_assets
      WHERE category = 'founder_gallery'
      ORDER BY display_order ASC, datetime(created_at) ASC
    `)
    .all();

  const translations = targetLocale
    ? {
        companySections: loadPublishedTranslationMap(targetLocale, 'company_section'),
        articles: loadPublishedTranslationMap(targetLocale, 'article'),
        announcements: loadPublishedTranslationMap(targetLocale, 'announcement'),
        mediaAssets: loadPublishedTranslationMap(targetLocale, 'media_asset'),
      }
    : {
        companySections: {},
        articles: {},
        announcements: {},
        mediaAssets: {},
      };

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    language: targetLocale || 'en',
    companySections,
    articles: articles.map((a) => ({
      ...a,
      tags: safeParseJsonArray(a.tags_json as string),
    })),
    announcements,
    banners,
    founderGallery,
    translations,
  });
});

publicRouter.get('/articles', (req, res) => {
  const db = getDb();
  const targetLocale = parseTargetLocale(req.query.lang);
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
  const offset = (page - 1) * limit;

  const conditions: string[] = [PUBLIC_ARTICLE_FILTER];
  const params: (string | number)[] = [];

  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(title LIKE ? OR short_summary LIKE ? OR content LIKE ? OR author LIKE ?)');
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const totalRow = db
    .prepare(`SELECT COUNT(*) as total FROM articles ${whereClause}`)
    .get(...params) as { total: number };

  const items = db
    .prepare(`
      SELECT id, title, slug, cover_image_url, short_summary, content, author,
             category, tags_json, seo_title, seo_description, publish_at, updated_at
      FROM articles
      ${whereClause}
      ORDER BY datetime(COALESCE(publish_at, created_at)) DESC
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset) as Record<string, unknown>[];

  const articleTranslations = targetLocale
    ? loadPublishedTranslationMap(targetLocale, 'article')
    : {};

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    items: items.map((a) => {
      const base = {
        ...a,
        tags: safeParseJsonArray(a.tags_json as string),
      };
      return targetLocale
        ? applyArticleTranslation(base, articleTranslations[String(a.id)])
        : base;
    }),
    total: totalRow.total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalRow.total / limit)),
  });
});

publicRouter.get('/articles/:slug', (req, res) => {
  const db = getDb();
  const targetLocale = parseTargetLocale(req.query.lang);
  const row = db
    .prepare(`
      SELECT id, title, slug, cover_image_url, short_summary, content, author,
             category, tags_json, seo_title, seo_description, publish_at, updated_at
      FROM articles
      WHERE slug = ? AND ${PUBLIC_ARTICLE_FILTER}
    `)
    .get(req.params.slug) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }

  const base = {
    ...row,
    tags: safeParseJsonArray(row.tags_json as string),
  };
  const articleTranslations = targetLocale
    ? loadPublishedTranslationMap(targetLocale, 'article')
    : {};

  res.setHeader('Cache-Control', 'no-store');
  res.json(
    targetLocale ? applyArticleTranslation(base, articleTranslations[String(row.id)]) : base
  );
});

publicRouter.get('/announcements', (req, res) => {
  const db = getDb();
  const targetLocale = parseTargetLocale(req.query.lang);
  const rows = db
    .prepare(`
      SELECT id, kind, title, summary, body, image_url, is_pinned, show_as_banner,
             publish_at, starts_at, expires_at
      FROM announcements
      WHERE ${PUBLIC_ANNOUNCEMENT_FILTER}
      ORDER BY is_pinned DESC, datetime(COALESCE(publish_at, created_at)) DESC
    `)
    .all() as Record<string, unknown>[];

  const annTranslations = targetLocale
    ? loadPublishedTranslationMap(targetLocale, 'announcement')
    : {};

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    items: targetLocale
      ? rows.map((row) => applyAnnouncementTranslation(row, annTranslations[String(row.id)]))
      : rows,
  });
});

const enquirySchema = z.object({
  type: z.enum(['general', 'business', 'partnership', 'careers', 'feedback']),
  fullName: z.string().trim().min(2, 'Name is required').max(120),
  email: z.string().trim().email('Valid email address is required').max(160),
  organisation: z.string().trim().max(160).optional().default(''),
  subjectContext: z.string().trim().max(160).optional().default(''),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(4000),
});

publicRouter.post('/enquiries', enquiryLimiter, (req, res) => {
  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid submission fields.',
    });
    return;
  }

  const { type, fullName, email, organisation, subjectContext, message } = parsed.data;
  const db = getDb();
  const id = `ENQ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  db.prepare(`
    INSERT INTO enquiries (id, type, full_name, email, organisation, subject_context, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, type, fullName, email.toLowerCase(), organisation, subjectContext, message);

  res.status(201).json({
    id,
    status: 'pending',
    message: 'Your submission has been recorded by MAATA Technologies.',
  });
});

function safeParseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
