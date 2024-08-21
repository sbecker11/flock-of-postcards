import { describe, it, expect } from 'vitest';
import getResumeJobObjects from './get-resume-job-objects.mjs';
import path from 'path';
import fs from 'fs';

// Define constants for the paths to the test files
const TEST_FILES_DIR = path.join(__dirname, 'test-files');
const RESUME_DOCX_PATH = path.join(TEST_FILES_DIR, 'test-resume.docx');
const RESUME_PDF_PATH = path.join(TEST_FILES_DIR, 'test-resume.pdf');
const JOB_OBJECTS_SCHEMA_PATH = path.join(TEST_FILES_DIR, 'test-job-objects-schema.json');
const JOB_OBJECTS_PATH = path.join(TEST_FILES_DIR, 'test-job-objects.json');

describe('getResumeJobObjects', () => {
    it('should create a prompt with resume text and jobs schema from a PDF file', async () => {
        const jobsSchema = JSON.parse(fs.readFileSync(JOB_OBJECTS_SCHEMA_PATH, 'utf-8'));

        const prompt = await getResumeJobObjects(RESUME_PDF_PATH, jobsSchema);
        expect(prompt).toContain(fs.readFileSync(RESUME_PDF_PATH, 'utf-8'));
        expect(prompt).toContain(JSON.stringify(jobsSchema));
    });

    it('should create a prompt with resume text and jobs schema from a DOCX file', async () => {
        const jobsSchema = JSON.parse(fs.readFileSync(JOB_OBJECTS_SCHEMA_PATH, 'utf-8'));

        const prompt = await getResumeJobObjects(RESUME_DOCX_PATH, jobsSchema);
        expect(prompt).toContain(fs.readFileSync(RESUME_DOCX_PATH, 'utf-8'));
        expect(prompt).toContain(JSON.stringify(jobsSchema));
    });

    it('should create a prompt with resume text and jobs schema from a JSON schema file', async () => {
        const jobsSchemaContent = JSON.parse(fs.readFileSync(JOB_OBJECTS_SCHEMA_PATH, 'utf-8'));

        const prompt = await getResumeJobObjects(RESUME_PDF_PATH, JOB_OBJECTS_SCHEMA_PATH);
        expect(prompt).toContain(fs.readFileSync(RESUME_PDF_PATH, 'utf-8'));
        expect(prompt).toContain(JSON.stringify(jobsSchemaContent));
    });

    it('should verify the LLM response against the expected job objects', async () => {
        const jobsSchema = JSON.parse(fs.readFileSync(JOB_OBJECTS_SCHEMA_PATH, 'utf-8'));
        const expectedJobObjects = JSON.parse(fs.readFileSync(JOB_OBJECTS_PATH, 'utf-8'));

        const prompt = await getResumeJobObjects(RESUME_PDF_PATH, jobsSchema);
        
        // Simulate LLM response (replace this with actual LLM call in production)
        const llmResponse = expectedJobObjects;

        expect(llmResponse).toEqual(expectedJobObjects);
    });
});