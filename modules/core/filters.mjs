// /modules/core/filters.mjs

import { linearInterp } from '../utils/mathUtils.mjs';

// Filter constants
export const MIN_BRIGHTNESS_PERCENT = 15; // Very dark for dramatic effect
export const BLUR_Z_SCALE_FACTOR = 2.0; // More dramatic blur
export const CARD_MIN_Z = 10;
export const CARD_MAX_Z = 20-1;

/**
 * Gets the brightness value from a z value
 * @param {number} z - The z value
 * @returns {number} The brightness value
 */
export function get_brightness_value_from_z(z) {
    var z_interp = linearInterp(
        z,
        CARD_MIN_Z, 1.0,
        CARD_MAX_Z, MIN_BRIGHTNESS_PERCENT / 100.0
    );
    var z_brightness_value = (z > 0) ? z_interp : 1.0;
    return z_brightness_value;
}

/**
 * Gets the brightness filter string from a z value
 * @param {number} z - The z value
 * @returns {string} The brightness filter string
 */
export function get_brightness_str_from_z(z) {
    return `brightness(${100 * get_brightness_value_from_z(z)}%)`;
}

/**
 * Gets the blur filter string from a z value
 * @param {number} z - The z value
 * @returns {string} The blur filter string
 */
export function get_blur_str_from_z(z) {
    var blur = (z > 0) ? (z - CARD_MIN_Z) / BLUR_Z_SCALE_FACTOR : 0;
    return `blur(${blur}px)`;
}

/**
 * Gets the contrast filter string from a z value
 * @param {number} z - The z value
 * @returns {string} The contrast filter string
 */
export function get_contrast_str_from_z(z) {
    var z_interp = linearInterp(
        z,
        CARD_MIN_Z, 1.0,
        CARD_MAX_Z, 0.7 // Reduce contrast for distant cards
    );
    var contrast = (z > 0) ? z_interp : 1.0;
    return `contrast(${contrast})`;
}

/**
 * Gets the saturation filter string from a z value
 * @param {number} z - The z value
 * @returns {string} The saturation filter string
 */
export function get_saturation_str_from_z(z) {
    var z_interp = linearInterp(
        z,
        CARD_MIN_Z, 1.0,
        CARD_MAX_Z, 0.6 // Reduce saturation for distant cards
    );
    var saturation = (z > 0) ? z_interp : 1.0;
    return `saturate(${saturation})`;
}

/**
 * Gets the combined filter string from a z value
 * @param {number} z - The z value
 * @returns {string} The combined filter string
 */
export function get_filterStr_from_z(z) {
    var filterStr = "";
    filterStr += get_brightness_str_from_z(z) + " ";
    filterStr += get_blur_str_from_z(z) + " ";
    filterStr += get_contrast_str_from_z(z) + " ";
    filterStr += get_saturation_str_from_z(z);
    return filterStr;
} 