import { defineConfig } from 'vite';
import path from 'path';

// Per-game Vite config. `--mode native` flips base to './' for Capacitor (file/localhost scheme).
// See references/02-dual-deploy.md. Build web: `vite build`. Build native: `vite build --mode native`.
export default defineConfig(({ mode }) => ({
  base: mode === 'native' ? './' : '/',
  resolve: {
    alias: {
      '@blublux/engine-sort': path.resolve(__dirname, '../../packages/engine-sort/src/index.ts'),
      '@blublux/engine-block': path.resolve(__dirname, '../../packages/engine-block/src/index.ts'),
      '@blublux/engine': path.resolve(__dirname, '../../packages/engine/src/index.ts'),
      '@blublux/ads-adapter': path.resolve(__dirname, '../../packages/ads-adapter/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    rollupOptions: {
      output: {
      },
    },
  },
  server: { port: 5173 },
}));
