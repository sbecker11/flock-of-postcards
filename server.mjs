import express from 'express';
import fs from 'fs/promises'; // Use promises for async/await
import path from 'path';
import cors from 'cors';

// Assume server is run from the project root directory
const PROJECT_ROOT = process.cwd();
const PALETTE_DIR_PATH = path.resolve(PROJECT_ROOT, 'static_content', 'colorPalettes');
const CSS_FILE_PATH = path.resolve(PROJECT_ROOT, 'static_content', 'css', 'palette-styles.css');
const STATE_FILE_PATH = path.resolve(PROJECT_ROOT, 'app_state.json');

const app = express();

// --- Middleware ---
// Enable CORS for all origins (adjust for production if needed)
app.use(cors());

// Parse JSON bodies for the state endpoint
app.use(express.json());
// Parse text bodies for the CSS endpoint
app.use(express.text());

// --- API Endpoints ---
// These must be defined *before* the static file server.

// GET /api/state: Fetches the saved application state
app.get('/api/state', async (req, res) => {
    try {
        await fs.access(STATE_FILE_PATH);
        const stateData = await fs.readFile(STATE_FILE_PATH, 'utf-8');
        const parsedState = JSON.parse(stateData);
        console.log('📖 Loading app state from disk - colorPalette:', parsedState.colorPalette);
        res.json(parsedState);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📖 State file not found, client will use defaults');
            res.status(404).json({ error: 'State file not found.' });
        } else {
            console.error('Error reading state file:', error);
            res.status(500).json({ error: 'Failed to read state file.' });
        }
    }
});

// POST /api/state: Saves the application state
app.post('/api/state', async (req, res) => {
    try {
        const stateData = JSON.stringify(req.body, null, 2);
        await fs.writeFile(STATE_FILE_PATH, stateData, 'utf-8');
        console.log('💾 Saving app state to disk - colorPalette:', req.body.colorPalette);
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing state file:', error);
        res.status(500).json({ error: 'Failed to write state file.' });
    }
});

// GET /api/palette-manifest: Provides a sorted list of color palettes
app.get('/api/palette-manifest', async (req, res) => {
    try {
        const allEntries = await fs.readdir(PALETTE_DIR_PATH);
        const jsonFiles = allEntries.filter(entry => entry.endsWith('.json'));
        jsonFiles.sort((a, b) => {
            const regex = /^(\d+)-/;
            const matchA = a.match(regex);
            const matchB = b.match(regex);
            const numA = matchA ? parseInt(matchA[1], 10) : -1;
            const numB = matchB ? parseInt(matchB[1], 10) : -1;
            if (numA !== -1 && numB !== -1) return numA - numB;
            if (numA !== -1) return -1;
            if (numB !== -1) return 1;
            return a.localeCompare(b);
        });
        res.json(jsonFiles);
    } catch (error) {
        res.status(error.code === 'ENOENT' ? 404 : 500).json({ error: 'Failed to read palette directory.' });
    }
});

// POST /api/write-css: Writes dynamic CSS content to a file
app.post('/api/write-css', async (req, res) => {
    try {
        await fs.mkdir(path.dirname(CSS_FILE_PATH), { recursive: true });
        await fs.writeFile(CSS_FILE_PATH, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to write CSS file.' });
    }
});

// --- Start the server with port finding ---
const MAX_PORT_RETRIES = 10; // Limit how many ports to try
const START_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3009;

function startServer(port) {
    if (port >= START_PORT + MAX_PORT_RETRIES) {
        console.error(`Failed to bind server after trying ports ${START_PORT} to ${port - 1}. Exiting.`);
        process.exit(1); // Exit if no port found
    }

    const server = app.listen(port, () => {
        // Success!
        console.log(`Server listening on http://localhost:${port}`);
        console.log(`Serving dynamic palette manifest at /api/palette-manifest`);
        console.log(`Palette directory path: ${PALETTE_DIR_PATH}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
            // Close the server instance that failed before retrying
            server.close(() => {
                 startServer(port + 1); // Recursively try the next port
            });
        } else {
            // Handle other server errors
            console.error("Server failed to start:", err);
            process.exit(1);
        }
    });
}

// Initial call to start the server process
startServer(START_PORT);