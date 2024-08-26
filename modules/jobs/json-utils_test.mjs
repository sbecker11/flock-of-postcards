import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import draft07Schema from 'ajv/lib/refs/json-schema-draft-07.json';

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import logger from 'modules/jobs/logger.mjs';
import * as jsonutils from 'modules/jobs/json-utils.mjs';
import * as messages from 'modules/jobs/messages.mjs';

// Define constants for the paths to the test files
const TEST_FILES_DIR = path.join(__dirname, 'test-files');
const TEST_RESUME_DOCX_PATH = path.join(TEST_FILES_DIR, 'test-resume.docx');
const TEST_RESUME_PDF_PATH = path.join(TEST_FILES_DIR, 'test-resume.pdf');
const TEST_SIMPLE_RESUME_OBJ_PATH = path.join(TEST_FILES_DIR, 'simple-resume-obj.json');

// const createTempFile = (content) => {
//     const tempFilePath = path.join(__dirname, 'temp-file.txt');
//     fs.writeFileSync(tempFilePath, content);
//     return tempFilePath;
// };

// const deleteTempFile = (filePath) => {
//     if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//     }
// };

// describe('should get a resume data object', () => {

//     it('should throw an error given an invalid or blank resume text', async () => {
//         const resumeText = '';
//         const resumeSchema = await jsonutils.getResumeDataObject(resumeText, jsonutils.RESUME_SCHEMA_PATH)).rejects.toThrow(messages.ERROR_INVALID_OR_EMPTY_RESUME_TEXT);
//     });

//     it('should throw an error given an invalid or blank resumeSchema', async () => {
//         const resumeText = await jsonutils.extractTextFromDocument(TEST_RESUME_DOCX_PATH);
//         const resumeSchema = null;
//         const  resumeDataObject = await jsonutils.getResumeDataObject(resumeText, resumeSchema)).rejects.toThrow(messages.ERROR_INVALID_JSON_SCHEMA);
//     });
    
//     it('should return a resume data object given valid resume text and resume schema', async () => {
//         const resumeText = await jsonutils.extractTextFromDocument(TEST_RESUME_DOCX_PATH);
//         const resumeSchema = await jsonutils.getResumeSchema(jsonutils.RESUME_SCHEMA_PATH);
//         const resumeDataObject = jsonutils.getResumeDataObject(resumeText, resumeSchema);
//         const isValid = jsonutils.isValidResumeDataObject(resumeDataObject);
//         expect(isValid).toBe(true);
//     });

// }); 

// describe('should extract text from document', () => {
//     it('should thow an error given a null or undefined or empty filePath', async () => {
//         let filePath = null;
//         await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_UNDEFINED_OR_EMPTY_FILEPATH);
//     });

//     it('should throw an error if file not found', async () => {
//         const filePath = "modules/jobs/test-files/non-existent-file.docx";
//         await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_FILE_NOT_FOUND + ` : ${filePath}`);
//     });

//     it('should throw an error if file is found but extension is missing', async () => {
//         const filePath = "modules/jobs/test-files/small";
//         const extname = path.extname(filePath);
//         await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_FILENAME_EXTENSION_UNDEFINED + ` : ${filePath}`);
//     });

//     it('should throw an error if file is found and extension is found but is not supported', async () => {
//         const filePath = "modules/jobs/test-files/small.pdf";
//         const extname = path.extname(filePath);
//         await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_FILENAME_EXTENSION_NOT_SUPPORTED + ` : [${extname}]`);
//     });

//     it('should throw an error if valid filePath, file is found, has supported extension but file is empty ', async () => {
//         const filePath = "modules/jobs/test-files/empty.docx";
//         await expect(jsonutils.extractTextFromDocument(filePath)).rejects.toThrow(messages.ERROR_FILE_IS_EMPTY);
//     });
    
//     it('should extract text from a DOCX file that exists and has supported extension', async () => {
//         const filePath = "modules/jobs/test-files/small.docx";
//         const text = await jsonutils.extractTextFromDocument(filePath);
//         const inValid = jsonutils.isValidNonEmptyString(text);
//         expect(inValid).toBe(true);
//     });

//     it('should extract text from a DOCX file with special characters', async () => {
//         const filePath = "modules/jobs/test-files/special_chars.docx";
//         const text = await jsonutils.extractTextFromDocument(filePath);
//         const isValid = messages.SPECIAL_CHARACTERS_REGEXP.test(text);
//         expect(isValid).toBe(true);
//     });

//     it('should handle a large DOCX file', async () => {
//         const filePath = "modules/jobs/test-files/2025-words.docx";
//         const text = await jsonutils.extractTextFromDocument(filePath);
//         const isValid = jsonutils.isValidNonEmptyString(text) && text.length >= messages.LARGE_FILE_LENGTH; // Assuming large file has more than 10,000 characters
//         expect(isValid).toBe(true);
//     });

//     it('should ignore images in a DOCX file', async () => {
//         const filePath = "modules/job/test-files/has-image-and-text.docx";
//         const text = await jsonutils.extractTextFromDocument(filePath);
//         const isValid = jsonutils.isValidNonEmptyString(text) && !text.includes(messages.IMAGE_CONTENT);
//         expect(isValid).toBe(true);
//     });

//     it('should ignore table directives in a DOCX file', async () => {
//         const filePath = "modules/job/test-files/has-table-and-text.docx";
//         const text = await jsonutils.extractTextFromDocument(filePath);
//         const isValid = jsonutils.isValidNonEmptyString(text) && !text.includes(messages.TABLE_CONTENT);
//         expect(isValid).toBe(true);
//     });

// });

// describe('should get resume data object given valid resume text and resume schema', () => {

//     it('should throw an error given null resumeText', async () => {
//         let resumeText = null;
//         let resumeSchema = jsonutils.getResumeSchema(jsonutils.RESUME_SCHEMA_PATH));
//         await expect(jsonutils.getResumeDataObject(resumeText, resumeSchema)).rejects.toThrow(messages.ERROR_UNDEFINED_OR_EMPTY_RESUME_TEXT);
//     });

//     it('should throw an error given incomplete resumeText', async () => {
//         let resumeText = "incomplete resume text";
//         let resumeSchema = jsonutils.getResumeSchema(jsonutils.RESUME_SCHEMA_PATH));
//         await expect(jsonutils.getResumeDataObject(resumeText, resumeSchema)).rejects.toThrow(messages.ERROR_INCOMPLETE_RESUME_TEXT);
//     });

//     it('should throw an error if resumeSchema is undefined', async () => {
//         const resumeText = await jsonutils.extractTextFromDocument(TEST_RESUME_DOCX_PATH);
//         const resumeSchema = null;
//         await expect(jsonutils.getResumeDataObject(resumeText, resumeSchema)).rejects.toThrow(messages.ERROR_UNDEFINED_RESUME_SCHEMA);
//     });

//     it('should throw an error if resumeSchema is invalid', async () => {
//         const resumeText = await jsonutils.extractTextFromDocument(TEST_RESUME_DOCX_PATH);
//         const resumeSchema = jsonutils.getResumeSchema("modules/jobs/test-files/invalid-schema.json");
//         await expect(jsonutils.getResumeDataObject(resumeText, resumeSchema)).rejects.toThrow(messages.ERROR_INVALID_RESUME_SCHEMA);
//     }); 

//     it('should return a valid resumeDataObject if resumeText and resumeSchema are valid', async () => {
//         const resumeText = await jsonutils.extractTextFromDocument(TEST_RESUME_DOCX_PATH);
//         const resumeSchema = await jsonutils.getResumeSchema(jsonutils.RESUME_SCHEMA_PATH);
//         const resumeDataObject = await jsonutils.getResumeDataObject(resumeText, resumeSchema);
//         isValid = jsonutils.isValidResumeDataObject(resumeDataObject);
//         expect(isValid).toBe(true);
//     });
// });

const ajv = new Ajv();
addFormats(ajv); // Add formats to Ajv instance

// Ensure the draft-07 schema is added to the Ajv instance
if (!ajv.getSchema(draft07Schema.$id)) {
    ajv.addMetaSchema(draft07Schema);
    logger.info('Draft-07 schema added to Ajv instance.');
} else {
    logger.info('Draft-07 schema already exists in Ajv instance.');
}

describe('should verify that jsonutils.RESUME_SCHEMA_PATH is a valid json schema file', () => {
    it('should validate RESUME_SCHEMA_PATH is a valid path', async () => {
        let filePath = jsonutils.RESUME_SCHEMA_PATH;
        logger.info(`RESUME_SCHEMA_PATH: ${filePath}`);
        let isValidTrue = await jsonutils.isValidPath(filePath);
        logger.info(`isValidTrue: ${isValidTrue}`);
        expect (isValidTrue).toBe(true);
    });

    it('should validate RESUME_SCHEMA_PATH is readable as a jsonSchema', () => {
        let filePath = jsonutils.RESUME_SCHEMA_PATH;
        logger.info(`RESUME_SCHEMA_PATH: ${filePath}`);
        const resumeSchema = JSON.parse(fs.readFileSync(jsonutils.RESUME_SCHEMA_PATH, 'utf-8'));
        logger.info(`resumeSchema: ${JSON.stringify(resumeSchema)}`);
        let isValidTrue = jsonutils.isValidJsonSchema(resumeSchema);
        logger.info("isValidJsonSchema: " + isValidTrue);
        expect(isValidTrue).toBe(true);
        
        // Example simple hand-craftedresume object to validate
        filePath = TEST_SIMPLE_RESUME_OBJ_PATH;
        logger.info(`TEST_SIMPLE_RESUME_OBJ_PATH: ${filePath}`);
        jsonutils.isValidPath(filePath).then(isValidTrue => {
            logger.info(`isValidPath: ${isValidTrue}`);
            expect(isValidTrue).toBe(true);
            const simpleResumeObject = jsonutils.readJsonFile(filePath);
            isValidTrue = jsonutils.isValidJsonObject(simpleResumeObject);
            logger.info("isValidJsonObject: " + isValidTrue);
            expect(isValidTrue).toBe(true);
    
            const validate = ajv.compile(resumeSchema);
            isValidTrue = validate(simpleResumeObject);
            logger.info("isSimpleResumeObject validated: " + isValidTrue);
            if ( !isValidTrue) {
                logger.error(validate.errors);
            }
        }).catch(error => {
            logger.error(`Error validating path: ${error}`);
        });
    });
});

// describe('schemaValidateData', () => {
//     const resumeDataSchema = {
//         "type": "object",
//         "properties": {
//             "name": {
//                 "type": "string"
//             },
//             "email": {
//                 "type": "string"
//             },
//             "phone": {
//                 "type": "string"
//             }
//         },
//         "required": ["name", "email"]
//     };

//     it('should validate resumeDataSchema is a valid dataSchema', () => {
//         let isValidTrue = isValidJsonSchema(resumeDataSchema);
//         expect(isValidTrue).toBe(true);
//     });

//     const resumeDataObject = {
//         "name": "John Doe",
//         "email": "5vUeh@example.com",
//         "age": 39,
//     };

//     it('should validate resumeDataObject is a valid dataObject', () => {
//         let isValidTrue = isValidDataObject(resumeDataObject);
//         expect(isValidTrue).toBe(true);
//     }); 

//     it('should use resumeDataSchema to validate resumeDataObject', () => {
//         let isValidTrue = schemaValidateObject(resumeDataSchema, resumeDataObject);
//         expect(isValidTrue).toBe(true);
//     });  
// });