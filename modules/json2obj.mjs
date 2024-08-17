import { readFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Reads a JSON file and returns its content as a JavaScript object.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<object>} A promise that resolves to the parsed JSON object.
 * @throws Will throw an error if the file cannot be read or parsed.
 */
export async function json2obj(filePath) -> jobs{
  try {
    // Resolve the file path
    const absolutePath = resolve(filePath);
    
    // Read the file
    const data = await readFile(absolutePath, 'utf8');
    
    // Parse and return the JSON data
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
    } else {
      throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
  }
}

// Example usage (can be removed if not needed)
// const filePath = './jobs.json';
// json2obj(filePath)
//   .then(jobs => console.log('Jobs:', jobs))
//   .catch(error => console.error('Error:', error.message));
