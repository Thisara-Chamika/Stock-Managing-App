import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
// The base path is controlled by the VITE_BASE env variable so that the same
// build can target both local development (default "/") and GitHub Pages
// (e.g. "/Stock-Managing-App/").
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
    server: {
      // Bind to IPv4 loopback only.  On Windows, Vite's default attempt to
      // also listen on ::1 (IPv6 loopback) commonly fails with
      // `EACCES: permission denied` when Hyper-V / WSL has reserved the
      // port range containing 5173.
      host: '127.0.0.1',
      // 5300 sits outside the typical Windows / Hyper-V excluded port ranges
      // (e.g. 5041-5240 on many Windows machines).  If it happens to be in
      // use, strictPort=false lets Vite pick the next free port automatically.
      // Verify reserved ranges with:
      //   netsh interface ipv4 show excludedportrange protocol=tcp
      port: 5300,
      strictPort: false,
      // Auto-open the browser when the server is ready.
      open: true,
    },
    preview: {
      host: '127.0.0.1',
      port: 4300,
    },
  };
});
