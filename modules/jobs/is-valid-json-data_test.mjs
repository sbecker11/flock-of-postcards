import { isValidJsonData } from './is-valid-json-data.mjs';
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('isValidJsonData', () => {
    const validJsonSchema = {
        type: 'object',
        properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            email: { type: 'string' }
        },
        required: ['name', 'age', 'email']
    };

    const validJsonData = {
        name: 'John Doe',
        age: 30,
        email: 'nQoJt@example.com'
    };

    const invalidJsonData = {
        name: 'John Doe',
        age: 'thirty',
        email: 'nQoJt@example.com'
    };

    const tempSchemaFilePath = path.join(__dirname, 'temp-schema.json');
    const tempValidDataFilePath = path.join(__dirname, 'temp-valid-data.json');
    const tempInvalidDataFilePath = path.join(__dirname, 'temp-invalid-data.json');

    fs.writeFileSync(tempSchemaFilePath, JSON.stringify(validJsonSchema, null, 2));
    fs.writeFileSync(tempValidDataFilePath, JSON.stringify(validJsonData, null, 2));
    fs.writeFileSync(tempInvalidDataFilePath, JSON.stringify(invalidJsonData, null, 2));

    it('should return true for valid JSON data against a schema (object input)', () => {
        expect(isValidJsonData(validJsonSchema, validJsonData)).toBe(true);
    });

    it('should return false for invalid JSON data against a schema (object input)', () => {
        expect(isValidJsonData(validJsonSchema, invalidJsonData)).toBe(false);
    });

    it('should return true for valid JSON data against a schema (file path input)', () => {
        expect(isValidJsonData(tempSchemaFilePath, tempValidDataFilePath)).toBe(true);
    });

    it('should return false for invalid JSON data against a schema (file path input)', () => {
        expect(isValidJsonData(tempSchemaFilePath, tempInvalidDataFilePath)).toBe(false);
    });

    afterAll(() => {
        fs.unlinkSync(tempSchemaFilePath);
        fs.unlinkSync(tempValidDataFilePath);
        fs.unlinkSync(tempInvalidDataFilePath);
    });
});