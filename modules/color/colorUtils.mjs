// modules/utils/colorUtils.mjs

import * as mathUtils from '../utils/mathUtils.mjs';
import * as utils from '../utils/utils.mjs';
import * as cssColors from './cssColors.mjs';

import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("colorUtils", LogLevel.DEBUG);

// --------------------------------------
// Utility export functions

const EPSILON = 1.0;

/**
 * returns true if hexColorStr is a valid hex color string
 * @param {string} hexColorStr 
 * @returns boolean
 */
export function isHexColorString(hexColorStr) {
    return (utils.isNonEmptyString(hexColorStr) && /^#[0-9A-F]{6}$/i.test(String(hexColorStr)));
}

/**
 * throws an Error if hexColorStr is not a valid hex color string
 * @param {string} hexColorStr 
 * @returns nothing
 */
export function validateHexColorString(hexColorStr) {
    if (!isHexColorString(hexColorStr) ) {
        throw new Error(`hexColorStr: '${hexColorStr}' is invalid.`);
    }
}

/**
 * Calculates the maximum rgb difference between the hex strings
 * @param {string} hexStr1 
 * @param {string} hexStr2 
 * @returns {number} the maximum rgb difference
 */
export function getHexDifference(hexStr1, hexStr2) {
    const rgb1 = get_RGB_from_Hex(hexStr1);
    const rgb2 = get_RGB_from_Hex(hexStr2);
    const rDist = mathUtils.abs(rgb1[0] - rgb2[0]);
    const gDist = mathUtils.abs(rgb1[1] - rgb2[1]);
    const bDist = mathUtils.abs(rgb1[2] - rgb2[2]);
    return mathUtils.max3(rDist, gDist, bDist);
}


/**
 * Clamps the given value to a valid degree value between 0 and 360
 * @param {number} value 
 * @returns {number} a valid degree value
 */
export function clampDegrees(value) {
    // guaranteed to return a value between 0 and 360.0 degrees
    while ( value < 0.0 ) {
        value += 360.0;
    }
    while ( value > 360.0 ) {
        value -= 360.0;
    }
    return mathUtils.clampInt(value, 0, 360);
}

/**
 * Adjusts the brightness of an RGB array
 * @param {number[]} rgb 
 * @param {number} brightness 
 * @returns {number[]} a brightness adjusted RGB array
 */
export const adjustRgbBrightness = (rgb, brightness) => { utils.validateIntArrayLength(rgb, 3); return rgb.map(channel => mathUtils.clampInt(Math.round(channel * brightness), 0, 255)); }; // 1.0 is normal brightness

/**
 * Adjusts the brightness of a hex color string
 * @param {string} hexStr 
 * @param {number} brightness 
 * @returns 
 */
export const adjustHexBrightness = (hexStr, brightness) => { validateHexColorString(hexStr); utils.validateFloat(brightness); return get_Hex_from_RGB(adjustRgbBrightness(get_RGB_from_Hex(`${hexStr}`), brightness)); }; // 1.0 is normal brightness

/**
 * Converts a hex color string to an RGB array
 * @param {string} hexStr 
 * @returns (number[]} an RGB array
 */
export const get_RGB_from_Hex = hexStr => {
    validateHexColorString(hexStr);
    const r = parseInt(hexStr.slice(1, 3), 16);
    const g = parseInt(hexStr.slice(3, 5), 16);
    const b = parseInt(hexStr.slice(5, 7), 16);
    return [r, g, b];
};


/**
 * converts an RGB array to an RGBA string
 * @param {number[]} RGB 
 * @param {number} alpha 
 * @returns an RGBA array
 */
export const get_RGBA_from_RGB = (RGB, alpha) => { utils.validateIntArrayLength(RGB, 3); utils.validateFloatInRange(alpha, 0.0, 1.0); return `rgba(${RGB[0]}, ${RGB[1]}, ${RGB[2]}, ${alpha})`; };

/**
 * converts an RGB array to an Hex string
 * @param {number[]} RGB 
 * @returns {String} a hex color string
 */
export const get_Hex_from_RGB = RGB => { utils.validateIntArrayLength(RGB, 3); return "#" + RGB.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase(); };

/**
 * checks if HSV is a valid HSV array and within ranges for each channel
 * @param {number[]} HSV 
 * @returns boolean
 */
export function isHSV(HSV) {
    if (!Array.isArray(HSV)) return false;
    if (HSV.length != 3) return false;
    if (HSV[0] < 0.0) return false;
    if (HSV[0] > 360.0) return false;
    if (HSV[1] < 0.0) return false;
    if (HSV[1] > 100.0) return false;
    if (HSV[2] < 0.0) return false;
    if (HSV[2] > 100.0) return false;
    return true;
}


/**
 * throws an Error if HSV is not a valid HSV array
 * @param {number[]} HSV 
 */
export function validateHSV(HSV) {
    if ( !isHSV(HSV) ) {
        throw new Error(`HSV:[${HSV}] is invalid`);
    }
}

/**
 * tests if RGB is a valid RGB array
 * @param {number[]} RGB 
 * @returns {boolean}
 */
export function isRGB(RGB) {
    if (!Array.isArray(RGB) || RGB.length != 3 || RGB[0] < 0 || RGB[0] > 255 || RGB[1] < 0 || RGB[1] > 255 || RGB[2] < 0 || RGB[2] > 255) {
        return false;
    }
    return true;
}

/**
 * throws an Error if RGB is not a valid RGB array
 * @param {number[]} RGB 
 * @returns {boolean} RGB 
 */
export function validateRGB(RGB) {
    if ( !isRGB(RGB) ) {
        throw new Error(`RGB:[${RGB}] is invalid`);
    }
}

/**
 * given RGB array [r,g,b] return HSV array [h,s,v]
 * for example: get_HSV_from_RGB([255, 0, 0]) returns [0, 100, 100] 
 * @ts-ignore
 * @param {number[]} RGB
 * @returns {number[]} an HSV array
 */
export function get_HSV_from_RGB([R, G, B]) {
    const RGB = [R,G,B];
    validateRGB(RGB);
    const r = R/255.0;
    const g = G/255.0;
    const b = B/255.0;
  
    const max = mathUtils.max(r, g, b);
    const min = mathUtils.min(r, g, b);
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
    const S = mathUtils.clampInt(s * 100.0, 0, 100);
    const V = mathUtils.clampInt(v * 100.0, 0, 100);
    const HSV = [H,S,V];
    validateHSV(HSV);

    return HSV;
}

/**
 * Clamp all channels to [0,255]
 * @param {number[]} RGB array
 * @returns {number{}} RGB array clamped to [0,255]
 */
function clampRGBtoRange(RGB) {
    return RGB.map(channel => mathUtils.clampInt(channel, 0, 255));
}

/**
 * given HSV array [h,s,v (360,100,100) return RGB array [r,g,b] [255,255,255]
 * @ts-ignore
 * @param {number[]} HSV
 * @returns {number[]} an RGB array
 */
export const get_RGB_from_HSV = (HSV) => {
    validateHSV(HSV);
    const h = HSV[0];
    const s = HSV[1] / 100.0;
    const v = HSV[2] / 100.0;
    function f(n) {
        const k = (n + h / 60) % 6;
        const factor = mathUtils.max(mathUtils.min(k, 4 - k, 1), 0);
        return v - v * s * factor;
    }
    let RGB = [ 255.0 * f(5), 255.0 * f(3),255.0 *  f(1) ].map(Math.round);
    RGB = clampRGBtoRange(RGB);
    validateRGB(RGB);
    return RGB;
}


/**
 * Converts a hex color string to an HSV array
 * @param {*} hexStr 
 * @returns 
 */
export function get_HSV_from_Hex(hexStr) {
    validateHexColorString(hexStr);
    const RGB = get_RGB_from_Hex(hexStr);
    validateRGB(RGB);
    // @ts-ignore
    const HSV = get_HSV_from_RGB(RGB);
    validateHSV(HSV);
    return HSV;
}

/**
 * Converts an HSV array to a hex color string
 * @param {*} HSV 
 * @returns a hex color string
 */
export function get_Hex_from_HSV(HSV) {
    validateHSV(HSV);
    const RGB = get_RGB_from_HSV(HSV);
    validateRGB(RGB);
    const Hex = get_Hex_from_RGB(RGB);
    validateHexColorString(Hex);
    return Hex;
}

/**
 * tests the HSV/RGB/Hex conversion functions
 */
export function test_HSV_RGB_Hex_functions() {
    function test_get_HSV_from_RGB() {
        const RGBIn = [64, 128, 255];
        const HSV = get_HSV_from_RGB([RGBIn[0],RGBIn[1],RGBIn[2]]);
        const RGBOut = get_RGB_from_HSV([HSV[0],HSV[1],HSV[2]]);
        const rgbDist = mathUtils.getEuclideanDistance(RGBOut, RGBIn);
        if ( rgbDist > EPSILON )
            console.log(`ERROR: rgbDist:${rgbDist} exceeds EPSILON:${EPSILON}`);
    }
    function test_get_RGB_from_HSV() {
        const HSVIn = [180, 75, 100]; // H in [0..360], S in [0..100], V in [0..100]
        const RGB = get_RGB_from_HSV([HSVIn[0],HSVIn[1],HSVIn[2]]);
        validateRGB(RGB);
        const expectedRGB =[0, 179, 255];
        const HSVOut = get_HSV_from_RGB([RGB[0],RGB[1],RGB[2]]);
        const hsvDist = mathUtils.getEuclideanDistance(HSVOut, HSVIn);
        if (hsvDist > EPSILON ) 
            console.log(`ERROR: hsvDist:${hsvDist} exceeds EPSILON:${EPSILON}`);
    }
    function test_get_HSV_from_Hex() {
        const hexStr = "#66AAEE";
        const HSV = get_HSV_from_Hex(hexStr);
        const hexOut = get_Hex_from_HSV(HSV);
        const hexDiff = getHexDifference(hexStr, hexOut);
        if ( hexDiff > 1 ) {
            console.log(`ERROR: hexDiff:${hexDiff} exceeds 1`);
        }
    }
    function test_get_Hex_from_HSV() {
        const HSVin = [45, 90, 80];
        const Hex = get_Hex_from_HSV(HSVin);
        const HSVout = get_HSV_from_Hex(Hex);
        const hsvDist = mathUtils.getEuclideanDistance(HSVout, HSVin);
        if ( hsvDist > EPSILON )
            console.log(`ERROR: hsvDist:${hsvDist} exceeds EPSILON:${EPSILON}`);
    }
    
    test_get_HSV_from_RGB();
    test_get_RGB_from_HSV();
    test_get_HSV_from_Hex();
    test_get_Hex_from_HSV();
}

/**
 * converts an  RgbStr to an RGB array
 * @param {a} rgbStr 
 * @returns an RGB array
 */
export function get_RGB_from_RgbStr(rgbStr) {
    if ( utils.isString(rgbStr) ) {
        rgbStr = rgbStr.replaceAll(" ","");
        const regex = /rgb\((\d+),(\d+),(\d+)\)/;
        const matches = rgbStr.match(regex);
        if (matches) {
            const [ , rStr, gStr, bStr ] = matches;
            const R = parseInt(rStr, 10);
            const G = parseInt(gStr, 10);
            const B = parseInt(bStr, 10);
            const RGB = [ R, G, B ];
            if( isRGB(RGB) )
                return RGB;
        }
    }
    return null;
}

/* 
 * converts an RGB array to an RgbStr
 * @param {number[]} RGB 
 * @returns an RgbStr
 */
export function get_RgbStr_from_RGB(RGB) {
    return `rgb(${RGB[0]}, ${RGB[1]}, ${RGB[2]})`;
}

/**
 * tests the RGB/RgbStr conversion functions
 */
export function test_RGB_RgbStr_functions() {
    function test_get_RGB_from_RgbStr() {
        const rgbStrIn = 'rgb(255, 64, 127)';
        const RGB = get_RGB_from_RgbStr(rgbStrIn);
        const rgbStrOut = get_RgbStr_from_RGB(RGB);
        const rgbDist = mathUtils.getEuclideanDistance(RGB, [255, 64, 127]);
        if ( rgbStrIn !== rgbStrOut )
            console.log(`ERROR: rgbStrIn:${rgbStrIn} != rgbStrOut:${rgbStrOut}`);
    }
    function test_get_RgbStr_from_RGB() {
        const rgbIn = [255, 0, 0];
        const rgbStr = get_RgbStr_from_RGB(rgbIn);
        const rgbOut = get_RGB_from_RgbStr(rgbStr);
        if ( !mathUtils.arraysAreEqual(rgbOut, rgbIn) )
            console.log(`ERROR: rgbOut:${rgbOut} != rgbIn:${rgbIn}`);
    }
    test_get_RGB_from_RgbStr();
    test_get_RgbStr_from_RGB();
}

/**
 * converts a ColorStr to an RGB array
 * @param {*} colorStr 
 * @returns an RGB array
 */
export function get_RGB_from_ColorStr(colorStr) {
    if ( utils.isString(colorStr) && colorStr.length > 6) {
        colorStr = colorStr.replaceAll(" ","");
        const regex = /color\((\d+),(\d+),(\d+)\)/;
        const matches = colorStr.match(regex);
        var RGB = [];
        if (matches) {
            const [ , rStr, gStr, bStr ] = matches;
            const R = parseInt(rStr, 10);
            const G = parseInt(gStr, 10);
            const B = parseInt(bStr, 10);
            RGB = [ R, G, B ];
        }
        return RGB;
    }
    return null;
}

/** converts an RGB array to a ColorStr
 * @param {number[]} RGB 
 * @returns a ColorStr
 */
export function get_ColorStr_from_RGB(RGB) {
    validateRGB(RGB);
    return `color(${RGB[0]}, ${RGB[1]}, ${RGB[2]})`;
}

/**
 * converts any color string to an RGB array
 * @param {*} anyStr 
 * @returns an RGB array or null if not a parsablecolor string
 */
export function get_RGB_from_AnyStr(anyStr) {
    if ( utils.isString(anyStr) ) {
        let hex = cssColors.get_HEX_from_CssColor(anyStr);
        if ( isHexColorString(hex) ) {
            return get_RGB_from_Hex(hex);
        } else if ( isHexColorString(anyStr) ) {
            return get_RGB_from_Hex(anyStr);
        } else if ( anyStr.startsWith('rgb') ) {
            return get_RGB_from_RgbStr(anyStr);
        } else if ( anyStr.startsWith('color') ) {
            return get_RGB_from_ColorStr(anyStr);
        } else {
            console.trace(`anyStr:[${anyStr}] unable to find matching RGB converter`);
            return null;
        }
    }
    console.trace(`anyStr:[${anyStr}] is undefined, null, or blank`);
    return null;
}

/**
 * tests the RGB/ColorStr conversion functions
 */
export function test_RGB_ColorStr_functions() {
    function test_get_ColorStr_from_RGB() {
        const RGBin = [127, 64, 255];
        const ColorStr = get_ColorStr_from_RGB(RGBin);
        const RGBout = get_RGB_from_ColorStr(ColorStr);
        if ( !mathUtils.arraysAreEqual(RGBout, RGBin) )
            console.log(`ERROR: RGBout:${RGBout} != RGBin:${RGBin}`);
    }
    function test_get_RGB_from_ColorStr() {
        const ColorStrIn = "color(127, 64, 255)";
        const RGB = get_RGB_from_ColorStr(ColorStrIn);
        const ColorStrOut = get_ColorStr_from_RGB(RGB);
        if ( ColorStrOut != ColorStrIn )
            console.log(`ERROR: ColorStrOut:${ColorStrOut} != ColorStrIn:${ColorStrIn}`);
    }
    test_get_ColorStr_from_RGB();
    test_get_RGB_from_ColorStr();
}

/**
 * converts a ColorStr to a hex color string
 * @param {*} colorStr 
 * @returns a hex color string
 */
export function get_Hex_from_ColorStr(colorStr) {
    var RGB = get_RGB_from_AnyStr(colorStr);
    
    // Check if RGB is valid
    if (!RGB || !isRGB(RGB)) {
        return "#000000"; // Default to black for invalid colors
    }
    
    return get_Hex_from_RGB(RGB);
}

/**
 * Uses the browser's color parsing to normalize a hex color string
 * @param {*} hexColorStr 
 * @returns the normalized hex color string
 */
export function normalizeHexColorString(hexColorStr) {
    // Create a dummy element to leverage the browser's color parsing
    var dummy = document.createElement("div");
    dummy.style.color = hexColorStr;
    document.body.appendChild(dummy);

    // Get the computed style and extract the color
    var computedColor = getComputedStyle(dummy).color;

    // Remove the dummy element
    document.body.removeChild(dummy);

    // Convert to hex (if necessary) and return
    // This part may need to be extended based on the format
    var rgbMatch = /rgb\((\d+), (\d+), (\d+)\)/.exec(computedColor);
    if (rgbMatch) {
        var r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
        var g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
        var b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
    }
    return hexColorStr; // Fallback if not RGB
}

/**
 * Clamps the given HSV array to valid values
 * @param {number[]} colorHSV 
 * @returns the clamped HSV array
 */
export function clampHSV(colorHSV) {
    return [clampDegrees(colorHSV[0]), mathUtils.clampInt(colorHSV[1],0,100), mathUtils.clampInt(colorHSV[2],0,100)];
}

/**
 * return black if luminence/value > 0.5 otherwise return white
 * @param {*} bgHex 
 * @returns black or white in hex format
 */
export function getHighContrastCssHexColorStr(bgHex) {
    validateHexColorString(bgHex);
    const bgRGB = get_RGB_from_Hex(bgHex);
    validateRGB(bgRGB);
    // @ts-ignore
    const bgHSV = get_HSV_from_RGB(bgRGB);
    validateHSV(bgHSV);
    const clampedHSV = clampHSV(bgHSV);
    validateHSV(clampedHSV);
    const value = clampedHSV[2];
    const fgHex = value < 65 ? "#FFFFFF" : "#000000";
    validateHexColorString(fgHex);
    return fgHex;
}

/**
 * This function tests the high/low contrast color generated 
 * by comparing a low/high luminance colos  
*/
export function test_getHighContrastCssHexColorStr() {
    let lo_RGB = [26, 13, 46];
    validateRGB(lo_RGB)
    let lo_Hex = get_Hex_from_RGB( lo_RGB );
    let hi_Hex = getHighContrastCssHexColorStr(lo_Hex);
    let hi_RGB = get_RGB_from_Hex(hi_Hex);
    console.log(`lo_RGB:${lo_RGB} lo_Hex:${lo_Hex} -> hi_Hex:${hi_Hex} hi_RGB:${hi_RGB}`);
    if ( hi_RGB[0] !== 0xff || hi_RGB[1] !== 0xff || hi_RGB[2] !== 0xff ) {
        console.log("FAILURE expected white, not hi_RGB:", hi_RGB);
    } 

    hi_RGB = [222, 100, 150];
    validateRGB(lo_RGB)
    hi_Hex = get_Hex_from_RGB( hi_RGB );
    lo_Hex = getHighContrastCssHexColorStr(hi_Hex);
    lo_RGB = get_RGB_from_Hex(lo_Hex);
    console.log(`hi_Hex:${hi_Hex} hi_RGB:${hi_RGB} -> lo_RGB:${lo_RGB} lo_Hex:${lo_Hex} `);
    if ( lo_RGB[0] !== 0 || lo_RGB[1] !== 0 || lo_RGB[2] !== 0 ) {
        console.log("FAILURE expected black, not lo_RGB:", lo_RGB);
    } 
}

/**
 * Calculates the Euclidean distance between two RGB color arrays
 * @param {number[]} rgb1 - First RGB color array [r,g,b]
 * @param {number[]} rgb2 - Second RGB color array [r,g,b]
 * @returns {number} The Euclidean distance between the colors
 */
export function get_RGB_distance(rgb1, rgb2) {
    validateRGB(rgb1);
    validateRGB(rgb2);
    let dist = 0;
    for ( let i = 0; i < 3; i++ ) {
        const diff = rgb1[i] - rgb2[i];
        dist += diff * diff;
    }
    return Math.sqrt(dist);
}

/**
 * Checks if a string is a valid hex color
 * @param {string} hexColor - The hex color string to validate
 * @returns {boolean} True if the string is a valid hex color
 */
export function isValidHexColor(hexColor) {
    return typeof hexColor === 'string' && /^#[0-9A-F]{6}$/i.test(hexColor);
}

/**
 * Gets a contrasting color (black or white) for text on the given background color
 * @param {string} backgroundColor - The background color in hex format
 * @returns {string} Either black or white hex color
 */
export function getContrastingColor(backgroundColor) {
    if (!backgroundColor) throw new Error("getContrastingColor: backgroundColor is null");
    if (!isValidHexColor(backgroundColor)) throw new Error('Invalid hex color format for backgroundColor;', backgroundColor);
    const rgb = get_RGB_from_Hex(backgroundColor);
    // Calculate relative luminance
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    // Use white text for dark backgrounds (luminance < 0.4) and black text for light backgrounds
    return luminance > 0.4 ? '#000000' : '#FFFFFF';
}

/**
 * Adjusts the brightness of a hex color
 * @param {string} hexColor - The hex color to adjust
 * @param {number} factor - The brightness factor (1 = no change, >1 brighter, <1 darker)
 * @returns {string} The adjusted hex color
 */
export function adjustBrightness(hexColor, factor) {
    if (!isValidHexColor(hexColor)) {
        throw new Error('Invalid hex color format');
    }
    const rgb = get_RGB_from_Hex(hexColor);
    const adjustedRgb = rgb.map(channel => 
        mathUtils.clampInt(Math.round(channel * factor), 0, 255)
    );
    return get_Hex_from_RGB(adjustedRgb);
}     

// compute the best text color for a given background color
export function computeLuminance(backgroundHexColor) {
    // Get the RGB values safely
    const rgb = get_RGB_from_AnyStr(backgroundHexColor);
    
    // Check if rgb is valid
    if (!rgb || !Array.isArray(rgb) || rgb.length !== 3) {
        return 0; // Default luminance for invalid colors
    }
    
    // Calculate luminance from RGB
    const [r, g, b] = rgb;
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function computeTextColor(backgroundHexColor) {
    // Handle null or undefined inputs
    if (!backgroundHexColor) {
        return "#000000"; // Default to black for invalid inputs
    }
    
    const luminance = computeLuminance(backgroundHexColor);
    return luminance > 75.0 ? '#000000' : '#FFFFFF';
}

export function testColorFunctions() {
    test_RGB_RgbStr_functions();
    test_RGB_ColorStr_functions();
}

export function testColorUtils() {
    test_HSV_RGB_Hex_functions();
    test_RGB_RgbStr_functions();
    test_RGB_ColorStr_functions();
    test_getHighContrastCssHexColorStr();
    
    let hexStr = "#66AAEE";
    let HSV = get_HSV_from_Hex(hexStr);
    let hexOut = get_Hex_from_HSV(HSV);
    let hexDiff = getHexDifference(hexStr, hexOut);
    if ( hexDiff > 1 ) {
        console.log(`ERROR: hexDiff:${hexDiff} exceeds 1`);
    }

    let RGB = get_RGB_from_Hex(hexStr);
    HSV = get_HSV_from_RGB(RGB);
    let RGB_out = get_RGB_from_HSV(HSV);
    let rgbDiff = get_RGB_distance(RGB, RGB_out);
    if ( rgbDiff > 1.0 ) {
        console.log(`ERROR: rgbDiff:${rgbDiff} exceeds 1.0`);
    }
}