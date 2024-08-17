import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Workaround to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the jobs.mjs file
const jobsFilePath = path.join(__dirname, 'jobs.mjs');

// Read the jobs.mjs file
fs.readFile(jobsFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    // Extract JSON data from the JavaScript file
    const jsonDataMatch = data.match(/const jobs\s*=\s*(\[.*\]);/s);
    if (!jsonDataMatch) {
        console.error('Error: Could not find JSON data in the file.');
        return;
    }

    const jsonData = jsonDataMatch[1];

    // Parse the JSON data
    let jobs;
    try {
        jobs = JSON.parse(jsonData);
    } catch (parseErr) {
        console.error('Error parsing JSON data:', parseErr);
        return;
    }

    // Write the JSON data to jobs.json
    const jobsJsonString = JSON.stringify(jobs, null, 2);
    fs.writeFileSync(path.join(__dirname, 'jobs.json'), jobsJsonString);
    console.log('JSON Data written to jobs.json');

    // Proceed to generate JSON schema
    const jobsJsonSchema = generateJsonSchema(jobs);
    fs.writeFileSync(path.join(__dirname, 'jobs-schema.json'), jobsJsonSchema);
    console.log('JSON Schema written to jobs-schema.json');
});

// Function to generate JSON schema
function generateJsonSchema(jobs) {
    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                employer: { type: "string" },
                role: { type: "string" },
                cssRGB: { type: "string" },
                textColor: { type: "string" },
                endstart: { type: "string" },
                index: { type: "number" },
                description: { type: "string" }
            },
            required: ["employer", "role", "cssRGB", "textColor", "endstart", "index", "description"]
        }
    };

    // Return the JSON schema as a string
    return JSON.stringify(schema, null, 2);
}