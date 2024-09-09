import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 70000, // 70 seconds
    include: [
      '**/*.{test,spec}.[tj]s?(x)', // Matches .test.js, .test.ts, .spec.js, .spec.ts, etc.
      '**/*_test.mjs' // Matches _test.mjs files
    ],
    exclude: [
      '**/node_modules/**', // Excludes node_modules directory
      '**/dist/**', // Excludes dist directory
      '**/cypress/**', // Excludes cypress directory
      '**/.{idea,git,cache,output,temp}/**', // Excludes various hidden directories
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,tsup,build,eslint,prettier}.config.*' // Excludes various config files
    ]
  }
});