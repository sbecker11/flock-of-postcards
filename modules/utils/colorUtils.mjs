// Color Utilities
import { clampInt } from './arrayUtils.mjs';
import { isNonEmptyString } from './typeValidators.mjs';

export function isHexColorString(hexColorStr) {
    return (isNonEmptyString(hexColorStr) && /^#[0-9A-F]{6}$/i.test(String(hexColorStr)));
}

export function validateHexColorString(hexColorStr) {
    if (!isHexColorString(hexColorStr)) {
        throw new Error(`hexColorStr: '${hexColorStr}' is invalid.`);
    }
}

export const adjustRgbBrightness = (rgb, brightness) => { validateIntArrayLength(rgb, 3); return rgb.map(channel => clampInt(Math.round(channel * brightness), 0, 255)); }; // 1.0 is normal brightness
export const adjustHexBrightness = (hexStr, brightness) => { validateHexColorString(hexStr); validateFloat(brightness); return get_Hex_from_RGB(adjustRgbBrightness(get_RGB_from_Hex(`${hexStr}`), brightness)); }; // 1.0 is normal brightness

export const get_RGB_from_Hex = hexStr => {
    validateHexColorString(hexStr);
    const r = parseInt(hexStr.slice(1, 3), 16);
    const g = parseInt(hexStr.slice(3, 5), 16);
    const b = parseInt(hexStr.slice(5, 7), 16);
    return [r, g, b];
};

export const get_RGBA_from_RGB = (RGB, alpha) => { validateIntArrayLength(RGB, 3); validateFloatInRange(alpha, 0.0, 1.0); return `rgba(${RGB[0]}, ${RGB[1]}, ${RGB[2]}, ${alpha})`; };

export const get_Hex_from_RGB = RGB => { validateIntArrayLength(RGB, 3); return "#" + RGB.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase(); };

export function get_HSV_from_RGB([R, G, B]) {
    const RGB = [R,G,B];
    validateRGB(RGB);
    const r = R/255.0;
    const g = G/255.0;
    const b = B/255.0;
  
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
  
    let h, s, v = max;
  
    if (delta === 0) {
      h = s = 0; // achromatic
    } else {
      s = delta / max;
  
      if (max === r) {
        h = (g - b) / delta + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
      }
  
      h /= 6;
    }
    const H = clampDegrees(h * 360);
    const S = clampInt(s * 100.0, 0, 100);
    const V = clampInt(v * 100.0, 0, 100);
    const HSV = [H,S,V];
    validateHSV(HSV);

    return HSV;
}

export const get_RGB_from_HSV = (HSV) => {
    validateHSV(HSV);
    const h = HSV[0];
    const s = HSV[1] / 100.0;
    const v = HSV[2] / 100.0;
    function f(n) {
        const k = (n + h / 60) % 6;
        const factor = Math.max(Math.min(k, 4 - k, 1), 0);
        return v - v * s * factor;
    }
    const RGB = [ 255.0 * f(5), 255.0 * f(3),255.0 *  f(1) ].map(Math.round);
    validateRGB(RGB);
    return RGB;
}

export function get_HSV_from_Hex(hexStr) {
    validateHexColorString(hexStr);
    const RGB = get_RGB_from_Hex(hexStr);
    validateRGB(RGB);
    const HSV = get_HSV_from_RGB(RGB);
    validateHSV(HSV);
    return HSV;
}

export function get_Hex_from_HSV(HSV) {
    validateHSV(HSV);
    const RGB = get_RGB_from_HSV(HSV);
    validateRGB(RGB);
    const Hex = get_Hex_from_RGB(RGB);
    validateHexColorString(Hex);
    return Hex;
}

export function getHexDifference(hexStr1, hexStr2) {
    const rgb1 = get_RGB_from_Hex(hexStr1);
    const rgb2 = get_RGB_from_Hex(hexStr2);
    const rDist = abs(rgb1[0] - rgb2[0]);
    const gDist = abs(rgb1[1] - rgb2[1]);
    const bDist = abs(rgb1[2] - rgb2[2]);
    return max3(rDist, gDist, bDist);
}

export function clampDegrees(value) {
    // guaranteed to return a value between 0 and 360.0 degrees
    while ( value < 0.0 ) {
        value += 360.0;
    }
    while ( value > 360.0 ) {
        value -= 360.0;
    }
    return clampInt(value, 0, 360);
}

/**
 * Checks if an array is a valid HSV color array
 * @param {number[]} HSV - The HSV array to check
 * @returns {boolean} True if the array is a valid HSV color array
 */
export function isHSV(HSV) {
    if (!Array.isArray(HSV) || HSV.length !== 3) {
        return false;
    }
    const [h, s, v] = HSV;
    return (
        typeof h === 'number' && !isNaN(h) && h >= 0 && h <= 360 &&
        typeof s === 'number' && !isNaN(s) && s >= 0 && s <= 100 &&
        typeof v === 'number' && !isNaN(v) && v >= 0 && v <= 100
    );
}

export function validateHSV(HSV) {
    if (!isHSV(HSV)) {
        throw new Error(`HSV:[${HSV}] is invalid`);
    }
}

/**
 * Checks if an array is a valid RGB color array
 * @param {number[]} RGB - The RGB array to check
 * @returns {boolean} True if the array is a valid RGB color array
 */
export function isRGB(RGB) {
    if (!Array.isArray(RGB) || RGB.length !== 3) {
        return false;
    }
    return RGB.every(channel => 
        typeof channel === 'number' && 
        !isNaN(channel) && 
        channel >= 0 && 
        channel <= 255
    );
}

export function validateRGB(RGB) {
    if (!isRGB(RGB)) {
        throw new Error(`RGB:[${RGB}] is invalid`);
    }
}

export function test_HSV_RGB_Hex_functions() {
    function test_get_HSV_from_RGB() {
        const RGBIn = [64, 128, 255];
        const HSV = get_HSV_from_RGB([RGBIn[0],RGBIn[1],RGBIn[2]]);
        const RGBOut = get_RGB_from_HSV([HSV[0],HSV[1],HSV[2]]);
        const rgbDist = getEuclideanDistance(RGBOut, RGBIn);
        if ( rgbDist > EPSILON )
            logger.log(`ERROR: rgbDist:${rgbDist} exceeds ESPSILON:${EPSILON}`);
    }
    function test_get_RGB_from_HSV() {
        const HSVIn = [180, 75, 100]; // H in [0..360], S in [0..100], V in [0..100]
        const RGB = get_RGB_from_HSV([HSVIn[0],HSVIn[1],HSVIn[2]]);
        const HSVOut = get_HSV_from_RGB([RGB[0],RGB[1],RGB[2]]);
        const hsvDist = getEuclideanDistance(HSVOut, HSVIn);
        if (hsvDist > EPSILON ) 
            logger.log(`ERROR: hsvDist:${hsvDist} exceeds ESPSILON:${EPSILON}`);
    }
    function test_get_HSV_from_Hex() {
        const hexStr = "#66AAEE";
        const HSV = get_HSV_from_Hex(hexStr);
        const hexOut = get_Hex_from_HSV(HSV);
        const hexDiff = getHexDifference(hexStr, hexOut);
        if ( hexDiff > 1 ) {
            logger.log(`ERROR: hexDiff:${hexDiff} exceeds 1`);
        }
    }
    function test_get_Hex_from_HSV() {
        const HSVin = [45, 90, 80];
        const hexStr = get_Hex_from_HSV(HSVin);
        const HSVout = get_HSV_from_Hex(hexStr);
        const hsvDist = getEuclideanDistance(HSVout, HSVin);
        if ( hsvDist > EPSILON ) {
            logger.log(`ERROR: hsvDist:${hsvDist} exceeds ESPSILON:${EPSILON}`);
        }
    }
    test_get_HSV_from_RGB();
    test_get_RGB_from_HSV();
    test_get_HSV_from_Hex();
    test_get_Hex_from_HSV();
}

/**
 * Gets a high contrast CSS hex color string for a given background color
 * @param {string} backgroundColor - The background color in hex format
 * @returns {string} A high contrast color in hex format
 */
export function getHighContrastCssHexColorStr(backgroundColor) {
    validateHexColorString(backgroundColor);
    const rgb = get_RGB_from_Hex(backgroundColor);
    // Calculate relative luminance using the formula from WCAG 2.0
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    // Return black for light backgrounds and white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Calculates the Euclidean distance between two RGB color arrays
 * @param {number[]} rgb1 - First RGB color array [r,g,b]
 * @param {number[]} rgb2 - Second RGB color array [r,g,b]
 * @returns {number} The Euclidean distance between the colors
 */
export function getEuclideanDistance(rgb1, rgb2) {
    if (!Array.isArray(rgb1) || !Array.isArray(rgb2) || rgb1.length !== 3 || rgb2.length !== 3) {
        throw new Error('Both arguments must be RGB arrays of length 3');
    }
    const rDiff = rgb1[0] - rgb2[0];
    const gDiff = rgb1[1] - rgb2[1];
    const bDiff = rgb1[2] - rgb2[2];
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Validates that an array contains integers and has the specified length
 * @param {number[]} arr - The array to validate
 * @param {number} length - The expected length of the array
 * @throws {Error} If the array is invalid or has the wrong length
 */
export function validateIntArrayLength(arr, length) {
    if (!Array.isArray(arr)) {
        throw new Error('Input must be an array');
    }
    if (arr.length !== length) {
        throw new Error(`Array must have length ${length}, got ${arr.length}`);
    }
    if (!arr.every(item => Number.isInteger(item))) {
        throw new Error('All array elements must be integers');
    }
}

/**
 * Validates that a number is a float within a specific range
 * @param {number} num - The number to validate
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @throws {Error} If the number is invalid or out of range
 */
export function validateFloatInRange(num, min, max) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
        throw new Error(`Invalid number: ${num}`);
    }
    if (num < min || num > max) {
        throw new Error(`Number ${num} is out of range [${min}, ${max}]`);
    }
} 