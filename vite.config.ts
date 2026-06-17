import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vitejs.dev/config/
// The base path is controlled by the VITE_BASE env variable so that the same
// build can target both local development (default "/") and GitHub Pages
// (e.g. "/Stock-Managing-App/").
export default defineConfig(({ mode }) => {
  const base = process.env['VITE_BASE'] ?? (mode === 'production' ? '/Stock-Managing-App/' : '/');

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        // Re-register the service worker whenever a new version of the app
        // ships, so users get fresh code on next reload without having to
        // clear their browser cache.
        registerType: 'autoUpdate',
        // Inject `<script>` to register the SW from `index.html`.
        injectRegister: 'auto',
        includeAssets: [
          'favicon.svg',
          'favicon.ico',
          'apple-touch-icon-180x180.png',
          '404.html',
        ],
        manifest: {
          name: 'Calculator Stock Tracker',
          short_name: 'Stock Tracker',
          description:
            'Track calculator stock batches, sold quantities, supplier payments, and profit – fully offline.',
          start_url: '.',
          scope: '.',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f1f5f9',
          theme_color: '#2563eb',
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Precache every asset the app actually serves (HTML, JS, CSS,
          // SVG, PNG, JSON).  Since the app is 100% offline-first with no
          // network calls of its own, this is enough to make the entire
          // experience available offline.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2,json}'],
          // SPA fallback so HashRouter routes always resolve to index.html
          // when the SW serves them while offline.
          navigateFallback: 'index.html',
          // Skip /404.html in the navigate fallback so dedicated 404
          // requests still get the right page.
          navigateFallbackDenylist: [/^\/404\.html$/],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          // Allow testing the SW in dev with `npm run dev` -- handy when
          // iterating on the offline flow.
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5300,
      strictPort: false,
      open: true,
    },
    preview: {
      host: '127.0.0.1',
      port: 4300,
    },
  };
});
