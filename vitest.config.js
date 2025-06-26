// eslint-disable-next-line import/no-unresolved -- it resolved
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['lcov'],
      provider: 'v8',
      include: [
        'server/**',
      ],
      exclude: [
        'server/migrations/**',
      ],
    },
  },
});
