import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    alias: {
      '@blublux/engine': path.resolve(__dirname, '../engine/src/index.ts')
    }
  }
});
