import Ajv from 'ajv';
// import addFormats from 'ajv-formats';
// import draft07Schema from 'ajv/lib/refs/json-schema-draft-07.json';

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import logger from './logger.mjs';
import * as jsonutils from './json_utils.mjs';
import * as messages from './messages.mjs';
// import JsonSchema from './json_schema.mjs';

// Define constants for the paths to the test files
const TEST_FILES_DIR = path.join(__dirname, 'test-files');
const TEST_RESUME_DOCX_PATH = path.join(TEST_FILES_DIR, 'abbr-resume.docx');
const TEST_RESUME_PDF_PATH = path.join(TEST_FILES_DIR, 'abbr-resume.pdf');
const TEST_SIMPLE_RESUME_OBJ_PATH = path.join(TEST_FILES_DIR, 'simple-resume-obj.json');

if ( !fs.existsSync(TEST_FILES_DIR) ) {
    throw new Error(messages.ERROR_TEST_FILES_DIR_NOT_FOUND + ` : ${TEST_FILES_DIR}`);
}
if ( !fs.existsSync(TEST_RESUME_DOCX_PATH) ) {
    throw new Error(messages.ERROR_TEST_RESUME_DOCX_NOT_FOUND + ` : ${TEST_RESUME_DOCX_PATH}`);
}
if ( !fs.existsSync(TEST_RESUME_PDF_PATH) ) {
    throw new Error(messages.ERROR_TEST_RESUME_PDF_NOT_FOUND + ` : ${TEST_RESUME_PDF_PATH}`);
}
if ( !fs.existsSync(TEST_SIMPLE_RESUME_OBJ_PATH) ) {
    throw new Error(messages.ERROR_TEST_SIMPLE_RESUME_OBJ_NOT_FOUND + ` : ${TEST_SIMPLE_RESUME_OBJ_PATH}`); 
}

describe('should extract text from document', () => {
    it('should thow an error given a null or undefined or empty filePath', async () => {
        let filePath = null;
        await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_UNDEFINED_OR_EMPTY_FILEPATH);
    });

    it('should throw an error if file not found', async () => {
        const filePath = "modules/jobs/test-files/non-existent-file.docx";
        let expected_err_message = messages.ERROR_FILE_NOT_FOUND + `: ${filePath}`;
        await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(expected_err_message);
    });

    it('should throw an error if file is found but extension is missing', async () => {
        const filePath = "modules/jobs/test-files/no-extension";
        const extname = path.extname(filePath);
        await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_FILENAME_EXTENSION_UNDEFINED + ` : ${filePath}`);
    });

    it('should throw an error if file is found and extension is found but is not supported', async () => {
        const filePath = "modules/jobs/test-files/small.pdf";
        const extname = path.extname(filePath);
        await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_FILENAME_EXTENSION_NOT_SUPPORTED + ` : [${extname}]`);
    });

    it('should throw an error if valid filePath, file is found, has supported extension but file is empty ', async () => {
        const filePath = "modules/jobs/test-files/empty.docx";
        await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_FILE_IS_EMPTY + `: ${filePath}`);
    });

    it('should extract text from a DOCX file that exists and has supported extension', async () => {
        const filePath = "modules/jobs/test-files/small.docx";
        const text = await jsonutils.extractTextFromDocument(filePath);
        const isValid = jsonutils.isValidNonEmptyString(text);
        expect(isValid).toBe(true);
        return text;
    });

    it('should extract text from a DOCX file with special characters', async () => {
        const filePath = "modules/jobs/test-files/special_chars.docx";
        const text = await jsonutils.extractTextFromDocument(filePath);
        const isValid = jsonutils.isValidNonEmptyString(text) &&messages.SPECIAL_CHARACTERS_REGEXP.test(text);
        if ( !isValid ) {
            throw new Error(messages.ERROR_SPECIAL_CHARACTERS_FAILED + ` : ${filePath}`);
        }
        expect(isValid).toBe(true);
    });

    it('should handle a large DOCX file', async () => {
        const filePath = "modules/jobs/test-files/2025-words.docx";
        const text = await jsonutils.extractTextFromDocument(filePath);
        const isValid = jsonutils.isValidNonEmptyString(text) && text.length >= messages.LARGE_FILE_LENGTH; // Assuming large file has more than 10,000 characters
        expect(isValid).toBe(true);
    });

    it('should ignore images in a DOCX file', async () => {
        const filePath = "modules/jobs/test-files/abbr-resume-with-image.docx";
        const text = await jsonutils.extractTextFromDocument(filePath);
        const isValid = jsonutils.isValidNonEmptyString(text) && !text.includes(messages.IMAGE_CONTENT);
        expect(isValid).toBe(true);
    });

    it('should ignore table directives in a DOCX file', async () => {
        const filePath = "modules/jobs/test-files/abbr-resume-with-table.docx";
        const text = await jsonutils.extractTextFromDocument(filePath);
        const isValid = jsonutils.isValidNonEmptyString(text) && !text.includes(messages.TABLE_CONTENT);
        expect(isValid).toBe(true);
    });
});

describe('should validate RESUME_JSON_SCHEMA_PATH is a valid path that can be used to create a JsonSchema', () => {
    it('should validate RESUME_JSON_SCHEMA_PATH is a valid path', async () => {
        let filePath = jsonutils.RESUME_JSON_SCHEMA_PATH;
        let isValidTrue = jsonutils.isValidNonEmptyString(filePath);
        if ( !isValidTrue ) {
            throw new Error(messages.ERROR_INVALID_SCHEMA_PATH);
        } expect(true).toBe(true);
    });

    it('should validate RESUME_JSON_SCHEMA_PATH file exists', async () => {
        const filePath = jsonutils.RESUME_JSON_SCHEMA_PATH;
        const fileIsFound = await jsonutils.isFileFound(filePath);
        if ( !fileIsFound ) {
            throw new Error(messages.ERROR_FILE_NOT_FOUND + ` : ${filePath}`);
        } 
        expect(true).toBe(true);
    });

    it('should validate RESUME_JSON_SCHEMA_PATH is readable as a valid data object', () => {
        const jsonObject = JSON.parse(fs.readFileSync( jsonutils.RESUME_JSON_SCHEMA_PATH, 'utf-8'));
        let isValidTrue = jsonutils.isValidJsonObject(jsonObject);
        if ( !isValidTrue ) {
            throw new Error(messages.ERROR_INVALID_OR_EMPTY_DATA_OBJECT);
        } 
        expect(isValidTrue).toBe(true);
    });

    it('should validate LEGITIMATE_JSON_RESUME_PATH is readable as a valid data object', () => {
        const jsonObject = JSON.parse(fs.readFileSync( jsonutils.LEGITIMATE_JSON_RESUME_PATH, 'utf-8'));
        let isValidTrue = jsonutils.isValidJsonObject(jsonObject);
        if ( !isValidTrue ) {
            throw new Error(messages.ERROR_INVALID_OR_EMPTY_DATA_OBJECT);
        }
        expect(isValidTrue).toBe(true);
    });

    // it('should validate that a JsonSchema object can be created and self validated', () => {
    //     const jsonSchemaPath = jsonutils.RESUME_JSON_SCHEMA_PATH;
    //     const legitimateDataObjectPath = jsonutils.LEGITIMATE_JSON_RESUME_PATH;
    //     let isValid = true;
    //     try {
    //         const jsonSchema = new JsonSchema(jsonSchemaPath, legitimateDataObjectPath);
    //     } catch (error) {
    //         isValid = false;
    //     }
    //     if ( !isValidTrue ) {
    //         throw new Error(messages.ERROR_INVALID_RESUME_JSON_SCHEMA);
    //     } 
    //     expect(isValidTrue).toBe(true);
    // });



}); // end describe

