export function getJsonSchema(json) {
  // Create a json-schema given a json object
  const schema = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const key in json) {
    if (json.hasOwnProperty(key)) {
      const value = json[key];
      schema.properties[key] = { type: typeof value };
      schema.required.push(key);
    }
  }

  return schema;
}
