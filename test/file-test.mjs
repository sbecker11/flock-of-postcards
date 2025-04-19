import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);

const resultsPath = path.join(process.cwd(), 'test', 'test-results.txt');

async function runTest() {
    await writeFile(resultsPath, 'Starting test...\n');
    
    try {
        // Simple test
        const result = 1 + 1;
        await appendFile(resultsPath, `Test result: ${result}\n`);
        
        if (result === 2) {
            await appendFile(resultsPath, 'Test passed!\n');
        } else {
            await appendFile(resultsPath, 'Test failed!\n');
        }
    } catch (error) {
        await appendFile(resultsPath, `Error: ${error.message}\n`);
        throw error;
    }
}

runTest()
    .then(() => console.log('Test completed'))
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    }); 