import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests are pure logic (no DOM APIs) — use 'node' to avoid requiring the
    // happy-dom package, which was never declared as a dependency and broke
    // `npm ci` in the GitHub Actions Deploy workflow (ERR_MODULE_NOT_FOUND).
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', '.codex'],
  },
});
