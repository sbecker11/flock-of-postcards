// Z-index constants and utility functions
export const ROOT_Z_INDEX = 0;             // no parallax 
export const CANVAS_Z_INDEX = 1;           // no parallax
export const CANVAS_GRADIENTS_Z_INDEX = 2; // no parallax
export const TIMELINE_Z_INDEX = 3;         // no parallax

// Special case Z-indices
export const BULLSEYE_Z_INDEX = 98;            // no parallax
export const SELECTED_CARD_Z_INDEX = 99;       // no parallax, higher than bulls-eye
export const FOCAL_POINT_Z_INDEX = 100;        // no parallax
export const AIM_POINT_Z_INDEX = 101;          // no parallax

// Card Z-index ranges
export const MIN_BIZCARD_Z_INDEX = 1000; // Minimum z-index for business cards
export const MAX_BIZCARD_Z_INDEX = 9;
export const MIN_CARD_Z_INDEX = 19;
export const MAX_CARD_Z_INDEX = 29; 
export const MAX_ALL_CARDS_Z_INDEX = 31;

// Z value ranges
export const ALL_CARDS_MAX_Z = 35;
export const BIZCARD_MAX_Z = 35;
export const BIZCARD_MIN_Z = 30;
export const SKILLCARD_MAX_Z = 20;
export const SKILLCARD_MIN_Z = 10;
export const ALL_CARDS_MIN_Z = 10;

/**
 * Converts a z-index to a z value
 * @param {number} z_index - The z-index to convert
 * @returns {number|null} The corresponding z value or null if invalid
 */
export function get_z_from_z_index(z_index) {
    if (z_index > MAX_ALL_CARDS_Z_INDEX) {
        return null;
    }
    if (z_index >= MIN_BIZCARD_Z_INDEX && z_index <= MAX_BIZCARD_Z_INDEX) {
        const z_index_range = MAX_BIZCARD_Z_INDEX - MIN_BIZCARD_Z_INDEX;
        const z_range = BIZCARD_MAX_Z - BIZCARD_MIN_Z;
        const z_index_offset = z_index - MIN_BIZCARD_Z_INDEX;
        return Math.round(BIZCARD_MIN_Z + (z_index_offset * z_range / z_index_range));
    } else if (z_index >= MIN_CARD_Z_INDEX && z_index <= MAX_CARD_Z_INDEX) {
        const z_index_range = MAX_CARD_Z_INDEX - MIN_CARD_Z_INDEX;
        const z_range = SKILLCARD_MAX_Z - SKILLCARD_MIN_Z;
        const z_index_offset = z_index - MIN_CARD_Z_INDEX;
        return Math.round(SKILLCARD_MIN_Z + (z_index_offset * z_range / z_index_range));
    } else {
        return z_index;
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
    if (z >= BIZCARD_MIN_Z && z <= BIZCARD_MAX_Z) {
        const z_range = BIZCARD_MAX_Z - BIZCARD_MIN_Z;
        const z_index_range = MAX_BIZCARD_Z_INDEX - MIN_BIZCARD_Z_INDEX;
        const z_offset = z - BIZCARD_MIN_Z;
        return Math.round(MIN_BIZCARD_Z_INDEX + (z_offset * z_index_range / z_range));
    } else if (z >= SKILLCARD_MIN_Z && z <= SKILLCARD_MAX_Z) {
        const z_range = SKILLCARD_MAX_Z - SKILLCARD_MIN_Z;
        const z_index_range = MAX_CARD_Z_INDEX - MIN_CARD_Z_INDEX;
        const z_offset = z - SKILLCARD_MIN_Z;
        return Math.round(MIN_CARD_Z_INDEX + (z_offset * z_index_range / z_range));
    } else {
        return z;
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
    // Test bizcard z-index to z conversion
    console.log("Testing bizcard z-index to z conversion...");
    for (let z_index = MIN_BIZCARD_Z_INDEX; z_index <= MAX_BIZCARD_Z_INDEX; z_index++) {
        const z = get_z_from_z_index(z_index);
        if (z < BIZCARD_MIN_Z || z > BIZCARD_MAX_Z) {
            console.error(`ERROR: z:${z} is out of bizcard_z range of ${BIZCARD_MIN_Z}..${BIZCARD_MAX_Z} for z_index:${z_index}`);
        }
        const zIndexStr = get_zIndexStr_from_z(z);
        const check_z = get_z_from_zIndexStr(zIndexStr);
        if (z != check_z) {
            console.error(`ERROR: z:${z} != check_z:${check_z} for z_index:${z_index}`);
        }
    }
} 