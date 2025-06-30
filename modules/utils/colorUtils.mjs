/**
 * Checks if a color is a shade of grey.
 * @param {object} rgb - An object with r, g, b properties.
 * @param {number} tolerance - The allowed difference between r, g, b values.
 * @returns {boolean} True if the color is a shade of grey.
 */
export function isGrey(rgb, tolerance = 10) {
    const { r, g, b } = rgb;
    return Math.abs(r - g) <= tolerance && Math.abs(r - b) <= tolerance && Math.abs(g - b) <= tolerance;
}

/**
 * Calculates the perceived brightness of a hex color.
 * @param {string} hexColor - The color in hex format (e.g., "#RRGGBB").
 * @returns {number} A brightness value, where lower is darker.
 */
export function getPerceivedBrightness(hexColor) {
    const rgb = get_RGB_from_Hex(hexColor);
    // Formula for perceived brightness (luminance):
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
}

/**
 * Gets a contrasting color (black or white) for a given background color.
 * @param {string} hexColor - The background color in hex format.
 * @returns {string} "#000000" (black) or "#FFFFFF" (white).
 */
export function getContrastingColor(hexColor) {
    const brightness = getPerceivedBrightness(hexColor);
    return brightness > 128 ? '#000000' : '#FFFFFF';
}

/**
 * Adjusts the brightness of a hex color by a given factor.
 * @param {string} hexColor - The color to adjust.
 * @param {number} factor - The brightness factor (1 = no change, >1 = brighter, <1 = darker).
 * @returns {string} The adjusted hex color.
 */
export function adjustBrightness(hexColor, factor) {
    const rgb = get_RGB_from_Hex(hexColor);
    const hsv = get_HSV_from_RGB(rgb);
    hsv.v = Math.min(1, hsv.v * factor); // Adjust brightness (value) and cap at 1
    const newRgb = get_RGB_from_HSV(hsv);
    return get_Hex_from_RGB(newRgb);
}

// --------------------------------------------------------------------------------
// --- Conversion functions -----------------------------------------------------
// --------------------------------------------------------------------------------
// ... existing code ... 

export function get_RGB_from_Hex(hex) {
    if (hex.startsWith('#')) hex = hex.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
}

export function get_Hex_from_RGB(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1).toUpperCase();
}

export function get_HSV_from_RGB(rgb) {
    let { r, g, b } = rgb;
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h, s, v };
}

export function get_RGB_from_HSV(hsv) {
    let { h, s, v } = hsv;
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
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