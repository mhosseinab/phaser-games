import { defineConfig } from 'vite';

// Per-game Vite config. `--mode native` flips base to './' for Capacitor (file/localhost scheme).
// See references/02-dual-deploy.md. Build web: `vite build`. Build native: `vite build --mode native`.
export default defineConfig(({ mode }) => ({
  base: mode === 'native' ? './' : '/',
  build: {
    outDir: 'dist',
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] }, // cache the engine separately from game code
      },
    },
  },
  server: { port: 5173 },
}));
