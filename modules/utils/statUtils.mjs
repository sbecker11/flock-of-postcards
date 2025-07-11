// modules/utils/statUtils.mjs

// =====================
// GENERATIVE FUNCTIONS
// =====================

/**
 * Generates two independent standard normal variates using the Box-Muller transform.
 *
 * @returns {{z0: number, z1: number}} - An object containing two standard normal variates.
 */
export function boxMullerTransform() {
  let u1 = Math.random();
  let u2 = Math.random();

  // Handle u1 or u2 being 0 to avoid Math.log(0) which is -Infinity
  while (u1 === 0) {
    u1 = Math.random();
  }
  while (u2 === 0) {
    u2 = Math.random();
  }

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

  return { z0, z1 };
}

/**
 * Generates a single random number from a normal distribution with a given mean and standard deviation.
 *
 * @param {number} mean - The desired mean of the distribution.
 * @param {number} stdDev - The desired standard deviation of the distribution.
 * @returns {number} - A single normally distributed random number.
 */
export function getNormallyDistributedRandomNumber(mean, stdDev) {
  // Use z0 from the Box-Muller transform to get a standard normal variate (mean 0, std dev 1)
  const { z0 } = boxMullerTransform();

  // Scale and shift the standard normal variate to the desired mean and standard deviation
  return z0 * stdDev + mean;
}

/**
 * Fills an array of length N with normally distributed random numbers.
 *
 * @param {number} N - The desired length of the array.
 * @param {number} mean - The desired mean of the distribution.
 * @param {number} stdDev - The desired standard deviation of the distribution.
 * @returns {number[]} - An array of N normally distributed random numbers.
 */
export function generateNormalDistributionArray(N, mean, stdDev) {
  if (N <= 0 || !Number.isInteger(N)) {
    console.error("N must be a positive integer.");
    return [];
  }
  if (typeof mean !== 'number' || typeof stdDev !== 'number') {
    console.error("Mean and standard deviation must be numbers.");
    return [];
  }
  if (stdDev < 0) {
    console.warn("Standard deviation should ideally be non-negative. Using absolute value.");
    stdDev = Math.abs(stdDev);
  }

  const result = [];
  for (let i = 0; i < N; i++) {
    result.push(getNormallyDistributedRandomNumber(mean, stdDev));
  }
  return result;
}

// =====================
// MEASUREMENT FUNCTIONS
// =====================

/**
 * Calculates the mean (average) of a given array of numbers.
 *
 * @param {number[]} arr - The array of numbers.
 * @returns {number} - The mean value.
 */
export function calculateMean(arr) {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  return sum / arr.length;
}

/**
 * Calculates the median of a given array of numbers.
 *
 * @param {number[]} arr - The array of numbers.
 * @returns {number} - The median value.
 */
export function calculateMedian(arr) {
  if (arr.length === 0) return undefined;

  // Create a copy and sort the array to avoid modifying the original
  const sortedArr = [...arr].sort((a, b) => a - b);

  const middle = Math.floor(sortedArr.length / 2);

  if (sortedArr.length % 2 === 0) {
    // Even number of elements, median is the average of the two middle elements
    return (sortedArr[middle - 1] + sortedArr[middle]) / 2;
  } else {
    // Odd number of elements, median is the middle element
    return sortedArr[middle];
  }
}

/**
 * Calculates the standard deviation of a given array of numbers.
 * Can calculate either the sample standard deviation (default) or the population standard deviation.
 *
 * @param {number[]} arr - The array of numbers.
 * @param {boolean} usePopulation - If true, calculates the population standard deviation. Defaults to false (sample standard deviation).
 * @returns {number | undefined} - The standard deviation value, or undefined if the array length is less than 2 for sample standard deviation calculation.
 */
export function calculateStandardDeviation(arr, usePopulation = false) {
  if (arr.length < 2 && !usePopulation) {
    return undefined; // Standard deviation is undefined for less than 2 observations for sample standard deviation
  }
  if (arr.length === 0) return 0;
  const mean = calculateMean(arr);
  const sumOfSquaredDifferences = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0);

  // Adjust denominator for sample vs population standard deviation
  const divisor = arr.length - (usePopulation ? 0 : 1);

  return Math.sqrt(sumOfSquaredDifferences / divisor);
}

/**
 * Computes Pearson's median skewness for a given array of numbers.
 * Formula: Skewness = 3 * (Mean - Median) / Standard Deviation
 *
 * @param {number[]} data - The array of numbers.
 * @returns {number | undefined} - Pearson's median skewness, or undefined if standard deviation is zero.
 */
export function calculatePearsonMedianSkewness(data) {
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Input must be a non-empty array of numbers.");
    return undefined;
  }

  const mean = calculateMean(data);
  const median = calculateMedian(data);
  const stdDev = calculateStandardDeviation(data);

  if (stdDev === 0) {
    // If standard deviation is 0, all values are the same, indicating no skewness.
    // Division by zero would occur otherwise.
    return 0;
  }

  return (3 * (mean - median)) / stdDev;
}

/**
 * Counts how many values fall within different standard deviation ranges
 * @param {number[]} data - The array of numbers
 * @param {number} mean - The mean of the data
 * @param {number} stdDev - The standard deviation of the data
 * @returns {Object} - Object containing counts for different sigma ranges
 */
export function calculateStdDevRanges(data, mean, stdDev) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      within1StdDev: 0,
      between1And2StdDev: 0,
      between2And3StdDev: 0,
      beyond3StdDev: 0
    };
  }

  let within1StdDev = 0;
  let between1And2StdDev = 0;
  let between2And3StdDev = 0;
  let beyond3StdDev = 0;

  data.forEach(value => {
    const distance = Math.abs(value - mean);
    if (distance <= stdDev) {
      within1StdDev++;
    } else if (distance <= 2 * stdDev) {
      between1And2StdDev++;
    } else if (distance <= 3 * stdDev) {
      between2And3StdDev++;
    } else {
      beyond3StdDev++;
    }
  });

  return {
    within1StdDev,
    between1And2StdDev,
    between2And3StdDev,
    beyond3StdDev
  };
}

// =====================
// TEST FUNCTIONS
// =====================


/**
 * Runs a single test case for normal distribution generation.
 *
 * @param {object} testCase - An object containing N, desiredMean, desiredStdDev for the test.
 * @param {number} testCase.N - The length of the array to generate.
 * @param {number} testCase.desiredMean - The desired mean of the normal distribution.
 * @param {number} testCase.desiredStdDev - The desired standard deviation of the normal distribution.
 * @returns {void} - Reports the results to the console.
 */
export function runNormalDistributionTest(testCase) {
  const { N, desiredMean, desiredStdDev } = testCase;
  console.log(`\n--- Testing Normal Distribution Generation (N=${N}, Mean=${desiredMean}, StdDev=${desiredStdDev}) ---`);

  const normalArray = generateNormalDistributionArray(N, desiredMean, desiredStdDev);

  if (normalArray.length === 0) {
    console.error("Failed to generate normal distribution array. Check input parameters.");
    return;
  }

  const calculatedMean = calculateMean(normalArray);
  const calculatedStdDev = calculateStandardDeviation(normalArray);

  console.log("Input Mean:", desiredMean);
  console.log("Computed Mean:", calculatedMean);
  console.log("Input Standard Deviation:", desiredStdDev);
  console.log("Computed Standard Deviation:", calculatedStdDev);

  const meanDifference = Math.abs(desiredMean - calculatedMean);
  const stdDevDifference = Math.abs(desiredStdDev - calculatedStdDev);

  console.log("Mean Difference:", meanDifference);
  console.log("Standard Deviation Difference:", stdDevDifference);

  // Example tolerance levels; these might need adjustment based on the expected accuracy for your use case
  // A reasonable tolerance can be related to the standard error of the mean or standard deviation.
  // The standard error of the mean is approximately stdDev / sqrt(N).
  // The standard error of the standard deviation is approximately stdDev / sqrt(2*N) for a normal distribution.
  const meanTolerance = 2 * (desiredStdDev / Math.sqrt(N)); // Allowing for some deviation
  const stdDevTolerance = 2 * (desiredStdDev / Math.sqrt(2 * N)); // Allowing for some deviation

  if (meanDifference < meanTolerance) {
    console.log("Result: Computed Mean is within an acceptable range.");
  } else {
    console.warn("Result: Computed Mean deviates significantly from the Input Mean. Consider increasing N.");
  }

  if (calculatedStdDev === undefined || stdDevDifference < stdDevTolerance) {
    console.log("Result: Computed Standard Deviation is within an acceptable range.");
  } else {
    console.warn("Result: Computed Standard Deviation deviates significantly from the Input Standard Deviation. Consider increasing N.");
  }

  console.log("------------------------------------------------------------------");
  return {
    success: meanDifference < meanTolerance && (calculatedStdDev === undefined || stdDevDifference < stdDevTolerance),
    meanDifference,
    stdDevDifference,
    calculatedMean,
    calculatedStdDev
  };
}

/**
 * Runs all defined test cases for normal distribution generation.
 * @returns {Array} - Array of test results
 */
export function runAllNormalDistributionTests() {
  const testCases = [
    { N: 100, desiredMean: 0, desiredStdDev: 1 },     // Standard Normal Distribution
    { N: 1000, desiredMean: 50, desiredStdDev: 10 },  // Larger sample size
    { N: 10000, desiredMean: 100, desiredStdDev: 2 }, // Very large sample size, expecting closer match
    { N: 50, desiredMean: 20, desiredStdDev: 3 },    // Smaller sample size, expecting more variation
    { N: 5000, desiredMean: -10, desiredStdDev: 0.5 } // Negative mean, smaller std dev
  ];

  console.log("=== Running All Normal Distribution Tests ===");
  const results = testCases.map(runNormalDistributionTest);
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n=== Test Summary: ${successCount}/${results.length} tests passed ===`);
  
  return results;
}