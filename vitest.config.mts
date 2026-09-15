import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://api.test/api',
      NEXT_PUBLIC_SOCKET_URL: 'http://socket.test',
    },
    coverage: {
      include: ['lib/**', 'hooks/**', 'feat/**', 'components/**', 'column/**', 'middleware.ts'],
    },
  },
});
