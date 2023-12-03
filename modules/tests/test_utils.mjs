import * as utils from '../utils.mjs';

export function testFormatNumber() {
    let testCases = [
      { num: 123.456, format: "3.2", expected: "123.45" },
      { num: 1.234, format: "3.3", expected: "001.234" },
      { num: -10, format: "3.2", expected: "-10.00" },
      { num: -100, format: "3.2", expectedError: true },
      { num: 0.1234, format: "3.4", expected: "000.1234" },
      // Add more test cases as needed
    ];
  
    testCases.forEach(testCase => {
      try {
        let result = utils.formatNumber(testCase.num, testCase.format);
        let success = result === testCase.expected;
        console.log(`Test with num=${testCase.num}, format="${testCase.format}": ${success ? 'PASS' : 'FAIL'}`);
        if (!success) {
          console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
        }
      } catch (error) {
        if (!testCase.expectedError) {
          console.log(`Test with num=${testCase.num}, format="${testCase.format}": FAIL`);
          console.log(`   Unexpected error: ${error.message}`);
        } else {
          console.log(`Test with num=${testCase.num}, format="${testCase.format}": PASS (expected error)`);
        }
      }
    });
  }
