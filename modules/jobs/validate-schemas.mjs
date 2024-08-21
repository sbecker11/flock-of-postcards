import { isValidJsonSchema } from './is-valid-json-schema.mjs';
import fs from 'fs';

const testSchemaPath = './modules/jobs/test-files/test-job-objects-schema.json';

try {
    const schemaContent = fs.readFileSync(testSchemaPath, 'utf-8');
    const isValid = isValidJsonSchema(JSON.parse(schemaContent));
    console.log(`Validation result for ${testSchemaPath}: ${isValid}`);

    if (isValid) {
        console.log('Schema validation succeeded.');
        process.exit(0); // Success
    } else {
        console.error('Schema validation failed.');
        process.exit(1); // Failure
    }
} catch (error) {
    console.error(`Error reading or validating schema: ${error.message}`);
    process.exit(1); // Failure
}