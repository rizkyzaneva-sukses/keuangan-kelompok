import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import type { ViteDevServer } from 'vite';

/**
 * Dev-only API middleware.
 *
 * IMPORTANT: the server modules are imported lazily *inside* configureServer
 * and never at config-load time. A top-level import would pull better-sqlite3
 * (a native .node addon) into the Vite config bundle, which breaks the
 * frontend build on machines without a native toolchain.
 */
function apiPlugin(): Plugin {
  return {
    name: 'api-server',
    apply: 'serve',
    async configureServer(server: ViteDevServer) {
      const [{ apiRouter }, expressModule] = await Promise.all([
        import('./server/api.ts'),
        import('express'),
      ]);
      const express = expressModule.default;
      const app = express();
      app.use(express.json({ limit: '1mb' }));
      app.use(express.urlencoded({ extended: false, limit: '1mb' }));
      app.use('/api', apiRouter);
      app.use('/uploads', express.static(path.resolve(__dirname, 'data/uploads')));

      server.middlewares.use((req: any, res: any, next: any) => {
        if (
          req.url &&
          (req.url.startsWith('/api') || req.url.startsWith('/uploads'))
        ) {
          (app as any)(req, res, next);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});