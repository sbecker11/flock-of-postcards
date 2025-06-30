import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), '.')
    }
  },
  server: {
    proxy: {
      // Proxy all requests starting with /api to the backend server
      '/api': {
        target: 'http://localhost:3009', // The address of our Node.js server
        changeOrigin: true, // Recommended for virtual hosts
        secure: false,      // Optional: if your backend server is not using HTTPS
      },
    }
  }
}) 