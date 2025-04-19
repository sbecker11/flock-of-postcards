console.log('Starting test runner...');

import('./simple.test.mjs')
    .then(() => {
        console.log('Tests completed successfully');
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    }); 