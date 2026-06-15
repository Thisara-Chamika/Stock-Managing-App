import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
// The base path is controlled by the VITE_BASE env variable so that the same
// build can target both local development (default "/") and GitHub Pages
// (e.g. "/calculator-stock-tracker/").
export default defineConfig(({ mode }) => {
  const base = process.env['VITE_BASE'] ?? (mode === 'production' ? '/Stock-Managing-App/' : '/');

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
