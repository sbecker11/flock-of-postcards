import dotenv from 'dotenv';
dotenv.config();

import Anthropic from '@anthropic-ai/sdk';

// Function to create the system prompt
function createSystemPrompt() {
    return "You are a helpful assistant.";
}

// Class to handle entity extraction
class EntityExtractor {
    constructor(apiKey) {
        this.client = new Anthropic({
            apiKey: apiKey
        });
    }

    async extractEntities(text) {
        const response = await this.client.createCompletion({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            temperature: 0,
            system: createSystemPrompt(), // Ensure this method exists
            messages: [
                {
                    role: 'user',
                    content: text
                }
            ]
        });

        return JSON.parse(response.content[0].text);
    }

    printEntities(entities) {
        console.log('Extracted entities:', entities);
    }
}

// Main function to start the application
async function main() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
        process.exit(1);
    }
    const extractor = new EntityExtractor(apiKey);

    // Define an array of strings to process
    const lines = [
        "First line of text to extract entities from.",
        "Second line of text to extract entities from.",
        "Third line of text to extract entities from."
    ];

    // Process each line
    for (const line of lines) {
        try {
            const result = await extractor.extractEntities(line);
            extractor.printEntities(result);
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Run the main function
main();