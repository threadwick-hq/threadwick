import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed to Vercel under https://threadwick.com/studio. An absolute `base`
// makes every asset URL resolve under /studio/, and the build nests output in
// dist/studio so the files physically match that path (Vercel serves dist/).
export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/studio/',
  build: {
    outDir: 'dist/studio',
    emptyOutDir: true,
    sourcemap: false,
    // antd is ~900 kB minified on its own — a known, cache-stable vendor cost
    // (dropped once the 6c chrome migration removes AntD; see TW-017).
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // split the big vendors into their own cache-stable chunks
        manualChunks: { antd: ['antd'], supabase: ['@supabase/supabase-js'] },
      },
    },
  },
});
