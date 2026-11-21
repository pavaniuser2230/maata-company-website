import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const ephemeralSecret = crypto.randomBytes(32).toString('hex');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  appUrl: (process.env.APP_URL || '').trim(),
  databasePath: path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/maata.db'),
  mediaStorageDir: path.resolve(process.cwd(), process.env.MEDIA_STORAGE_DIR || './storage/media'),
  leadershipDocsDir: path.resolve(
    process.cwd(),
    process.env.LEADERSHIP_DOCS_DIR || './storage/leadership_docs'
  ),
  sessionSecret: process.env.SESSION_SECRET || ephemeralSecret,
  sessionTtlHours: Math.max(1, Number(process.env.SESSION_TTL_HOURS || 12)),
  initialSetupToken: (process.env.INITIAL_SETUP_TOKEN || '').trim(),
  adminBootstrapName: (process.env.ADMIN_BOOTSTRAP_NAME || '').trim(),
  adminBootstrapEmail: (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase(),
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || '',
  allowDevResetPreview:
    process.env.ALLOW_DEV_RESET_PREVIEW !== 'false' && process.env.NODE_ENV !== 'production',
};
