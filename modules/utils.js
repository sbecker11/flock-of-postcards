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
export const adjustHexBrightness = (hexStr, brightness) => { validateHexString(hexStr); validateFloat(brightness); return getHexFromRGB(adjustRgbBrightness(getRGBfromHex(`${hexStr}`), brightness)); }; // 1.0 is normal brightness
export const getHexFromRGB = rgb => { validateIntArrayLength(rgb, 3); return "#" + rgb.map(c => c.toString(16).padStart(2, "0")).join("").toLowerCase(); };
export const getRGBfromHex = hexStr => { validateHexString(hexStr); return hexStr.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)?.slice(1).map(c => parseInt(c, 16)); };
export const toFixedPoint = (value, precision) => +value.toFixed(precision);
export const linearInterp = (x, x1, y1, x2, y2) => y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const zeroPad = (num, places) => num.toString().padStart(places, "0");
export const getHSVfromRGB = ([r, g, b]) => {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    const s = max !== 0 ? delta / max : 0;
    let h = max === min ? 0 : (max === r ? (g - b) / delta + (g < b ? 6 : 0) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60;
    if (isNaN(h))
        h = 0;
    return [h, s, max];
};
export const getRGBfromHSV = ([h, s, v]) => {
    const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)].map(Math.round);
};
export const calculateDistance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
export const isBetween = (value, min, max) => value >= min && value <= max;
export const createRect = (x1, y1, x2, y2) => ({ left: Math.min(x1, x2), top: Math.min(y1, y2), right: Math.max(x1, x2), bottom: Math.max(y1, y2) });
export const isPointInsideRect = (x, y, rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
export const half = (value) => typeof value === 'number' ? Math.floor(value / 2) : (() => { throw new Error(`Value '${value}' is not a number`); })();

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
        var part = parts[i].trim()
        if (part.length > 0) {
            // add first char
            acro += part[0];
        }
    }
    if (acro.length == 0)
        acro = text.slice(0, Math.min(3, text.length));
    return acro;
}

