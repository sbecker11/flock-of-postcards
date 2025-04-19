import assert from 'assert';

describe('Simple Test', () => {
    console.log('Starting test...');
    
    test('should pass', () => {
        console.log('Inside test...');
        expect(1 + 1).toBe(2);
        console.log('Test passed!');
    });
}); 