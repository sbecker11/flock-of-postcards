// modules/utils/mathUils.mjs

import * as utils from './utils.mjs';

/**
 * Return the euccidean distance between two positions
 * @param {x: number, y: number} pos1 
 * @param {x: number, y: number} pos2 
 * @returns number
 */
export function getPositionsSquaredDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return dx*dx + dy*dy;
}

export function getPositionsEuclideanDistance(pos1, pos2) {
    return Math.sqrt(getPositionsSquaredDistance([pos1.x,pos1.y], [pos2.x,pos2.y]));
}

/**
 * Returns the squared distance between two arrays
 * @param {number[]} arr1 
 * @param {number[]} arr2 
 * @returns number
 */
export function getSquaredDistance(arr1, arr2) {
    const dx = arr1[0] - arr2[0];
    const dy = arr1[1] - arr2[1];
    return dx*dx + dy*dy;
}

/**
 * Returns the Euclidean distance between two arrays
 * @param {number[]} arr1 
 * @param {number[]} arr2 
 * @returns number
 */
export function getEuclideanDistance(arr1, arr2) {
    return Math.sqrt(getSquaredDistance(arr1, arr2));
}

/**
 * Returns the sum of differences among all 
 * properties of the DOMRec object
 * @param {DOMRect} rect1 
 * @param {DOMRect} rect2 
 */
export function getRectSquaredDifference(rect1, rect2) {
    const squared_diff = (val1, val2) => { return (val1-val2)*(val1-val2); }
    let diff = 0;
    diff += squared_diff(rect1.top, rect2.top);
    diff += squared_diff(rect1.left, rect2.left); 
    diff += squared_diff(rect1.right, rect2.right);
    diff += squared_diff(rect1.bottom, rect2.bottom);
    return diff;
}

/**
 * Gets a random int number between minVal and maxVal (inclusive)
 * @param {number} minVal - Minimum int value
 * @param {number} maxVal - Maximum int value
 * @returns {number} Random int number between minVal and maxVal
 */
export function getRandomInt(minVal, maxVal) {
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
}

export const getRandomSign = () => Math.random() < 0.5 ? -1 : 1;

/**
 * Gets a random offset within a range
 * @param {number} maxOffset - Maximum offset in pixels
 * @returns {number} Random offset between -maxOffset and maxOffset
 */
export function getRandomSignedOffset(maxOffset) {
    return (Math.random() * 2 - 1) * maxOffset; // Random value between -maxOffset and maxOffset
}

/**
 * Linear interpolation: maps x in [x0, x1] to y in [y0, y1]
 * @param {number} x - The input value
 * @param {number} x0 - The lower bound of x
 * @param {number} y0 - The lower bound of y
 * @param {number} x1 - The upper bound of x
 * @param {number} y1 - The upper bound of y
 * @returns {number} The interpolated value
 */
export function linearInterp(x, x0, y0, x1, y1) {
    if (x1 === x0) throw new Error("x0 and x1 cannot be the same value");
    return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
} 

export const linearInterpArray = (t, array1, array2) => {
    validateIsNumericArray(array1);
    validateIsNumericArray(array2);
    const interpolatedArray = [];
    if (array1.length != array2.length)
        throw new Error('linearInterpArray length not equal');

    for (let i = 0; i < array1.length; i++) {
        const channelInterpolation = linearInterp(t, 0, array1[ i ], 1, array2[ i ]);
        interpolatedArray.push(Math.round(channelInterpolation));
    }
    validateIsNumericArray(interpolatedArray);
    return interpolatedArray;
};
export const isNumericArray = (arr) => {
    if (!Array.isArray(arr)) {
        return false;
    }
    for (const element of arr) {
        if (!isNumericString(element)) {
            return false;
        }
    }
    return true;
};
export function validateIsNumericArray(arr) {    
    if (!isNumericArray(arr)) {
        throw new Error("ValueError: Array must contain only numeric values");
    }
}
export const arrayHasNaNs = array => array.some(element => Number.isNaN(element));

export const arraysAreEqual = (arr1, arr2) => arr1.length === arr2.length && arr1.every((element, index) => element === arr2[index]);

export function validateIsArray(arr) {
    if (!Array.isArray(arr)) {
        const inputType = typeof arr;
        throw new Error(`ValueError: Input is not an array, it is a(n) ${inputType} with value ${arr}`);
    }
    if (arr.length === 0) {
        throw new Error("ValueError: Array length must be greater than 0");
    }
}
export function validateIsArrayOfArrays(obj) {
    if (!Array.isArray(obj)) {
        throw new Error(`ValueError: Input is not an array, but is a(n) ${typeof obj} with value ${obj}`);
    }
    if (obj.length === 0) {
        throw new Error("ValueError: Array must not be empty");
    }
    obj.forEach(element => {
        validateIsArray(element);
    });
}


export function formatNumber(num, format) {
    // Parse the format string
    const [wholeDigits, decimalDigits] = format.split('.').map(Number);
  
    // Separate the number into whole and decimal parts
    let wholePart = Math.floor(num); // Keep the sign for the whole part
    let decimalPart = num % 1;
  
    // Convert the whole part to a string and include the minus sign in the count if the number is negative
    let wholePartStr = wholePart.toString();
    let lengthToCheck = num < 0 ? wholePartStr.length - 1 : wholePartStr.length; // Subtract 1 if the number is negative
  
    // Check if the length exceeds the specified number of digits
    if (lengthToCheck > wholeDigits) {
      throw new Error(`Format error: the number ${num} has a whole part larger than ${wholeDigits} digits.`);
    }
  
    // Format the whole part
    let formattedWhole = wholePartStr.padStart(wholeDigits, '0');
  
    // Format the decimal part
    let formattedDecimal = decimalPart.toFixed(decimalDigits).substring(2);
  
    return `${formattedWhole}.${formattedDecimal}`;
}

/** ---------------------------------------
 * tests mathUtils functions 
 * reporting only test failures
 */

let numErrs = 0;

function clearErrs() {
    numErrs = 0;
}

function testArrayFunctions() {
    const arr = [1, 2, 3];
    if ( !isNumericArray(arr) ) {
        // console.log(`ERROR: isNumericArray(${arr}) = false but expected true`);
        numErrs++;
    }
    try {
        validateIsNumericArray(arr);
    } catch (e) {
        // console.log(`ERROR: validateIsNumericArray(${arr}) threw error but expected no error`);
        numErrs++;
    }
    if ( arrayHasNaNs(arr) ) {
        // console.log(`ERROR: arrayHasNaNs(${arr}) = true but expected false`);
        numErrs++;
    }
    const arr2 = [1, 2, 3];
    if ( arraysAreEqual(arr, arr2) ) {
        // console.log(`ERROR: arraysAreEqual(${arr}, ${arr2}) = true but expected false`);
        numErrs++;
    }
}

function testMinMaxAbs() {
    const val1 = 1;
    const val2 = 2;
    const val3 = 3;

    if ( abs(-val1) != val1 ) {
        // console.log(`ERROR: abs(-${val1}) = ${abs(-val1)} but expected ${val1}`);
        numErrs++;
    }
    if ( abs_diff(val1, val2) != val2 - val1 ) {
        // console.log(`ERROR: abs_diff(${val1}, ${val2}) = ${abs_diff(val1, val2)} but expected ${val2 - val1}`);
        numErrs++;
    }
    if ( min(val1, val2) != val1 ) {
        // console.log(`ERROR: min(${val1}, ${val2}) = ${min(val1, val2)} but expected ${val1}`);
        numErrs++;
    }
    if ( max(val1, val2) != val2 ) {
        // console.log(`ERROR: max(${val1}, ${val2}) = ${max(val1, val2)} but expected ${val2}`);
        numErrs++;
    }
    if ( max3(val1, val2, val3) !== val3 ) {
        // console.log(`ERROR: max3(${val1}, ${val2}, ${val3}) = ${max3(val1, val2, val3)} but expected ${val3}`);
        numErrs++;
    }
}

function testClamps() {
    const value = 1.5;
    const minVal = 1;
    const maxVal = 2;
    const expected = 1.5;
    const result = clamp(value, minVal, maxVal);
    if (result !== expected) {
        // console.log(`ERROR: clamp(${value}, ${minVal}, ${maxVal}) = ${result} but expected ${expected}`);
        numErrs++;
    }
    const value2 = 2.5;
    const expected2 = 2;
    const result2 = clampInt(value2, minVal, maxVal);
    if (result2 !== expected2) {
        // console.log(`ERROR: clampInt(${value2}, ${minVal}, ${maxVal}) = ${result2} but expected ${expected2}`);
        numErrs++;
    }
}

function testLinearInterp() {
    const x = 0.5;
    const x0 = 0;
    const y0 = 0;
    const x1 = 1;
    const y1 = 1;
    const expected = 0.5;
    const result = linearInterp(x, x0, y0, x1, y1);
    if (result !== expected) {
        // console.log(`ERROR: linearInterp(${x}, ${x0}, ${y0}, ${x1}, ${y1}) = ${result} but expected ${expected}`);
        numErrs++;
    }
}

function testArrayOfArrays() {
    const arr = [[1, 2, 3], [4, 5, 6]];
    if (!validateIsArrayOfArrays(arr) ) {
        // console.log(`ERROR: validateIsArrayOfArrays(${arr}) threw error but expected no error`);
        numErrs++;
    }
}

function testDistances() {

    const pos1 = {x: 0, y: 0};
    const pos2 = {x: 1, y: 1};
    let expected = Math.sqrt(2);
    let result = getPositionsEuclideanDistance(pos1, pos2);
    if (result !== expected) {
        // console.log(`ERROR: getPositionsEuclideanDistance(${pos1}, ${pos2}) = ${result} but expected ${expected}`);
        numErrs++;
    }
    if ( getPositionsSquaredDistance(pos1, pos2) !== 2) {
        // console.log(`ERROR: getPositionsSquaredDistance(${pos1}, ${pos2}) = ${result} but expected ${expected}`);
        numErrs++;
    }

    const arr1 = [0, 0];
    const arr2 = [1, 1];
    expected = Math.sqrt(2);
    result = getEuclideanDistance(arr1, arr2);
    if (result !== expected) {
        // console.log(`ERROR: getEuclideanDistance(${arr1}, ${arr2}) = ${result} but expected ${expected}`);
        numErrs++;
    }

    if ( getSquaredDistance(arr1, arr2) !== 2) {
        // console.log(`ERROR: getSquaredDistance(${arr1}, ${arr2}) = ${result} but expected ${expected}`);
        numErrs++;
    }
}

function testRandomOffset() {
    const maxOffset = 10;
    const result = getRandomSignedOffset(maxOffset);
    if (result < -maxOffset || result > maxOffset) {
        // console.log(`ERROR: getRandomSignedOffset(${maxOffset}) = ${result} but expected a value between -${maxOffset} and ${maxOffset}`);
        numErrs++;
    }
}

/**
 * tests mathUtils functions 
 * reporting only test failures
 */
export function test_mathutils() {
    clearErrs();
    testMinMaxAbs();
    testClamps();
    testArrayOfArrays();
    testLinearInterp();
    testDistances();
    testRandomOffset();
    if ( numErrs !== 0 ) {
        // console.log(`mathUtils: ${numErrs} tests failed`);
    }
}