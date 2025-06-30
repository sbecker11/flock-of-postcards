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

// Add cache control headers for static files
app.use((req, res, next) => {
    if (req.path.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        // Remove any existing Content-Length header to let Express calculate it
        res.removeHeader('Content-Length');
    }
    next();
});

// Serve static files (HTML, JS, CSS, and the palette JSON files)
// Make sure client-side fetch paths match how files are served.
// Serving the whole project root might be needed if index.html is there.
CONSOLE_LOG_IGNORE(`Serving static files from root: ${PROJECT_ROOT}`);

// Add logging for CSS file requests
app.use((req, res, next) => {
    if (req.path.endsWith('.css')) {
        CONSOLE_LOG_IGNORE(`CSS file requested: ${req.path}`);
    }
    next();
});

app.use(express.static(PROJECT_ROOT, {
    // Set proper MIME types
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// --- State Management Endpoints ---
app.get('/api/state', async (req, res) => {
    try {
        await fs.access(STATE_FILE_PATH);
        const stateData = await fs.readFile(STATE_FILE_PATH, 'utf-8');
        res.json(JSON.parse(stateData));
    } catch (error) {
        // If the file doesn't exist (ENOENT), it's not an error.
        // The client will handle creating a default state.
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'State file not found. Client should use default.' });
        } else {
            console.error('Error reading state file:', error);
            res.status(500).json({ error: 'Failed to read state file.' });
        }
    }
});

app.post('/api/state', async (req, res) => {
    try {
        const stateData = JSON.stringify(req.body, null, 2);
        await fs.writeFile(STATE_FILE_PATH, stateData, 'utf-8');
        res.json({ success: true, message: 'State saved successfully.' });
    } catch (error) {
        console.error('Error writing state file:', error);
        res.status(500).json({ error: 'Failed to write state file.' });
    }
});

// --- API Endpoint for Dynamic Manifest ---
app.get('/api/palette-manifest', async (req, res) => {
    CONSOLE_LOG_IGNORE(`Request received for /api/palette-manifest`);
    CONSOLE_LOG_IGNORE(`Scanning directory: ${PALETTE_DIR_PATH}`);
    try {
        // Read all entries in the directory
        const allEntries = await fs.readdir(PALETTE_DIR_PATH);

        // Filter for files ending in .json (excluding the manifest itself if present)
        const jsonFiles = allEntries.filter(entry =>
            typeof entry === 'string' &&
            entry.endsWith('.json') &&
            entry !== 'palette-manifest.json' // Exclude the old static manifest
        );

        CONSOLE_LOG_IGNORE(`Found ${jsonFiles.length} palette JSON files.`);

        // *** Custom Sort: Numeric prefix (0-9) then alphabetical ***
        jsonFiles.sort((a, b) => {
            const regex = /^(\d+)-/;
            const matchA = a.match(regex);
            const matchB = b.match(regex);

            const numA = matchA ? parseInt(matchA[1], 10) : -1;
            const numB = matchB ? parseInt(matchB[1], 10) : -1;

            // If both have numbers, compare numbers
            if (numA !== -1 && numB !== -1) {
                return numA - numB;
            }
            // If only A has a number, A comes first
            if (numA !== -1) {
                return -1;
            }
            // If only B has a number, B comes first
            if (numB !== -1) {
                return 1;
            }
            // If neither has a number, compare alphabetically
            return a.localeCompare(b);
        });

        // Send the sorted list as a JSON response
        res.json(jsonFiles);

    } catch (error) {
        console.error(`Error reading palette directory ${PALETTE_DIR_PATH}:`, error);
        if (error.code === 'ENOENT') {
             res.status(404).json({ error: 'Palette directory not found.' });
        } else {
             res.status(500).json({ error: 'Failed to read palette directory.', details: error.message });
        }
    }
});

// --- API Endpoint for Writing CSS ---
app.post('/api/write-css', async (req, res) => {
    CONSOLE_LOG_IGNORE('Received request to write CSS file');
    try {
        // Ensure the CSS directory exists
        const cssDir = path.dirname(CSS_FILE_PATH);
        await fs.mkdir(cssDir, { recursive: true });

        // Write the CSS content
        await fs.writeFile(CSS_FILE_PATH, req.body);
        CONSOLE_LOG_IGNORE(`Successfully wrote CSS to ${CSS_FILE_PATH}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing CSS file:', error);
        res.status(500).json({
            error: 'Failed to write CSS file',
            details: error.message
        });
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
        CONSOLE_LOG_IGNORE(`Server listening on http://localhost:${port}`);
        CONSOLE_LOG_IGNORE(`Serving dynamic palette manifest at /api/palette-manifest`);
        CONSOLE_LOG_IGNORE(`Palette directory path: ${PALETTE_DIR_PATH}`);
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