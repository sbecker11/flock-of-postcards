import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Ajv from 'ajv';

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

    // Define a valid JSON schema
    const jobsSchema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                // Add other properties as needed
            },
            required: ["id", "title", "description"]
        }
    };

    // Generate JSON schema using Ajv
    const ajv = new Ajv();
    const validate = ajv.compile(jobsSchema);

    // Log the JSON schema
    console.log('JSON Schema:', JSON.stringify(validate.schema, null, 2));
});