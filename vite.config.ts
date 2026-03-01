import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/flock-of-postcards/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'static_content/icons',
          dest: 'static_content'
        },
        {
          src: 'static_content/graphics',
          dest: 'static_content'
        },
        {
          src: 'static_content/media',
          dest: 'static_content'
        },
        {
          src: 'static_content/links',
          dest: 'static_content'
        },
        {
          src: 'static_content/palettes',
          dest: 'static_content'
        },
        {
          src: 'static_content/jobs/jobs.mjs',
          dest: 'static_content/jobs'
        }
      ]
    })
  ]
});
