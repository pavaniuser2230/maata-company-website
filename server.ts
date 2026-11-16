import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { env } from './server/config/env.ts';
import { createExpressApp } from './server/app.ts';

async function startServer() {
  const app = createExpressApp();
  const httpServer = http.createServer(app);
  const isProd = env.nodeEnv === 'production';

  if (!isProd) {
    const allowedHosts = ['localhost', '127.0.0.1', '.run.app'];
    if (process.env.APP_URL) {
      try {
        const appHost = new URL(process.env.APP_URL).hostname;
        if (appHost && !allowedHosts.includes(appHost)) {
          allowedHosts.push(appHost);
        }
      } catch {
        // Ignore malformed APP_URL
      }
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: env.port,
        allowedHosts,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(
      `[MAATA Technologies] Corporate & CMS server listening on http://0.0.0.0:${env.port}`
    );
  });
}

startServer().catch((err) => {
  console.error('[MAATA Technologies] Failed to start server:', err);
  process.exit(1);
});
