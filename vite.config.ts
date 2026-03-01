import { defineConfig } from 'vite';

export default defineConfig({
  base: '/flock-of-postcards/',
  publicDir: 'static_content',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
