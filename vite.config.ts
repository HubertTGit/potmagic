import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import vitereact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nitro } from 'nitro/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart(),
    nitro({
      renderer: {
        handler: './server/renderer.ts',
      },
      rollupConfig: {
        onwarn(warning, handler) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          handler(warning);
        },
      },
    }),
    vitereact(),
  ],
  server: {
    host: true,
  },
  optimizeDeps: {
    exclude: ['fsevents', 'lightningcss'],
  },
  build: {
    rollupOptions: {
      external: ['fsevents', 'lightningcss'],
    },
  },
});
