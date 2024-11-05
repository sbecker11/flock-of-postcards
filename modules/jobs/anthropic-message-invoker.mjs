import Anthropic from "@anthropic-ai/sdk";
// see https://docs.anthropic.com/en/prompt-library/data-organizer
import dotenv from 'dotenv'; // Userland package for loading environment variables

import { getResumeSchema } from "./json_utils.mjs"
import { getResumeString } from './json_utils.mjs';
import { fileURLToPath } from 'url';
import process from 'process';
import json from 'json';
import { config } from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const apiKey = process.env["ANTHROPIC_API_KEY"];
if (!apiKey) {
    console.error('Error: Missing ANTHROPIC_API_KEY environment variable.');
    process.exit(1);
}
console.log(`API Key: ${apiKey}`);

const client = new Anthropic({
  apiKey: apiKey,
});

const resumePath = 'resume-inputs/resume.docx';
const resumeString = await getResumeString(resumePath);
if (!resumeString) {
    console.error(`Error: Could not load resume content from resumePath: ${resumePath}.`);
    process.exit(1);
}
console.log(`Loaded resume content from resumePath: ${resumePath}`);
console.log(`resume content: ${resumeString.slice(0, 200)}`);

const jsonSchemaPath = 'resume-inputs/resume-schema.json';
const resumeJsonSchema = await getResumeSchema(jsonSchemaPath);
if (!resumeJsonSchema) {
    console.error(`Error: Could not load jsonSchemaPath: ${jsonSchemaPath}`);
    process.exit(1);
} else {
    // use Adv to verify that this is a valid json-schema
    const isValid = await isStructurallyValidResumeJsonSchema(resumeJsonSchema);
    if (!isValid) {
        console.error(`Error: resumeJsonSchema is not valid.`);
        process.exit(1);
    }
}
console.log(`Loaded resume json schema from jsonSchemaPath: ${jsonSchemaPath}`);
console.log(`resumeJsonSchema: ${resumeJsonSchema}`);

const task = "Your task is to take the provided semi-structured 'resume-text', and use the provided 'resume-json-schema' to produce a well-structured JSON-formatted version of the resume. Ensure that the extracted resume JSON data is accurately represented, properly formatted within the JSON structure, and that it can be validated by the given resume-json-schema. The resulting JSON text should provide a clear, structured overview of the information presented in the original resume-text";

// see https://github.com/anthropics/courses/blob/master/tool_use/03_structured_outputs.ipynb
tools = [
    {
        "name": "resume-schema",
        "description": task,
        "input_schema": resumeJsonSchema
    }
];

query = `
<document>
${resumeString}
</document>

Only use the resume-schema tool.
`;

console.log(`Query: ${query}`);

function getResumeObject() {

    response = client.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=7000,
        temperature=0,
        system=task,
        tools=tools,
        messages=[{ "role": "user", "content": query }]
    );
    let json_entities = null;
    for (let content in response.content) {
        if (content.type == "tool_use" && content.name == "print_entities") {
            json_entities = content.input;
            break;
        }
    }
    let resumeObj = null;
    if (json_entities.length > 0) {
        resumeObj = json_entities[0].content;
        if ( !isDataObjectSchemaValid(resumeObj, resumeJsonSchema) ) {
            console.log("Extracted resumeObj is not valid against the schema.");
            return null;    
        }
        console.log("Extracted resumeObj (JSON):");
        console.log(json.dumps(resumeObj, indent=2));
        return resumeObj;
    }
    else {
        console.log("No entities found in the response.");
        return null;
    }
}

/**
 * Main function to handle command line execution
 */
function main() {
    let resumeObject = null;
    try {
        resumeObject = getResumeObject();
        console.log(resumeObject);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run main when script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}