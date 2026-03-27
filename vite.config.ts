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
    nitro({ preset: 'vercel' }),
    tanstackStart({
      router: {
        // ($lang) files trigger TanStack Router's route-group error in v1.166+.
        // We maintain routeTree.gen.ts manually, so we skip auto-generation for
        // files/dirs starting with '(' and redirect generator output elsewhere.
        routeFileIgnorePrefix: '(',
        generatedRouteTree: './src/routeTree.ignored.gen.ts',
      },
    }),
  ],
  server: {
    host: true,
  },
  optimizeDeps: {
    exclude: ['fsevents', 'lightningcss'],
    include: ['@rive-app/react-webgl2'],
  },
  build: {
    rollupOptions: {
      external: ['fsevents', 'lightningcss'],
    },
  },
});
