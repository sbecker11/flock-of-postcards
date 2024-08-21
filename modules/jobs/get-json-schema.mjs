import fs from 'fs';

export function getJsonSchema(input) {
  let jsonData;

  if (typeof input === 'string') {
    // Read the JSON data from the file
    const fileContent = fs.readFileSync(input, 'utf-8');
    jsonData = JSON.parse(fileContent);
  } else if (typeof input === 'object') {
    // Use the input directly as the JSON data
    jsonData = input;
  } else {
    throw new Error('Invalid input: must be a file path or a JSON object');
  }

  // Create a json-schema given a json object
  const schema = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      const value = jsonData[key];
      schema.properties[key] = { type: typeof value };
      schema.required.push(key);
    }
  }

  return schema;
}