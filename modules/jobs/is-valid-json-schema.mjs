import fs from 'fs';
import path from 'path';

export function isValidJsonSchema(schemaOrPath) {
    let schema;

    if (typeof schemaOrPath === 'string') {
        try {
            const fullPath = path.resolve(schemaOrPath);
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            schema = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading or parsing the JSON schema file:', error.message);
            return false;
        }
    } else if (typeof schemaOrPath === 'object' && schemaOrPath !== null) {
        schema = schemaOrPath;
    } else {
        return false;
    }

    if (schema.type !== 'object' || typeof schema.properties !== 'object' || !Array.isArray(schema.required)) {
        return false;
    }

    return true;
}