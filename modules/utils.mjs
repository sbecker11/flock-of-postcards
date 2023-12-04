// @ts-check

// --------------------------------------
// Utility functions

export const isString = (value) => (typeof value === 'string' || value instanceof String);
export const isNumber = (value) => typeof value === 'number' && !isNaN(value);
export const validateKey = (obj, key) => { if (!(key in obj)) throw new Error(`Key '${key}' not found in object`); };
export const validateString = (str) => { if (typeof str === 'undefined' || str === null || typeof str !== 'string' || str.trim().length === 0) throw new Error(`Invalid string:[${str}]`); };
export const validateHexString = hexStr => { if (typeof hexStr !== 'string' || hexStr === null || hexStr === undefined || !hexStr.startsWith('#') || !/^[0-9a-fA-F]{6}$/.test(hexStr.slice(1)) || hexStr.length !== 7) throw new Error('Hexadecimal string is invalid.'); };
export const validateIntArrayLength = (arr, length) => { if (typeof arr === 'undefined' || arr === null || !Array.isArray(arr) || arr.some(item => !Number.isInteger(item)) || (typeof length !== 'undefined' && arr.length !== length)) throw new Error('Invalid array of integers or length mismatch'); };
export const validateFloat = (num) => { if (typeof num === 'undefined' || num === null || typeof num !== 'number' || !Number.isFinite(num)) throw new Error('Invalid floating-point number'); };
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const adjustRgbBrightness = (rgb, brightness) => { validateIntArrayLength(rgb, 3); return rgb.map(channel => clamp(Math.round(channel * brightness), 0, 255)); }; // 1.0 is normal brightness
export const adjustHexBrightness = (hexStr, brightness) => { validateHexString(hexStr); validateFloat(brightness); return get_Hex_from_RGB(adjustRgbBrightness(get_RGB_from_Hex(`${hexStr}`), brightness)); }; // 1.0 is normal brightness
export const get_Hex_from_RGB = RGB => { validateIntArrayLength(RGB, 3); return "#" + RGB.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase(); };
export const get_RGB_from_Hex = hexStr => { validateHexString(hexStr); return hexStr.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)?.slice(1).map(c => parseInt(c, 16)); };
export const toFixedPoint = (value, precision) => +value.toFixed(precision);
export const linearInterp = (x, x1, y1, x2, y2) => y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const zeroPad = (num, places) => num.toString().padStart(places, "0");
export const get_HSV_from_RGB = ([ R, G, B ]) => {
    const min = Math.min(R, G, B);
    const max = Math.max(R, G, B);
    const delta = max - min;
    const s = max !== 0 ? delta / max : 0;
    let h = max === min ? 0 : (max === R ? (G - B) / delta + (G < B ? 6 : 0) : max === G ? (B - R) / delta + 2 : (R - G) / delta + 4) * 60;
    if (isNaN(h))
        h = 0;
    return [ h, s, max ];
};
export const get_RGB_from_HSV = ([ h, s, v ]) => {
    const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [ f(5), f(3), f(1) ].map(Math.round);
};
export function get_RGB_from_RgbStr(rgbStr) {
    validateString(rgbStr);
    rgbStr = rgbStr.replaceAll(" ","");
    const regex = /rgb\((\d+),(\d+),(\d+)\)/;
    const matches = rgbStr.match(regex);
    if (!matches)
        throw new Error('Invalid RGB format. Expected format: rgb(r,g,b)');
    const [ , rStr, gStr, bStr ] = matches;
    const R = parseInt(rStr, 10);
    const G = parseInt(gStr, 10);
    const B = parseInt(bStr, 10);
    return [ R, G, B ];
}
export function get_ColorStr_from_RGB(RGB) {
    validateIntArrayLength(RGB,3);
    return `color(${RGB[0]},${RGB[1]},${RGB[2]})`;
}
export function get_RGB_from_ColorStr(colorStr) {
    validateString(colorStr);
    if (colorStr.startsWith("#"))
        return get_RGB_from_Hex(colorStr);
    if (colorStr.startsWith('rgb'))
        return get_RGB_from_RgbStr(colorStr);
    return colorStr;
}
export function get_Hex_from_ColorStr(colorStr) {
    var RGB = get_RGB_from_ColorStr(colorStr);
    return get_Hex_from_RGB(RGB);
}


export const calculateDistance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
export const isBetween = (value, min, max) => value >= min && value <= max;
export const createRect = (x1, y1, x2, y2) => ({ left: Math.min(x1, x2), top: Math.min(y1, y2), right: Math.max(x1, x2), bottom: Math.max(y1, y2) });
export const isPointInsideRect = (x, y, rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
export const half = (value) => typeof value === 'number' ? Math.floor(value / 2) : (() => { throw new Error(`Value '${value}' is not a number`); })();
export const getMonthDates = (year, month) => ({ start: new Date(year, month - 1, 1), end: new Date(year, month, 0) });
export const getIsoDateString = (date) => date.toISOString().slice(0, 10);
export const linearInterpArray = (t, array1, array2) => {
    const interpolatedArray = [];
    if (array1.length != array2.length)
        throw new Error('linearInterpArray length mismatch');

    for (let i = 0; i < array1.length; i++) {
        const channelInterpolation = linearInterp(t, 0, array1[ i ], 1, array2[ i ]);
        interpolatedArray.push(Math.round(channelInterpolation));
    }
    if ( array_has_NaNs(interpolatedArray))
        throw new Error("interpolatedArray has NaNs at E");
    return interpolatedArray;
};

export const is_numeric_array = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        if (typeof arr[ i ] !== 'number' || isNaN(arr[ i ])) {
            return false;
        }
    }
    return true;
};

export const array_has_NaNs = array => array.some(element => isNaN(element));

export const arrays_are_equal = (arr1, arr2) => arr1.length === arr2.length && arr1.every((element, index) => element === arr2[index]);


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

