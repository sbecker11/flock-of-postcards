import express from 'express';
import fs from 'fs/promises'; // Use promises for async/await
import path from 'path';
import cors from 'cors';

// Assume server is run from the project root directory
const PROJECT_ROOT = process.cwd();
const PALETTE_DIR_PATH = path.resolve(PROJECT_ROOT, 'static_content', 'color_palettes');

const app = express();
const PORT = process.env.PORT || 3000; // Use port 3000 unless specified

// --- Middleware ---
// Enable CORS for all origins (adjust for production if needed)
app.use(cors());

// Serve static files (HTML, JS, CSS, and the palette JSON files)
// Make sure client-side fetch paths match how files are served.
// Serving the whole project root might be needed if index.html is there.
console.log(`Serving static files from root: ${PROJECT_ROOT}`);
app.use(express.static(PROJECT_ROOT));

// --- API Endpoint for Dynamic Manifest ---
app.get('/api/palette-manifest', async (req, res) => {
    console.log(`Request received for /api/palette-manifest`);
    console.log(`Scanning directory: ${PALETTE_DIR_PATH}`);
    try {
        // Read all entries in the directory
        const allEntries = await fs.readdir(PALETTE_DIR_PATH);

        // Filter for files ending in .json (excluding the manifest itself if present)
        const jsonFiles = allEntries.filter(entry =>
            typeof entry === 'string' &&
            entry.endsWith('.json') &&
            entry !== 'palette-manifest.json' // Exclude the old static manifest
        );

        console.log(`Found ${jsonFiles.length} palette JSON files.`);

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

// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Serving dynamic palette manifest at /api/palette-manifest`);
    console.log(`Palette directory path: ${PALETTE_DIR_PATH}`);
}); 