import { isJsonData } from './is-json-data.mjs';
import { describe, it, expect } from 'vitest';

describe('isJsonData', () => {
    it('should return true for a valid JSON object', () => {
        const validJsonObject = { name: 'John Doe', age: 30, email: 'nQoJt@example.com' };
        expect(isJsonData(validJsonObject)).toBe(true);
    });

    it('should return true for a valid JSON string', () => {
        const validJsonString = '{"name": "John Doe", "age": 30, "email": "nQoJt@example.com"}';
        expect(isJsonData(validJsonString)).toBe(true);
    });

    it('should return false for an invalid JSON string', () => {
        const invalidJsonString = '{name: John Doe, age: 30, email: nQoJt@example.com';
        expect(isJsonData(invalidJsonString)).toBe(false);
    });

    it('should return false for a non-JSON object', () => {
        const nonJsonObject = 'This is not a JSON object';
        expect(isJsonData(nonJsonObject)).toBe(false);
    });

    it('should return false for null', () => {
        expect(isJsonData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
        expect(isJsonData(undefined)).toBe(false);
    });

    it('should return false for a number', () => {
        expect(isJsonData(123)).toBe(false);
    });

    it('should return false for an array', () => {
        expect(isJsonData([1, 2, 3])).toBe(false);
    });
});