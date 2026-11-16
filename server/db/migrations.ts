import type { DatabaseSync } from 'node:sqlite';

interface Migration {
  id: string;
  disableForeignKeys?: boolean;
  sql: string;
}

const MIGRATIONS: Migration[] = [
  {
    id: '001_initial_cms_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('super_admin', 'content_manager', 'support_manager')),
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_exp ON admin_sessions(expires_at);

      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS company_sections (
        section_key TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        draft_json TEXT NOT NULL,
        published_json TEXT,
        status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
        updated_by TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        published_at TEXT
      );

      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        cover_image_url TEXT NOT NULL DEFAULT '',
        short_summary TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN (
          'Announcements',
          'Product Updates',
          'Company News',
          'Articles & Insights',
          'Featured Stories'
        )),
        tags_json TEXT NOT NULL DEFAULT '[]',
        seo_title TEXT NOT NULL DEFAULT '',
        seo_description TEXT NOT NULL DEFAULT '',
        publish_at TEXT,
        status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'unpublished')) DEFAULT 'draft',
        created_by TEXT,
        updated_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_articles_status_publish ON articles(status, publish_at);
      CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN (
          'company_announcement',
          'product_update',
          'new_feature',
          'service_notification',
          'important_notice'
        )),
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT '',
        is_pinned INTEGER NOT NULL DEFAULT 0,
        visibility TEXT NOT NULL CHECK (visibility IN ('public', 'hidden')) DEFAULT 'public',
        status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'archived')) DEFAULT 'draft',
        show_as_banner INTEGER NOT NULL DEFAULT 0,
        publish_at TEXT,
        starts_at TEXT,
        expires_at TEXT,
        created_by TEXT,
        updated_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status, visibility, is_pinned);

      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        url TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN (
          'company_logo',
          'founder_photo',
          'product_screenshot',
          'article_cover',
          'banner',
          'approved_media'
        )),
        alt_text TEXT NOT NULL DEFAULT '',
        is_protected INTEGER NOT NULL DEFAULT 0,
        uploaded_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS enquiries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('general', 'business', 'partnership', 'careers', 'feedback')),
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        organisation TEXT NOT NULL DEFAULT '',
        subject_context TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_review', 'resolved', 'archived')) DEFAULT 'pending',
        internal_notes TEXT NOT NULL DEFAULT '',
        resolved_by TEXT,
        resolved_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_enquiries_type_status ON enquiries(type, status, created_at);

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor_user_id TEXT,
        actor_email TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL DEFAULT '',
        details_json TEXT NOT NULL DEFAULT '{}',
        ip_address TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
    `,
  },
  {
    id: '002_leadership_portal',
    disableForeignKeys: true,
    sql: `
      CREATE TABLE admin_users_next (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('super_admin', 'founder', 'ceo', 'content_manager', 'support_manager')),
        leadership_role TEXT NOT NULL CHECK (leadership_role IN ('founder', 'ceo', 'none')) DEFAULT 'none',
        custom_permissions INTEGER NOT NULL DEFAULT 0,
        permissions_json TEXT NOT NULL DEFAULT '[]',
        mfa_enabled INTEGER NOT NULL DEFAULT 0,
        mfa_secret_enc TEXT NOT NULL DEFAULT '',
        pending_mfa_secret_enc TEXT NOT NULL DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO admin_users_next (
        id, name, email, password_hash, role, leadership_role,
        custom_permissions, permissions_json, mfa_enabled, mfa_secret_enc, pending_mfa_secret_enc,
        is_active, last_login_at, created_at, updated_at
      )
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        CASE WHEN role = 'super_admin' AND lower(name) LIKE '%pavani%' THEN 'ceo' ELSE 'none' END,
        0,
        '[]',
        0,
        '',
        '',
        is_active,
        last_login_at,
        created_at,
        updated_at
      FROM admin_users;

      DROP TABLE admin_users;
      ALTER TABLE admin_users_next RENAME TO admin_users;

      CREATE TABLE IF NOT EXISTS leadership_work_items (
        id TEXT PRIMARY KEY,
        domain TEXT NOT NULL CHECK (domain IN ('product', 'marketing', 'testing')),
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        summary TEXT NOT NULL DEFAULT '',
        owner_name TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
        status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'in_review', 'completed', 'blocked')) DEFAULT 'planned',
        progress_pct INTEGER NOT NULL DEFAULT 0,
        target_date TEXT,
        notes TEXT NOT NULL DEFAULT '',
        created_by TEXT,
        updated_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_leadership_work_domain ON leadership_work_items(domain, status);

      CREATE TABLE IF NOT EXISTS leadership_reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        report_type TEXT NOT NULL CHECK (report_type IN ('executive_summary', 'operations', 'merchant_growth', 'financial', 'product_metrics')),
        period_label TEXT NOT NULL DEFAULT '',
        summary TEXT NOT NULL,
        metrics_json TEXT NOT NULL DEFAULT '[]',
        highlights TEXT NOT NULL DEFAULT '',
        author_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft', 'final')) DEFAULT 'final',
        created_by TEXT,
        updated_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS leadership_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('governance', 'strategy', 'product_spec', 'marketing_plan', 'legal_compliance', 'financial', 'meeting_notes')),
        summary TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        attachment_filename TEXT NOT NULL DEFAULT '',
        attachment_original_name TEXT NOT NULL DEFAULT '',
        attachment_mime TEXT NOT NULL DEFAULT '',
        attachment_size INTEGER NOT NULL DEFAULT 0,
        classification TEXT NOT NULL CHECK (classification IN ('leadership_only', 'executive_confidential')) DEFAULT 'leadership_only',
        uploaded_by TEXT,
        updated_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    id: '003_founder_gallery_media',
    sql: `
      CREATE TABLE media_assets_next (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        url TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN (
          'company_logo',
          'founder_photo',
          'founder_gallery',
          'product_screenshot',
          'article_cover',
          'banner',
          'approved_media'
        )),
        alt_text TEXT NOT NULL DEFAULT '',
        focal_position TEXT NOT NULL DEFAULT '50% 25%',
        caption TEXT NOT NULL DEFAULT '',
        display_order INTEGER NOT NULL DEFAULT 0,
        is_protected INTEGER NOT NULL DEFAULT 0,
        uploaded_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO media_assets_next (
        id, filename, original_name, mime_type, size_bytes, url, category,
        alt_text, focal_position, caption, display_order, is_protected,
        uploaded_by, created_at, updated_at
      )
      SELECT
        id, filename, original_name, mime_type, size_bytes, url, category,
        alt_text, '50% 25%', '', 0, is_protected,
        uploaded_by, created_at, updated_at
      FROM media_assets;

      DROP TABLE media_assets;
      ALTER TABLE media_assets_next RENAME TO media_assets;

      INSERT OR IGNORE INTO media_assets (
        id, filename, original_name, mime_type, size_bytes, url, category,
        alt_text, focal_position, caption, display_order, is_protected, uploaded_by
      ) VALUES
        (
          'media-gallery-01',
          'image_6fa97355.png',
          'Founders Leadership Studio Portrait',
          'image/png',
          0,
          '/assets/aistudio/image_6fa97355.png',
          'founder_gallery',
          'G. Balaji Reddy (Founder) and G. Pavani (Co-Founder & CEO) in executive attire at the MAATA Technologies desk',
          '60% 24%',
          'G. Balaji Reddy (Founder) & G. Pavani (Co-Founder & CEO) — From Local Experience to a Connected India.',
          1,
          0,
          'system-seed'
        ),
        (
          'media-gallery-02',
          'image_b7c2d33f.png',
          'Founders Traditional Attire Desk Portrait',
          'image/png',
          0,
          '/assets/aistudio/image_b7c2d33f.png',
          'founder_gallery',
          'G. Balaji Reddy in cream kurta and shawl alongside G. Pavani in red kurti with MAATA laptop and mug',
          '50% 28%',
          'A local business experience paired with a young technology vision — Together, MAATA.',
          2,
          0,
          'system-seed'
        ),
        (
          'media-gallery-03',
          'Introducing_Maata_s_Leadership_Team_b9ca1410.png',
          'Introducing Maata Leadership Team Showcase',
          'image/png',
          0,
          '/assets/aistudio/Introducing_Maata_s_Leadership_Team_b9ca1410.png',
          'founder_gallery',
          'Introducing the father-daughter leadership team behind MAATA: G. Balaji Reddy (Founder) and G. Pavani (Co-Founder & CEO)',
          '50% 46%',
          'A father-daughter team united by a shared vision to build a people-first Indian digital ecosystem.',
          3,
          0,
          'system-seed'
        ),
        (
          'media-gallery-04',
          'image_4e120cb0.png',
          'Founders Chittoor Workspace Collaboration',
          'image/png',
          0,
          '/assets/aistudio/image_4e120cb0.png',
          'founder_gallery',
          'G. Balaji Reddy and G. Pavani seated behind the MAATA laptop in the Chittoor workspace',
          '50% 24%',
          'Built for Indian communities — practical everyday collaboration from Chittoor, Andhra Pradesh.',
          4,
          0,
          'system-seed'
        );
    `,
  },
  {
    id: '004_multilingual_cms',
    sql: `
      CREATE TABLE IF NOT EXISTS cms_translations (
        entity_type TEXT NOT NULL CHECK (entity_type IN (
          'company_section',
          'article',
          'announcement',
          'media_asset'
        )),
        entity_id TEXT NOT NULL,
        locale TEXT NOT NULL CHECK (locale IN (
          'te', 'hi', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa'
        )),
        draft_json TEXT NOT NULL,
        published_json TEXT,
        status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
        updated_by TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        published_at TEXT,
        PRIMARY KEY (entity_type, entity_id, locale)
      );

      CREATE INDEX IF NOT EXISTS idx_cms_translations_lookup
        ON cms_translations(entity_type, locale, status);
    `,
  },
];

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const checkStmt = db.prepare('SELECT id FROM schema_migrations WHERE id = ?');
  const markStmt = db.prepare('INSERT INTO schema_migrations (id) VALUES (?)');

  for (const migration of MIGRATIONS) {
    const existing = checkStmt.get(migration.id);
    if (!existing) {
      if (migration.disableForeignKeys) {
        db.exec('PRAGMA foreign_keys = OFF;');
      }
      db.exec('BEGIN');
      try {
        db.exec(migration.sql);
        markStmt.run(migration.id);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      } finally {
        if (migration.disableForeignKeys) {
          db.exec('PRAGMA foreign_keys = ON;');
        }
      }
    }
  }
}
