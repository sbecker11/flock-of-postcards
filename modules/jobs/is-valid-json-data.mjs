import fs from 'fs';
import Ajv from 'ajv';

const ajv = new Ajv();

function loadJson(input) {
    if (typeof input === 'string') {
        const fileContent = fs.readFileSync(input, 'utf-8');
        return JSON.parse(fileContent);
    } else if (typeof input === 'object' && input !== null) {
        return input;
    } else {
        throw new Error('Invalid input: must be a file path or a JSON object');
    }
}

export function isValidJsonData(schemaInput, dataInput) {
    const schema = loadJson(schemaInput);
    const data = loadJson(dataInput);

    const validate = ajv.compile(schema);
    const valid = validate(data);

    return valid;
}