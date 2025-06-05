// modules/core/zIndex.mjs

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("zIndex", LogLevel.INFO);


// Z-index constants and utility functions
export const ROOT_Z_INDEX = 0;             // no parallax 
export const SCENE_Z_INDEX = 1;           // no parallax
export const SCENE_GRADIENTS_Z_INDEX = 2; // no parallax
export const TIMELINE_Z_INDEX = 3;         // no parallax
export const BACKGROUND_ELEMENTS_MAX_Z_INDEX = 4;

export const ALL_CARDS_Z_INDEX_MIN = 5;

// biz card z-index range 5 to 10
export const BIZCARD_Z_INDEX_MIN = 5;
export const BIZCARD_Z_INDEX_MAX = 10;

// Skill card z-index range 20 to 30
export const SKILLCARD_Z_INDEX_MIN = 20;
export const SKILLCARD_Z_INDEX_MAX = 30;

export const ALL_CARDS_Z_INDEX_MAX = 30;
export const ALL_CARDS_Z_MAX = 35;

// biz card Z value range 35 tp 30
export const BIZCARD_Z_MAX = 35;
export const BIZCARD_Z_MIN = 30;

// skill card Z value range 20 to 10
export const SKILLCARD_Z_MAX = 20;
export const SKILLCARD_Z_MIN = 10;

export const ALL_CARDS_Z_MIN = 10;

const Z_INDEX_RANGE = ALL_CARDS_Z_INDEX_MAX - ALL_CARDS_Z_INDEX_MIN;
const Z_RANGE = ALL_CARDS_Z_MAX - ALL_CARDS_Z_MIN;

if (Z_RANGE != Z_INDEX_RANGE) {
    throw new Error(`Z_RANGE:${Z_RANGE} != Z_INDEX_RANGE:${Z_INDEX_RANGE}`);
}

export const z_from_z_index = (z_index) => z_index + Z_RANGE;
export const z_index_from_z = (z) => z - Z_RANGE;


// Special case Z-indices
export const BULLSEYE_Z_INDEX = 98;            // no parallax
export const SELECTED_CARD_Z_INDEX = 99;       // no parallax, higher than bulls-eye
export const FOCAL_POINT_Z_INDEX = 100;        // no parallax
export const AIM_POINT_Z_INDEX = 101;          // no parallax

/**
 * Converts a z-index to a z value
 * @param {number} z_index - The z-index to convert
 * @returns {number|null} The corresponding z value or null if invalid
 */
export function get_z_from_z_index(z_index) {
    if ( (z_index < ALL_CARDS_Z_INDEX_MIN) || (z_index > ALL_CARDS_Z_INDEX_MAX) ) {
        throw new Error(`z_index:${z_index} is out of range of ${ALL_CARDS_Z_INDEX_MIN}..${ALL_CARDS_Z_INDEX_MAX}`);
    }
    return z_from_z_index(z_index);
}

export function get_z_index_from_z(z) {
    if ( (z < ALL_CARDS_Z_MIN) || (z > ALL_CARDS_Z_MAX) ) {
        throw new Error(`z:${z} is out of range of ${ALL_CARDS_Z_MIN}..${ALL_CARDS_Z_MAX}`);
    }
    return z_index_from_z(z);
}

/**
 * Converts a z-index string to a z value
 * @param {string} zIndexStr - The z-index string to convert
 * @returns {number|null} The corresponding z value or null if invalid
 */
export function get_z_from_zIndexStr(zIndexStr) {
    return get_z_from_z_index(parseInt(zIndexStr));
}

/**
 * Converts a z value to a z-index string
 * @param {number} z - The z value to convert
 * @param {optional string} cardDivId used to check z ranges
 * @returns {string} The corresponding z-index string
 */
export function get_zIndexStr_from_z(z, cardDivId=null) {
    if ( cardDivId ) {
        if ( cardDivId.indexOf("biz-card-div") >= 0 ) {
            if ( (z < BIZCARD_Z_MIN) || (z > BIZCARD_Z_MAX) ) {
                throw new Error(`z:${z} is out of bizCardDiv range of${BIZCARD_Z_MIN}..${BIZCARD_Z_MAX}`);
            }
        } else if ( cardDivId.indexOf("skill-card-div") >= 0 ) {
            if ( (z < SKILLCARD_Z_MIN) || (z > SKILLCARD_Z_MAX) ) {
                throw new Error(`z:${z} is out of allDivs range of ${SKILLCARD_Z_MIN}..${SKILLCARD_Z_MAX}`);
            }
        }
    }
    if ((z < ALL_CARDS_Z_MIN) || (z > ALL_CARDS_Z_MAX)) {
        throw new Error(`z:${z} is out of range of ${ALL_CARDS_Z_MIN}..${ALL_CARDS_Z_MAX}`);
    }
    const z_index = get_z_index_from_z(z);
    const zIndexStr = `${z_index}`;
    return zIndexStr;
}

/**
 * Tests the z-index conversion functions
 */
export function test_z_functions() {
    // Test bizCard z-index to z conversion
    console.log("Testing bizCard z-index to z conversion...");
    for (let z_index = BIZCARD_Z_INDEX_MIN; z_index <= BIZCARD_Z_INDEX_MAX; z_index++) {
        const z = get_z_from_z_index(z_index);
        if (z < BIZCARD_Z_MIN || z > BIZCARD_Z_MAX) {
            console.error(`ERROR: z:${z} is out of bizCard_z range of ${BIZCARD_Z_MIN}..${BIZCARD_Z_MAX} for z_index:${z_index}`);
        }
        const zIndexStr = get_zIndexStr_from_z(z);
        const check_z = get_z_from_zIndexStr(zIndexStr);
        if (z != check_z) {
            console.error(`ERROR: z:${z} != check_z:${check_z} for z_index:${z_index}`);
        }
    }
} 