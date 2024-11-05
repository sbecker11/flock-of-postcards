// import { promises as fs } from 'fs';
import fs from 'fs';
import { promises as fs_promises } from 'fs';
import pdf from 'pdf-parse';
// npm install pdf-parse
import officeparser from 'officeparser';
import { type } from 'os';
// npm install officeparser
import { json } from 'stream/consumers';
import Ajv from 'ajv';

import dotenv from 'dotenv'; // Userland package for loading environment variables
import { publicDecrypt } from 'crypto';
dotenv.config();

const RESUME_JSON_SCHEMA_PATH = process.env["RESUME_JSON_SCHEMA_PATH"];
const RESUME_DOCX_PATH = process.env["RESUME_DOCX_PATH"];
const RESUME_PDF_PATH = process.env["RESUME_PDF_PATH"];
const RESUME_TXT_PATH = process.env["RESUME_TXT_PATH"];
const RESUME_OUTPUTS_DIR = process.env["RESUME_OUTPUTS_DIR"];

async function parse_docx(path_to_file_docx) {
  try {
    const dataBuffer = fs.readFileSync(path_to_file_docx);
    const data = await officeparser.parseOfficeAsync(dataBuffer);
    return data;
  } catch (error) {
    console.error('Error parsing docx:', error);
    throw error;
  }
}

async function parse_pdf(path_to_file_pdf) {
  try {
    if (!fs.existsSync(path_to_file_pdf)) {
      throw new Error(`File ${path_to_file_pdf} not found`);
    }
    const dataBuffer = fs.readFileSync(path_to_file_pdf);
    const data = await pdf(dataBuffer);
    return data;
  } catch (error) {
    console.error('Error parsing pdf:', error);
    throw error;
  }
}


// just decode the pdf or docx or txt file or a string buffer
async function readDocument(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`filePath: ${filePath} not found`);
    }
    // Read file content based on file type
    const fileExtension = filePath.split('.').pop().toLowerCase();
    let text = '';

    if (fileExtension === 'pdf') {
      const data = await parse_pdf(filePath);
      if (data.text) text = data.text;
    } else if (fileExtension === 'docx') {
      const data = await parse_docx(filePath);
      if (data.text) text = data.text;
    } else if (fileExtension === 'txt') {
      const data = fs.readFileSync(filePath, 'utf8');
      if (data) text = data;
    } else {
      throw new Error('Unsupported file type');
    }
    return text;
  }
  catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}

async function readSource(filePathOrBuffer) {
  try {
    const filePath = typeof filePathOrBuffer === 'string' ? filePathOrBuffer : '';
    const buffer = Buffer.isBuffer(filePathOrBuffer) ? filePathOrBuffer : null;
    let text = null;
    if (filePath && !buffer) {
      text = await readDocument(filePath);
      if (!text) {
        throw new Error('No text found in the resume');
      }
    }
    else if (filePath && !fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    else if (buffer) {
      text = buffer.toString();
    }
    else {
      throw new Error('Invalid input');
    }
    if (!text || text.length === 0) {
      throw new Error('No text found in the source');
    }
    return text;
  }
  catch (error) {
    console.error('Error reading source:', error);
    throw error;
  }
}
const headerPattern = /^.*$/s;
const fullNamePattern = /^[A-Z][a-zA-Z]+(?:[-' ][A-Z][a-zA-Z]+)*$/m;
const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
const phonePattern = /\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/;
const titlePattern = /^[A-Za-z\s/]+$/;
const introPattern = /.{200,}/;

function extractField(text, fieldName, pattern) {
  const match = text.match(pattern);
  if (match) {
    return match[0];
  } else {
    throw new Error(`Field ${fieldName} not found given pattern: ${pattern}`);
  }
}

function extractHeader(text) {
  const match = text.match(headerPattern);
  if (match) {
    const header = match[0];
    const fullName = extractField(header, 'fullName', fullNamePattern);
    console.log('Extracted header.fullName:', fullName);
    const email = extractField(header, 'email', emailPattern);
    console.log('Extracted header.email:', email);
    const phone = extractField(header, 'phone', phonePattern);
    console.log('Extracted header.phone:', phone);
    const title = extractField(header, 'title', titlePattern);
    console.log('Extracted header.title:', title);
    const intro = extractField(header, 'intro', introPattern);
    console.log('Extracted header.intro:', intro);

    return {
      fullName,
      email,
      phone,
      title,
      intro
    };

  } else {
    throw new Error('Header not found');
  }
}

async function parseResume(resumeText) {
  try {
    const header = extractHeader(resumeText);
    console.log('Extracted resume.header:', JSON.stringify(header, null, 2));

    const resume = {
      header: header
    };

    return resume;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}

// function extractEmploymentHistory(text) {
//   try {
//     const employmentHistoryText = text.match(/EXPERIENCE(.*?)(?=EDUCATION|SKILLS|$)/si)?.[1] || '';
//     const employmentHistory = [];
//     const jobEntriesText = employmentHistoryText.split('\n\n').filter(Boolean);
//     for (const jobEntryText of jobEntriesText) {
//       const jobEntry = extractJobEntry(jobEntryText);
//       employmentHistory.push(jobEntry);
//     }
//     return employmentHistory;
//   } 
//   catch (error) {
//     console.error('Error extracting employment history:', error);
//     throw error;
//   }
// }

// function extractJobEntry(text) {
//   try {
//     const jobEntry = {
//       jobHeader: extractJobHeader(text),
//       responsibilities: extractResponsibilities(text)
//     };
//     return jobEntry;
//   }
//   catch (error) {
//     console.error('Error extracting job entry:', error);
//     throw error;
//   }
// }

// function extractJobHeader(text) {
//   try {
//     const positionTitle = text.match(/^[A-Z][a-zA-Z\s-]+/);
//     const employerName = text.match(/at\s[A-Z][a-zA-Z\s&-]+/);
//     const dateRange = text.match(/\(\w{3,10}\s?\d{4}\s*-\s*\w{3,10}\s?\d{4}|Present\)/);
//     const typeOfWork = text.match(/Full-Time|Part-Time|Contract|Internship/);
//     const location = text.match(/in\s[A-Za-z\s,]+/);
//     const jobHeader = {
//       positionTitle: positionTitle ? positionTitle[0] : '',
//       employerName: employerName ? employerName[0] : '',
//       dateRange: dateRange ? dateRange[0] : '',
//       typeOfWork: typeOfWork ? typeOfWork[0] : '',
//       location: location ? location[0] : '',
//       responsibilities: extractResponsibilities(text)
//     };
//     return jobHeader;
//   }
//   catch (error) {
//     console.error('Error extracting job header:', error);
//     throw error;
//   } 
// }

// function extractResponsibilities(text) {
//   try {
//     const bulletPattern = /^(?:[*•●-])\s.+?[.!?]$/gm;
//     const responsibilities = text.match(bulletPattern) || [];
//     return responsibilities.map(responsibility => responsibility.slice(2).trim());
//   }
//   catch (error) {
//     console.error('Error extracting responsibilities:', error);
//     throw error;
//   }
// }

// function extractEducationSection(text) {
//   try {
//     const educationSectionText = text.match(/EDUCATION(.*?)(?=EXPERIENCE|SKILLS|$)/si)?.[1] || '';
//     const educationSection = {
//       degrees: extractEducationDegrees(educationSectionText)
//     }
//     return educationSection;
//   }
//   catch (error) {
//     console.error('Error extracting education section:', error);
//     throw error;
//   }
// }

// function extractEducationDegrees(text) {
//   try {
//     const educationPattern = /^(?<university>[A-Z][a-zA-Z\s-]+)\s?(?:\((?<location>[A-Za-z\s,]+)\))?,\s(?<degree>[A-Z][a-zA-Z\s-]+)\sin\s(?<major>[A-Z][a-zA-Z\s-]+)\s(?<dateRange>\(\d{4}\s*-\s*\d{4}\)|Present)/gm;
//     return [...text.matchAll(educationPattern)].map((match) => ({
//         university: match.groups.university,
//         location: match.groups.location,
//         degree: match.groups.degree,
//         major: match.groups.major,
//         dateRange: match.groups.dateRange
//     }));
//   }
//   catch (error) {
//     console.error('Error extracting education degrees:', error);
//     throw error;
//   }
// }

// function extractSkillsSection(text) {
//   try {
//     const skillsSectionText = text.match(/SKILLS(.*?)(?=EDUCATION|EXPERIENCE|$)/si)?.[1] || '';
//     const skillsSection = {
//       skills: extractSkills(skillsSectionText)
//     }
//     return skillsSection;
//   }
//   catch (error) {
//     console.error('Error extracting skills section:', error);
//     throw error;
//   } 
// }

// function extractSkills(text) {
//   try {
//     // extracts skills from a bulleted list of phrases
//     const bulletPattern = /^(?:[*•●-])\s.+?[.!?]$/gm;
//     const skills = text.match(bulletPattern) || [];
//     return skills.map(skill => skill.slice(2).trim());
//   } 
//   catch (error) {
//     console.error('Error extracting skills:', error);
//     throw error;
//   }
// }

// function extractPublications(text) {
//   // publications sectino starts with "PUBLICATIONS" and ends with "REFERENCES" or "SKILLS" or end of text
//   try {
//     const publicationSectionText = text.match(/PUBLICATIONS(.*?)(?=REFERENCES|SKILLS|$)/si)?.[1] || '';
//     const publications = [];
//     const publicationEntriesText = publicationSectionText.split('\n\n').filter(Boolean);
//     for ( let publicationEntryText of publicationEntriesText ) {
//       const publication = extractPublication(publicationEntryText);
//       publications.push(publication);
//     }
//     return publications;
//   }
//   catch (error) {
//     console.error('Error extracting publications:', error);
//     throw error;
//   }
// }

// function extractPublication(text) {
//   try {
//     const publication = {
//       title: text.match(/^[A-Z][a-zA-Z\s-]+/),
//       authors: text.match(/by\s[A-Z][a-zA-Z\s-]+/),
//       publicationDate: text.match(/\(\d{4}\)/),
//       url: text.match(/^(https?|ftp):\/\/[\w.-]+(?:\.[\w\.-]+)+[/#?]?.*$/)
//     }
//     return publication;
// } 
// catch (error) {
//     console.error('Error extracting publication:', error);
//     throw error;
//   }
// }

function readJsonSchema(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} not found`);
    }
    const jsonSchemaText = fs.readFileSync(filePath, 'utf8');
    if (!jsonSchemaText) {
      throw new Error('Invalid JSON file');
    }
    let jsonSchema = null;
    try {
      jsonSchema = JSON.parse(jsonSchemaText);
    }
    catch (error) {
      console.error('Error parsing JSON schema:', error);
      throw error;
    }
    let adv = null;
    try {
      const ajv = new Ajv({
        allErrors: true,
        verbose: true,
        strict: false,
        strictTuples: false,
        strictTypes: false
      });
      adv = ajv.compile(jsonSchema);
      if (!adv) {
        throw new Error('Invalid schema');
      }
    }
    catch (error) {
      console.error('Error compiling JSON schema:', error);
      throw error;
    }
    return jsonSchema;
  }
  catch (error) {
    console.error(`Error reading JSON schema from filePath: ${filePath}`, error);
    throw error;
  }
}

function createJsonSchemaValidator(jsonSchema) {
  try {
    const ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      strictTuples: false,
      strictTypes: false
    });

    console.log("******************************");
    const schemaString = JSON.stringify(jsonSchema, null, 2);
    console.log(`jsonSchema:\n${schemaString}`);
    console.log("******************************");

    const schemaValidator = ajv.compile(jsonSchema);
    if (!schemaValidator) {
      throw new Error('Invalid jsonSchema');
    }
    return schemaValidator;
  }
  catch (error) {
    console.error('Error creating JSON schema validator:', error);
    throw error;
  } 
}

function findLineInJson(jsonString, path) {
  const lines = jsonString.split('\n');
  let lineNumber = 0;
  let charCount = 0;

  for (let i = 0; i < lines.length; i++) {
    charCount += lines[i].length + 1; // +1 for the newline character
    if (jsonString.indexOf(path) !== -1) {
      lineNumber = i + 1;
      break;
    }
  }

  return lineNumber;
}

// Usage example
async function main() {
  try {
    const pdfDocumentPath = RESUME_PDF_PATH;
    if ( !fs.existsSync(pdfDocumentPath) ) {
      throw new Error(`File ${pdfDocumentPath} not found`);
    }
    const pdfResumeText = await readSource(pdfDocumentPath);
    console.log(`pdfResumeText ${pdfResumeText}`);
    
    const pdfResumeJson = await parseResume(pdfResumeText);
    console.log(`pdfResumeJson: ${JSON.stringify(pdfResumeJson, null, 2)}`);
    
    // Optionally save to file
    const resumeOutputsDir = RESUME_OUTPUTS_DIR;
    if ( !fs.existsSync(resumeOutputsDir) ) {
      throw new Error(`File ${resumeOutputsDir} not found`);
    }
    const pdfResumeJsonPath = resumeOutputsDir + 'pdf-resume.json';
    fs.writeFileSync(pdfResumeJsonPath, JSON.stringify(pdfResumeJson, null, 2));
    console.log(`pdfResumeJson saved to ${pdfResumeJsonPath}`);

    const jsonSchemaPath = RESUME_JSON_SCHEMA_PATH;
    if ( !fs.existsSync(jsonSchemaPath) ) {
      throw new Error(`File ${jsonSchemaPath} not found`);
    }
    const jsonSchema = readJsonSchema(jsonSchemaPath);
    const schemaValidator = createJsonSchemaValidator(jsonSchema);
    console.log(`schemaValidator read from ${jsonSchemaPath}`);

    const valid = schemaValidator(pdfResumeJson);
    if (!valid) {
      console.error('JSON data does not match the schema');
      if ( !fs.existsSync(pdfResumeJsonPath) ) {
        throw new Error(`File ${pdfResumeJsonPath} not found`); 
      }
      const jsonData = JSON.parse(await fs_promises.readFile(pdfResumeJsonPath, 'utf8'));
      const jsonString = JSON.stringify(jsonData, null, 2);
      schemaValidator.errors.forEach(error => {
        const lineNumber = findLineInJson(jsonString, error.instancePath);
        console.error(`Error at ${error.instancePath} (line ${lineNumber}): ${error.message}`);
      });
      throw new Error('Validation failed');
    }
    console.log('pdfResumeJson is valid against the schemaValidator');
  } 
  catch (error) {
    console.error('Error:', error);
  }
}

main();
