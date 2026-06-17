import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

/**
 * Configuration for the @vite-pwa/assets-generator CLI.
 *
 * Run with:
 *   npm run generate-pwa-assets
 *
 * Produces (in /public):
 *   favicon.ico (also used as fallback for older browsers)
 *   apple-touch-icon-180x180.png
 *   pwa-64x64.png
 *   pwa-192x192.png
 *   pwa-512x512.png
 *   maskable-icon-512x512.png
 */
export default defineConfig({
  preset,
  images: ['public/favicon.svg'],
});
