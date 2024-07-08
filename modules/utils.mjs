// @ts-check

import * as css_colors from './css_colors.mjs';

// --------------------------------------
// Utility export functions

const EPSILON = 1.0;

export function isHexColorString(hexColorStr) { // enforces uppercase hex string only
    return isString(hexColorStr) && /^#[0-9A-F]{6}$/.test(hexColorStr);
}
export function validateHexColorString(hexColorStr) {
    if (!isHexColorString(hexColorStr) ) {
        throw new Error(`hexColorStr: '${hexColorStr}' is invalid.`);
    }
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

export const isString = (value) => (typeof value === 'string' || value instanceof String);
export const isNumber = (value) => typeof value === 'number' && !isNaN(value);
export const validateKey = (obj, key) => { if (!(key in obj)) throw new Error(`Key '${key}' not found in object`); };
export const validateString = (str) => { if (typeof str === 'undefined' || str === null || typeof str !== 'string' || str.trim().length === 0) throw new Error(`Invalid string:[${str}]`); };
export const validateIntArrayLength = (arr, length) => { if (typeof arr === 'undefined' || arr === null || !Array.isArray(arr) || arr.some(item => !Number.isInteger(item)) || (typeof length !== 'undefined' && arr.length !== length)) throw new Error('Invalid array of integers or length mismatch'); };
export const validateFloat = (num) => { if (typeof num === 'undefined' || num === null || typeof num !== 'number' || !Number.isFinite(num)) throw new Error('Invalid floating-point number'); };
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const adjustRgbBrightness = (rgb, brightness) => { validateIntArrayLength(rgb, 3); return rgb.map(channel => clamp(Math.round(channel * brightness), 0, 255)); }; // 1.0 is normal brightness
export const adjustHexBrightness = (hexStr, brightness) => { validateHexColorString(hexStr); validateFloat(brightness); return get_Hex_from_RGB(adjustRgbBrightness(get_RGB_from_Hex(`${hexStr}`), brightness)); }; // 1.0 is normal brightness
export const get_Hex_from_RGB = RGB => { validateIntArrayLength(RGB, 3); return "#" + RGB.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase(); };
export const get_RGB_from_Hex = hexStr => { validateHexColorString(hexStr); return hexStr.match(/^#?([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i)?.slice(1).map(c => parseInt(c, 16)); };
export const toFixedPoint = (value, precision) => +value.toFixed(precision);
export const linearInterp = (x, x1, y1, x2, y2) => y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const zeroPad = (num, places) => num.toString().padStart(places, "0");
// given RGB array [R, G, B] return HSV array [ h, s, v]
export const get_HSV_from_RGB = ([ R, G, B ]) => {
    const RGB = [R,G,B];
    validateRGB(RGB);
    const min = Math.min(R, G, B);
    const max = Math.max(R, G, B);
    const delta = max - min;
    const s = max !== 0 ? delta / max : 0;
    let h = max === min ? 0 : (max === R ? (G - B) / delta + (G < B ? 6 : 0) : max === G ? (B - R) / delta + 2 : (R - G) / delta + 4) * 60;
    if (isNaN(h))
        h = 0;
    const v = max;
    const HSV = [ h, s, v ].map(Math.round);
    validateHSV(HSV);
    return HSV;
};

// given HSV array [h,s,v] return RGB array [r,g,b]
export const get_RGB_from_HSV = ([ h, s, v ]) => {
    const HSV = [h,s,v];
    validateHSV(HSV);
    const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    const RGB = [ f(5), f(3), f(1) ].map(Math.round);
    validateRGB(RGB);
    return RGB;
};

function test_HSV_RGB_functions() {
    function test_get_HSV_from_RGB() {
        const RGBIn = [64, 128, 255];
        const HSV = get_HSV_from_RGB([RGBIn[0],RGBIn[1],RGBIn[2]]);
        const RGBOut = get_RGB_from_HSV([HSV[0],HSV[1],HSV[2]]);
        console.assert( getEuclideanDistance(RGBOut, RGBIn) < EPSILON);
    }
    function test_get_RGB_from_HSV() {
        const HSVIn = [180, 0, 1]; // H in [0..360], S in [0..1], V in [0..1]
        const RGB = get_RGB_from_HSV([HSVIn[0],HSVIn[1],HSVIn[2]]);
        const HSVOut = get_HSV_from_RGB([RGB[0],RGB[1],RGB[2]]);
        console.assert( getEuclideanDistance(HSVOut, HSVIn) < EPSILON);
    }
    test_get_HSV_from_RGB();
    test_get_RGB_from_HSV();
}

export function isHSV(HSV) {
    if( !Array.isArray(HSV) || HSV.length != 3 ) {
        return false;
    } else if ( HSV[0] < 0.0 || HSV[0] > 360.0 ) { 
        return false;
    } else if ( HSV[1] < 0.0 || HSV[1] > 1.0 ) {
        return false;
    } else if ( HSV[2] < 0.0 || HSV[2] > 1.0 ) {
        return false;
    }
    return true;
}

export function validateHSV(HSV) {
    if ( !isHSV(HSV) ) {
        throw new Error(`HSV:[${HSV}] is invalid`);
    }
}

export function isRGB(RGB) {
    if( !Array.isArray(RGB) || RGB.length != 3 ) {
        return false;
    } else if ( RGB[0] < 0 || RGB[0] > 255 ) { 
        return false;
    } else if ( RGB[1] < 0 || RGB[1] > 255 ) {
        return false;
    } else if ( RGB[2] < 0 || RGB[2] > 255 ) {
        return false;
    }
    return true;
}

export function validateRGB(RGB) {
    if ( !isRGB(RGB) ) {
        throw new Error(`RGB:[${RGB}] is invalid`);
    }
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
        console.assert(rgbStrIn === rgbStrOut);
    }
    function test_get_RgbStr_from_RGB() {
        const rgbIn = [255, 0, 0];
        const rgbStr = get_RgbStr_from_RGB(rgbIn);
        const rgbOut = get_RGB_from_RgbStr(rgbStr);
        console.assert(arraysAreEqual(rgbOut, rgbIn));
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

function test_RGB_ColorStr_functions() {
    function test_get_ColorStr_from_RGB() {
        const RGBin = [127, 64, 255];
        const ColorStr = get_ColorStr_from_RGB(RGBin);
        const RGBout = get_RGB_from_ColorStr(ColorStr);
        console.assert( arraysAreEqual(RGBout, RGBin) );
    }
    function test_get_RGB_from_ColorStr() {
        const ColorStrIn = "color(127, 64, 255)";
        const RGB = get_RGB_from_ColorStr(ColorStrIn);
        const ColorStrOut = get_ColorStr_from_RGB(RGB);
        console.assert( ColorStrOut == ColorStrIn );
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

export const isNumeric = (obj) => !isNaN(parseFloat(obj)) && isFinite(obj);

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
export const arrayHasNaNs = array => array.some(element => isNaN(element));

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
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
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
        if( isString(attr) ) {
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
    if( typeof color === 'undefined' || color === null || color === "") {
        throw new Error(`Style ${styleName} must be defined.`);
    }
    var hex = null;
    if ( isHexColorString(color) ) {
        hex = color;
    } else if ( isNumericArray(color) && color.length === 3 ) {
        hex = get_Hex_from_ColorStr(color);
    } else if ( color.startWith('color') ) {
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

// see https://www.cl.cam.ac.uk/~mgk25/ucs/quotes.html
// \u0060	GRAVE ACCENT	 `	Sometimes used for LEFT SINGLE QUOTATION MARK
// \u2018	LEFT SINGLE QUOTATION MARK	‘	 
// \u2019	RIGHT SINGLE QUOTATION MARK	’
// \u201C	LEFT DOUBLE QUOTATION MARK	“	 
// \u201D	RIGHT DOUBLE QUOTATION MARK	”	 
// \u0022	QUOTATION MARK	"
// \u0027	APOSTROPHE	'

// replace curly or smart single quotes with single straight quotes.
export function replaceCurlySingleQuotes(text) {
    return text.replace(/[\u2018\u2019\u0060]/g, "'");
  }
  
  // Replace curly double quotes with straight double quotes.
  export function replaceCurlyDoubleQuotes(text) {
      text = text.replace(/“/g, '"');
      text = text.replace(/”/g, '"');
      return text;
  }
  // Replace curly double quotes and then trim double quotes
  export function trimDoubleQuotes(text) {
      return replaceCurlyDoubleQuotes(text).replaceAll("^\"|\"$", "");
  }
  