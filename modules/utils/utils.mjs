// modules/utils/utils.mjs          

// calculation and logic functions throw no Errors
export const calculateDistance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
export const isBetween = (value, min, max) => value >= min && value <= max;
export const createRect = (x1, y1, x2, y2) => ({ left: Math.min(x1, x2), top: Math.min(y1, y2), right: Math.max(x1, x2), bottom: Math.max(y1, y2) });
export const isPointInsideRect = (x, y, rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
export const half = (value) => typeof value === 'number' ? Math.floor(value / 2) : (() => { throw new Error(`Value '${value}' is not a number`); })();
export const toFixedPoint = (value, precision) => +value.toFixed(precision);
export const linearInterp = (x, x1, y1, x2, y2) => y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const getRandomSign = () => Math.random() < 0.5 ? -1 : 1;
export const zeroPad = (num, places) => num.toString().padStart(places, "0");
export const isString = (value) => (typeof value === 'string' || value instanceof String);
export const isNonEmptyString = (value) => (isString(value) && (value.length > 0));
export const isNumber = (value) => typeof value === 'number' && !Number.isNaN(value);

// validation util functions throw Errors
export const validateKey = (obj, key) => { if (!(key in obj)) throw new Error(`Key '${key}' not found in object`); };
export const validateString = (str) => { if (typeof str === 'undefined' || str === null || typeof str !== 'string' || str.trim().length === 0) throw new Error(`Invalid string:[${str}]`); };
export const validateIntArrayLength = (arr, length) => { if (typeof arr === 'undefined' || arr === null || !Array.isArray(arr) || arr.some(item => !Number.isInteger(item)) || (typeof length !== 'undefined' && arr.length !== length)) throw new Error('Invalid array of integers or length mismatch'); };
export const validateNumbersArray = (arr) => { try { return Array.isArray(arr) && arr.every(item => (validateNumber(item), true)); } catch { return false; } };
export const validateNumber = (num) => { if (typeof num === 'undefined' || num === null || typeof num !== 'number' || !Number.isFinite(num)) throw new Error(`Invalid number:${num}`); };
export const validateNumberInRange = (num, min, max) => { if ( !validateNumbersArray([num, min, max]) || num < min || num > max) throw new Error(`Invalid number:[${num}] out of range:[${min}..${max}]`); };
export const validateIsNumericString = (str) => { if (! isNumericString(str) ) throw new Error(`str:${str} not isNumericString`)}
export const validateFloat = (num) => validateNumber(num);
export const validateFloatInRange = (num, min, max) => validateNumberInRange(num, min, max);
export const validatePosition = (position) => { validateFloat(position.x) && validateFloat(position.y) };
export const validateRect = (domRect) => { 
    if (!domRect) {
        throw new Error(`Invalid rect: rect is ${domRect === undefined ? 'undefined' : 'null'}`);
    }
    if (typeof domRect !== 'object') {
        throw new Error(`Invalid rect: not an object, got ${typeof domRect}`);
    }
    if (domRect.top === undefined || domRect.left === undefined || 
        domRect.right === undefined || domRect.bottom === undefined) {
        throw new Error(`Invalid rect: missing properties - ${JSON.stringify(domRect)}`);
    }
    validateFloat(domRect.top) && validateFloat(domRect.left) && 
    validateFloat(domRect.right) && validateFloat(domRect.bottom);
};

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

// return the numeric value between minVal and maxVal
// @param {number} value - The value to clamp
// @param {number} minVal - The minimum value
// @param {number} maxVal - The maximum value
// @returns {number} The clamped value  
export function clamp(value, minVal, maxVal) {
    if (typeof value !== 'number' || typeof minVal !== 'number' || typeof maxVal !== 'number') {
        throw new Error(`clamp: value:${value}, minVal:${minVal}, or maxVal:${maxVal} is not a number`);
    }
    return max(minVal, min(maxVal, value));
}

// return the integer value between minVal and maxVal
// @param {number} value - The value to clamp
// @param {number} minVal - The minimum value
// @param {number} maxVal - The maximum value
// @returns {number} The clamped value  
export function clampInt(value, minVal, maxVal) {
    if (typeof value !== 'number' || typeof minVal !== 'number' || typeof maxVal !== 'number') {
        throw new Error(`clampInt: value:${value}, minVal:${minVal}, or maxVal:${maxVal} is not a number`);
    }
    // First convert all values to integers, then apply clamping
    const intValue = Math.floor(value);
    const intMinVal = Math.floor(minVal);
    const intMaxVal = Math.floor(maxVal);
    
    return Math.max(intMinVal, Math.min(intMaxVal, intValue));
}

export function max3(val1, val2, val3) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' || typeof val3 !== 'number' ) {
        throw new Error(`max3: val1:${val1} or val2:${val2} or val3:${val3} is not a number`);
    }
    return max(max(val1, val2), val3);
}

/**
 * Test if point x,y is within rect
 * @param {*} x : float
 * @param {*} y : float
 * @param {*} rect : {left, top, right, bottom}
 * @returns true if point x,y is within rect
 */
export function inRect (x, y, rect) {
    return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    );
}

// String-related utility functions
/**
 * Create a position string
 * @param {x:number, y:number} pos - the position
 * @param {string} sep - the separator string, e.g. ',\n'
 * @returns {string} - the position string
 */
export function getPositionAsString(pos, sep=',') {
    const posArray = [`x:${pos.x}`,`y:${pos.y}`];
    const posString = '{' + sep.join(rectArray) + '}';
    return posString;
}

/**
 * Create a rect string
 * @param {top:number, left:number, right:number, bottom:number} rect - the DOMRect
 * @param {string} sep - the separator string, e.g. ',\n'
 * @returns {string} - the rect string
 */
export function getRectAsString(rect, sep='') {
    const rectArray = [`top:${rect.top}`,`left:${rect.left}`,`right:${rect.right}`,`bottom:${rect.bottom}`];
    const rectString = "{" + sep.join(rectArray) + "}";
    return rectString;
}

// returns true for "5", "5.2", "5_foreground_only"
// returns false for "abc", "5abc", "5_foreground_only"
export function hasLeadingNumericValue(str) {
    return typeof str === "string" && /^\d+(\.\d+)?/.test(str);
}

// returns 5 for "5","5_foreground_only" and 5.2 for "5.2" and '5.2_foreground_only"
// throws Error for "abc", "5abc", "5_foreground_only"
export function getLeadingNumericValue(str) {
    const match = str.match(/^\d+(\.\d+)?/);
    if (match) return parseFloat(match[0]);
    throw new Error(`getLeadingNumericValue: ${str} does not start with a number`);
}

// returnd true for : "0", "123", "-5.2", "+.5", ".5"
// returns false for : ".", "", "abc", "5abc", "5_foreground_only"
export function isNumericString(str) {
    // Only return true if the entire string is a valid number (integer or decimal, optional sign)
    return typeof str === 'string' && /^[-+]?\d*(\.\d+)?$/.test(str.trim()) && str.trim() !== '';
}

// returnd Number for : "0", "123", "-5.2", "+.5", ".5"
// throws error for : ".", "", "abc", "5abc", "5_foreground_only"
export function getNumericValue(str) {
    if (typeof str === 'number' && Number.isFinite(str)) {
        return str;
    }
    if (isNumericString(str)) {
        const n = parseFloat(str);
        if (Number.isFinite(n)) return n;
        else throw new Error(`getNumericValue: ${str} is not a numeric string`);
    }
    throw new Error(`getNumericValue: ${str} is not a numeric string`);
}

export const validateIsNumeric = (obj) => {
    if (!isNumericString(obj)) {
        throw new Error(`ValueError: Input is not a number, but it is a(n) ${typeof obj} with value ${obj}`);
    }
}

export function validateIsBoolean(arg) {
    if (typeof arg !== 'boolean') {
        throw new Error(`Argument is not a boolean. but it is a(n) ${typeof arg} with value ${arg}`);
    }
}

export function isPlainObject(obj) {
    if (typeof obj !== 'object' || obj === null) return false;
    if (Array.isArray(obj) || obj instanceof Date || obj instanceof RegExp) return false;
    return true;
}

export function validateIsPlainObject(obj) {
    if (!isPlainObject(obj)) {
        throw new Error(`Error: argument is not a plain object, it is a(n) ${typeof obj} with value ${obj}`);
    }
}



/**
 * called by modules/tests/tests.mjs::runSanityTests()
 */
export function test_utils() {

}
