import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: [path.resolve(__dirname, 'tsconfig.json')] }),
    tailwindcss(),
    tanstackStart(),
    nitro(),
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
