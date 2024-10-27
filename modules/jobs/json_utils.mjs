import Ajv from 'ajv';
import dotenv from 'dotenv'; // Userland package for loading environment variables
import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import { Document } from 'docx';
import mammoth from 'mammoth';
import logger from './logger.mjs';
import * as messages from './messages.mjs';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables from .env file
dotenv.config();

// Constants
export const RESUME_SCHEMA_PATH = 'modules/jobs/resume-inputs/resume-schema.json';
export const RESUME_DOCX_PATH = 'modules/jobs/resume-inputs/resume.docx';
export const RESUME_DOCX_JSON_PATH = 'modules/jobs/resume-outputs/resume.docx.json';

// Function definitions

export function isValidNonEmptyString(input) {
    return input !== null && input !== undefined && typeof input === 'string' && input.trim().length > 0;
}

export function isEmptyOrFalsy(value) {
    if (value === null || value === undefined || value === '') {
        return true; // Handles null, undefined, and zero-length string
    }
    if (Array.isArray(value) && value.length === 0) {
        return true; // Handles empty arrays
    }
    if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
        return true; // Handles empty objects
    }
    return false; // Value is not null, undefined, or blank
}

export function isCompleteResumeText(resumeText) {
    const resumeTextUpper = resumeText.toUpperCase();
    return resumeTextUpper.includes('EDUCATION') && resumeTextUpper.includes('EXPERIENCE');
}

export function readJsonFile(filePath) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function isValidJsonObject(jsonObject) {
     if ( jsonObject == null ) {
        logger.info("isValidJsonObject False A");
        return false;
     } else if ( typeof jsonObject != 'object' ) {
        logger.info("isValidJsonObject False B");
        return false;
     } else if ( Object.keys(jsonObject).length == 0 ) {
        logger.info("isValidJsonObject False C");
        return false;
     } else {
        logger.info("isValidJsonObject True");
        return true;
     }
}

export function isValidJsonSchema(schema) {
    if (schema == null || typeof schema != 'object')  {
        logger.warn(`schema is null or not object`);
        return false;
    }
    if (schema.$schema == null || typeof schema.$schema != 'string' || schema.$schema.length == 0) {
        logger.warn(`schema.$schema is null or not a string or empty string`);
        return false;
    }
    if (schema.$schema != 'http://json-schema.org/draft/2019-09/schema' && 
        schema.$schema != 'http://json-schema.org/draft/2020-12/schema' && 
        schema.$schema != 'http://json-schema.org/draft-07/schema#' &&
        schema.$schema != 'http://json-schema.org/draft-06/schema#' &&
        schema.$schema != 'http://json-schema.org/draft-04/schema#' &&
        schema.$schema != 'http://json-schema.org/draft-03/schema#' &&  
        schema.$schema != 'http://json-schema.org/schema#' ) {
        logger.warn(`${schema.$schema} doesn't match valid values`);
        return false;
    }
    if ( schema.type != 'object' && 
        schema.type != 'array' && 
        schema.type != 'string' && 
        schema.type != 'number' && 
        schema.type != 'boolean' && 
        schema.type != 'null' &&
        schema.type != 'integer' ) {
        logger.warn(`schema.type doesn't match valid values: ${schema.type}`);
        return false;
    }
    if (schema.properties == null || typeof schema.properties != 'object' || Object.keys(schema.properties).length == 0) {  
        logger.warn(`schema.properties is null or invalid: ${schema.properties}`);
        return false;
    }
    if (schema.required == null || typeof schema.required != 'object' || Object.keys(schema.required).length == 0) {
        logger.warn(`schema.required is null or invalid: ${schema.required}`);
        return false;
    }
    // if (schema.items == null || typeof schema.items != 'object' || Object.keys(schema.items).length == 0) {
    //     logger.warn(`schema.items is invalid: ${schema.items}`);
    //     return false;
    // }
    // if (schema.additionalProperties == null || typeof schema.additionalProperties != 'boolean') {
    //     logger.warn(`schema.additionalProperties is invalid: ${schema.additionalProperties}`);
    //     return false;
    // }
    logger.info(`schema is valid with string length: ${JSON.stringify(schema).length}`);
    return true;
}

export async function isFileFound(filePath) {
    try {
        await fs.access(filePath);
    } catch (error) {
        return false;
    }
    return true;
}

export function schemaFromString(schemaString) {
    return jsonFromString(schemaString);
}

export function schemaToString(schemaObject) {
    return jsonToString(schemaObject);
}

export function jsonToString(jsonObject) {
    if ( jsonObject == null ) {
        throw new Error(messages.ERROR_UNDEFINED_OR_EMPTY_JSON_OBJECT);
    }
    if (typeof jsonObject != 'object' ) {
        throw new Error(messages.ERROR_NOT_A_JSON_OBJECT + ` : type: ${typeof jsonObject}`);
    }
    const jsonString = JSON.stringify(jsonObject, null, 2);
    return jsonString;
}

export function jsonFromString(jsonString) {
    if ( !isValidNonEmptyString(jsonString) ) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_JSON_STRING);
    }
    const jsonObject = JSON.parse(jsonString);
    return jsonObject;
}

export function getResumeDataPrompt(resumeText, resumeSchemaString) {
    const prompt = `
    Here is a resume text:

        ${resumeText}

    And here is the JSON schema for the resume:

        ${resumeSchemaString}

    Please convert the resume text into a JSON 
    object that conforms to the provided JSON schema.
    Also, remove any text that is not part of the resume.
    `;
    return prompt;
}

export async function savedataObject(resumeJsonPath, dataObject) {
    const dataObjectString = JSON.stringify(dataObject);
    try {
        await fs.writeFile(resumeJsonPath, dataObjectString, 'utf8');
        logger.info(`dataObject saved to resumeJsonPath: ${resumeJsonPath}`);
    } catch (err) {
        throw new Error(messages.ERROR_FAILED_TO_SAVE_RESUME_DATA_OBJECT_TO_RESUME_JSON_PATH + ` resumeJsonPath: ${resumeJsonPath} err: ${err}`);
    }
}

export async function extractTextFromDocxDocument(filePath) {
    if ( !isValidNonEmptyString(filePath) ) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_FILEPATH + `: ${filePath}`);
    }
    let fileIsFound = await isFileFound(filePath);
    if (!fileIsFound) {
        throw new Error(messages.ERROR_FILE_NOT_FOUND + `: ${filePath}`);
    }
    const fileBuffer = readFileSync(filePath); // Correct usage of readFileSync
    if (fileBuffer.length === 0) {
        throw new Error(messages.ERROR_FILE_IS_EMPTY + `: ${filePath}`);
    }
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = (result != null && result.value != null) ? result.value : null;
    if ( !isValidNonEmptyString(text) ) {
        throw new Error(messages.ERROR_FILE_IS_EMPTY + `: ${filePath}`);
    }
    return text;
}

export async function extractTextFromDocument(filePath) {
     if (!isValidNonEmptyString(filePath)) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_FILEPATH + `: ${filePath}`);
    }
    let fileIsFound = await isFileFound(filePath);
    if (!fileIsFound) {
        throw new Error(messages.ERROR_FILE_NOT_FOUND + `: ${filePath}`);
    }
    let extname = path.extname(filePath);
    if ( !isValidNonEmptyString(extname) ) {
        throw new Error(messages.ERROR_FILENAME_EXTENSION_UNDEFINED + ` : ${filePath}`);
    }
    extname = extname.toLowerCase();
    if (extname != '.docx') {
        throw new Error(messages.ERROR_FILENAME_EXTENSION_NOT_SUPPORTED + ` : [${extname}]`);
    }
    const text = await extractTextFromDocxDocument(filePath);
    if ( !isValidNonEmptyString(text) ) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_EXTRACTED_TEXT + ` : ${filePath}`);
    }
    return text;
}

export async function getResumeText(resumeDocPath) {
    if ( !isValidNonEmptyString(resumeDocPath) ) {
        throw new Error(messages.ERROR_NULL_OR_UNDEFINED_OR_EMPTY_FILEPATH);
    }
    const resumeText = await extractTextFromDocxDocument(resumeDocPath);
    if ( !isValidNonEmptyString(resumeText) ) {
        throw new Error(messages.ERROR_NULL_OR_UNDEFINED_OR_EMPTY_STRING);
    }
    if (!resumeText.toLowerCase().includes('education')) {
        throw new Error(messages.ERROR_INVALID_RESUME_TEXT_NO_EDUCATION);
    }
    return resumeText;
}
// single usage below
export function get_single_spaced(str) {
    return str.replace(/\s+/g, ' ');
}

// this is the mother load!
export async function submitPromptAndReturnDataObject(resumeText, resumeSchema) {
    // returns a validated dataObject or throws an error
    if ( !isValidNonEmptyString(resumeText) ) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_RESUME_TEXT);
    }
    if ( !isCompleteResumeText(resumeText) ) {
        throw new Error(messages.ERROR_INCOMPLETE_RESUME_TEXT);
    }
    if ( !isValidJsonSchema(resumeSchema) ) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_RESUME_SCHEMA);
    }
    const resumeSchemaString = JSON.stringify(resumeSchema);
    if ( !isValidNonEmptyString(resumeSchemaString) ) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_RESUME_SCHEMA_STRING);
    }

    const full_prompt = getResumeDataPrompt(resumeText, resumeSchemaString);
    const sngl_prompt = get_single_spaced(full_prompt);
    logger.info('sngl_prompt:' + sngl_prompt);

    logger.info('process.env.ANTHROPIC_API_KEY:' + process.env.ANTHROPIC_API_KEY);
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY // Read API key from .env file
    });
    logger.info('Anthropic instance created');
    logger.info('model: claude-3-5-sonnet-20241022');
    logger.info('max_tokens_to_sample: 3000');
    logger.info("prompt:");
    logger.info('    Anthropic.HUMAN_PROMPT:' + Anthropic.HUMAN_PROMPT );
    logger.info('    sngl_prompt:' + sngl_prompt);
    logger.info('    Anthropic.AI_PROMPT:' + Anthropic.AI_PROMPT );
    logger.info('timeout: 75000');


    // note vitest.config.js has testTimeout: 70000, // 70 seconds
    
    const startMillis = Date.now();
    const model = "claude-3-5-sonnet-20241022";
    const completion = await anthropic.completions
        .create({
            model: model,
            max_tokens_to_sample: 3000,
            prompt: `${Anthropic.HUMAN_PROMPT} ${sngl_prompt} ${Anthropic.AI_PROMPT}`
        },
        { 
            timeout: 75000, // per API request override, 
            // note vitest.config.js has testTimeout: 70000, // 70 seconds
        },
        )
        .catch((err) => {
            if (err instanceof Anthropic.APIError) {
                logger.error('Anthropic.APIError');
                logger.error('err.type:   ' + typeof err); // 400
                logger.error('err.status: ' + err.status); // 400
                logger.error('err.name:   ' + err.name); // BadRequestError
                logger.error('err.headers:' + err.headers); // {server: 'nginx', ...}
            } else {
                logger,error("Unexpected error:", error);
                throw err;
            }
        });

        const elapsedMillis = Date.now() - startMillis;
        logger.info('--o--o--o--o--o--o--o--o--o--o-o--o--o--o--o--o--o--o--o');
        logger.info(`Anthropic completion received after ${elapsedMillis} millis: \n`, 
            completion);
        logger.info('--o--o--o--o--o--o--o--o--o--o-o--o--o--o--o--o--o--o--o');
    logger.info('submitPromptAndReturndataObject returning null');
    return null;
}

export async function getSchema(schemaPath) {
    logger.info(`Getting schema from ${schemaPath}`);
    if ( !isValidNonEmptyString(schemaPath) ) {
        const errorMsg = messages.ERROR_NULL_OR_UNDEFINED_OR_EMPTY_SCHEMA_PATH;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
    const fileIsFound = await isFileFound(schemaPath);
    if (!fileIsFound) {
        const errorMsg = messages.ERROR_FILE_NOT_FOUND + ` : ${schemaPath}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }   
    const schemaString = await fs.readFile (schemaPath, 'utf8');
    logger.info(`reading from schemaPath: ${schemaPath} `);
    if ( !isValidNonEmptyString(schemaString) ) {
        const errorMsg = messages.ERROR_INVALID_OR_EMPTY_SCHEMA_STRING;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
    let schema;
    try {
        schema = JSON.parse(schemaString);
    } catch (e) {
        const errorMsg = messages.ERROR_NOT_A_JSON_OBJECT;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
    if ( !isValidJsonSchema(schema) ) {
        const errorMsg = messages.ERROR_INVALID_JSON_SCHEMA;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
    return schema;
}

// return True if the given dataObject is valid against the given schemaObject
export async function isDataObjectSchemaValid(dataObject, schemaObject) {
    if ( dataObject === null || dataObject === undefined ) {
        logger.error(`dataObject is null or undefined. return FALSE 0`);
        return false;
    }
    if ( !isValidJsonObject(dataObject) ) {
        logger.error(`isDataObjectSchemaValid dataObject type: ${typeof dataObject}`);
        logger.error(`isDataObjectSchemaValid json-stringified dataObject stringlength: ${JSON.stringify(dataObject).length}`);
        logger.error(`dataObject is NOT a valid json object. return FALSE 1`);
        return false;
    }
    // use the schemaObject to create a validator function
    const ajv = new Ajv();
    const validator = ajv.compile(schemaObject);

    // use the validator function to validate the dataObject against the schemaObject   
    if ( !validator(dataObject) ) {
        logger.error(`${ajv.errors}`);
        logger.error(`dataObject is NOT schema-valid. return FALSE 3`);
        return false;
    }
    logger.info(`dataObject is schema-valid. return TRUE`);
    return true;
}

export async function generateAndSavedataObject() {
// get the newly generated dataObject and save it to 
// RESUME_DOCX_JSON_PATH and return it 
// or throw error on failuare
    try {
        logger.info(`Loading dataObject from from ${RESUME_DOCX_PATH} started...`);
        let startTime = Date.now();
        const resumeText = await getResumeText(RESUME_DOCX_PATH);
        const resumeSchema = await getResumeSchema(RESUME_SCHEMA_PATH);
        const dataObject = await submitPromptAndReturnDataObject(resumeText, resumeSchema);
        let elapsedTime = Date.now() - startTime;
        logger.info(`... loading completed in ${elapsedTime} ms`);

        logger.info(`saving dataObject to ${RESUME_DOCX_JSON_PATH} started...`);
        startTime = Date.now();
        savedataObject(RESUME_DOCX_JSON_PATH, dataObject);
        elapsedTime = Date.now() - startTime;
        logger.info(`... saving completed in ${elapsedTime} ms`);
        return dataObject
    } catch (error) {
        logger.error('Error generating and saving resume data object:', error.message);
        const stackTrace = error.stack; // Declare stackTrace
        logger.error('Stack trace:', stackTrace); // Log the stack trace
        throw error;
    }
}

export async function loadResumeJobs() {
    // this is the entry point to get the jobs from the resume
    // it is called from 'modules/index.mjs' import loadResumeJobs;
    // which is called 'index.html'
    try {
        const dataObject = await generateAndSavedataObject();
        if ( dataObject && isValidJsonObject(dataObject) ) {
            let jobs = [];
            for ( let i = 0; i < dataObject['EmploymentHistory'].length; i++ ) {
                jobs.push(dataObject['EmploymentHistory'][i]);
            }
            for ( let i = 0; i < dataObject['Education'].length; i++ ) {
                jobs.push(dataObject['Education'][i]);
            }
            return jobs;
        } else {
            logger.error(messages.ERROR_NOT_A_VALID_RESUME_DATA_OBJECT);
            throw new Error(messages.ERROR_NOT_A_VALID_RESUME_DATA_OBJECT);
        }
    } catch (error) {
        const stackTrace = error.stack;
        logger.error('Error loading resume jobs:', error.message);
        logger.error('Stack trace:', stackTrace);
        throw error;
    }
}


// Entry point for stand-alone mode
async function main() {
    try {
        const resumeJobs = await loadResumeJobs();
        if (!resumeJobs) {
            throw new Error('Failed to load resume jobs');
        }
        console.log('Resume Jobs:', resumeJobs);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack); // Log the full stack trace
    }
}

// Check if the script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}