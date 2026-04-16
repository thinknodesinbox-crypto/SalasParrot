/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('@tiptap/')) return 'tiptap';
          if (
            id.includes('@tanstack/react-router') ||
            id.includes('@tanstack/router-') ||
            id.includes('@tanstack/history')
          ) {
            return 'tanstack-router';
          }
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) {
            return 'tanstack-query';
          }
          if (id.includes('framer-motion')) return 'framer-motion';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
          if (id.includes('lucide-react') || id.includes('dompurify')) return 'ui-vendor';

          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', 'src/routeTree.gen.ts'],
    },
  },
});
