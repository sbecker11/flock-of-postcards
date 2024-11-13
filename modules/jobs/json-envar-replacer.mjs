// text-envar-replacer.mjs
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Parse .env file content into key-value pairs
 * @param {string} content - Content of .env file
 * @returns {Object} - Environment variables as key-value pairs
 */
function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');

  for (let line of lines) {
    line = line.trim();
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) continue;

    // Handle both 'KEY=value' and 'KEY="value"' formats
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove surrounding quotes if they exist
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  }
  
  return env;
}

/**
 * Load environment variables from .env file if it exists
 * @param {string} [envPath='.env'] - Path to .env file
 */
async function loadEnvFile(envPath = '.env') {
  try {
    if (existsSync(envPath)) {
      const envContent = await readFile(envPath, 'utf8');
      const envVars = parseEnvFile(envContent);
      
      // Add variables to process.env
      for (const [key, value] of Object.entries(envVars)) {
        // Only set if not already defined in process.env
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
      console.error(`Loaded environment variables from ${envPath}`);
    }
  } catch (error) {
    console.error(`Warning: Error reading ${envPath}: ${error.message}`);
  }
}

/**
 * Replace environment variables in text content
 * @param {string} content - Text content
 * @returns {string} - Text with environment variables replaced
 */
function replaceEnvVars(content) {
  // Handle ${VAR_NAME} format
  const pattern1 = /\${([^}]+)}/g;
  // Handle $VAR_NAME format
  const pattern2 = /\$([A-Za-z0-9_]+)/g;
  // Handle %VAR_NAME% format (Windows style)
  const pattern3 = /%([^%]+)%/g;

  let result = content;
  
  for (const pattern of [pattern1, pattern2, pattern3]) {
    result = result.replace(pattern, (match, varName) => {
      const envValue = process.env[varName];
      if (envValue === undefined) {
        console.error(`Warning: Environment variable '${varName}' not found`);
        return match; // Keep original placeholder if env var not found
      }
      return envValue;
    });
  }
  
  return result;
}

/**
 * Process a text file and replace environment variables
 * @param {string} inputFile - Path to input file
 * @returns {Promise<string>} - Processed text content
 */
async function processFile(inputFile) {
  try {
    const content = await readFile(inputFile, 'utf8');
    return replaceEnvVars(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Input file '${inputFile}' not found`);
    }
    throw error;
  }
}

/**
 * Main function to handle command line execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Please provide the input file path');
    console.error('Usage: node text-envar-replacer.mjs <input-file>');
    process.exit(1);
  }

  const inputFile = args[0];
  
  // Look for .env file in the same directory as the input file
  const envPath = path.join(path.dirname(inputFile), '.env');
  
  // Load environment variables from .env file
  await loadEnvFile(envPath);

  try {
    const processedContent = await processFile(inputFile);
    // Print the processed content to stdout
    console.log(processedContent);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run main when script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}