import Ajv from 'ajv';
import dotenv from 'dotenv'; // Userland package for loading environment variables
import { promises as fs } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';
import { Document } from 'docx';
import mammoth from 'mammoth';
import logger from 'modules/jobs/logger.mjs';
import * as messages from 'modules/jobs/messages.mjs';
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
        throw new Error(messages.ERROR_NOT_A_JSON_OBJECT);
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

export async function saveResumeDataObject(resumeJsonPath, resumeDataObject) {
    const resumeDataObjectString = JSON.stringify(resumeDataObject);
    try {
        await fs.writeFile(resumeJsonPath, resumeDataObjectString, 'utf8');
        logger.info(`resumeDataObject saved to ${resumeJsonPath}`);
    } catch (err) {
        throw new Error(messages.ERROR_FAILED_TO_SAVE_RESUME_DATA_OBJECT_TO_RESUME_JSON_PATH + ` : ${resumeJsonPath} err: ${err}`);
    }
}

export async function extractTextFromDocxDocument(filePath) {
    if ( !isValidNonEmptyString(filePath) ) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_FILEPATH);
    }
    let fileIsFound = await isFileFound(filePath);
    if (!fileIsFound) {
        throw new Error(messages.ERROR_FILE_NOT_FOUND + ` : ${filePath}`);
    }
    const fileBuffer = readFileSync(filePath); // Correct usage of readFileSync
    if (fileBuffer.length === 0) {
        throw new Error(messages.ERROR_FILE_IS_EMPTY + ` : ${filePath}`);
    }
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = (result != null && result.value != null) ? result.value : null;
    if ( !isValidNonEmptyString(text) ) {
        throw new Error(messages.ERROR_FILE_IS_EMPTY + ` : ${filePath}`);
    }
    return text;
}

export async function extractTextFromDocument(filePath) {
    if (!isValidNonEmptyString(filePath)) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_FILEPATH);
    }
    let fileIsFound = await isFileFound(filePath);
    if (!fileIsFound) {
        throw new Error(messages.ERROR_FILE_NOT_FOUND + ` : ${filePath}`);
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
    if ( !resumeText.includes('Education') ) {
        throw new Error(messages.ERROR_INVALID_RESUME_TEXT_NO_EDUCATION);
    }
    return resumeText;
}
// single usage below
function get_single_spaced(str) {
    return str.replace(/\s+/g, ' ');
}

export async function getResumeDataObject(resumeText, resumeSchema) {
    // returns a validated resumeDataObject or throws an error
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

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY, // Read API key from .env file
    });
    // note vitest.config.js has testTimeout: 70000, // 70 seconds
    
    const startMillis = Date.now();
    const model = "claude-3-sonnet-20240229";
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
                logger.error(err.status); // 400
                logger.error(err.name); // BadRequestError
                logger.error(err.headers); // {server: 'nginx', ...}
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
    logger.info('getResumeDataObject returning null');
    return null;

    // axios.post('http://api.claude.ai/v1/complete', {
    //     prompt: prompt,
    //     max_tokens: 500
    // })
    // .then(response => {
    //     logger.info('--+--+--+--+--+--+--+--+--+--+-+--+--+--+--+--+--+--+--+');
    //     logger.info(`resonse: ${response}`);
    //     logger.info(`resonse.status: ${response.status}`);
    //     logger.info(`resonse.statusText: ${response.statusText}`);
    //     logger.info(`resonse.headers: ${response.headers}`);
    //     logger.info(`resonse.config: ${response.config}`);
    //     logger.info(`resonse.data: ${response.data}`);
    //     logger.info(`resonse.data.choices: ${response.data.choices}`);
    //     logger.info(`resonse.data.choices[0]: ${response.data.choices[0]}`);
    //     logger.info(`resonse.data.choices[0].text: ${response.data.choices[0].text}`);
    //     logger.info(`--+--+--+--+--+--+--+--+--+--+-+--+--+--+--+--+--+--+--+`);
    //     logger.info(`resumeDataObjectString: ${resumeDataObjectString}`);
    //     logger.info(`--+--+--+--+--+--+--+--+--+--+-+--+--+--+--+--+--+--+--+`);

    //     const resumeDataObjectString = response.data.choices[0].text.trim();
    //     if ( !isValidNonEmptyString(resumeDataObjectString) ){
    //         throw new Error(messages.ERROR_INVALID_OR_EMPTY_RESUME_DATA_OBJECT_STRING);
    //     }
    //     const resumeDataObject = JSON.parse(resumeDataObjectString);
    //     if ( !isValidResumeDataObject(resumeDataObject) ) {
    //         throw new Error(messages.ERROR_NOT_A_VALID_RESUME_DATA_OBJECT);
    //     }
    //     return resumeDataObject;
    // })
    // .catch(error => {
    //     logger.error(error);
    //     throw error;
    // });
}  // getResumeDataObject

// async function sendRequest(request) {
//     let response = null;
//     let payload = {
//         model: 'gpt-4',
//         temperature: 1,
//         top_p: 1,
//         messages: [{
//             role: 'user',
//             content: request
//         }]
//     }
//     try {
//         response = await axios.post(
//             'https://api.openai.com/v1/chat/completions',
//             JSON.stringify(payload), {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer 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`,
//             },
//         });
//         if(!response) throw new Error('No response');
//         if (response.data && response.data.choices && response.data.choices.length > 0) {
//             response = response.data.choices[0].message.content;
//         } else {
//             throw new Error('No completion found');
//         }
//     } catch (error) { throw error;  }
//     return response;
// };

// As an artificial intelligence, I don't have feelings. But I'm here, ready to help you. How can I assist you today?

// returns a function that can be called to send a request to the AI. the prompt defines the main
// prompt that will be sent to the AI. The prompt may contain a mumber of replacement markers.
// the markers are defined as {0}, {1}, {2}, etc. The function returns a function that takes parameters
// that will replace the markers in the prompt. The function returns a promise that resolves to the
// response from the AI.
// function createAIFunction(prompt) {
//     return function (...args) {
//         let request = prompt;
//         for (let i = 0; i < args.length; i++) {
//             request = request.replace(`{${i}}`, args[i]);
//         }
//         return sendRequest(request);
//     }
// }

// // example usage
// const aiFunction = createAIFunction('Create a {0} that {1}.');

// // this calls the prompt "Create a function that returns the sum of two numbers." and returns the response from the AI.
// aiFunction('function', 'returns the sum of two numbers').then(logger.info);


export async function getResumeSchema(schemaPath) {
    logger.info(`Getting resume schema from ${schemaPath}`);
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

export async function isValidResumeDataObject(resumeDataObject) {
    if ( resumeDataObject === null || resumeDataObject === undefined ) {
        logger.error(`resumeDataObject is null or undefined. return FALSE 0`);
        return false;
    }
    if ( !isValidJsonObject(resumeDataObject) ) {
        logger.error(`isValidResumeDataObject type: ${typeof resumeDataObject}`);
        logger.error(`isValidResumeDataObject stringlength: ${JSON.stringify(resumeDataObject).length}`);
        logger.error(`resumeDataObject is NOT a valid json object. return FALSE 1`);
        return false;
    }
    const resumeSchema = await getResumeSchema(RESUME_SCHEMA_PATH);
    if ( !isValidJsonSchemaObject(resumeSchema) ) {
        logger.error(`resumeSchema is NOT a valid json schema object. return FALSE 2`);
        return false;
    }
    const ajv = new Ajv();
    const valildator = ajv.compile(resumeSchema);
    if ( !validator(resumeDataObject) ) {
        logger.error(`${ajv.errors}`);
        logger.error(`resumeDataObject is NOT a valid resume data object. return FALSE 3`);
        return false;
    }
    logger.info(`resumeDataObject is a valid resume data object. return TRUE`);
    return true;
}

export async function loadAndSaveResumeDataObject() {
// return the newly loaded and saved resumeDataObject 
// or throw error on failuare
    try {
        logger.info(`Loading resumeDataObject from from ${RESUME_DOCX_PATH} started...`);
        let startTime = Date.now();
        const resumeText = await getResumeText(RESUME_DOCX_PATH);
        const resumeSchema = await getResumeSchema(RESUME_SCHEMA_PATH);
        const resumeDataObject = await getResumeDataObject(resumeText, resumeSchema);
        let elapsedTime = Date.now() - startTime;
        logger.info(`... loading completed in ${elapsedTime} ms`);

        logger.info(`saving resumeDataObject to ${RESUME_DOCX_JSON_PATH} started...`);
        startTime = Date.now();
        saveResumeDataObject(RESUME_DOCX_JSON_PATH, resumeDataObject);
        elapsedTime = Date.now() - startTime;
        logger.info(`... saving completed in ${elapsedTime} ms`);
        return resumeDataObject
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

export async function loadResumeJobs() {
    // this is the entry point to get the jobs from the resume
    const resumeDataObject = await loadAndSaveResumeDataObject();
    if ( resumeDataObject && isValidJsonObject(resumeDataObject) ) {
        let jobs = [];
        for ( let i = 0; i < resumeDataObject['EmploymentHistory'].length; i++ ) {
            jobs.push(resumeDataObject['EmploymentHistory'][i]);
        }
        for ( let i = 0; i < resumeDataObject['Education'].length; i++ ) {
            jobs.push(resumeDataObject['Education'][i]);
        }
        return jobs;
    } else {
        logger.error(ERROR_NOT_A_VALID_RESUME_DATA_OBJECT);
        return null;
    }
}
