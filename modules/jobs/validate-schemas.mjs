import { isValidJsonSchema } from './modules/jobs/is-valid-json-schema.mjs';

const schemas = ['./resume-schema.json', './jobs-schema.json'];

schemas.forEach((schemaPath) => {
    const isValid = isValidJsonSchema(schemaPath);
    console.log(`Validation result for ${schemaPath}: ${isValid}`);
});