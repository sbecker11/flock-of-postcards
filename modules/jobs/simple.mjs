
import dotenv from 'dotenv';
import Anthropic from 'anthropic';
import json from 'json';
dotenv.config();
const my_api_key = process.env.ANTHROPIC_API_KEY;
const client = new Anthropic({
    apiKey: my_api_key
});

let tools = [
    {
        "name": "print_entities",
        "description": "Prints extract named entities.",
        "input_schema": {
            "type": "object",
            "properties": {
                "entities": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "The extracted entity name."},
                            "type": {"type": "string", "description": "The entity type (e.g., PERSON, ORGANIZATION, LOCATION)."},
                            "context": {"type": "string", "description": "The context in which the entity appears in the text."}
                        },
                        "required": ["name", "type", "context"]
                    }
                }
            },
            "required": ["entities"]
        }
    }
];


let text = "John works at Google in New York. He met with Sarah, the CEO of Acme Inc., last week in San Francisco."

let query = `
<document>
{text}
</document>

Use the print_entities tool.
`;

let response = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 4096,
    tools: tools,
    messages: [{"role": "user", "content": query}]
});
let json_entities = null;
for( let content in response.content ) {
    if (content.name === "print_entities") {
        break;
    }
}


if( json_entities.length > 0 ) {
    console.log("Extracted Entities (JSON):");
    console.log(json.dumps(json_entities, indent=2));
    console.log(JSON.stringify(json_entities, null, 2));
} else {
    console.log("No entities found in the response.");
}