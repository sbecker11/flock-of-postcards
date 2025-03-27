import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Endpoint to receive diagnostics
app.post('/api/log', (req, res) => {
    console.log('Received log request:', req.body.message);
    const { message, data } = req.body;
    console.log('\n=== Browser Diagnostics ===');
    console.log(message);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
    console.log('========================\n');
    res.json({ received: true });
});

// Serve index.html as the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 