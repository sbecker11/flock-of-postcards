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
    if (z_index >= BIZCARD_Z_INDEX_MIN && z_index <= BIZCARD_Z_INDEX_MAX) {
        const z_index_range = BIZCARD_Z_INDEX_MAX - BIZCARD_Z_INDEX_MIN;
        const z_range = BIZCARD_Z_MAX - BIZCARD_Z_MIN;
        const z_index_offset = z_index - BIZCARD_Z_INDEX_MIN;
        return Math.round(BIZCARD_Z_MIN + (z_index_offset * z_range / z_index_range));
    } else if (z_index >= SKILLCARD_Z_INDEX_MIN && z_index <= SKILLCARD_Z_INDEX_MAX) {
        const z_index_range = SKILLCARD_Z_INDEX_MAX - SKILLCARD_Z_INDEX_MIN;
        const z_range = SKILLCARD_Z_MAX - SKILLCARD_Z_MIN;
        const z_index_offset = z_index - SKILLCARD_Z_INDEX_MIN;
        return Math.round(SKILLCARD_Z_MIN + (z_index_offset * z_range / z_index_range));
    } else {
        throw new Error(`IMPOSSIBLE ERROR for z_index:${z_index}`);
    }
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
 * Converts a z value to a z-index
 * @param {number} z - The z value to convert
 * @returns {number} The corresponding z-index
 */
export function get_zindex_from_z(z) {
    if ((z < ALL_CARDS_Z_MIN) || (z > ALL_CARDS_Z_MAX)) {
        throw new Error(`z:${z} is out of range of ${ALL_CARDS_Z_MIN}..${ALL_CARDS_Z_MAX}`);
    }
    if (z >= BIZCARD_Z_MIN && z <= BIZCARD_Z_MAX) {
        const z_offset = z - BIZCARD_Z_MIN;
        const z_index = BIZCARD_Z_INDEX_MAX - z_offset;
        return z_index;
    } else if (z >= SKILLCARD_Z_MIN && z <= SKILLCARD_Z_MAX) {
        const z_offset = z - SKILLCARD_Z_MIN;
        const z_index = SKILLCARD_Z_INDEX_MAX - z_offset;
        return z_index;
    } else {
        throw new Error(`IMPOSSIBLE ERROR for z:${z}`);
    }
}

/**
 * Converts a z value to a z-index string
 * @param {number} z - The z value to convert
 * @returns {string} The corresponding z-index string
 */
export function get_zIndexStr_from_z(z) {
    return `${get_zindex_from_z(z)}`;
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