
// brightness decreases to MIN_BRIGHTNESS_PERCENT as z increases
const MIN_BRIGHTNESS_PERCENT = 70;

// card blur increases as z increases
const BLUR_Z_SCALE_FACTOR = 0.1;

// --------------------------------------
// _SkillCardDiv globals


// --------------------------------------
// Z globals

// ground is zindex = 0 and zindex is offset from ground,
// and z is distance to viewer, so 
// card.z = MAX_ALL_CARDS_Z_INDEX - card.zindex,
// conversely 
// card.zindex = MAX_ALL_CARDS_Z_INDEX - card.z.

const ROOT_Z_INDEX = 0;             // no parallax 
const CANVAS_Z_INDEX = 1;           // no parallax
const CANVAS_GRADIENTS_Z_INDEX = 2; // no parallax
const TIMELINE_Z_INDEX = 3;         // no parallax

// all Z_INDEX values less than MIN_BIZCARD_Z_INDEX or
// greater than MAX_CARD_Z_INDEX are reserved for special cases
// and do not convert to Z values and are not used in parallax calculations


// bizcards have minimum z_index and 
// max Z values of MAX_ALL_CARDS_Z_INDEX - bizcard_z_index

const MIN_BIZCARD_Z_INDEX = 4;
const MAX_BIZCARD_Z_INDEX = 9;
const MIN_CARD_Z_INDEX = 19;
const MAX_CARD_Z_INDEX = 29; 
const MAX_ALL_CARDS_Z_INDEX = 31;

// selected bizcards and cardDivs have no Z value
const ALL_CARDS_MAX_Z = 35;
const BIZCARD_MAX_Z = 35;
const BIZCARD_MIN_Z = 30;
const CARD_MAX_Z = 20;
const CARD_MIN_Z = 10;
const ALL_CARDS_MIN_Z = 10;

function get_z_from_z_index(z_index) {
    if (z_index > MAX_ALL_CARDS_Z_INDEX) {
        // For z-indices over MAX_ALL_CARDS_Z_INDEX, return null to indicate no z-value conversion
        return null;
    }
    if (z_index >= MIN_BIZCARD_Z_INDEX && z_index <= MAX_BIZCARD_Z_INDEX) {
        // For bizcards, z should be between BIZCARD_MIN_Z and BIZCARD_MAX_Z
        const z_index_range = MAX_BIZCARD_Z_INDEX - MIN_BIZCARD_Z_INDEX;
        const z_range = BIZCARD_MAX_Z - BIZCARD_MIN_Z;
        const z_index_offset = z_index - MIN_BIZCARD_Z_INDEX;
        return Math.round(BIZCARD_MIN_Z + (z_index_offset * z_range / z_index_range));
    } else if (z_index >= MIN_CARD_Z_INDEX && z_index <= MAX_CARD_Z_INDEX) {
        // For cards, z should be between CARD_MIN_Z and CARD_MAX_Z
        const z_index_range = MAX_CARD_Z_INDEX - MIN_CARD_Z_INDEX;
        const z_range = CARD_MAX_Z - CARD_MIN_Z;
        const z_index_offset = z_index - MIN_CARD_Z_INDEX;
        return Math.round(CARD_MIN_Z + (z_index_offset * z_range / z_range));
    } else {
        // For special cases like selected cards
        return z_index;
    }
}

function get_z_from_zIndexStr(zIndexStr) {
    return get_z_from_z_index(parseInt(zIndexStr));
}

function get_zindex_from_z(z) {
    if (z >= BIZCARD_MIN_Z && z <= BIZCARD_MAX_Z) {
        // For bizcards
        const z_range = BIZCARD_MAX_Z - BIZCARD_MIN_Z;
        const z_index_range = MAX_BIZCARD_Z_INDEX - MIN_BIZCARD_Z_INDEX;
        const z_offset = z - BIZCARD_MIN_Z;
        return Math.round(MIN_BIZCARD_Z_INDEX + (z_offset * z_index_range / z_range));
    } else if (z >= CARD_MIN_Z && z <= CARD_MAX_Z) {
        // For cards
        const z_range = CARD_MAX_Z - CARD_MIN_Z;
        const z_index_range = MAX_CARD_Z_INDEX - MIN_CARD_Z_INDEX;
        const z_offset = z - CARD_MIN_Z;
        return Math.round(MIN_CARD_Z_INDEX + (z_offset * z_index_range / z_range));
    } else {
        // For special cases like selected cards
        return z;
    }
}

function get_zIndexStr_from_z(z) {
    return `${get_zindex_from_z(z)}`;
}


//--------------------------------------
// Z functions

// only cards have Z values
// bizcards have maximum Z values
// cards have minimum Z values = MAX_CARD_Z_INDEX - 

// brightness max CARD_MIN_Z is 1.0 is normal
// brightness dims as z increated to CARD_MAX_Z
function get_brightness_value_from_z(z) {
    var z_interp = utils.linearInterp(
        z,
        CARD_MIN_Z, 1.0,
        CARD_MAX_Z, MIN_BRIGHTNESS_PERCENT / 100.0
    );
    var z_brightness_value = (z > 0) ? z_interp : 1.0;
    return z_brightness_value;
}
// return a filter brightness string
// brightness dims as z increases
function get_brightness_str_from_z(z) {
    return `brightness(${100 * get_brightness_value_from_z(z)}%)`;
}
// returns a filter blur string
// blur increases as z increases
function get_blur_str_from_z(z) {
    var blur = (z > 0) ? (z - CARD_MIN_Z) * BLUR_Z_SCALE_FACTOR : 0;
    return `blur(${blur}px)`;
}

// returns a filter string of the form:
// "brightness(<_brightness>%) blur(<blur>px)"
function get_filterStr_from_z(z) {
    var filterStr = "";
    filterStr += get_brightness_str_from_z(z) + " ";
    filterStr += get_blur_str_from_z(z);
    return filterStr;
}

// returns a filter string of the form:
// "brightness(<_brightness>%) blur(<blur>px)"
export function get_filterStr_from_z_index(z_index) {
    var z = get_z_from_z_index(z_index);
    var filterStr = "";
    filterStr += get_brightness_str_from_z(z) + " ";
    filterStr += get_blur_str_from_z(z);
    return filterStr;
}
