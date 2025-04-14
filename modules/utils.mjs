// @ts-check
import * as css_colors from './css_colors.mjs';
import { Logger, LogLevel } from './logger.mjs';
const logger = new Logger("utils", LogLevel.INFO);

// --------------------------------------
// Utility export functions

const EPSILON = 1.0;

export function isHexColorString(hexColorStr) {
    return (isNonEmptyString(hexColorStr) && /^#[0-9A-F]{6}$/i.test(String(hexColorStr)));
}
export function validateHexColorString(hexColorStr) {
    if (!isHexColorString(hexColorStr) ) {
        throw new Error(`hexColorStr: '${hexColorStr}' is invalid.`);
    }
}

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


// return the maximum rgb difference between the hex strings
export function getHexDifference(hexStr1, hexStr2) {
    const rgb1 = get_RGB_from_Hex(hexStr1);
    const rgb2 = get_RGB_from_Hex(hexStr2);
    const rDist = abs(rgb1[0] - rgb2[0]);
    const gDist = abs(rgb1[1] - rgb2[1]);
    const bDist = abs(rgb1[2] - rgb2[2]);
    return max3(rDist, gDist, bDist);
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


export const isString = (value) => (typeof value === 'string' || value instanceof String);
export const isNonEmptyString = (value) => (isString(value) && (value.length > 0));
export const isNumber = (value) => typeof value === 'number' && !Number.isNaN(value);
export const validateKey = (obj, key) => { if (!(key in obj)) throw new Error(`Key '${key}' not found in object`); };
export const validateString = (str) => { if (typeof str === 'undefined' || str === null || typeof str !== 'string' || str.trim().length === 0) throw new Error(`Invalid string:[${str}]`); };
export const validateIntArrayLength = (arr, length) => { if (typeof arr === 'undefined' || arr === null || !Array.isArray(arr) || arr.some(item => !Number.isInteger(item)) || (typeof length !== 'undefined' && arr.length !== length)) throw new Error('Invalid array of integers or length mismatch'); };
export const validateFloat = (num) => { if (typeof num === 'undefined' || num === null || typeof num !== 'number' || !Number.isFinite(num)) throw new Error('Invalid floating-point number'); };
export const clampInt = (value, min, max) => Math.round(Math.max(min, Math.min(max, value)));
export const adjustRgbBrightness = (rgb, brightness) => { validateIntArrayLength(rgb, 3); return rgb.map(channel => clampInt(Math.round(channel * brightness), 0, 255)); }; // 1.0 is normal brightness
export const adjustHexBrightness = (hexStr, brightness) => { validateHexColorString(hexStr); validateFloat(brightness); return get_Hex_from_RGB(adjustRgbBrightness(get_RGB_from_Hex(`${hexStr}`), brightness)); }; // 1.0 is normal brightness
export const get_RGB_from_Hex = hexStr => {
    validateHexColorString(hexStr);
    const r = parseInt(hexStr.slice(1, 3), 16);
    const g = parseInt(hexStr.slice(3, 5), 16);
    const b = parseInt(hexStr.slice(5, 7), 16);
    return [r, g, b];
};

export const get_Hex_from_RGB = RGB => { validateIntArrayLength(RGB, 3); return "#" + RGB.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase(); };

export const toFixedPoint = (value, precision) => +value.toFixed(precision);
export const linearInterp = (x, x1, y1, x2, y2) => y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const getRandomSign = () => Math.random() < 0.5 ? -1 : 1;
export const zeroPad = (num, places) => num.toString().padStart(places, "0");

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


export function validateHSV(HSV) {
    if ( !isHSV(HSV) ) {
        throw new Error(`HSV:[${HSV}] is invalid`);
    }
}

export function isRGB(RGB) {
    if (!Array.isArray(RGB) || RGB.length != 3 || RGB[0] < 0 || RGB[0] > 255 || RGB[1] < 0 || RGB[1] > 255 || RGB[2] < 0 || RGB[2] > 255) {
        return false;
    }
    return true;
}

export function validateRGB(RGB) {
    if ( !isRGB(RGB) ) {
        throw new Error(`RGB:[${RGB}] is invalid`);
    }
}

// given RGB (255,255,255) return HSV (360,100,100) 
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

// given HSV array [h,s,v (360,100,100) return RGB array [r,g,b] [255,255,255]
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
    // @ts-ignore
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
        const Hex = get_Hex_from_HSV(HSVin);
        const HSVout = get_HSV_from_Hex(Hex);
        const hsvDist = getEuclideanDistance(HSVout, HSVin);
        if ( hsvDist > EPSILON )
            logger.log(`ERROR: hsvDist:${hsvDist} exceeds ESPSILON:${EPSILON}`);
    }
    
    test_get_HSV_from_RGB();
    test_get_RGB_from_HSV();
    test_get_HSV_from_Hex();
    test_get_Hex_from_HSV();
}

export function get_RGB_from_RgbStr(rgbStr) {
    if ( isString(rgbStr) ) {
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
export function get_RgbStr_from_RGB(RGB) {
    return `rgb(${RGB[0]}, ${RGB[1]}, ${RGB[2]})`;
}
export function test_RGB_RgbStr_functions() {
    function test_get_RGB_from_RgbStr() {
        const rgbStrIn = 'rgb(255, 64, 127)';
        const RGB = get_RGB_from_RgbStr(rgbStrIn);
        const rgbStrOut = get_RgbStr_from_RGB(RGB);
        const rgbDist = getEuclideanDistance(RGB, [255, 64, 127]);
        if ( rgbStrIn !== rgbStrOut )
            logger.log(`ERROR: rgbStrIn:${rgbStrIn} != rgbStrOut:${rgbStrOut}`);
    }
    function test_get_RgbStr_from_RGB() {
        const rgbIn = [255, 0, 0];
        const rgbStr = get_RgbStr_from_RGB(rgbIn);
        const rgbOut = get_RGB_from_RgbStr(rgbStr);
        if ( !arraysAreEqual(rgbOut, rgbIn) )
            logger.log(`ERROR: rgbOut:${rgbOut} != rgbIn:${rgbIn}`);
    }
    test_get_RGB_from_RgbStr();
    test_get_RgbStr_from_RGB();
}

export function get_RGB_from_ColorStr(colorStr) {
    if ( isString(colorStr) && colorStr.length > 6) {
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
    
export function get_ColorStr_from_RGB(RGB) {
    validateRGB(RGB);
    return `color(${RGB[0]}, ${RGB[1]}, ${RGB[2]})`;
}
// returns a 3-element array of integers or null
export function get_RGB_from_AnyStr(anyStr) {
    if ( isString(anyStr) ) {
        let hex = css_colors.get_HEX_from_CssColor(anyStr);
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

export function test_RGB_ColorStr_functions() {
    function test_get_ColorStr_from_RGB() {
        const RGBin = [127, 64, 255];
        const ColorStr = get_ColorStr_from_RGB(RGBin);
        const RGBout = get_RGB_from_ColorStr(ColorStr);
        if ( !arraysAreEqual(RGBout, RGBin) )
            logger.log(`ERROR: RGBout:${RGBout} != RGBin:${RGBin}`);
    }
    function test_get_RGB_from_ColorStr() {
        const ColorStrIn = "color(127, 64, 255)";
        const RGB = get_RGB_from_ColorStr(ColorStrIn);
        const ColorStrOut = get_ColorStr_from_RGB(RGB);
        if ( ColorStrOut != ColorStrIn )
            logger.log(`ERROR: ColorStrOut:${ColorStrOut} != ColorStrIn:${ColorStrIn}`);
    }
    test_get_ColorStr_from_RGB();
    test_get_RGB_from_ColorStr();
}

export function get_Hex_from_ColorStr(colorStr) {
    var RGB = get_RGB_from_AnyStr(colorStr); 
    return get_Hex_from_RGB(RGB);
}

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

export function clampHSV(colorHSV) {
    return [clampDegrees(colorHSV[0]), clampInt(colorHSV[1],0,100), clampInt(colorHSV[2],0,100)];
}


// return black if luminence/value > 0.5 otherwise return white
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

// This function tests the high/low contrast color generated 
// by comparing a low/high luminance colos
export function test_getHighContrastCssHexColorStr() {
    let lo_RGB = [26, 13, 46];
    validateRGB(lo_RGB)
    let lo_Hex = get_Hex_from_RGB( lo_RGB );
    let hi_Hex = getHighContrastCssHexColorStr(lo_Hex);
    let hi_RGB = get_RGB_from_Hex(hi_Hex);
    logger.log(`lo_RGB:${lo_RGB} lo_Hex:${lo_Hex} -> hi_Hex:${hi_Hex} hi_RGB:${hi_RGB}`);
    if ( hi_RGB[0] !== 0xff || hi_RGB[1] !== 0xff || hi_RGB[2] !== 0xff ) {
        logger.log("FAILURE expected white, not hi_RGB:", hi_RGB);
    } 

    hi_RGB = [222, 100, 150];
    validateRGB(lo_RGB)
    hi_Hex = get_Hex_from_RGB( hi_RGB );
    lo_Hex = getHighContrastCssHexColorStr(hi_Hex);
    lo_RGB = get_RGB_from_Hex(lo_Hex);
    logger.log(`hi_Hex:${hi_Hex} hi_RGB:${hi_RGB} -> lo_RGB:${lo_RGB} lo_Hex:${lo_Hex} `);
    if ( lo_RGB[0] !== 0 || lo_RGB[1] !== 0 || lo_RGB[2] !== 0 ) {
        logger.log("FAILURE expected black, not lo_RGB:", lo_RGB);
    } 
}


export const calculateDistance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
export const isBetween = (value, min, max) => value >= min && value <= max;
export const createRect = (x1, y1, x2, y2) => ({ left: Math.min(x1, x2), top: Math.min(y1, y2), right: Math.max(x1, x2), bottom: Math.max(y1, y2) });
export const isPointInsideRect = (x, y, rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
export const half = (value) => typeof value === 'number' ? Math.floor(value / 2) : (() => { throw new Error(`Value '${value}' is not a number`); })();
export const getMonthDates = (year, month) => ({ start: new Date(year, month - 1, 1), end: new Date(year, month, 0) });
export const getIsoDateString = (date) => date.toISOString().slice(0, 10);
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

export const isNumeric = (obj) => !Number.isNaN(parseFloat(obj)) && isFinite(obj);

export const validateIsNumeric = (obj) => {
    if (!isNumeric(obj)) {
        throw new Error(`ValueError: Input is not a number, but it is a(n) ${typeof obj} with value ${obj}`);
    }
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
export function validateIsStyleArray(arr) {
    validateIsNumericArray(arr);
    if ( arr.length != 9 ) {
        throw new Error("ValueError: StyleArray must contain 9 numeric values");
    }
    if ( arrayHasNaNs(arr) ) {
        throw new Error("ValueError: StyleArray must not contain NaNs");
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
export function validateIsStyleFrame(styleFrame) {
    validateIsStyleArray(styleFrame);
}
export function validateIsStyleFrameArray(obj) {
    validateIsArray(obj);
    obj.forEach(element => {
        validateIsStyleFrame(element);
    });
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
export function isElement(obj) {
    return (obj instanceof HTMLElement);
}
export function validateIsElement(obj) {
    if (!isElement(obj)) {
        throw new Error(`Argument is not an HTML element. but it is a(n) ${typeof obj} with value ${obj}`);
    }
}
const USABLE_STYLE_PROPS = [
    'color','background-color','left','top', 'z-index', 'filter','translate'
];

// z-index and background-color are read-only from window.getComputedStyle(element).prop
// let zIndex = element.getComputedStyle.getPropertyValue('z-index')
const STYLE_PROPS_MAP = {
    'z-index':'zIndex',
    'background-color':'backgroundColor'
};
// zIndex and backgroundColor are used in element.style[prop] 
// element.style.zIndex = styleProps.zIndex
const PROPS_STYLE_MAP = {
    'zIndex':'z-index',
    'backgroundColor':'background-color'
};

// zIndex and backgroundColor are styleProps
export function getStyleProps(element) {
    validateIsElement(element);
    let computedStyle = window.getComputedStyle(element);
    let styleProps = {};
    for (let prop of computedStyle) {
        if ( USABLE_STYLE_PROPS.includes(prop) ) {
            var dstProp = prop;
            if (prop in STYLE_PROPS_MAP) {
                dstProp = STYLE_PROPS_MAP[prop];
            }
            styleProps[dstProp] = computedStyle.getPropertyValue(prop);
        }
    }
    validateIsStyleProps(styleProps);
    return styleProps;
}

export function getStylePropsString(styleProps) {
    validateIsStyleProps(styleProps);
    return JSON.stringify(styleProps,null,2);
}

// z-index and background-color are styleProps
export function applyStyleProps(element, styleProps) {
    validateIsStyleProps(styleProps);
    for (let prop in styleProps) {
        if (styleProps.hasOwnProperty(prop)) {
            var dstProp = prop;
            if (prop in PROPS_STYLE_MAP) {
                dstProp = PROPS_STYLE_MAP[prop];
            }
            element.style[dstProp] = styleProps[prop];
        }
    }
} 
export function validateIsStyleProps(obj) {
    validateIsPlainObject(obj);
}
export function validateIsStylePropsArray(obj) {
    validateIsArray(obj);
    obj.forEach(element => {
        validateIsStyleProps(element);
    });
}
export function isDivElement(obj) {
    return (obj instanceof HTMLElement) && (obj.tagName == 'DIV');
}
export function validateIsDivElement(obj) {
    if (!isDivElement(obj)) {
        throw new Error(`Argument is not an HTML DIV element. bit is a(n) ${typeof obj} with value ${obj}`);
    }
}
export function isLineItemElement(obj) {
    return (obj instanceof HTMLElement) && (obj.tagName == 'LI')
}
export function validateIsLineItemElement(obj) {
    if (!isLineItemElement(obj)){
        throw new Error(`Argument is not an HTML LI element, but is a(n) ${typeof obj} with value ${obj}`);
    }
}
export function isCardDiv(obj) {
    return isDivElement(obj) && obj.classList.contains('card-div');
}

export function validateIsCardDiv(obj) {
    if (!isCardDiv(obj)) {
        throw new Error(`Argument does not have "card-div" class but does have ${obj.classList}.`);
    }
}
export function isBizcardDiv(obj) {
    return isDivElement(obj) && obj.classList.contains('bizcard-div')
}
export function validateIsBizcardDiv(obj) {
    if (!isBizcardDiv(obj)) {
        throw new Error(`Argument does not have "bizcard-div" class but does have ${obj.classList}.`);
    }
}
export function isCardDivOrBizcardDiv(obj) {
    return isCardDiv(obj) || isBizcardDiv(obj);
}
export function validateIsCardDivOrBizcardDiv(obj) {
    if (!isCardDivOrBizcardDiv(obj)) {
        throw new Error(`Argument does not have "card-div" or "bizcard-div" class but does have ${obj.classList}.`);
    }
}
export function isCardDivLineItem(obj) {
    return isLineItemElement(obj) && obj.classList.contains('card-div-line-item');
}
export function validateIsCardDivLineItem(obj) {
    if (!isCardDivLineItem(obj)) {
        throw new Error(`Argument does not have "card-div-line-item" class but does have ${obj.classList}.`);
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

export function ensureHexColorStringAttribute(obj, attr) {
    let val = null;
    let hex = null;
    if ( isElement(obj) ) {
        if( typeof attr === 'string' ) {
            val = obj.getAttribute(attr);
            if( isString(val) ) {
                if ( isHexColorString(val) ) {
                    return;
                } 
                var RGB = get_RGB_from_AnyStr(val);
                if ( isRGB(RGB) ) {
                    hex = get_Hex_from_RGB(RGB);
                    if ( isHexColorString(hex) && hex != val) {
                        obj.setAttribute(attr, hex);
                        return;
                    }
                }
            }
        }
    }
    throw new Error(`obj:[${obj}] attr:[${attr}] val:[${val}] hex:[${hex}] is not a valid hexColorString.`);
}


export function ensureHexColorStringStyle(obj, styleName) {
    let color = obj.style['styleName'];
    if( !isNonEmptyString(color) ) {
        throw new Error(`Style ${styleName} must be defined.`);
    }
    var hex = null;
    if ( isHexColorString(color) ) {
        hex = color;
    } else if ((isNumericArray(color) && color.length === 3) || color.startsWith('color')) {
        hex = get_Hex_from_ColorStr(color);
    }
    if (hex !== null) {
        obj.style[styleName] = hex;
    } else {
        throw new Error(`Style ${styleName} is not a valid hex color string.`);
    }
    validateHexColorString(obj.style['styleName']);

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

export function testColorFunctions() {
    test_RGB_RgbStr_functions();
    test_RGB_ColorStr_functions();
}

// compute the best text color for a given background color
export function computeLuminance(backgroundHexColor) {
    // @ts-ignore
    const [r,g,b] = get_RGB_from_AnyStr(backgroundHexColor);
    return 0.299 * r + 0.587 * g + 0.114 * b;
}
export function computeTextColor(backgroundHexColor) {
    const luminance = computeLuminance(backgroundHexColor);
    return luminance > 75.0 ? '#000000' : '#FFFFFF';
}

export function testColorUtils() {
    logger.log("-------------------------------------");
    test_HSV_RGB_Hex_functions();
    test_RGB_RgbStr_functions();
    test_RGB_ColorStr_functions();
    test_getHighContrastCssHexColorStr();
    testColorFunctions();
    logger.log("-------------------------------------");
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

// CPU Usage: O(n)
// Memory Usage: O(depth)
// Stack Overflow Risk: higher for deeply nested depth
// Overhead: higher due to recursive call stack management
// Ease of implementation: simpler and more intuitive

export function findAllChildrenRecursively(parent, allChildren = []) {
    /** @type {HTMLElement[]} */
    allChildren = allChildren || [];
    if (!allChildren) {
        allChildren = [];
    }
    if (allChildren && !allChildren.includes(parent)) {
        allChildren.push(parent);
    }
    if (parent.children.length > 0) {
        for (let child of parent.children) {
            findAllChildrenRecursively(child, allChildren);
        }
    }
    return allChildren;
}

// CPU Usage: O(n)
// Memory Usage: O(breadth)
// Stack Overflow Risk: None
// Overhead: Lower due to no stakc mangements
// Ease of implementation: medium
export function findAllChildrenIteratively(parent) {
    // Validate that the input is a valid DOM element
    if (!(parent instanceof HTMLElement)) {
        throw new Error("Invalid parent element");
    }

    // Initialize the stack with the parent element
    const stack = [parent];
    const allChildren = [];

    // Process elements in the stack
    while (stack.length > 0) {
        const current = stack.pop();

        // Add the current element to the result if not already included
        if (!allChildren.includes(current)) {
            allChildren.push(current);

            // Add all children of the current element to the stack
            if (current && current.children) {
                stack.push(...Array.from(current.children).filter(child => child instanceof HTMLElement));
            }
        }
    }

    return allChildren;
}

// returns true if addClass was added, otherwise false
export function addClass(element, addClass) {
    if ( ! element.classList.contains(addClass)) {
        element.classList.add(addClass);
        return true;
    }
    return false;
}

// returns true if removeClass was removed, otherwise false
export function removeClass(element, removeClass) {
    if ( element.classList.contains(removeClass)) {
        element.classList.remove(removeClass);
        return true;
    }
    return false;
}

// used to add or remove eventListener types from element
export function updateEventListener(element, eventType, newListener, options = null) {
    // Remove the existing event listener if it exists
    if (newListener === null) {
        element.removeEventListener(eventType, element[`__${eventType}Listener`]);
        delete element[`__${eventType}Listener`]; // Clean up the reference
    } else {
        // Replace the existing listener with the new one
        if (element[`__${eventType}Listener`]) {
            element.removeEventListener(eventType, element[`__${eventType}Listener`]);
        }
        // Add the new listener with the optional options object
        element.addEventListener(eventType, newListener, options);
        element[`__${eventType}Listener`] = newListener; // Store the reference
    }
}

export const formatNumbersReplacer = (key, value) => {
    if (typeof value === 'number') {
        return value.toFixed(2);
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
  

export function showPosition(position, prefix="") {
    logger.log(prefix, JSON.stringify(position, utils.formatNumbersReplacer, 2));
}

export function showElement(element, prefix="", logLevel=LogLevel.LOG) {
    prefix = "showElement" + prefix + ":";

    if (element == null) {
        logger.warn(`${prefix} given null element`);
        return;
    }
    if (!this.isElement(element)) {
        logger.warn(`${prefix} given non-element object:${element}`);
        return;
    }
    if (element.id == null) {
        logger.warn(`${prefix} given element with no id:${element}`);
        return;
    }
    // now construct the elementInfo object
    const parentElementId = (element.parentElement != null) ? element.parentElement.id : "";
    let nextSiblingId = null;
    if (isCardDiv(element)) {
        const nextSibling = utils.findNextSiblingWithClass(element, "card-div");
        nextSiblingId = (nextSibling != null) ? nextSibling.id : "";
    } else if (isBizcardDiv(element)) {
        const nextSibling = utils.findNextSiblingWithClass(element, "bizcard-div");
        nextSiblingId = (nextSibling != null) ? nextSibling.id : "";
    }
    const center = {
        x: element.offsetLeft + element.clientWidth / 2,
        y: element.offsetTop + element.clientHeight / 2
    }
    const dims = {
        width: element.clientWidth,
        height: element.clientHeight
    }
    const elementInfo = {
        tagname: element.tagName,
        id: element.id,
        parent_id: parentElementId,
        next_sibling_id: nextSiblingId,
        center: center,
        dims: dims,
        zIndex: element.style.zIndex,
        filter: element.style.filter,
        classList: element.classList
    }
    logger.logWithLevel(JSON.stringify(elementInfo, utils.formatNumbersReplacer, 2), logLevel);
}

