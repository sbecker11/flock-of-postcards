
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const tools = [
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

const text = "John works at Google in New York. He met with Sarah, the CEO of Acme Inc., last week in San Francisco."

const query = "<text>I'd like to use NodeJS to have you analyze text from a resume document and return a json version of it. How do I do this?</text>";


async function createMessage() {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: query },
    ],
  });

  console.log(response);
}

createMessage();