import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['modules/jobs/*_test.mjs'],
    exclude: ['node_modules', 'dist', 'cypress', '.{idea,git,cache,output,temp}'],
  },
});
