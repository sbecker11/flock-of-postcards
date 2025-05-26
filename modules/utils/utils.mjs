// modules/utils/utils.mjs

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("utils", LogLevel.INFO);

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
export const validateKey = (obj, key) => { if (!(key in obj)) throw new Error(`Key '${key}' not found in object`); };
export const validateString = (str) => { if (typeof str === 'undefined' || str === null || typeof str !== 'string' || str.trim().length === 0) throw new Error(`Invalid string:[${str}]`); };
export const validateIntArrayLength = (arr, length) => { if (typeof arr === 'undefined' || arr === null || !Array.isArray(arr) || arr.some(item => !Number.isInteger(item)) || (typeof length !== 'undefined' && arr.length !== length)) throw new Error('Invalid array of integers or length mismatch'); };
export const validateFloat = (num) => { if (typeof num === 'undefined' || num === null || typeof num !== 'number' || !Number.isFinite(num)) throw new Error('Invalid floating-point number'); };
export const validateFloatInRange = (num, min, max) => { if (typeof num === 'undefined' || num === null || typeof num !== 'number' || !Number.isFinite(num) || num < min || num > max) throw new Error(`Invalid floating-point number:[${num}] out of range:[${min}..${max}]`); };

export function isNumeric(obj) {
    const n = parseFloat(obj);
    return Number.isFinite(n);
};

export function isNumericString(str) {
    const n = parseFloat(str);
    return Number.isFinite(n);
}

export function getNumericValue(str) {
    if (isNumericString(str)) {
        const n = parseFloat(str);
        if( Number.isFinite(n) ) return n;
        else throw new Error(`getNumericValue: ${str} is not a numeric string`);
    }
    throw new Error(`getNumericValue: ${str} is not a numeric string`);
}



export const validateIsNumeric = (obj) => {
    if (!isNumeric(obj)) {
        throw new Error(`ValueError: Input is not a number, but it is a(n) ${typeof obj} with value ${obj}`);
    }
};

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
// --------------------------------------
// Javascript hacks

// const left = getOffset(element).left; 
// const {top,left} = getOffset(element); 
export function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while (el && !Number.isNaN(el.offsetLeft) && !Number.isNaN(el.offsetTop)) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

// return "ABC" given "(apples),  !bananas#, & ~cherries"
export function acronym(text) {
    var acro = "";
    text = text.replace(/[.,\/#!@$%\^&\*;:{}=\-_`~()]/g, "").toUpperCase();
    var parts = text.trim().split(" ");
    for (var i = 0; i < parts.length; i++) {
        var part = parts[ i ].trim()
        if (part.length > 0) {
            // add first char
            acro += part[ 0 ];
        }
    }
    if (acro.length == 0)
        acro = text.slice(0, Math.min(3, text.length));
    return acro;
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

export function findScrollableAncestor(element) {
    while (element && element.parentNode) {
        element = element.parentNode;
        if (element === document.body) {
            // document.body is the default scrollable ancestor
            return document.body;
        }
        const overflowY = window.getComputedStyle(element).overflowY;
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
        const canScroll = element.scrollHeight > element.clientHeight;

        if (isScrollable && canScroll) {
            return element;
        }
    }
    return null;
}

export function getObjectAsString(obj) {
    let str = "";
    for (let key in obj) {
        let comma = (str === "") ? "" : ", ";
        str += `${comma}${key}:${obj[key]}`;
    }
    return str;
}

export function getAttributesAsObject(element) {
    let attributes = {};
    for (let attribute of element.attributes) {
        attributes[attribute.name] = attribute.value;
    }
    return attributes;
}
export function getAttributesAsString(element) {
    let attributes = getAttributesAsObject(element);
    return getObjectAsString(attributes);
}

export function getDatasetAsString(element) {
    let dataset = element.dataset;
    return getObjectAsString(dataset);
}

// counts all styles of prop strings
export class PropStyleCounter {
  constructor() {
    this.prop_styles = {};
  }

  prop_style( prop )  {
    if ( isNonEmptyString(prop) ) {
        // remove all numbers from prop
        return prop.replace(/\d/g, '');
    }
    return 'none';
  }

  addProp( prop ) {
    const prop_style = this.prop_style(prop);
    if (!this.prop_styles[prop_style]) {
        this.prop_styles[prop_style] = 1;
    } else {
        this.prop_styles[prop_style] += 1;
    }
  }

  reportPropStyles() {
    for (const prop_style in this.prop_styles) {
      logger.log(`${prop_style}: ${this.prop_styles[prop_style]}`);
    }
  }
}


export const formatNumbersReplacer = (key, value) => {
    if (typeof value === 'number') {
        return Number(value.toFixed(2));
    }
    return value;
}

/**
 * Finds the next sibling element of a given element that has a specific CSS class.
 *
 * @param {Element} element The starting element.
 * @param {string} className The CSS class name to search for.
 * @returns {Element|null} The first matching next sibling element, or null if none is found.
 */
export function findNextSiblingWithClass(element, className) {
    if (!element || !className) {
      logger.error("findNextSiblingWithClass: Invalid element or className provided.");
      return null;
    }
  
    // Start with the immediately following sibling ELEMENT
    let nextElement = element.nextElementSibling;
  
    // Loop through subsequent sibling elements
    while (nextElement) {
      // Check if the current sibling element has the specified class
      if (nextElement.classList.contains(className)) {
        return nextElement; // Found a match!
      }
      // Move to the next sibling ELEMENT
      nextElement = nextElement.nextElementSibling;
    }
  
    // If the loop finishes without finding a match
    return null;
  }
  
// return the integer value between min and max
// @param {number} value - The value to clamp
// @param {number} min - The minimum value
// @param {number} max - The maximum value
// @returns {number} The clamped value  
export function clampInt(value, min, max) {
    if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
        throw new Error(`clamp: value:${value}, min:${min}, or max:${max} is not a number`);
    }
    return Math.max(min, Math.min(max, value));
}

export function matchPositions(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}