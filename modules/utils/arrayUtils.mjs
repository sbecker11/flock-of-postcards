// Array and Vector Utilities
export function abs(val) {
    if ( typeof val !== 'number' ) {
        throw new Error(`abs: val:${val} is not a number`);
    }
    return val < 0 ? -val : val; 
}

export function abs_diff(val1, val2) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' ) {
        throw new Error(`abs_diff: val1:${val1} or val2:${val2} is not a number`);
    }
    return val1 < val2 ? val2 - val1 : val1 - val2; 
}

export function min(val1, val2) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' ) {
        throw new Error(`min: val1:${val1} or val2:${val2} is not a number`);
    }
    return val1 < val2 ? val1 : val2;
}

export function max(val1, val2) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' ) {
        throw new Error(`max: val1:${val1} or val2:${val2} is not a number`);
    }
    return val1 > val2 ? val1 : val2;
}

export function max3(val1, val2, val3) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' || typeof val3 !== 'number' ) {
        throw new Error(`max3: val1:${val1} or val2:${val2} or val3:${val3} is not a number`);
    }
    return max(max(val1, val2), val3);
}

export function getEuclideanDistance(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        throw new Error('Both arrays must have the same length');
    }
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
        sum += Math.pow(arr1[i] - arr2[i], 2);
    }
    return Math.sqrt(sum);
}

export const clampInt = (value, min, max) => Math.round(Math.max(min, Math.min(max, value)));
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const getRandomSign = () => Math.random() < 0.5 ? -1 : 1;

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