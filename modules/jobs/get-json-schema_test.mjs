import { getJsonSchema } from './get-json-schema.mjs';
import { describe, it, expect } from 'vitest';

describe('extract the JSON schema from a json file', () => {
    // Hardcoded test JSON data
    const testJsonData = {
        name: 'John Doe',
        age: 30,
        email: 'nQoJt@example.com'
    };

    const expectedJsonSchema = {
        type: 'object',
        properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            email: { type: 'string' }
        },
        required: ['name', 'age', 'email']
    };

    it('should extract the correct JSON schema', () => {
        const extractedJsonSchema = getJsonSchema(testJsonData);
        console.log('extractedJsonSchema:', JSON.stringify(extractedJsonSchema, null, 2));
        expect(extractedJsonSchema).toEqual(expectedJsonSchema);
    });
});