import logger from './logger.mjs';
import readJsonFile from 'json_utils.mjs';

const requiredJsonSchemaElementTypes = {
    "$schema": "string",
    "type": "string",
};

const optionalJsonSchemaElementTypes = {
    "additionalItems": "boolean",
    "additionalProperties": "boolean",
    "const": "any",
    "contentEncoding": "string",
    "contentMediaType": "string",
    "definitions": "object",
    "dependencies": "object",
    "enum": "array",
    "exclusiveMaximum": "number",
    "exclusiveMinimum": "number",
    "format": "string",
    "items": "object",
    "maximum": "number",
    "maxItems": "integer",
    "maxLength": "integer",
    "maxProperties": "integer",
    "minimum": "number",
    "minItems": "integer",
    "minLength": "integer",
    "minProperties": "integer",
    "multipleOf": "number",
    "pattern": "string",
    "patternProperties": "object",
    "propertyNames": "object",
    "uniqueItems": "boolean",
    "examples": "array",
    "if": "object",
    "then": "object",
    "else": "object",
    "allOf": "array",
    "anyOf": "array",
    "oneOf": "array",
    "not": "object",
    "contains": "object"
};

class JsonSchema {
    constructor(
        json_schema_path,// the path to the json schema file
        legitimiate_data_object_path // path to a legititimate data object used to test the schema
    ) {
        this.json_schema = readJsonFile(json_schema_path);
        if (!this.json_schema) {
            logger.warn(`Error: Invalid or empty json schema: ${json_schema_path}`);
            throw new Error(`Error: Invalid or empty json schema: ${json_schema_path}`);
        }
        this.legitimiate_data_object = readJsonFile(legitimiate_data_object_path);
        if (!this.legitimiate_data_object) {
            logger.warn(`Error: Invalid or empty legitimiate_data_object: ${legitimiate_data_object_path}`);
            throw new Error(`Error: Invalid or empty legitimiate_data_object: ${legitimiate_data_object_path}`);
        }

        this.ajv = new Ajv({
            allErrors: true,
            verbose: true,
            // strict: false,
            // strictTuples: false,
            // strictTypes: false
        });

        // compile the schemaObject to create the validator function
        this.validatorFunction = this.compileSchema(this.jsonSchema);

        this.checkStructurealValidity(this.jsonSchema);

        this.validateJsonSchemaAgainstLegitimateDataObject(this.legitimiate_data_object)
    }

    compileSchema(schemaObject) {
        return this.ajv.compile(schemaObject);
    }

    validateSchema(schemaObject) {
        return this.ajv.validateSchema(schemaObject);
    }

    // check if the schema of the json schema is registered in the ajv instance
    checkSchemaRegistration(schemaObject) {
        this.ajv.addSchema(schemaObject);
        if (!this.ajv.getSchema(schemaObject.$id)) {
            logger.error(messages.ERROR_SCHEMA_NOT_REGISTERED_IN_AJV);
            logger.error(`schemaObject.$id: ${schemaObject.$id}`);
            logger.error(`schemaObject: ${schemaObject}`);
            logger.error(`schemaObject stringified: ${JSON.stringify(schemaObject)}`);
            logger.error(`schemaObject stringified stringlength: ${JSON.stringify(schemaObject).length}`);
            throw new Error(messages.ERROR_INVALID_JSON_SCHEMA);
        }
    }

    // chedk that the given json schema is structurally valid
    // by verifying the types of the required and optional json schema elements
    checkStructurealValidity(schemaObject) {
        const requiredElementNames = Object.keys(requiredJsonSchemaElementTypes);
        for (let i = 0; i < requiredElementNames.length; i++) {
            if (schemaObject.hasOwnProperty(requiredElementNames[i])) {
                if (typeof schemaObject[requiredElementNames[i]] != requiredJsonSchemaElementTypes[requiredElementNames[i]]) {
                    logger.warn(`schemaObject.${requiredElementNames[i]} is not of type ${requiredElementTypes[requiredElementNames[i]]}`);
                }
            }
        }
        // verify that the given json schema is structurally valid
        // by verifying the types of the optional jason schema elements
        const optionalElementNames = Object.keys(optionalJsonSchemaElementTypes);
        for (let i = 0; i < optionalElementNames.length; i++) {
            if (schemaObject.hasOwnProperty(optionalElementNames[i])) {
                if (typeof schemaObject[optionalElementNames[i]] != optionalJsonSchemaElementTypes[optionalElementNames[i]]) {
                    logger.warn(`schemaObject.${optionalElementNames[i]} is not of type ${optionalElementTypes[optionalElementNames[i]]}`);
                }
            }
        }
    }

    // validate a data object that has been manually crafted to be valid against the json schema
    // against the validator function of this jsonSchema. This is used for testing the json schema.
    validateJsonSchemaAgainstLegitimateDataObject(data_object) {
        if (!data_object) {
            logger.warn(messages.ERROR_UNDEFINED_OR_INVALID_DATA_OBJECT);
            throw new Error(messages.ERROR_UNDEFINED_OR_INVALID_DATA_OBJECT);
        }
        if (this.validatorFunction(data_object) == false) {
            logger.error(messages.ERROR_INVALID_JSON_SCHEMA);
            logger.error(this.ajv.errorsText(this.validatorFunction.errors));
            return false;
        }
        return true;
    }

    // validate any data object against the validator function of this jsonSchema
    validateAnyDataObject(data_object) {
        if (!data_object) {
            logger.warn(messages.ERROR_UNDEFINED_OR_INVALID_DATA_OBJECT);
            throw new Error(messages.ERROR_UNDEFINED_OR_INVALID_DATA_OBJECT);
        }
        if ( this.validatorFunction(data_object) == false ) {
            logger.error(messages.ERROR_INVALID_JSON_SCHEMA);
            logger.error(this.ajv.errorsText(this.validatorFunction.errors));
            return false;
        }
        return true;
    }   
}