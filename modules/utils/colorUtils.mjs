/**
 * @module colorUtils
 * @description A consolidated library for color conversion, validation, and manipulation.
 * This module uses an object-based representation for colors (e.g., {r, g, b}) for clarity.
 */
import * as utils from './utils.mjs';

// --- Validation Functions ---

/**
 * Checks if a string is a valid hex color.
 * @param {string} hex - The string to check.
 * @returns {boolean}
 */
export function isHexColor(hex) {
    return utils.isNonEmptyString(hex) && /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Throws an error if the string is not a valid hex color.
 * @param {string} hex - The hex string to validate.
 * @param {string} [context=''] - Optional context for the error message.
 */
export function validateHexColor(hex, context = '') {
    if (!isHexColor(hex)) {
        throw new Error(`Invalid hex color string: "${hex}"${context ? ` (${context})` : ''}`);
    }
}

// --- Conversion Functions ---

/**
 * Converts a hex color string to an RGB object.
 * @param {string} hex - The hex color string (e.g., "#RRGGBB").
 * @returns {{r: number, g: number, b: number}}
 */
export function get_RGB_from_Hex(hex) {
    validateHexColor(hex, 'get_RGB_from_Hex');
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
}

/**
 * Converts an RGB object to a hex color string.
 * @param {{r: number, g: number, b: number}} rgb - The RGB object.
 * @returns {string} The hex color string.
 */
export function get_Hex_from_RGB(rgb) {
    const toHex = c => ('0' + Math.round(c).toString(16)).slice(-2);
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Converts an RGB object to an HSV object.
 * @param {{r: number, g: number, b: number}} rgb - The RGB object.
 * @returns {{h: number, s: number, v: number}}
 */
export function get_HSV_from_RGB(rgb) {
    let { r, g, b } = rgb;
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
}

/**
 * Converts an HSV object to an RGB object.
 * @param {{h: number, s: number, v: number}} hsv - The HSV object.
 * @returns {{r: number, g: number, b: number}}
 */
export function get_RGB_from_HSV(hsv) {
    let { h, s, v } = hsv;
    s /= 100; v /= 100;
    let r = 0, g = 0, b = 0;
    let i = Math.floor(h / 60);
    let f = h / 60 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// --- High-Level Manipulations ---

/**
 * Adjusts the brightness of a hex color by a given factor.
 * @param {string} hex - The color to adjust.
 * @param {number} factor - Brightness factor (1 = no change, >1 = brighter, <1 = darker).
 * @returns {string} The adjusted hex color.
 */
export function adjustBrightness(hex, factor) {
    validateHexColor(hex, 'adjustBrightness');
    
    // For very bright colors (factor > 1.5), use a different approach
    if (factor > 1.5) {
        const rgb = get_RGB_from_Hex(hex);
        const currentBrightness = getPerceivedBrightness(hex);
        
        // If the color is already very bright (> 200), use a more conservative approach
        if (currentBrightness > 200) {
            // Instead of multiplying HSV value, adjust RGB components more conservatively
            const newRgb = {
                r: Math.min(255, rgb.r + (255 - rgb.r) * 0.3),
                g: Math.min(255, rgb.g + (255 - rgb.g) * 0.3),
                b: Math.min(255, rgb.b + (255 - rgb.b) * 0.3)
            };
            return get_Hex_from_RGB(newRgb);
        }
    }
    
    // Use the original HSV approach for normal cases
    const rgb = get_RGB_from_Hex(hex);
    const hsv = get_HSV_from_RGB(rgb);
    hsv.v = Math.min(100, hsv.v * factor); // Adjust value and cap at 100
    const newRgb = get_RGB_from_HSV(hsv);
    return get_Hex_from_RGB(newRgb);
}

/**
 * Calculates the perceived brightness of a hex color.
 * @param {string} hex - The color in hex format.
 * @returns {number} A brightness value from 0 to 255.
 */
export function getPerceivedBrightness(hex) {
    validateHexColor(hex, 'getPerceivedBrightness');
    const rgb = get_RGB_from_Hex(hex);
    // Standard luminance formula
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
}

/**
 * Gets a contrasting color (black or white) for a given background color.
 * @param {string} hex - The background color in hex format.
 * @returns {string} "#000000" (black) or "#FFFFFF" (white).
 */
export function getContrastingColor(hex) {
    const brightness = getPerceivedBrightness(hex);
    return brightness > 128 ? '#000000' : '#FFFFFF';
}

/**
 * Checks if a color is a shade of grey.
 * @param {string} hex - The hex color to check.
 * @param {number} tolerance - The allowed difference between r, g, b values.
 * @returns {boolean} True if the color is a shade of grey.
 */
export function isGrey(hex, tolerance = 10) {
    validateHexColor(hex, 'isGrey');
    const { r, g, b } = get_RGB_from_Hex(hex);
    return Math.abs(r - g) <= tolerance && Math.abs(r - b) <= tolerance && Math.abs(g - b) <= tolerance;
} 