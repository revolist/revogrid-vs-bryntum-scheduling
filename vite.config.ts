import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        scheduling: resolve(
          import.meta.dirname,
          'revogrid-vs-bryntum-scheduling/index.html',
        ),
      },
    },
  },
});
