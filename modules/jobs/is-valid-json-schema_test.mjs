import { isValidJsonSchema } from './is-valid-json-schema.mjs';
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const createTempFile = (content) => {
    const tempFilePath = path.join(__dirname, 'temp-schema.json');
    fs.writeFileSync(tempFilePath, JSON.stringify(content, null, 2));
    return tempFilePath;
};

const deleteTempFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

describe('isValidJsonSchema', () => {
    it('should return true for a valid JSON schema object', () => {
        const validSchema = {
            type: 'object',
            properties: {
                name: { type: 'string' },
                age: { type: 'number' }
            },
            required: ['name', 'age']
        };
        expect(isValidJsonSchema(validSchema)).toBe(true);
    });

    it('should return false for an invalid JSON schema object', () => {
        const invalidSchema = {
            type: 'object',
            properties: 'invalid',
            required: 'invalid'
        };
        expect(isValidJsonSchema(invalidSchema)).toBe(false);
    });

    it('should return true for a valid JSON schema file', () => {
        const validSchema = {
            type: 'object',
            properties: {
                name: { type: 'string' },
                age: { type: 'number' }
            },
            required: ['name', 'age']
        };
        const tempFilePath = createTempFile(validSchema);
        expect(isValidJsonSchema(tempFilePath)).toBe(true);
        deleteTempFile(tempFilePath);
    });

    it('should return false for an invalid JSON schema file', () => {
        const invalidSchema = {
            type: 'object',
            properties: 'invalid',
            required: 'invalid'
        };
        const tempFilePath = createTempFile(invalidSchema);
        expect(isValidJsonSchema(tempFilePath)).toBe(false);
        deleteTempFile(tempFilePath);
    });

    it('should return false for a non-existent file', () => {
        const nonExistentFilePath = path.join(__dirname, 'non-existent-schema.json');
        expect(isValidJsonSchema(nonExistentFilePath)).toBe(false);
    });

    it('should return false for a file with invalid JSON content', () => {
        const tempFilePath = path.join(__dirname, 'temp-invalid-json-schema.json');
        fs.writeFileSync(tempFilePath, '{ invalid json content }');
        expect(isValidJsonSchema(tempFilePath)).toBe(false);
        deleteTempFile(tempFilePath);
    });
});