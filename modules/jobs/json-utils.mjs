import Ajv from 'ajv';
import axios from 'axios';
import { promises as fs } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';
import { Document } from 'docx';
import mammoth from 'mammoth';
import logger from 'modules/jobs/logger.mjs';
import * as messages from 'modules/jobs/messages.mjs';

// Constants
export const RESUME_SCHEMA_PATH = 'modules/jobs/resume-inputs/resume-schema.json';
export const RESUME_DOCX_PATH = 'modules/jobs/resume-inputs/resume.docx';
export const RESUME_DOCX_JSON_PATH = 'modules/jobs/resume-outputs/resume.docx.json';

// Function definitions

export function isValidNonEmptyString(input) {
    return input !== null && input !== undefined && typeof input === 'string' && input.trim().length > 0;
}

export function isCompleteResumeText(resumeText) {
    return resumeText.includes('Education') && resumeText.includes('Experience');
}

export function readJsonFile(filePath) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function isValidJsonObject(jsonObject) {
    return jsonObject != null && typeof jsonObject == 'object' && Object.keys(jsonObject).length > 0;
}

export function isValidJsonSchema(schema) {
    if (schema == null || typeof schema != 'object')  {
        return false;
    }
    if (schema.$schema == null || typeof schema.$schema != 'string' || schema.$schema.length == 0) {
        return false;
    }
    if (schema.$schema != 'http://json-schema.org/draft/2019-09/schema' && 
        schema.$schema != 'http://json-schema.org/draft/2020-12/schema' && 
        schema.$schema != 'http://json-schema.org/draft-07/schema#' &&
        schema.$schema != 'http://json-schema.org/draft-06/schema#' &&
        schema.$schema != 'http://json-schema.org/draft-04/schema#' &&
        schema.$schema != 'http://json-schema.org/draft-03/schema#' &&  
        schema.$schema != 'http://json-schema.org/schema#' ) {
        logger.warn(`schema.$schema is invalid: [${schema.$schema}]`);
        return false;
    }
    if ( schema.type != 'object' && 
        schema.type != 'array' && 
        schema.type != 'string' && 
        schema.type != 'number' && 
        schema.type != 'boolean' && 
        schema.type != 'null' &&
        schema.type != 'integer' ) {
        logger.warn(`schema.type is invalid: ${schema.type}`);
        return false;
    }
    if (schema.properties == null || typeof schema.properties != 'object' || Object.keys(schema.properties).length == 0) {  
        logger.warn(`schema.properties is invalid: ${schema.properties}`);
        return false;
    }
    if (schema.required == null || typeof schema.required != 'object' || Object.keys(schema.required).length == 0) {
        logger.warn(`schema.required is invalid: ${schema.required}`);
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

    Please convert the resume text into a JSON object that conforms to the provided JSON schema.
    `;
    return prompt;
}


export async function saveResumeDataObject(resumeJsonPath, resumeDataObject) {
    if ( !validateResumeDataObject(resumeDataObject) ) {
        throw new Error(messages.ERROR_INVALID_RESUME_DATA_OBJECT);
    }
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
    const fileBuffer = await fs.readFileSync(filePath); // Correct usage of readFileSync
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    if( result == null ) {
        throw new Error(messages.ERROR_NULL_EXTRACTED_RESULT);
    }
    const text = result.value;
    if ( !isValidNonEmptyString(text) ) {
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_EXTRACTED_TEXT);
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
    try {
        return await extractTextFromDocxDocument(filePath);
    } catch (err) {
        logger.error(messages.ERROR_EXTRACTING_TEXT_FROM_DOCX_DOCUMENT + ` : ${filePath} error: ${err}`);
        throw err;
    }
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

export async function getResumeDataObject(resumeText, resumeSchema) {
    if ( !isValidNonEmptyString(resumeText) ) {
        throw new Error(messages.ERROR_INVALID_OREMPTY_RESUME_TEXT);
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
    const prompt = getResumeDataPrompt(resumeText, resumeSchemaString);

    axios.post('http://api.claude.ai/v1/complete', {
        prompt: prompt,
        max_tokens: 500
    })
    .then(response => {
        const resumeDataObjectString = response.data.choices[0].text.trim();
        const resumeDataObject = JSON.parse(resumeDataObjectString);
        return resumeDataObject;
    })
    .catch(error => {
        logger.error('Error:', error);
    });
}

export async function getResumeSchema(schemaPath) {
    logger.info(`Getting resume schema from ${schemaPath}`);
    if ( !isValidNonEmptyString(schemaPath) ) {
        logger.error(messages.ERROR_NULL_OR_UNDEFINED_OR_EMPTY_SCHEMA_PATH);
        throw new Error(messages.ERROR_NULL_OR_UNDEFINED_OR_EMPTY_SCHEMA_PATH);
    }
    let fileIsFound = await isFileFound(schemaPath);
    if (!fileIsFound) {
        logger.error(messages.ERROR_FILE_NOT_FOUND + ` : ${schemaPath}`);
        throw new Error(messages.ERROR_FILE_NOT_FOUND + ` : ${schemaPath}`);
    }   
    const schemaString = await fs.readFileSync (schemaPath, 'utf8');
    logger.info(`reading from schemaPath: ${schemaPath} `);
    logger.info(`Got schemaString ${schemaString}`);
    if ( !isValidNonEmptyString(schemaString) ) {
        logger.error(messages.ERROR_INVALID_OR_EMPTY_SCHEMA_STRING);
        throw new Error(messages.ERROR_INVALID_OR_EMPTY_SCHEMA_STRING);
    }
    const schema = JSON.parse(schemaString);
    if ( !isValidJsonObject(schema) ) {
        logger.error(messages.ERROR_NOT_A_JSON_OBJECT);
        throw new Error(messages.ERROR_NOT_A_JSON_OBJECT);
    }
    if ( !isValidJsonSchema(schema) ) {
        logger.error(messages.ERROR_INVALID_JSON_SCHEMA);
        throw new Error(messages.ERROR_INVALID_JSON_SCHEMA);
    }
    return schema;
}


export async function loadResume() {

    logger.info('Initializing JSON utils');
    const resumeText = await getResumeText(RESUME_DOCX_PATH);
    const resumeSchema = await getResumeSchema(RESUME_SCHEMA_PATH);

    const startTime = Date.now();
    const resumeDataObject = getResumeDataObject(resumeText, resumeSchema);
    const elapsedTime = Date.now() - startTime;
    logger.info(`getResumeDataObject() took ${elapsedTime} ms`);

    const ajv = new Ajv();
    const validateResumeDataObject = ajv.compile(resumeSchema);
    if ( !validateResumeDataObject(resumeDataObject) ) {
        throw new Error(messages.ERROR_INVALID_RESUME_DATA_OBJECT);
    }

    saveResumeDataObject(RESUME_DOCX_JSON_PATH, resumeDataObject);
    logger.info('Done');
}

// uncomment to start loading the resume when this file is imported
// loadResume();