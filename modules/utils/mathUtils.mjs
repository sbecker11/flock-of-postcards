// modules/utils/arrayUtils.mjs

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
export function getSquaredDistance(arr1, arr2) {
    const dx = arr1[0] - arr2[0];
    const dy = arr1[1] - arr2[1];
    return dx*dx + dy*dy;
}
export function getPositionsEuclideanDistance(pos1, pos2) {
    return Math.sqrt(getSquaredDistance([pos1.x,pos1.y], [pos2.x,pos2.y]));
}
export function getEuclideanDistance(arr1, arr2) {
    return Math.sqrt(getSquaredDistance(arr1, arr2));
}
/**
 * Gets a random int number between min and max (inclusive)
 * @param {number} min - Minimum int value
 * @param {number} max - Maximum int value
 * @returns {number} Random int number between min and max
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
        if (!isNumeric(element)) {
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