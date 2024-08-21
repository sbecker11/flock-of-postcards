import { describe, it, expect } from 'vitest';
import { getResumeData, getResumeDataPrompt} from './get-resume-data.mjs';
import isValidJsonSchema from './is-valid-json-schema.mjs'; 
import path from 'path';
import fs from 'fs';

// Define constants for the paths to the test files
const TEST_FILES_DIR = path.join(__dirname, 'test-files');
const RESUME_DOCX_PATH = path.join(TEST_FILES_DIR, 'test-resume.docx');
const RESUME_PDF_PATH = path.join(TEST_FILES_DIR, 'test-resume.pdf');
const RESUME_SCHEMA_PATH = path.join(TEST_FILES_DIR, 'test-resume-schema.json');

describe('getResumeData', () => {

    try {
        const resumeDataSchema = JSON.parse(fs.readFileSync(RESUME_DATA_SCHEMA_PATH, 'utf-8'));
        it('should have valid resumeDataSchema', () => {
            const isValid = isValidJsonSchema(resumeDataSchema);
            expect(isValid).toBe(true);
        });

        it('should create a prompt containing resume pdf text from resume pdf file and stringifiedresume_data_schema', async () => {
            const resumeText = fs.readFileSync(RESUME_PDF_PATH, 'utf-8');
            const resumeDataSchema = JSON.parse(fs.readFileSync(RESUME_DATA_SCHEMA_PATH, 'utf-8'));
            const resumeDataSchemaStr = typeof resumeDataSchema === 'object' ? JSON.stringify(resumeDataSchema) : fs.readFileSync(resumeDataSchema, 'utf-8');
            
            // for now getResumeData just returns its input prompt string
            const llmResponse = await getResumeData(resumeText, resumeDataSchema);
            expect(llmResponse).toContain(resumeText);
            expect(llmResponse).toContain(resumeDataSchemaStr);
        });

        it('should create a prompt containing resume docx text from resume docx file and stringifiedresume_data_schema', async () => {
            const resumeText = fs.readFileSync(RESUME_DOCX_PATH, 'utf-8');
            const resumeDataSchema = JSON.parse(fs.readFileSync(RESUME_DATA_SCHEMA_PATH, 'utf-8'));
            const resumeDataSchemaStr = typeof resumeDataSchema === 'object' ? JSON.stringify(resumeDataSchema) : fs.readFileSync(resumeDataSchema, 'utf-8');
            
            const llmResponse = await getResumeData(resumeText, resumeDataSchema);
            
            // for now getResumeData just returns its input prompt string
            expect(llmResponse).toContain(resumeText);
            expect(llmResponse).toContain(resumeDataSchemaStr);
        });

        it('should create a response with resume text and jobs schema from a JSON schema file', async () => {
            const resumeDataSchema = JSON.parse(fs.readFileSync(RESUME_DATA_SCHEMA_PATH, 'utf-8'));
            const resumeDataSchemaStr = typeof resumeDataSchema === 'object' ? JSON.stringify(resumeDataSchema) : fs.readFileSync(resumeDataSchema, 'utf-8');
        
            const llmResponse = getResumeData(resumeText, resumeDataSchema); 
    
            expect(llmResponse).toContain(resumeText);
            expect(llmResponse).toContain(resumeDataSchemaStr);
        });

        it('should verify the LLM response against the expected resume data', async () => {
            const resumeDataSchema = JSON.parse(fs.readFileSync(RESUME_DATA_SCHEMA_PATH, 'utf-8'));
            const resumeDataSchemaStr = typeof resumeDataSchema === 'object' ? JSON.stringify(resumeDataSchema) : fs.readFileSync(resumeDataSchema, 'utf-8');

            const resumeText = "bogus_resumeText";
            const llmResponse = await getResumeData(resumeText, resumeDataSchema);
            
            expect(llmResponse).toContain(resumeText);
            expect(llmResponse).toContain(resumeDataSchemaStr);

        });
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error('File not found:', err.path);
        } else {
            console.error('Error reading file:', err);
        }    
    }
});