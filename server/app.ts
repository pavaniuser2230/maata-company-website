import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { env } from './config/env.ts';
import { getDb } from './db/database.ts';
import { runMigrations } from './db/migrations.ts';
import { seedInitialData } from './db/seed.ts';
import { adminAuthRouter } from './routes/adminAuthRoutes.ts';
import { adminCmsRouter } from './routes/adminCmsRoutes.ts';
import { adminOpsRouter } from './routes/adminOpsRoutes.ts';
import { leadershipAuthRouter } from './routes/leadershipAuthRoutes.ts';
import { leadershipRouter } from './routes/leadershipRoutes.ts';
import { publicRouter } from './routes/publicRoutes.ts';
import { verifySameOriginForMutations } from './middleware/auth.ts';

export function createExpressApp(options?: { dbPath?: string }) {
  const db = getDb(options?.dbPath);
  runMigrations(db);
  seedInitialData(db);

  const app = express();

  app.set('trust proxy', true);
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));

  // Basic security headers for corporate site & admin workspace
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Never allow reverse proxies or browsers to cache authenticated auth/session/workspace endpoints
  app.use(['/api/admin', '/api/leadership'], verifySameOriginForMutations, (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('Vary', 'Cookie');
    next();
  });

  // Serve uploaded media safely with strict path confinement
  fs.mkdirSync(env.mediaStorageDir, { recursive: true });
  app.use(
    '/media',
    express.static(env.mediaStorageDir, {
      fallthrough: false,
      index: false,
      maxAge: '7d',
    })
  );

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'maata-technologies-cms' });
  });

  app.use('/api/public', publicRouter);
  app.use('/api/admin/auth', adminAuthRouter);
  app.use('/api/admin', adminCmsRouter);
  app.use('/api/admin', adminOpsRouter);
  app.use('/api/leadership/auth', leadershipAuthRouter);
  app.use('/api/leadership', leadershipRouter);

  // Unknown API routes return clean JSON 404
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Centralized secure API error handler
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/media')) {
      next(err);
      return;
    }

    const message =
      err instanceof Error && err.message
        ? err.message
        : 'An unexpected server error occurred.';

    if (message.includes('File too large')) {
      res.status(413).json({ error: 'Uploaded image exceeds the 5 MB size limit.' });
      return;
    }

    if (
      message.includes('Only PNG, JPEG, and WebP') ||
      message.includes('ENOENT')
    ) {
      const status = message.includes('ENOENT') ? 404 : 400;
      res.status(status).json({ error: status === 404 ? 'Media file not found.' : message });
      return;
    }

    if (env.nodeEnv !== 'production') {
      console.error('[MAATA API Error]', err);
    }

    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
