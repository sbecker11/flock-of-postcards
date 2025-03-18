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
const targetColumn = 'Description'; // Now in column F
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

import { resolve, basename } from 'path';

import path from 'path';
import sanitize from 'sanitize-filename';

const inputXlsxFile = path.resolve(sanitize(args[0] || defaultInputXlsxFile));
const outputMjsFile = path.resolve(sanitize(args[1] || defaultOutputMjsFile));

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

// Simple Levenshtein distance for string similarity
function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

// Find the best matching job name
function findBestMatch(target, options) {
  let bestMatch = null;
  let minDistance = Infinity;
  options.forEach(option => {
    const distance = levenshteinDistance(target.toLowerCase(), option.toLowerCase());
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = option;
    }
  });
  return { match: bestMatch, distance: minDistance };
}

// Test URL reachability with timeout
async function testUrl(url) {
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
    const response = await fetchWithTimeout(url, { method: 'HEAD', redirect: 'follow' }, MAX_TRANSFORMATION_SECONDS * 1000);
    if (response.status === 200) {
      logger.info(`Success: url:${url} is reachable`);
      return { valid: url, code: -1 };
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      logger.info(`Timeout: url:${url} exceeded ${MAX_TRANSFORMATION_SECONDS}s`);
      return { valid: null, code: -3 };
    }
  }
  logger.info(`Failure: url:${url} could not be resolved`);
  return null;
}

// Test and permute URLs with timeout (for web links)
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

// Process description and extract references
async function processDescription(text, counters) {
  if (!text) return { description: text, references: [] };

  let newText = text;
  const references = [];

  const imagePattern = /\[([^\[\]]+)\]\{([^\{\}]+)\}/g;
  let match;
  while ((match = imagePattern.exec(text)) !== null) {
    const label = `[${match[1]}]`;
    const imageUrl = match[2];
    const imageResult = await testUrl(imageUrl);
    const imgClass = imageResult ? (imageResult.valid ? 'img-ref' : 'img-ref-error') : 'img-ref-not-found';
    const refHtml = `<div class="${imgClass}">${label}<img src="${imageUrl}"/></div>`;
    references.push(refHtml);
    newText = newText.replace(match[0], label);
  }

  const combinedPattern = /\[([^\[\]]+)\]\{([^\{\}]+)\}\(([^\s)]+)\)/g;
  while ((match = combinedPattern.exec(text)) !== null) {
    const label = `[${match[1]}]`;
    const imageUrl = match[2];
    const webUrl = match[3];
    const imageResult = await testUrl(imageUrl);
    const webResult = await testPermutedUrl(webUrl);
    let validatedWebUrl = webUrl;
    if (webResult) {
      if (webResult !== null && webResult !== undefined && webResult.code === -3) {
        counters.skipped_timeout_cnt++;
      } else if (webResult !== null && webResult !== undefined && webResult.valid) {
        validatedWebUrl = webResult ? webResult.valid : '';
        if (webResult && webResult.code === -1) counters.valid_no_changes_cnt++;
        else counters.valid_some_changes_cnt++;
      } else {
        counters.invalid_all_changes_cnt++;
        validatedWebUrl = '';
      }
    } else {
      counters.invalid_all_changes_cnt++;
      validatedWebUrl = '';
    }
    const imgClass = imageResult && imageResult.valid ? 'img-ref' : (imageResult ? 'img-ref-error' : 'img-ref-not-found');
    const anchorClass = validatedWebUrl ? 'anchor-ref' : 'anchor-ref-not-found';
    const refHtml = `<div class="${imgClass} ${anchorClass}">${label}<a href="${validatedWebUrl}"><img src="${imageUrl}"/></a></div>`;
    references.push(refHtml);
    newText = newText.replace(match[0], label);
  }

  const labeledWebPattern = /\[([^\[\]]+)\]\(([^\s)]+)\)/g;
  while ((match = labeledWebPattern.exec(text)) !== null) {
    const label = `[${match[1]}]`;
    const webUrl = match[2];
    const webResult = await testPermutedUrl(webUrl);
    let validatedWebUrl = webUrl;
    if (webResult) {
      if (webResult !== null && webResult !== undefined && webResult.code === -3) {
        counters.skipped_timeout_cnt++;
      } else if (webResult !== null && webResult !== undefined && webResult.valid) {
        validatedWebUrl = webResult ? webResult.valid : '';
        if (webResult && webResult.code === -1) counters.valid_no_changes_cnt++;
        else counters.valid_some_changes_cnt++;
      } else {
        counters.invalid_all_changes_cnt++;
        validatedWebUrl = '';
      }
    } else {
      counters.invalid_all_changes_cnt++;
      validatedWebUrl = '';
    }
    const anchorClass = validatedWebUrl ? 'anchor-ref' : 'anchor-ref-not-found';
    const refHtml = `<div class="${anchorClass}"><a href="${validatedWebUrl}">${label}</a></div>`;
    references.push(refHtml);
    newText = newText.replace(match[0], label);
  }

  const webPattern = /\((?:https?:\/\/)?([^\s)]+)\)/g;
  while ((match = webPattern.exec(text)) !== null) {
    const originalUrl = match[1];
    if (!match) continue;
    const fullMatch = match[0];
    const webResult = await testPermutedUrl(originalUrl);
    let validatedWebUrl = originalUrl;
    if (webResult) {
      if (webResult !== null && webResult !== undefined && webResult.code === -3) {
        counters.skipped_timeout_cnt++;
      } else if (webResult && webResult.valid) {
        validatedWebUrl = webResult.valid;
        if (webResult.code === -1) counters.valid_no_changes_cnt++;
        else counters.valid_some_changes_cnt++;
      } else {
        counters.invalid_all_changes_cnt++;
        validatedWebUrl = '';
      }
    } else {
      counters.invalid_all_changes_cnt++;
      validatedWebUrl = '';
    }
    if (validatedWebUrl) {
      const anchorClass = validatedWebUrl ? 'anchor-ref' : 'anchor-ref-not-found';
      const refHtml = `<div class="${anchorClass}"><a href="${validatedWebUrl}">${validatedWebUrl}</a></div>`;
      references.push(refHtml);
    }
    newText = newText.replace(fullMatch, validatedWebUrl);
  }

  return { description: newText.trim(), references };
}

// Main function
async function convertXlsxToMjs() {
  try {
    console.log(`Processing input: ${inputXlsxFile}`);
    console.log(`Outputting to: ${outputMjsFile}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputXlsxFile);

    // Process "jobs" sheet
    const jobsSheet = workbook.getWorksheet('jobs');
    if (!jobsSheet) throw new Error('Sheet "jobs" not found');
    const jobHeaders = jobsSheet.getRow(1).values.slice(1);
    const jobsData = [];
    const employerNames = [];
    jobsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj = {};
      row.eachCell((cell, colNumber) => {
        const header = jobHeaders[colNumber - 1];
        let value;
        if (header === 'start' || header === 'end') {
          if (typeof cell.value === 'string') value = cell.value.trim();
          else if (cell.value instanceof Date) value = cell.value.toISOString().split('T')[0];
          else if (cell.text) value = cell.text;
          else value = null;
        } else {
          value = cell.value === null || cell.value === undefined ? null : cell.value.toString();
        }
        obj[header] = value;
      });
      jobsData.push(obj);
      if (obj['employer']) employerNames.push(obj['employer'].trim());
    });

    if (!jobHeaders.includes(targetColumn)) {
      throw new Error(`'${targetColumn}' field not found in columns: ${jobHeaders}`);
    }

    // Process "job-skills" sheet
    const skillsSheet = workbook.getWorksheet('job-skills');
    if (!skillsSheet) throw new Error('Sheet "job-skills" not found');
    const skillsHeaders = skillsSheet.getRow(1).values;
    const jobSkillsMap = {};

    for (let col = 3; col <= 22; col++) {
      const jobName = skillsHeaders[col]?.toString().trim();
      if (jobName) {
        jobSkillsMap[jobName] = { column: col, skills: {} };
      }
    }

    skillsSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const skillName = row.getCell(1).value?.toString().trim();
      if (!skillName) return;
      for (let col = 3; col <= 22; col++) {
        const jobName = skillsHeaders[col]?.toString().trim();
        if (!jobName) continue;
        const cellValue = row.getCell(col).value;
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          jobSkillsMap[jobName].skills[rowNumber] = skillName;
        }
      }
    });

    // Process descriptions and add skills with fuzzy matching
    const counters = initCounters();
    const processedData = await Promise.all(jobsData.map(async row => {
      const { description, references } = await processDescription(row[targetColumn], counters);
      row[targetColumn] = description;
      row.references = references;

      const employer = row['employer']?.toString().trim();
      if (employer) {
        const { match, distance } = findBestMatch(employer, Object.keys(jobSkillsMap));
        if (match && distance < 10) {
          row['job-skills'] = jobSkillsMap[match].skills;
          if (distance > 0) {
            logger.info(`Matched "${employer}" to "${match}" (distance: ${distance})`);
          }
        } else {
          logger.warn(`No close match found for employer: "${employer}" (best: "${match}", distance: ${distance})`);
          row['job-skills'] = {};
        }
      } else {
        logger.warn(`No employer specified for job, skipping job-skills`);
        row['job-skills'] = {};
      }
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
