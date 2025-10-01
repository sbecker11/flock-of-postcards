import { defineConfig } from 'vite';

export default defineConfig({
  base: '/flock-of-postcards/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
