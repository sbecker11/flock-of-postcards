import { readFile, writeFile } from 'fs/promises';
import ExcelJS from 'exceljs';
import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const logger = require('log4js').getLogger();
logger.level = 'info';

// Default file paths (relative to script location)
const defaultInputXlsxFile = 'jobs.xlsx';
const defaultOutputMjsFile = 'jobs.mjs';
const targetColumn = 'Description';
const MAX_TRANSFORMATION_SECONDS = 10;

// Get command-line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node xlsx2mjs.mjs [input.xlsx] [output.mjs]');
  console.log('  - input.xlsx: Path to input Excel file (default: jobs.xlsx)');
  console.log('  - output.mjs: Path to output Node.js module file (default: jobs.mjs)');
  console.log('Examples:');
  console.log('  node xlsx2mjs.mjs <outputs this usage message>');
  console.log('  node xlsx2mjs.mjs my-jobs.xlsx my-output.mjs');
  console.log('  node xlsx2mjs.mjs custom.xlsx');
  process.exit(0);
}

const inputXlsxFile = args[0] || defaultInputXlsxFile;
const outputMjsFile = args[1] || defaultOutputMjsFile;

// Initialize counters
function initCounters() {
  return {
    valid_no_changes_cnt: 0,
    valid_some_changes_cnt: 0,
    invalid_all_changes_cnt: 0,
    skipped_timeout_cnt: 0,
  };
}

// Report counters
function reportCounters(counters) {
  console.log(`valid_no_changes_count: ${counters.valid_no_changes_cnt}`);
  console.log(`valid_some_changes_count: ${counters.valid_some_changes_cnt}`);
  console.log(`invalid_all_changes_count: ${counters.invalid_all_changes_cnt}`);
  console.log(`skipped_timeout_count: ${counters.skipped_timeout_cnt}`);
}

// Test and permute URLs with timeout
async function testPermutedUrl(originalUrl) {
  const transformations = [
    '', '.com', 'www.', 'www.com',
    'http://', 'http://.com', 'http://www.', 'http://www.com',
    'https://', 'https://.com', 'https://www.', 'https://www.com',
  ];

  const fetchWithTimeout = async (url, options, timeoutMs) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  };

  try {
    const response = await fetchWithTimeout(originalUrl, { method: 'HEAD', redirect: 'follow' }, MAX_TRANSFORMATION_SECONDS * 1000);
    if (response.status === 200) {
      logger.info(`Success: original_url:${originalUrl} is already valid with no transformation`);
      return { original: originalUrl, valid: originalUrl, code: -1 };
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      logger.info(`Timeout: original_url:${originalUrl} exceeded ${MAX_TRANSFORMATION_SECONDS}s`);
      return { original: originalUrl, valid: null, code: -3 };
    }
  }

  const strippedUrl = originalUrl.replace(/\.(com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum|co|tv)\/$/, '.$1').replace(/^['"]|['"]$/g, '');
  
  if (strippedUrl !== originalUrl.replace(/^['"]|['"]$/g, '')) {
    try {
      const response = await fetchWithTimeout(strippedUrl, { method: 'HEAD', redirect: 'follow' }, MAX_TRANSFORMATION_SECONDS * 1000);
      if (response.status === 200) {
        logger.info(`Success: original_url:${originalUrl} was made valid by removing trailing slash: '${strippedUrl}'`);
        return { original: originalUrl, valid: strippedUrl, code: -2 };
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        logger.info(`Timeout: stripped_url:${strippedUrl} exceeded ${MAX_TRANSFORMATION_SECONDS}s`);
        return { original: originalUrl, valid: null, code: -3 };
      }
    }
  }

  for (let i = 0; i < transformations.length; i++) {
    const transform = transformations[i];
    const url = transform.includes('.com') ? transform.replace('.com', `${strippedUrl}.com`) : transform + strippedUrl;
    try {
      const response = await fetchWithTimeout(url, { method: 'HEAD', redirect: 'follow' }, MAX_TRANSFORMATION_SECONDS * 1000);
      if (response.status === 200) {
        logger.info(`Success: original_url:${originalUrl} was made valid:'${url}' with transformation code ${i}`);
        return { original: originalUrl, valid: url, code: i };
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        logger.info(`Timeout: url:${url} exceeded ${MAX_TRANSFORMATION_SECONDS}s`);
        return { original: originalUrl, valid: null, code: -3 };
      }
    }
  }

  logger.info(`Failure: original_url:'${originalUrl}' could not be transformed into a valid url`);
  return null;
}

// Process URLs in a string
async function processUrlsInString(text, counters) {
  if (!text) return text;
  const pattern = /\((?:https?:\/\/)?([^\s)]+)\)/g;
  let match;
  let newText = text;

  while ((match = pattern.exec(text)) !== null) {
    const originalUrl = match[1];
    const fullMatch = match[0];
    const validPermutation = await testPermutedUrl(originalUrl);
    if (validPermutation) {
      if (validPermutation.code === -3) {
        counters.skipped_timeout_cnt++;
        newText = newText.replace(fullMatch, `(${originalUrl})`);
      } else if (validPermutation.valid) {
        const replacementUrl = validPermutation.valid;
        if (validPermutation.code === -1) counters.valid_no_changes_cnt++;
        else counters.valid_some_changes_cnt++;
        newText = newText.replace(fullMatch, `(${replacementUrl})`);
      } else {
        counters.invalid_all_changes_cnt++;
        newText = newText.replace(fullMatch, '');
      }
    } else {
      counters.invalid_all_changes_cnt++;
      newText = newText.replace(fullMatch, '');
    }
  }
  return newText;
}

// Main function
async function convertXlsxToMjs() {
  try {
    console.log(`Processing input: ${inputXlsxFile}`);
    console.log(`Outputting to: ${outputMjsFile}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputXlsxFile);
    const worksheet = workbook.getWorksheet(1);
    const headers = worksheet.getRow(1).values.slice(1);
    const data = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      const obj = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        let value = cell.value;
        // Explicitly handle start and end dates to preserve YYYY-MM-DD
        if (header === 'start' || header === 'end') {
          // Use raw text if available, or format Date to YYYY-MM-DD
          if (typeof value === 'string') {
            value = value; // Already a string, keep it
          } else if (value instanceof Date) {
            value = value.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD
          } else if (cell.text) {
            value = cell.text; // Fallback to raw text
          } else {
            value = null; // Fallback if no valid date
          }
        } else {
          value = value === null || value === undefined ? null : value.toString();
        }
        obj[header] = value;
      });
      data.push(obj);
    });

    if (!headers.includes(targetColumn)) {
      throw new Error(`'${targetColumn}' field not found in columns: ${headers}`);
    }

    const counters = initCounters();
    const processedData = await Promise.all(data.map(async row => {
      row[targetColumn] = await processUrlsInString(row[targetColumn], counters);
      return row;
    }));
    reportCounters(counters);

    // Write to .mjs file without export default
    const mjsContent = `const jobs = ${JSON.stringify(processedData, null, 2)};`;
    await writeFile(outputMjsFile, mjsContent, 'utf-8');
    console.log(`Successfully output ${outputMjsFile}.`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
convertXlsxToMjs();