import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nitro } from 'nitro/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart(),
    nitro({
      preset: 'node-server',
    }),
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
