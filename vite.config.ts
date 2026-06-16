/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Homepage is served at the domain root (threadwick.com). The Studio lives at
// /studio via a Vercel rewrite (see vercel.json), so this build always uses base '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split heavy vendors into long-term-cacheable chunks so the browser can
        // fetch them in parallel and reuse them across deploys (better TBT/INP).
        // Order matters: iconoir-react and the rc-* deps both contain "react".
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('node_modules/iconoir-react')) return 'icons';
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-is') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-vendor';
          }
          if (
            id.includes('node_modules/antd') ||
            id.includes('node_modules/@ant-design') ||
            id.includes('node_modules/@rc-component') ||
            id.includes('node_modules/rc-')
          ) {
            return 'antd-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: false,
  },
});
