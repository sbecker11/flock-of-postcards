import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs/promises';
import path from 'path';

// Custom plugin to handle API endpoints
function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // Middleware for reading the body of POST requests
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            req.body = body;
            next();
          });
        } else {
          next();
        }
      });

      // Handler for the palette manifest
      server.middlewares.use('/api/palette-manifest', async (req, res, next) => {
        const PALETTE_DIR_PATH = path.resolve(process.cwd(), 'static_content', 'colorPalettes');
        try {
          const allEntries = await fs.readdir(PALETTE_DIR_PATH);
          const jsonFiles = allEntries.filter(entry =>
            typeof entry === 'string' && entry.endsWith('.json')
          );

          jsonFiles.sort((a, b) => {
            const regex = /^(\\d+)-/;
            const matchA = a.match(regex);
            const matchB = b.match(regex);
            const numA = matchA ? parseInt(matchA[1], 10) : -1;
            const numB = matchB ? parseInt(matchB[1], 10) : -1;
            if (numA !== -1 && numB !== -1) return numA - numB;
            if (numA !== -1) return -1;
            if (numB !== -1) return 1;
            return a.localeCompare(b);
          });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(jsonFiles));
        } catch (error) {
          console.error(`Error in api-plugin (manifest):`, error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to read palette directory.' }));
        }
      });

      // Handler for writing the CSS file
      server.middlewares.use('/api/write-css', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }
        const CSS_FILE_PATH = path.resolve(process.cwd(), 'static_content', 'css', 'palette-styles.css');
        try {
          await fs.writeFile(CSS_FILE_PATH, req.body, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          console.error(`Error in api-plugin (write-css):`, error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to write CSS file.' }));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), apiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), '.')
    }
  }
}) 