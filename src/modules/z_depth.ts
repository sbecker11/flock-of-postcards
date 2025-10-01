// Z-depth calculation functions for card layering and visual effects

import * as utils from './utils.js';
import {
  ALL_CARDS_MAX_Z,
  CARD_MIN_Z,
  CARD_MAX_Z,
  MIN_BRIGHTNESS_PERCENT,
  BLUR_Z_SCALE_FACTOR,
  SELECTED_CARD_DIV_Z
} from './constants.js';

/**
 * Convert z-depth to CSS z-index string
 * @param z - Z-depth value (higher = closer to viewer)
 * @returns CSS z-index as string
 */
export function get_zIndexStr_from_z(z: number): string {
  return `${ALL_CARDS_MAX_Z - z}`;
}

/**
 * Convert CSS z-index string to z-depth
 * @param zindex - CSS z-index as string
 * @returns Z-depth value
 */
export function get_z_from_zIndexStr(zindex: string): number {
  return ALL_CARDS_MAX_Z - parseInt(zindex);
}

/**
 * Calculate brightness value based on z-depth
 * @param z - Z-depth value
 * @returns Brightness multiplier (0.0 to 1.0)
 */
export function get_brightness_value_from_z(z: number): number {
  const z_interp = utils.linearInterp(
    z,
    CARD_MIN_Z, 1.0,
    CARD_MAX_Z, MIN_BRIGHTNESS_PERCENT / 100.0
  );
  return (z > 0) ? z_interp : 1.0;
}

/**
 * Get CSS brightness filter string from z-depth
 * @param z - Z-depth value
 * @returns CSS brightness filter string
 */
export function get_brightness_str_from_z(z: number): string {
  return `brightness(${100 * get_brightness_value_from_z(z)}%)`;
}

/**
 * Get CSS blur filter string from z-depth
 * @param z - Z-depth value
 * @returns CSS blur filter string
 */
export function get_blur_str_from_z(z: number): string {
  const blur = (z > 0) ? (z - CARD_MIN_Z) / BLUR_Z_SCALE_FACTOR : 0;
  return `blur(${blur}px)`;
}

/**
 * Get combined CSS filter string from z-depth
 * @param z - Z-depth value
 * @returns CSS filter string with brightness and blur
 */
export function get_filterStr_from_z(z: number): string {
  return `${get_brightness_str_from_z(z)} ${get_blur_str_from_z(z)}`;
}

/**
 * Get the z-index string for selected cards
 * @returns CSS z-index string for selected state
 */
export function getSelectedCardDivZIndexStr(): string {
  return get_zIndexStr_from_z(SELECTED_CARD_DIV_Z);
}

/**
 * Get the filter string for selected cards
 * @returns CSS filter string for selected state
 */
export function getSelectedCardDivFilterStr(): string {
  return get_filterStr_from_z(SELECTED_CARD_DIV_Z);
}
