// @ts-nocheck
'use strict';

import * as utils from './modules/utils.mjs';
import * as timeline from './modules/timeline.mjs';
import * as focalPoint from './modules/focal_point.mjs';
import * as alerts from './modules/alerts.mjs';
import { getPaletteSelectorInstance } from './modules/color_palettes.mjs';
import { Logger, LogLevel } from "./modules/logger.mjs";
import { 
    // ... existing imports ...
    handleKeyDown as handleFocalPointKeyDown,
} from './modules/focal_point.mjs';
const logger = new Logger("main", LogLevel.DEBUG);


utils.testColorUtils();

// --------------------------------------
// Element reference globals

const rightContentDiv = document.getElementById("right-content-div");
const rightColumn = document.getElementById("right-column");  // Add this line
// const debugScrollingElement = null; //  = document.getElementById("debugScrollingElement");
// const debugFocalPointElement = null; //  = document.getElementById("debugFocalPointElement");
// const debugTheSelectedCardDivIdElement = null; //  = document.getElementById("debugTheSelectedCardDivIdElement");
const canvasContainer = document.getElementById("canvas-container");
const canvas = document.getElementById("canvas");
const focalPointElement = document.getElementById("focal-point");
const bullsEye = document.getElementById("bulls-eye");
const selectFirstBizcardButton = document.getElementById("select-first-bizcard");
const selectNextBizcardButton = document.getElementById("select-next-bizcard");
const selectAllBizcardsButton = document.getElementById("select-all-bizcards");
const clearAllLineItemsButton = document.getElementById("clear-all-line-items");
let paletteSelector = null;

// --------------------------------------
// Miscellaneous globals

const BULLET_DELIMITER = "\u2022";
const BULLET_JOINER = ' ' + BULLET_DELIMITER + ' '
// Global state for palette tracking

// --------------------------------------
// Animation globals

const NUM_ANIMATION_FRAMES = 0;
const ANIMATION_DURATION_MILLIS = 0;

// this must be set to true before starting the animation
// and then this is set to false at animation end.
var ANIMATION_IN_PROGRESS = false;

// --------------------------------------  
// BizcardDiv globals

// width decreases as zindex increases
const BIZCARD_WIDTH = 200;
const BIZCARD_INDENT = 29;
const MIN_BIZCARD_HEIGHT = 200;

// brightness decreases to MIN_BRIGHTNESS_PERCENT as z increases
const MIN_BRIGHTNESS_PERCENT = 70;

// card blur increases as z increases
const BLUR_Z_SCALE_FACTOR = 0.1;

// --------------------------------------
// CardDiv globals

// TO DO: tune or replace
const ESTIMATED_NUMBER_CARD_DIVS = 159;

// card metrics are in pixels
const MAX_CARD_POSITION_OFFSET = 200;
const MEAN_CARD_LEFT = 0;
const MEAN_CARD_HEIGHT = 75;
const MEAN_CARD_WIDTH = 100;

const MAX_CARD_SIZE_OFFSET = 20;
const CARD_BORDER_WIDTH = 3;

// --------------------------------------
// CardDivLineItem globals
// --------------------------------------
var CARDDIVLINEITEIM_USE_GLOBAL_BACKGROUND_COLOR= false;
var CARDDIVLINEITEIM_GLOBAL_BACKGROUND_COLOR = "lightgray";

// --------------------------------------
// Parallax globals
// --------------------------------------
const PARALLAX_X_EXAGGERATION_FACTOR = 0.05;
const PARALLAX_Y_EXAGGERATION_FACTOR = 0.1;

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

const BULLSEYE_Z_INDEX = 98;            // no parallax
const SELECTED_CARD_Z_INDEX = 99;       // no parallax, higher than bulls-eye
const FOCAL_POINT_Z_INDEX = 100;        // no parallax
const AIM_POINT_Z_INDEX = 101;          // no parallax

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

function test_z_functions() {
    // Test bizcard z-index to z conversion
    logger.log("Testing bizcard z-index to z conversion...");
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

    // Test card z-index to z conversion
    logger.log("Testing card z-index to z conversion...");
    for (let z = CARD_MIN_Z; z <= CARD_MAX_Z; z++) {
        const zIndexStr = get_zIndexStr_from_z(z);
        const check_z = get_z_from_zIndexStr(zIndexStr);
        const check_z_index = get_zindex_from_z(check_z);
        const z_index = parseInt(zIndexStr);
        if (check_z_index != z_index) {
            console.error(`ERROR: check_z_index:${check_z_index} != z_index:${z_index} for z:${z}`);
        }
    }

    logger.log("Z function tests completed.");
}

test_z_functions();


//--------------------------------------
// Default mouse behavior: prevent selections while mouse is fown
document.addEventListener('mousedown', function() {
    document.body.classList.add('no-select');
    document.getElementById("canvas-container").classList.add('no-select');
});

document.addEventListener('mouseup', function() {
    document.body.classList.remove('no-select');
    document.getElementById("canvas-container").classList.remove('no-select');
});


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

// --------------------------------------
// BizcardDiv and cardDiv functions

function isBizcardDiv(div) {
    return div != null && div.classList.contains('bizcard-div') ? true : false;
}
function isCardDiv(div) {
    return div != null && div.classList.contains('card-div') ? true : false;
}
function isBizcardDivId(divId) {
    return utils.isString(divId) && getBizcardDivIndex(divId) == null ? false : true;
}
function isCardDivId(divId) {
    return utils.isString(divId) && getCardDivIndex(divId) == null ? false : true;
}
function isCardDivLineItem(div) {
    if ( div == null )
        return false;
    if ( !utils.isString(div.id) )
        return false;
    if ( div.classList == null )
        return false;
    if ( div.classList.length == 0 )
        return false;
    if ( div.classList.contains('card-div-line-item') )
        return true;
    return false;
}

// returns 99 for bizcard-div-99' or null
function getBizcardDivIndex(bizcardDivId) {
    // console.assert(utils.isString(bizcardDivId));
    if (bizcardDivId.startsWith("bizcard-div-")) {
        var index = parseInt(bizcardDivId.replace("bizcard-div-", ""));
        return Number.isNaN(index) ? null : index;
    }
    return null;
}

// returns 99 for 'card-div-99' or null
function getCardDivIndex(cardDivId) {
    // console.assert(utils.isString(cardDivId));
    if (cardDivId.startsWith("card-div-")) {
        var index = parseInt(cardDivId.replace("card-div-", ""));
        return Number.isNaN(index) ? null : index;
    }
    return null;
}

// returns true if a bizcardDiv exists for the given index, else null
function getBizcardDivIdFromIndex(index) {
    // console.assert(utils.isNumber(index));
    var bizcardDivId = `bizcard-div-${index}`;
    var bizcardDiv = document.getElementById(bizcardDivId);
    return (bizcardDiv && bizcardDiv.id == bizcardDivId) ? bizcardDivId : null;
}

function getBizcardDivIdFromAnyDiv(anyDiv) {
    if ( isBizcardDiv(anyDiv) ) {
        return anyDiv.id;
    } else if ( isCardDiv(anyDiv) || isCardDivLineItem(anyDiv) ) {
        return anyDiv.getAttribute("bizcardDivId");
    }
    console.error("getBizcardDivIdFromAnyDiv: illegal div type");
    return null;
}

// .Bizcard-divs are never deleted so next id
// is just the current number of the .Bizcard-divs
function getNextNewBizcardDivId() {
    const bizcardDivs = document.getElementsByClassName("bizcard-div");
    const nextBizcardDivId = `bizcard-div-${bizcardDivs.length}`;
    return nextBizcardDivId;
}

// Use the "jobs" array to gather data used for
// the large "business cards" floating near 
// the ground level describing employment history.
//
// Also parse each job's description to pull out 
// the shared "skills" from the narrative pf each.
//  
function createBizcardDivs() {
    
    var sortedJobs = structuredClone(jobs);
    sortedJobs.sort((a,b) => new Date(b['end']) - new Date(a['end']));
    for ( const job of sortedJobs ) {

        // utils.validateKey(job, "role");
        var role = job[ "role" ];

        // utils.validateString(role);
        var employer = job[ "employer" ].trim();
                
        // timeline is descending so jobEnd is always above jobStart
        let jobEndParts =  job[ "end" ].split("-");
        var endYearStr = jobEndParts[0];
        var endMonthStr = jobEndParts[1];

        var endYearStrIsCURRENT_DATE = ( endYearStr == 'CURRENT_DATE' );
        // handle CURRENT_DATE to be the first of the next month
        if ( endYearStrIsCURRENT_DATE ) {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            endYearStr = `${nextMonth.getFullYear()}`;
            endMonthStr = `${nextMonth.getMonth() + 1}`; // getMonth() returns a zero-based month, so we add 1
        }

        var endDate = new Date(`${endYearStr}-${endMonthStr}-01`);
        // jobEndStr is used for display purposes only
        const jobEndStr = endYearStrIsCURRENT_DATE ? "current" : endDate.toISOString().slice(0, 7);
        var endBottomPx = timeline.getTimelineYearMonthBottom(endYearStr, endMonthStr);
        var jobStartParts = job[ "start" ].split("-");
        var startYearStr = jobStartParts[0];
        var startMonthStr = jobStartParts[1];

        var startDate = new Date(`${startYearStr}-${startMonthStr}-01`);
        // jobStartStr is used for display purposes only
        var jobStartStr = startDate.toISOString().slice(0,7);
        var startBottomPx = timeline.getTimelineYearMonthBottom(startYearStr, startMonthStr);

        var heightPx = Math.max(startBottomPx - endBottomPx, MIN_BIZCARD_HEIGHT);
        
        var z_index = utils.getRandomInt(MIN_BIZCARD_Z_INDEX, MAX_BIZCARD_Z_INDEX);
        if ( z_index < MIN_BIZCARD_Z_INDEX || z_index > MAX_BIZCARD_Z_INDEX ) {
            console.error(`ERROR: z_index:${z_index} is out of z_index range of ${MIN_BIZCARD_Z_INDEX}..${MAX_BIZCARD_Z_INDEX}`);
        }
        var zIndexStr = `${z_index}`;
        var z = get_z_from_zIndexStr(zIndexStr); // z is distance to viewer = ALL_CARDS_MAX_ZINDEX - z_index
        if ( z < BIZCARD_MIN_Z || z > BIZCARD_MAX_Z ) {
            console.error(`ERROR: z:${z} is out of bizcard_z range of ${BIZCARD_MIN_Z}..${BIZCARD_MAX_Z}`);
        }
        var halfIndent = (z_index - 1) * BIZCARD_INDENT/4;
        var indent = 3 * utils.getRandomInt(-halfIndent, halfIndent);

        // here we go
        var bizcardDiv = document.createElement("div");
        var left = indent;
        var width = BIZCARD_WIDTH;
        var top = endBottomPx;
        var height = heightPx;

        bizcardDiv.id = getNextNewBizcardDivId();
        bizcardDiv.classList.add("bizcard-div");
        bizcardDiv.style.top = `${top}px`;
        bizcardDiv.style.height = `${height}px`;
        bizcardDiv.style.left = `${left}px`;
        bizcardDiv.style.width = `${width}px`;
        bizcardDiv.style.zIndex = zIndexStr;
        bizcardDiv.setAttribute("data-color-index", bizcardDiv.id);

        canvas.appendChild(bizcardDiv);
        bizcardDiv['saved-parent'] = canvas;
        bizcardDiv.dataset.employer = employer;
        bizcardDiv.dataset.cardDivIds = [];
        bizcardDiv.setAttribute("endDate", utils.getIsoDateString(endDate));
        bizcardDiv.setAttribute("startDate", utils.getIsoDateString(startDate));

        bizcardDiv.setAttribute("saved_left", `${bizcardDiv.offsetLeft}`);
        bizcardDiv.setAttribute("saved_lop", `${bizcardDiv.offsetTop}`);
        bizcardDiv.setAttribute("saved_width", `${bizcardDiv.offsetWidth}`);
        bizcardDiv.setAttribute("saved_height", `${bizcardDiv.offsetHeight}`);
        bizcardDiv.setAttribute("saved_z", `${z}`);
        bizcardDiv.setAttribute("saved_zIndexStr", zIndexStr);
        bizcardDiv.setAttribute("saved_filterStr", get_filterStr_from_z(z));

        bizcardDiv.style.zIndex = bizcardDiv.getAttribute("saved_zIndexStr") || "";
        bizcardDiv.style.filter = bizcardDiv.getAttribute("saved_filterStr") || "";

        var description_raw = job[ "Description" ];
        if (description_raw && description_raw.length > 0) {
            // utils.validateString(description_raw);
            const [description_HTML, bizcardTagLinks] = process_bizcard_description_HTML(bizcardDiv, description_raw);
            bizcardDiv.setAttribute("Description", description_HTML);
            bizcardDiv.setAttribute("TagLinks", JSON.stringify(bizcardTagLinks));
        }

        var html = "";
        html += `<span class="bizcard-div-role">${role}</span><br/>`;
        html += `(${bizcardDiv.id} z_index:${z_index} z:${z})<br/>`;
        html += `<span class="bizcard-div-employer">${employer}</span><br/>`;
        html += `<span class="bizcard-div-dates">${jobStartStr} - ${jobEndStr}</span><br/>`;
        bizcardDiv.innerHTML = html;

        bizcardDiv.addEventListener("mouseenter", handleCardDivMouseEnter);
        bizcardDiv.addEventListener("mouseleave", handleCardDivMouseLeave);

        utils.validateIsCardDivOrBizcardDiv(bizcardDiv);
        addCardDivClickListener(bizcardDiv);
        // does not select self
        // does not scroll self into view
    } // all jobs loop
    paletteSelector.applyPaletteToElements();
}


// --------------------------------------
// tag_link globals

// the global set of tagLinks created while creating all .Bizcard-divs from
// the list of all `job` objects defined in "static_content/jobs.mjs"
var allTagLinks = [];

function initAllTagLinks() {
    allTagLinks = [];
}

// Use the BULLET_DELIMITER as separator to split the
// `bizcard_description` into a list of `description_items`.
//
// Parse each description_item to find the pattern `[skill_phrase](skill_img_url)(skill_url)`.
// Finds or creates a `card-div` for each `skill_phrase` and replaces the 
// saved_ html with `<card-link card-div-id="id" card-img-url="url">skill</card-link>`
// The `card-img-url` is ignored if its value if "url" or blank.
//
// Uses the BULLET_JOINER to join the list of description_items 
// back into an updated HTML description so it can be used to create an ordered 
// list with list items.
// 
// Also returns the list of allNewTagLinks created from the description_HTML
//
function process_bizcard_description_HTML(bizcardDiv, description_HTML) {
    // console.assert(bizcardDiv != null);
    var processed_items = [];
    var bizcardTagLinks = [];
    var description_items = description_HTML.split(BULLET_DELIMITER);
    if (description_items.length > 0) {
        for (var i = 0; i < description_items.length; i++) {
            var description_item = description_items[ i ].trim();
            if (description_item.length > 0) {
                var { newTagLinks, updatedString } = process_bizcard_description_item(bizcardDiv, description_item);
                if (updatedString && updatedString.length > 0)
                    processed_items.push(updatedString);
                if (newTagLinks && newTagLinks.length > 0)
                    // update the global list of allTagLinks 
                    // created from description_HTML of all .Bizcard-divs
                    allTagLinks = allTagLinks.concat(newTagLinks);
                    bizcardTagLinks = bizcardTagLinks.concat(newTagLinks);
            }
        }
    } 
    var processed_bizcard_description_HTML = description_HTML;
    if (processed_items.length > 0)
        processed_bizcard_description_HTML = processed_items.join(BULLET_JOINER);
    // logger.log("bizcardTagLinks:" + bizcardTagLinks.length  + " [" + debugTagLinksToStr(bizcardTagLinks) + "]")
    return [processed_bizcard_description_HTML, bizcardTagLinks];
}

function createUrlAnchorTag(bizcard_id) { // when class is "icon" use fg_color
    return `<img class="icon" data-icontype="url" data-color-index=${bizcard_id} />`;
}

function createImgAnchorTag(bizcard_id) { 
    return `<img class="icon data-icontype="img" data-color-index=${bizcard_id} />`;
}

function createBackAnchorTag(bizcard_id) { // when class is "icon" use fg_color
    return `<img class="icon data-icontype="back" data-color-index=${bizcard_id} />`;
}

// This function takes an inputString, applies the regular expression to extract the 
// newTagLink objects with properties text, img, url, and html, and then replaces 
// these newTagLinks in the saved_ string with their html values. The function return 
// both the list of newTagLinks and the updatedString with embedded HTML elements.

function process_bizcard_description_item(bizcardDiv, inputString) {
    if ( typeof bizcardDiv.id === 'undefined' || bizcardDiv.id === null || bizcardDiv.id === '')
        throw new Error(`bizcardDiv:${bizcardDiv} must have an id attribute`);

    // remove the ignorable placeholders
    inputString = inputString.replace(/\(url\)/g, '');
    inputString = inputString.replace(/\{img\}/g, '');
        
    const regex = /\[([^\]]+)\](?:\{([^\}]+)\})?(?:\(([^\)]+)\))?/;
    const matches = inputString.match(new RegExp(regex, 'g'));

    if (!matches) {
        return { newTagLinks: [], updatedString: inputString };
    }
    // create a newTagLink for each match
    const newTagLinks = matches.map(match => {
        const parsed = match.match(regex);
        return {
            text: parsed[1] || '',
            img: parsed[2] || '', 
            url: parsed[3] || '',
            bizcardDivId: bizcardDiv.id
        };
    });

    // create an htmlElement for each newTagLink
    let updatedString = inputString;

    newTagLinks.forEach(tag_link => {
        const text = tag_link.text;
        const img = tag_link.img ? tag_link.img : '';
        const url = tag_link.url ? tag_link.url : '';
    
        let htmlElementStr = '';
    
        if (text) {
            // Initialize the htmlElement with just underlined text
            htmlElementStr = `<u>${text}</u>`;
            var line2 = '';
        
            // If img is defined, add an anchor tag wrapping the local img.png
            if (img) {
                line2 += createImgAnchorTag(bizcardDiv.id);
            }
            
            // If url is defined, add an anchor tag wrapping the local geo.png
            if (url) {
                line2 += createUrlAnchorTag(bizcardDiv.id);
            }

            // always add the initial backAnchorTag
            line2 += createBackAnchorTag(bizcardDiv.id);

            htmlElementStr += '<br/>' + line2;
            if ( htmlElementStr.includes('undefined')) {
                throw new Error(`htmlElementStr:${htmlElementStr} must not have any undefined values`);
            }
        }
        tag_link.html = htmlElementStr;

        // find or create the cardDiv that matches this tag_link and use it to set the tag_link's "cardDivId" property
        setCardDivIdOfTagLink(bizcardDiv, tag_link);
        
        // create a tag_link span element with the targetCardDivId attribute and the htmlElementStr as its innerHTML
        let htmlSpanElementStr = `<span class="tag-link" targetCardDivId="${tag_link.cardDivId}">${htmlElementStr}</span>`;

        // reconstruct the saved_ pattern
        let saved_Pattern = `[${text}]`;
        if ( tag_link.img.length > 0 )
            saved_Pattern += `{${tag_link.img}}`;
        if (tag_link.url.length > 0) 
            saved_Pattern += `(${tag_link.url})`;

         // Replace the saved_ pattern with the new HTML element
         updatedString = updatedString.replace(saved_Pattern, htmlSpanElementStr);
         if ( updatedString.includes('undefined') ) {
            throw new Error(`updatedString:${updatedString} must not have an undefined attribute`);
        }
    });

    return { newTagLinks, updatedString };
}

// find or create a cardDiv and use it
// to set the tag_link's "cardDivId" property
// otherwise create a new cardDiv
function setCardDivIdOfTagLink(bizcardDiv, tag_link) {
    // console.assert(bizcardDiv != null && tag_link != null);
    var cardDiv = findCardDiv(bizcardDiv, tag_link);
    if (!cardDiv) {
        cardDiv = createCardDiv(bizcardDiv, tag_link);
    }
    tag_link.cardDivId = cardDiv.id;
    let comma = (bizcardDiv.dataset.cardDivIds.length > 0) ? ',' : '';
    bizcardDiv.dataset.cardDivIds += comma + cardDiv.id;
}

// add a click listener to the given icon element
function addIconClickListener(icon) {
    icon.addEventListener("click", (event) => {
        const iconElement = event.target;
        event.stopPropagation();

        if (iconElement) {
            const iconType = iconElement.dataset.icontype;
            const tag_link = iconElement.closest('span.tag-link');
            let tag_link_text = (tag_link && tag_link.innerText) ? tag_link.innerText : null;
            if ( tag_link_text ) {
                tag_link_text = tag_link_text.replace(/\(.*?\)/, ""); // remove everything in paraens
                tag_link_text = tag_link_text.replace(/\.$/, ""); // remove trailing period
            }
            switch (iconType) {
                case 'url': {
                    let url = iconElement.dataset.url; // from data-url
                    if (url) {
                        url = url.endsWith('/') ? url.slice(0,-1) : url;
                        let urlStr = (tag_link_text.length + url.length < 40) ? ` at <u>${url}</u>` : '';
                        let title = tag_link_text ? `the webpage for <b>${tag_link_text}</b>${urlStr}` : `the webpage at ${url}`;
                        logger.log(`iconElement iconType:${iconType} click: ${url} title: [${title}]`);
                        alerts.confirmOpenNewBrowserWindow(title, url);
                    } else {
                        console.error(`iconElement iconType:${iconType} click: no url`);
                    }
                    break;
                }
                case 'img': {
                    let img = iconElement.dataset.img; // from data-img
                    if (img) {
                        img = img.endsWith('/') ? img.slice(0,-1) : img;
                        img = "<u>" + img + "</u>";
                        let title = tag_link_text ? `the image for <b>${tag_link_text}</b>` : `the image at ${img}`;
                        logger.log(`iconElement iconType:${iconType} click: ${img} title: [${title}]`);
                        alerts.confirmOpenNewBrowserWindow(title, img);
                    } else {
                        console.error(`iconElement iconType:${iconType} click: no img`);
                    }
                    break;
                }
                case 'back': {
                    const bizcardId = iconElement.dataset.bizcardId; // from data-bizcard-id
                    if (bizcardId) {
                        const bizcardDiv = document.getElementById(bizcardId);
                        if (bizcardDiv) {
                            logger.log(`iconElement click: ${bizcardId}`);
                            selectTheCardDiv(bizcardDiv, true);
                            // scrollElementIntoView(bizcardDiv);
                        } else {
                            console.error(`iconElement iconType:${iconType} click: no bizcardDiv with id:${bizcardId}`);
                        }   
                    }
                    else {
                        console.error(`iconElement iconType:${iconType} click: no bizcard_id`);
                    }
                    break;
                }
                default: {
                    console.error(`iconElement click: illegal iconType:${iconType}`);
                    break;
                }
            }
        } else {
            // logger.log(`iconElement click: no iconElement`);
        }
        event.stopPropagation();
    });

    // Only add LinkedIn icon listener if it exists
    const linkedinIcon = document.querySelector('img.linkedin.icon');
    if (linkedinIcon) {
        linkedinIcon.addEventListener("click", (event) => {
            const iconElement = event.target;
            event.stopPropagation();
            const url = "https://www.linkedin.com/in/shawnbecker";
            const title = "Shawn's LinkedIn profile";
            logger.log(`linkedinIcon click: ${url} title: [${title}]`);
            alerts.confirmOpenNewBrowserWindow(title, url);
        });
    }

    // Only add Sankey icon listener if it exists
    const sankeyIcon = document.querySelector('img.sankey.icon');
    if (sankeyIcon) {
        sankeyIcon.addEventListener("click", (event) => {
            const iconElement = event.target;
            event.stopPropagation();
            const img = "static_content/graphics/sankeymatic_20240104_204625_2400x1600.png";
            const title = "a SankeyMatic&copy; diagram of Shawn's technical proficiencies";
            logger.log(`sankeyIcon click: ${img} title: [${title}]`);
            alerts.confirmOpenNewBrowserWindow(title, img);
        });
    }
}

function getBizcardDivDays(bizcardDiv) {
    const endMillis = getBizcardDivEndDate(bizcardDiv).getTime();
    const startMillis = getBizcardDivStartDate(bizcardDiv).getTime();
    const bizcardMillis = endMillis - startMillis;
    // logger.log(`bizcardDiv.id:${bizcardDiv.id} bizcardMillis:${bizcardMillis}`);
    const bizcardDivDays = bizcardMillis / (1000 * 60 * 60 * 24);
    // logger.log(`bizcardDiv.id:${bizcardDiv.id} bizcardDivDays:${bizcardDivDays}`);
    return parseInt(bizcardDivDays);
}

// this is an Order(N) search that could be optimized.
function findCardDiv(bizcardDiv, tag_link) {
    var cardDivs = document.getElementsByClassName("card-div");
    for (let cardDiv of cardDivs) {
        if (cardDivMatchesTagLink(cardDiv, tag_link)) {
            // found a match so add a backIcon if needed
            let backIcons = cardDiv.getElementsByClassName("back-icon");
            var numFound = 0;
            for ( let i = 0; i < backIcons.length; i++ ) {
                let backIcon = backIcons[i];
                if ( backIcon.dataset.bizcardId === bizcardDiv.id ) {
                    numFound++;
                }
            }
            // if no backIcon found for this bizcardDiv then add one
            if ( numFound === 0 ) {
                // default the colors from the bizcardDiv
                let newBackAnchorTag = createBackAnchorTag(bizcardDiv.id);
                let spanTagLink = cardDiv.querySelector('span.tag-link');
                if ( spanTagLink ) {
                    spanTagLink.innerHTML += newBackAnchorTag;
                } else {
                    throw new Error(`cardDiv:${cardDiv.id} must have a span.tag-link element`);
                }
                let days = parseInt(cardDiv.dataset.bizcardDivDays);
                days += getBizcardDivDays(bizcardDiv);
                cardDiv.dataset.bizcardDivDays = days
            }
            return cardDiv;
        }
    }
    return null;
}

function cardDivMatchesTagLink(cardDiv, tag_link) {
    // Check if the required text attribute matches
    if (tag_link.text !== cardDiv.getAttribute("tagLinkText")) {
        return false;
    }

    // Check if the optional img attribute matches or both are absent
    if (tag_link.img !== cardDiv.getAttribute("tagLinkImg")) {
        if (tag_link.img !== undefined && cardDiv.getAttribure("tagLinkImg") !== undefined) {
            return false;
        }
    }

    // Check if the optional url attribute matches or both are absent
    if (tag_link.url !== cardDiv.getAttribute("tagLinkUrl")) {
        if (tag_link.url !== undefined && cardDiv.getAttribute("tagLinkUrl") !== undefined) {
            return false;
        }
    }

    return true;
}

// takes the description_HTML stored as innerHTML
// of a card-div (or bizcard-div) and splits it by
// the BULLLET delimiter and returns the HTML of an 
// unordered list of description items.
function convert_description_HTML_to_line_items_HTML(description_HTML, cardDivLineItem) {
    var HTML = "";
    HTML += '<p class="card-div-line-item-description">';
    var items = description_HTML.split(BULLET_DELIMITER);
    if (items.length > 0) {
        HTML += '<ul class="card-div-line-item-description-list">';
        for (var i = 0; i < items.length; i++) {
            var description_item = items[ i ].trim();
            if (description_item.length > 0)
                HTML += "<li class='card-div-line-item-description-list-item'>" + description_item + "</li>";
        }
        HTML += "</ul>"
    } else {
        // logger.log(`unparsed description: ${description_HTML}`);
        HTML += description_HTML;
    }
    HTML += "</p>"
    return HTML;
}

// --------------------------------------
// CardDiv functions

// card-divs are never deleted so next cardDivId
// is `card-div-<N>` where N is the current number of all card-divs
function getNextCardDivId() {
    const cardDivs = document.getElementsByClassName("card-div");
    const nextCardDivId = `card-div-${cardDivs.length}`;
    return nextCardDivId;
}

var prev_z = null; // to track the previous z value 

// adds a new cardDiv to #canvas
// default center x to zero and center y to
// id * TOP_TO_TOP.
// give each random x,y offsets and random
// z levels, and z-varied brightness and blur.
// return the newly created cardDiv that has 
// been appended to its parent canvas.
function createCardDiv(bizcardDiv, tag_link) {
    // console.assert(bizcardDiv != null && tag_link != null);
    var cardDivId = getNextCardDivId();
    var cardDiv = document.createElement('div');
    cardDiv.classList.add("card-div");
    utils.validateIsCardDivOrBizcardDiv(cardDiv);

    cardDiv.tag_link = tag_link;
    cardDiv.id = cardDivId; 
    canvas.appendChild(cardDiv); 
    cardDiv.dataset.bizcardDivDays = getBizcardDivDays(bizcardDiv);

    // cardDivs distributed mostly around the bizcardDiv min and max y
    const bizCardMinY = bizcardDiv.offsetTop;
    const bizCardMaxY = bizCardMinY + bizcardDiv.offsetHeight;
    const cardCloudMinY = MAX_CARD_POSITION_OFFSET/3; // overhang the bizcardDiv
    const cardCloudMaxY = MAX_CARD_POSITION_OFFSET;
    const cardCloudY = utils.getRandomInt(cardCloudMinY, cardCloudMaxY);
    let cardY = 0;
    if ( utils.getRandomSign() == 1 ) {
        cardY = bizCardMinY - cardCloudY;
    } else {
        cardY = bizCardMaxY + cardCloudY;
    }

    // cardDivs distributed mostly around the bizcardDiv min and max x
    const bizCardMinX = bizcardDiv.offsetLeft;
    const bizCardMaxX = bizCardMinX + bizcardDiv.offsetWidth;
    const cardCloudMinX = MAX_CARD_POSITION_OFFSET / 3; // surround the bizcardDiv without obscuring it
    const cardCloudMaxX = MAX_CARD_POSITION_OFFSET / 3; // surround the bizcardDiv without obscuring it
    const cardCloudX = utils.getRandomInt(cardCloudMinX, cardCloudMaxX);
    let cardX = 0;
    if ( utils.getRandomSign() == 1 ) {
        cardX = bizCardMinX - cardCloudX;
    } else {
        cardX = bizCardMaxX + cardCloudX;
    }
    const cardDivIndex = getCardDivIndex(cardDivId) || 0;

    const top = cardY;
    cardDiv.style.top = `${top}px`;
    const left = cardX - MEAN_CARD_WIDTH / 2;
    cardDiv.style.left = `${left}px`;
    cardDiv.style.width = `${MEAN_CARD_WIDTH}px`;
    cardDiv.style.height = `${MEAN_CARD_HEIGHT}px`;


    var z = utils.getRandomInt(CARD_MIN_Z, CARD_MAX_Z);
    while (z === prev_z) {
        // Generate a new z if it's the same as the previous one
        z = utils.getRandomInt(CARD_MIN_Z, CARD_MAX_Z);
    }
    prev_z = z;

    // inherit colors of bizcardDiv
    cardDiv.setAttribute("bizcardDivId", bizcardDiv.id);
    cardDiv.setAttribute("data-color-index", bizcardDiv.id);
    
    cardDiv.setAttribute("saved_z", z);
    cardDiv.setAttribute("saved_zIndexStr", get_zIndexStr_from_z(z));
    cardDiv.setAttribute("saved_filterStr", get_filterStr_from_z(z));

    cardDiv.style.zIndex = cardDiv.getAttribute("saved_zIndexStr") || "";
    cardDiv.style.filter = cardDiv.getAttribute("saved_filterStr") || "";

    // the tag_link is used to define the contents of this cardDiv
    const spanId = `tag_link-${cardDivId}`;

    // define the innerHTML when cardDiv is added to #canvas
    cardDiv.innerHTML = `<span id="${spanId}" class="tag-link" targetCardDivId="${cardDivId}">${tag_link.html}</span>`;

    const spanElement = document.getElementById(spanId);

    // ==================================================================
    // cardDiv img_src and dimensions

    var img_src = null;
    var img_width = MEAN_CARD_WIDTH;
    var img_height = MEAN_CARD_HEIGHT;

    var width = img_width + 2 * CARD_BORDER_WIDTH;
    var height = img_height + 2 * CARD_BORDER_WIDTH
    // cardDiv.style.borderWidth = `${CARD_BORDER_WIDTH}px`;
    // cardDiv.style.borderStyle = "solid";
    // cardDiv.style.borderColor = "white";
    cardDiv.style.width = `${width}px`;
    cardDiv.style.height = `${height}px`;

    // save the saved_ center 
    var saved_ctrX = left + width / 2;
    var saved_ctrY = top + height / 2;
    cardDiv.setAttribute("saved_left", `${cardDiv.offsetLeft}`);
    cardDiv.setAttribute("saved_top", `${cardDiv.offsetTop}`);
    cardDiv.setAttribute("saved_width", `${cardDiv.offsetWidth}`);
    cardDiv.setAttribute("saved_height", `${cardDiv.offsetHeight}`);
    cardDiv.setAttribute("saved_ctrX", `${saved_ctrX}`);
    cardDiv.setAttribute("saved_ctrY", `${saved_ctrY}`);

    if (img_src !== null) {
        var img = document.createElement("img");
        img.classList.add("card-div-img");
        img.id = "card-div-img-" + cardDivId;
        img.src = img_src;
        img.style.width = `${img_width}px`;
        img.style.height = `${img_height}px`;
        img.alt = cardDiv.id;
        cardDiv.appendChild(img);
    }

    cardDiv.addEventListener("mouseenter", handleCardDivMouseEnter);
    cardDiv.addEventListener("mouseleave", handleCardDivMouseLeave);
    addCardDivClickListener(cardDiv);

    // add the cardDivClickListener to all cardDiv icon descendants 
    // except icon elements
    let cardDivDescendants = cardDiv.querySelectorAll('*');
    for ( let decendent of cardDivDescendants ) {
        if ( !decendent.classList.contains('icon') ) {
            addCardDivClickListener(cardDiv);
        }
    }

    // renderAllTranslateableDivsAtCanvasContainerCenter();

    cardDiv.setAttribute("tagLinkText", tag_link[ "text" ]);
    cardDiv.setAttribute("tagLinkUrl", tag_link[ "url" ]);
    cardDiv.setAttribute("tagLinkImg", tag_link[ "img" ]);

    return cardDiv;
}

function isWordSubstringInList(word, stringList) {
    word = word.toUpperCase().trim();
    for (let i = 0; i < stringList.length; i++) {
        let listStr = stringList[i].toUpperCase().trim();
        let listParts = listStr.split(' ');
        for ( let listPart of listParts ) {
            if ( word.includes(listPart) || listPart.includes(word) ) {
                return true;
            }
        }
        if (listStr.includes(word) || word.includes(listStr)) {
            return true;
        }
    }
    return false;
}
  
/**
 * Summary. Returns the translate string used to transform
 * any cardDiv's x,y coordinates into canvas-relative coordinates.
 * this assortment of divs has only a fixed number of possible
 * z values so the results of this function are cashed for
 * speed of access.
 *
 * Description. (use period)
 * @param {number}  dh           the horizontal parallax offset value
 * @param {number}  dv           the vertical parallax offet value
 * @param {number}   z           the random Z depth assigned to every cardDiv
 *                              where z ranges from 1 as max dist to viewer
 *                              to ALL_CARDS_MAX_Z being closest to viewer
 *                              with an integer value between CARD_MIN_Z and CARD_MAX_Z
 * @param {number}  canvasContainer_dx    the x value used to convert cardDiv.x to canvasContainer-relative position
 * @param {number}  canvasContainer_dy    the y value used to convert cardDiv.y to canvasContainer-relative position
 *
 * @return {string} Return a string with format "12.02px -156.79px"
 */

function getZTranslateStr(dh, dv, z, canvasContainer_dx, canvasContainer_dy) {
    // If z is null (meaning z_index > MAX_ALL_CARDS_Z_INDEX), return no translation
    if (z === null) {
        return "0px 0px";
    }
    
    // z ranges from 0 (closest) to viewer to MAX_Z furthest from viewer
    // zindex ranges MAX_Z (closest to viewer) to 1 furthest from viewer
    var z_index = parseInt(get_zIndexStr_from_z(z));
    var zScale = (z_index <= ALL_CARDS_MAX_Z) ? z_index : 0.0;

    // by definition, divs have zero mean hzCtrs so canvas translation is required
    var dx = dh * zScale + canvasContainer_dx;
    var dy = dv * zScale + 0; // canvasContainer_dy;
    var zTranslateStr = `${dx}px ${dy}px`;

    return zTranslateStr;
}

// return all bizcardDivs and cardDivs lazy-loaded
function getAllTranslateableCardDivs() {
    var allDivs = [];
    allDivs = Array.prototype.concat.apply(
        allDivs,
        canvas.getElementsByClassName("bizcard-div")
    );
    allDivs = Array.prototype.concat.apply(
        allDivs,
        canvas.getElementsByClassName("card-div")
    );
    return allDivs;
}

// apply parallax to the given cardDiv and returns
// the translate string used to transform. The transform
// will be applied on the next animation frame
function applyParallaxToOneCardDiv(cardDiv) {
    // utils.validateIsCardDivOrBizcardDiv(cardDiv);
    // utils.validateIsStyleProps(newStyleProps);
    var zIndexStr = cardDiv.style.zIndex;
    var z = cardDiv.getAttribute("saved_z");
    if ( (z === "") || (zIndexStr == SELECTED_CARD_Z_INDEX) ) {
        // empty string z or selected card means no parallax is needed
        return null;
    }

    // if zIndexStr is null do not apply parallax, because
    // the cardDiv is either not in the viewport or its position 
    // has been set through the selectTheCardDiv mechanism.
    if ( zIndexStr === null  ) {
        return null;
    }

    var { parallaxX, parallaxY } = getParallax();
    const canvasContainerX = utils.half(canvasContainer.offsetWidth);
    const canvasContainerY = utils.half(canvasContainer.offsetHeight);

    // constants for this parallax
    const dh = parallaxX * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = parallaxY * PARALLAX_Y_EXAGGERATION_FACTOR;

    // compute and apply translations to this translatableDiv
    var z = get_z_from_zIndexStr(zIndexStr);

    var cardDivX = utils.half(cardDiv.offsetWidth);
    var cardDivY = utils.half(cardDiv.offsetHeight);

    // canvasContainer-relative cardDiv center
    var canvasContainer_dx = canvasContainerX - cardDivX;
    var canvasContainer_dy = canvasContainerY - cardDivY;

    var zTranslateStr = getZTranslateStr(dh, dv, z, canvasContainer_dx, canvasContainer_dy);

    try {
        cardDiv.style.translate = zTranslateStr;
    } catch (error) {
        // console.error(`applyParallax cardDiv:${cardDiv.id}`, error);
    }
    return zTranslateStr;
}

/**
 * applyz-depth scaled parallax to all translateableDiv 
 * currently visible in the canvasContainer viewport
 */
function applyParallax() {
    //logger.log("applyParallax");
    // let numVisible = 0;
    var allCardDivs = getAllTranslateableCardDivs();   
    for ( var cardDiv of allCardDivs) {
        applyParallaxToOneCardDiv(cardDiv); // Apply parallax to the cloned cardDiv
    }
    // logger.log("numVisible:", numVisible, "numDivs:", allDivs.length);
}

// ************* AUTO SCROLLING *************

// *** Add new flag ***
const AUTOSCROLL_STOPS_ON_USER_SCROLL_OR_WHEEL = false; // Set to false to disable stopping autoscroll on user action
const AUTOSCROLL_ENABLED = true; 

var autoScrollingInterval = null;
var autoScrollVelocity = 0;
var oldAutoScrollVelocity = 0;
var autoScrollEase = 0;
const AUTOSCROLL_REPEAT_MILLIS = 10;
const MAX_AUTOSCROLL_VELOCITY = 3.0;
const MIN_AUTOSCROLL_VELOCITY = 2.0;
const AUTOSCROLL_CHANGE_THRESHOLD = 2.0;
const ALLOW_FOCAL_POINT_AIMING_IN_WHEEL_EVENT = false;

// set autoScrollVelocity based on current focalPoint 
function updateAutoScrollVelocity() {

    const topHeight = Math.floor(canvasContainer.offsetHeight / 4);
    const centerTop = topHeight;
    const centerHeight = topHeight * 2;
    const centerBottom = topHeight + centerHeight;
    const bottomHeight = topHeight;
    const scrollHeight = canvasContainer.scrollHeight;
    const scrollTop = canvasContainer.scrollTop;
    const windowHeight = canvasContainer.clientHeight;
    const scrollBottom = scrollHeight - scrollTop - windowHeight;

    if (focalPointY < centerTop) {
        autoScrollEase = (scrollTop < 150) ? 1 : 0;
        autoScrollVelocity = (focalPointY - centerTop) / topHeight * MAX_AUTOSCROLL_VELOCITY;
    } else if (focalPointY > centerBottom) {
        autoScrollEase = (scrollBottom < 150) ? 1 : 0;
        autoScrollVelocity = (focalPointY - centerBottom) / bottomHeight * MAX_AUTOSCROLL_VELOCITY;
    } else {
        autoScrollEase = 0;
        autoScrollVelocity = 0;
        // logger.log("autoScrollVelocity set to 0");
    }
}

// implement autoscrolling and then apply 
// parallax transformations to all 
// transformable elements
function handleFocalPointMove(prefix="") {

    updateAutoScrollVelocity();

    // if the velocity changed
    if (Math.abs(autoScrollVelocity - oldAutoScrollVelocity) >= AUTOSCROLL_CHANGE_THRESHOLD) {

        // if the velocity is near zero
        if (Math.abs(autoScrollVelocity) < MIN_AUTOSCROLL_VELOCITY) {
            // stop the interval if needed
            if (autoScrollingInterval != null) {
                clearInterval(autoScrollingInterval);
                autoScrollingInterval = null;
                autoScrollVelocity = 0;
                console.log("AUTOSCROLL STOPPED AT LOW VELOCITY");
            }
        } else {
            // start the inteval if needed
            if (autoScrollingInterval == null && AUTOSCROLL_ENABLED) {
                autoScrollingInterval = setInterval(function () {

                    // apply the velocity
                    var currentScrollTop = canvasContainer.scrollTop;
                    var newScrollTop = currentScrollTop + autoScrollVelocity;

                    // clampInt newScrollTop to the boundaries
                    var minScrollTop = 0;

                    var maxScrollTop = canvasContainer.scrollHeight - canvasContainer.clientHeight;

                    newScrollTop = utils.clampInt(newScrollTop, minScrollTop, maxScrollTop);

                    // if there is room to scroll 

                    if (Math.abs(canvasContainer.scrollTop - newScrollTop) > 0) {
                        // go ahead and scroll

                        console.log(`canvasContainer.scrollTop changed to newScrollTop: ${newScrollTop}`);
                        canvasContainer.scrollTop = newScrollTop;
                    } else {
                        console.log("AUTOSCROLL STOPPED AT BOUNDARY");
                        //  we've reached a boundary so 
                        // stop the auto-scroll
                        autoScrollVelocity = 0;
                        clearInterval(autoScrollingInterval);
                        autoScrollingInterval = null;
                    }
                }, AUTOSCROLL_REPEAT_MILLIS);
            }
        }
        oldAutoScrollVelocity = autoScrollVelocity;
    }
    // apply the parallax transformations
    applyParallax();
}

// function debugScrolling(event, scrollable, scrollVelocityType, scrollVelocity) {
//     if ( debugScrollingElement != null ) {
//         var scrollTop = scrollable.scrollTop;
//         var scrollHeight = scrollable.scrollHeight;
//         var windowHeight = scrollable.clientHeight;
//         var scrollBottom = scrollHeight - scrollTop - windowHeight;

//         var html = "";
//         html += `event:${event}<br/>`;
//         html += `scrollTop:${scrollTop}<br/>`;
//         html += `scrollBottom:${scrollBottom}<br/>`;
//         html += `autoScrollEase:${autoScrollEase}<br/>`;
//         if (scrollVelocityType != null && scrollVelocity != null)
//             html += `${scrollVelocityType}:${scrollVelocity}<br/>`;
//         debugScrollingElement.innerHTML = html;
//     }
// }


// Display mouse position and delta coordinates in the right-message-div  

function handleMouseEnterCanvasContainer(event) {
    focalPoint.handleMouseEnterCanvasContainer(event);
}

function handleMouseLeaveCanvasContainer(event) {
    focalPoint.handleMouseLeaveCanvasContainer(event);
}

var lastScrollTop = null;
var lastScrollTime = null;

function handleCanvasContainerScroll(scrollEvent) {
    // *** Wrap the stopping logic ***
    if (AUTOSCROLL_STOPS_ON_USER_SCROLL_OR_WHEEL) {
        if (autoScrollingInterval != null) {
            logger.log("A canvasContainer scroll detected, stopping autoscroll.");
            clearInterval(autoScrollingInterval);
            autoScrollingInterval = null;
            autoScrollVelocity = 0;
            oldAutoScrollVelocity = 0;
        }
    }
    // *** End wrap ***

    var thisTime = (new Date()).getTime();
    var thisScrollTop = canvasContainer.scrollTop;
    var deltaTime = (lastScrollTime != null) ? (thisTime - lastScrollTime) : null;
    var deltaTop = (lastScrollTop != null) ? (thisScrollTop - lastScrollTop) : null;
    var scrollVelocity = (deltaTime && deltaTop) ? (deltaTop) / (deltaTime) : "?";
    // debugScrolling("scroll", canvasContainer, "scrollVelocity", `${deltaTop}/${deltaTime}`);
    lastScrollTime = thisTime;
    lastScrollTop = thisScrollTop;
}

function handleCanvasContainerWheel(wheelEvent) {
    // *** Wrap the stopping logic ***
    if (AUTOSCROLL_STOPS_ON_USER_SCROLL_OR_WHEEL) {
        if (autoScrollingInterval != null) {
            logger.log("B canvaseContainer wheel detected, stopping autoscroll.");
            clearInterval(autoScrollingInterval);
            autoScrollingInterval = null;
            autoScrollVelocity = 0;
            oldAutoScrollVelocity = 0;
        }
    }
    // *** End wrap ***

    const position = {
        x: wheelEvent.clientX,
        y: wheelEvent.clientY
    };
    if ( ALLOW_FOCAL_POINT_AIMING_IN_WHEEL_EVENT ) {
        focalPoint.setAimPoint(position);
    }
}

// Keep the passive: true option to improve scroll performance
addCanvasContainerEventListener("wheel", handleCanvasContainerWheel, { passive: true });

// handle mouse enter event for any div element with
// cardClass "card-div" or "bizcard-div"
function handleCardDivMouseEnter(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        logger.info("handleCardDivMouseEnter", targetCardDiv);
    }
}

// handle mouse leave event for any div element with
// cardClass "card-div" or "bizcard-div"
function handleCardDivMouseLeave(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        logger.info("handleCardDivMouseLeave", targetCardDiv);
    }
}

// handle mouse leave event for any div element with
// cardClass "card-div" or "bizcard-div"
function handleCardDivMouseClick(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        selectTheCardDiv(targetCardDiv);
    }
}

function handleCanvasContainerMouseClick(event) {
    const target = event.target;
    if (target == canvasContainer ) {
        logger.info("canvasContainer calling deselectTheSelectedCardDiv(true)");
        deselectTheSelectedCardDiv(true);
    } else if (target == canvas ) {
        logger.info("canvas calling deselectTheSelectedCardDiv(true)");
        deselectTheSelectedCardDiv(true);
    } else if (target.classList.contains("card-div")) {
        logger.info(`canvasContainer calling handleCardDivMouseClick(event, card-div`);
        handleCardDivMouseClick(event, "card-div");
    } else if (target.classList.contains("bizcard-div")) {
        logger.info(`canvasContainer calling handleCardDivMouseClick(event, bizcard-div`);
        handleCardDivMouseClick(event, "bizcard-div");
    } else if (target.classList.contains("card-div-line-item")) {
        logger.info(`canvasContainer calling handleCardDivMouseClick(event, card-div-line-item`);
        handleCardDivMouseClick(event, "card-div-line-item");
    } else if (target.id == "focal-point" ) {
        // Save original pointer-events style
        const originalPointerEvents = target.style.pointerEvents;
        
        // Get all elements at the click point, hiding focal point temporarily
        target.style.pointerEvents = 'none';
        const elementsAtPoint = document.elementsFromPoint(event.clientX, event.clientY);
        // Restore original pointer-events style
        target.style.pointerEvents = originalPointerEvents;
        
        // Find the first card-div or bizcard-div under the focal point
        const cardDivUnder = elementsAtPoint.find(element => 
            element.classList.contains('card-div') || element.classList.contains('bizcard-div')
        );
        
        if (cardDivUnder) {
            logger.info("handleCanvasContainerMouseClick found card under focal-point:", cardDivUnder.id);
            selectTheCardDiv(cardDivUnder, true);
        } else {
            logger.info("handleCanvasContainerMouseClick focal-point with no card underneath");
            deselectTheSelectedCardDiv(true);
        }
    } else if (target.id == "aim-point" ) { // TODO: remove this
        logger.info("handleCanvasContainerMouseClick aim-point");
    } else if (target.id == "bulls-eye" ) { // TODO: remove this
        logger.info("handleCanvasContainerMouseClick bulls-eye");
    } else {
        logger.info("handleCanvasContainerMouseClick unknown target");
        utils.showElement(target,"from handleCanvasContainerMouseClick", LogLevel.INFO);
    }
}


// Prevents clicks anywhere during animation
document.addEventListener( // Call addEventListener
  'click',                 // Argument 1: Event type
  function(event) {        // Argument 2: Listener function starts here
    if (ANIMATION_IN_PROGRESS) {
      event.preventDefault();
      event.stopPropagation();
      // logger.log("Click blocked...");
    }
  },                       // Listener function ends here, followed by comma
  { capture: true }        // Argument 3: Options object
);                         // Closing parenthesis for addEventListener call

function startAnimationWithParallax(div, styleFrameArray) {
    // utils.validateIsDivElement(div);
    // utils.validateIsStyleFrameArray(styleFrameArray);
    const frameInterval = ANIMATION_DURATION_MILLIS / NUM_ANIMATION_FRAMES;
    let frameCount = 0;
    const lastFrame = NUM_ANIMATION_FRAMES - 1;
    let startTime = null;
    ANIMATION_IN_PROGRESS = true;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsedTime = timestamp - startTime;

        if (elapsedTime > frameInterval * frameCount) {
            applyParallaxToOneCardDiv(div);
            frameCount++;
        }

        if (frameCount < lastFrame) {
            requestAnimationFrame(step);
        }
    }

    div.animate(styleFrameArray, { duration: ANIMATION_DURATION_MILLIS, iterations: 1 })
        .finished.then(() => {
            endAnimation(div, styleFrameArray[lastFrame]);
        })
        .catch((error) => {
            console.error("Animation error:", error);
            endAnimation(div, styleFrameArray[lastFrame]);
        });

    requestAnimationFrame(step);
}

function endAnimation(div, targetStyleFrame) {
    // utils.validateIsDivElement(div);
    // utils.validateIsStyleFrame(targetStyleFrame);
    // apply the targetProps 
    if ( targetStyleFrame != null ) {
        // logger.log(`endAnimation targetStyleFrame:${targetStyleFrame}`)
        const targetStyleArray = targetStyleFrame;
        // utils.validateIsStyleArray(targetStyleArray);
        applyStyleArray(div, targetStyleArray);
    }
    // logger.log(`animationend for ${funcName} ${div.id}`);
    ANIMATION_IN_PROGRESS = false;
}  

function moveElementCenter(element, newCenter) {
    const rect = element.getBoundingClientRect();
    const newLeft = newCenter.x - rect.width / 2;
    const newTop = newCenter.y - rect.height / 2;
    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
    const checkLeft = parseInt(element.style.left);
    const checkTop = parseInt(element.style.top);
    const checkCenter = {
        x: checkLeft + rect.width / 2,
        y: checkTop + rect.height / 2
    }
    const dist = utils.getEuclideanDistance(checkCenter, newCenter);
    if (dist > utils.EPSILON) {
        throw new Error(`moveElementCenter:${element.id} dist:${dist} > EPSILON`);
    }
}

// Track selected state
let selectedClone = null;
let originalCard = null;
let theSelectedCardDivLineItem = null;  // Add this line

function selectTheCardDiv(cardDiv) {
    // Add logging to see when/why this is called during parallax
    logger.log(`[selectTheCardDiv ENTRY] Triggered for card: ${cardDiv ? cardDiv.id : 'null'}. Current selectedClone: ${selectedClone ? selectedClone.id : 'null'}. OriginalCard: ${originalCard ? originalCard.id : 'null'}`);
    
    if (!cardDiv) return;
    
    // Convert ID to element if needed
    if (typeof cardDiv === 'string') {
        logger.log(`[selectTheCardDiv] Converting ID string '${cardDiv}' to element.`);
        cardDiv = document.getElementById(cardDiv);
        if (!cardDiv) {
            logger.warn(`[selectTheCardDiv] Element with ID '${cardDiv}' not found.`);
            return;
        }
    }

    // Validate card type
    if (isCardDivLineItem(cardDiv) || (!isCardDivId(cardDiv.id) && !isBizcardDivId(cardDiv.id))) {
        logger.warn(`[selectTheCardDiv] Invalid card type for element: ${cardDiv.id}`);
        return;
    }

    // If clicking same card, unselect it
    if (cardDiv === originalCard) {
        logger.log(`[selectTheCardDiv] Clicked same card (${cardDiv.id}), calling unselectCardDiv.`);
        unselectCardDiv();
        return;
    }

    // Unselect any previously selected card
    if (selectedClone) {
        logger.log(`[selectTheCardDiv] Found existing clone (${selectedClone.id}), calling unselectCardDiv.`);
        unselectCardDiv();
    }

    // Create and style clone
    logger.log(`[selectTheCardDiv] Creating clone for card: ${cardDiv.id}`);
    const clone = cardDiv.cloneNode(true);
    clone.id = `${cardDiv.id}-clone`;
    logger.log(`[selectTheCardDiv] CREATED clone with ID: ${clone.id}`);
    clone.classList.add('selected-clone');
    
    // Position clone fixed at viewport center
    clone.style.position = 'fixed';
    
    // Get exact dimensions of the card
    clone.style.visibility = 'hidden';  // Temporarily hide to measure
    document.body.appendChild(clone);    // Add to DOM to get accurate measurements
    const width = clone.offsetWidth;
    const height = clone.offsetHeight;
    
    // Calculate center based on canvasContainer bounds
    const canvasRect = canvasContainer.getBoundingClientRect();
    const bullsEyeCenterX = canvasRect.left + canvasRect.width / 2;
    const bullsEyeCenterY = canvasRect.top + canvasRect.height / 2;
    
    // Position clone
    if (isBizcardDivId(cardDiv.id)) {
        // For bizcards: center X = bulls-eye center X, top = bulls-eye center Y - 100px
        clone.style.left = `${bullsEyeCenterX - width/2}px`;  // Center horizontally
        clone.style.top = `${bullsEyeCenterY - 100}px`;      // Top edge 100px above bulls-eye
    } else {
        // For regular cards: center both X and Y
        clone.style.left = `${bullsEyeCenterX - width/2}px`;
        clone.style.top = `${bullsEyeCenterY - height/2}px`;
    }
    clone.style.visibility = 'visible';
    
    // Style clone to be prominent
    clone.style.zIndex = SELECTED_CARD_Z_INDEX;
    clone.style.filter = 'brightness(1.0) blur(0px)';
    
    // Check position and adjust if needed
    requestAnimationFrame(() => {
        const rect = clone.getBoundingClientRect();
        const actualCenterX = rect.left + (rect.width / 2);
        
        if (isBizcardDivId(cardDiv.id)) {
            // For bizcards: verify center X alignment and top position
            const actualTop = rect.top;
            const adjustX = bullsEyeCenterX - actualCenterX;
            const adjustY = (bullsEyeCenterY - 100) - actualTop;
            
            if (Math.abs(adjustX) > 1 || Math.abs(adjustY) > 1) {
                const newLeft = parseInt(clone.style.left) + adjustX;
                const newTop = parseInt(clone.style.top) + adjustY;
                clone.style.left = `${newLeft}px`;
                clone.style.top = `${newTop}px`;
                logger.info(`Bizcard clone adjusted - X center offset: ${adjustX.toFixed(2)}, Top offset: ${adjustY.toFixed(2)}`);
            }
        } else {
            // For regular cards: verify center alignment
            const actualCenterY = rect.top + (rect.height / 2);
            const adjustX = bullsEyeCenterX - actualCenterX;
            const adjustY = bullsEyeCenterY - actualCenterY;
            
            if (Math.abs(adjustX) > 1 || Math.abs(adjustY) > 1) {
                const newLeft = parseInt(clone.style.left) + adjustX;
                const newTop = parseInt(clone.style.top) + adjustY;
                clone.style.left = `${newLeft}px`;
                clone.style.top = `${newTop}px`;
                logger.info(`Card clone adjusted - Center offset X: ${adjustX.toFixed(2)}, Y: ${adjustY.toFixed(2)}`);
            }
        }
        
        // Verify final position
        requestAnimationFrame(() => {
            const finalRect = clone.getBoundingClientRect();
            if (isBizcardDivId(cardDiv.id)) {
                logger.info(`Final bizcard position - Center X: ${(finalRect.left + finalRect.width/2).toFixed(2)}, Top: ${finalRect.top.toFixed(2)}`);
                logger.info(`Target position was - Center X: ${bullsEyeCenterX.toFixed(2)}, Top: ${(bullsEyeCenterY - 100).toFixed(2)}`);
            } else {
                logger.info(`Final card position - Center: x=${(finalRect.left + finalRect.width/2).toFixed(2)}, y=${(finalRect.top + finalRect.height/2).toFixed(2)}`);
                logger.info(`Target position was - Center: x=${bullsEyeCenterX.toFixed(2)}, y=${bullsEyeCenterY.toFixed(2)}`);
            }
        });
    });
    
    // Hide original
    logger.log(`[selectTheCardDiv] Hiding original card: ${cardDiv.id}`);
    cardDiv.style.visibility = 'hidden';
    
    // Update state
    logger.log(`[selectTheCardDiv] Updating state: selectedClone=${clone.id}, originalCard=${cardDiv.id}`);
    selectedClone = clone;
    originalCard = cardDiv;
    
    // Add click handler to clone
    clone.addEventListener('click', (e) => {
        logger.log(`[selectTheCardDiv] Clone ${clone.id} clicked, calling unselectCardDiv.`);
        unselectCardDiv();
        e.stopPropagation();
    });

    // Log initial position relative to canvas center
    const initialRect = clone.getBoundingClientRect();
    const initialCenterX = initialRect.left + (initialRect.width / 2);
    const initialCenterY = initialRect.top + (initialRect.height / 2);
    logger.info(`Initial dimensions: width=${width}, height=${height}`);
    logger.info(`Target center (canvas): x=${bullsEyeCenterX.toFixed(2)}, y=${bullsEyeCenterY.toFixed(2)}`);
    logger.info(`Initial center: x=${initialCenterX.toFixed(2)}, y=${initialCenterY.toFixed(2)}`);
    logger.info(`Initial offset from target: x=${(initialCenterX - bullsEyeCenterX).toFixed(2)}, y=${(initialCenterY - bullsEyeCenterY).toFixed(2)}`);
    logger.log(`[selectTheCardDiv EXIT] Finished selecting ${cardDiv.id}`);
}

function unselectCardDiv() {
    logger.log(`[unselectCardDiv ENTRY] Current selectedClone: ${selectedClone ? selectedClone.id : 'null'}. OriginalCard: ${originalCard ? originalCard.id : 'null'}`);
    if (!selectedClone || !originalCard) {
        logger.log('[unselectCardDiv] No selected clone/original found. Returning.');
        return;
    }
    
    logger.log(`[unselectCardDiv] Removing clone: ${selectedClone.id}, Restoring original: ${originalCard.id}`);
    // Remove clone
    selectedClone.remove();
    
    // Show original
    originalCard.style.visibility = 'visible';

    // Clear state AFTER accessing them
    let removedCloneId = selectedClone.id;
    let restoredOriginalId = originalCard.id;
    selectedClone = null;
    originalCard = null;
    logger.log(`[unselectCardDiv EXIT] Finished unselecting. Clone ${removedCloneId} removed, Original ${restoredOriginalId} restored.`);
}

// Remove old selection-related functions that are no longer needed
function setSelectedStyle() {} // Remove
function restoreSavedStyle() {} // Remove

// Update any existing functions that reference old selection state
function deselectTheSelectedCardDiv(deselectLineItem = false) {
    unselectCardDiv();
    if (deselectLineItem) {
        deselectTheSelectedCardDivLineItem();
    }
}

// add the mouse click event handler to any div element with
// class card-div or bizcard-div or to any child
// element that has a cardDiv or bizcard-div ancestor
function addCardDivClickListener(cardDiv) {
    cardDiv.addEventListener("click", cardDivClickListener);
}

// handle mouse click event for any div element with
// cardClass "card-div" or "bizcard-div" or any child
// element that has a cardDiv or bizcard-div ancestor.
function cardDivClickListener(event) {
    let element = event.target;
    let cardDiv = element;
    if ( utils.isCardDivOrBizcardDiv(cardDiv) ) {
        cardDiv = cardDiv.closest('.card-div, .bizcard-div');
        selectTheCardDiv(cardDiv, true);
    }
    // stop event propagation if the element is not an icon
    if ( cardDiv && !element.classList.contains('icon') ) {
        event.stopPropagation();
    }
}

// select the given cardDivLineItem after scrolling it into view 
function selectTheCardDivLineItem(cardDivLineItem, selectTheCardDivFlag=false) {
    if ( cardDivLineItem == null )
        return;
    // utils.validateIsCardDivLineItem(cardDivLineItem);
    // utils.validateIsBoolean(selectTheCardDivFlag);

    // does scroll self into view
    scrollElementToTop(cardDivLineItem);

    // click on selected to deselect and deselect its cardDiv
    if (theSelectedCardDivLineItem !== null &&
        cardDivLineItem.id == theSelectedCardDivLineItem.id) {
            deselectTheSelectedCardDivLineItem(selectTheCardDivFlag);
            return;
    }
    // calls  deselectTheSelectedCardDivLineItem and deselect its cardDiv
    deselectTheSelectedCardDivLineItem(selectTheCardDivFlag);
    // saves self as theSelected
    theSelectedCardDivLineItem = cardDivLineItem;
    // styles self as selected
    setSelectedStyle(theSelectedCardDivLineItem);

    // option to select its cardDiv
    if ( selectTheCardDivFlag ) {
        var cardDiv = getCardDivOfCardDivLineItem(cardDivLineItem);
        // console.assert(cardDiv != null);
        selectTheCardDiv(cardDiv);
        // scrollElementIntoView(cardDiv);
    }
    
    // debugTheSelectedCardDivId();
}

function deselectTheSelectedCardDivLineItem(deselectTheSelectedCardDivFlag=false) {
    // if theSelectedCardDivLineItem is defined
    if (theSelectedCardDivLineItem != null) {
        // utils.validateIsCardDivLineItem(theSelectedCardDivLineItem);

        restoreSavedStyle(theSelectedCardDivLineItem);

        if (deselectTheSelectedCardDivFlag) {
            deselectTheSelectedCardDiv();
        }
        // sets the theSelectedCardDivLineItem to null
        theSelectedCardDivLineItem = null;
    }
    // debugTheSelectedCardDivId();
}

function addCardDivLineItemClickListener(cardDivLineItem, cardDiv) {

    cardDivLineItem.addEventListener("click", function (event) {

        // cardDivLineItem selected not clicked
        // scrolls self into view
        // then select its cardDiv and bring it into view
        selectTheCardDivLineItem(cardDivLineItem, true);

        // stop event propagation after selecting the cardDivLineItem
        event.stopPropagation();
    })
}

// add a new card-div-line-item to right-column-content
// if one doesn't aleady exist
// returns the newly addedCardDivLineItem or null
function addCardDivLineItem(targetCardDivId) {

    if ( targetCardDivId == null) {
        logger.log(`ignoring request to add cardDivLineItem with null targetCardDivId`);
        return;
    }

    // check to see if the cardDiv exists
    var targetCardDiv = document.getElementById(targetCardDivId);
    if (targetCardDiv == null) {
        throw new Error(`no cardDiv found for targetCardDivId:${targetCardDivId}`);
    }
    let bizcardDivId = getBizcardDivIdFromAnyDiv(targetCardDiv);
    if ( bizcardDivId == null ) {
        throw new Error(`no bizcardDivId found for targetCardDivId:${targetCardDivId}`);
    }
    // logger.log(`addCardDivLineItemIfNeeded targetCardDivId:${targetCardDivId}`);
    // only add a card-div-line-item for this targetCardDivId if
    // it hasn't already been added
    var existingCardDivLineItem = getCardDivLineItem(targetCardDivId);
    // logger.log(`existingCardDivLineItem:${existingCardDivLineItem} found for targetCardDivId:${targetCardDivId}`);
    if (existingCardDivLineItem == null) {

        // create the card-div-line-item if one doesn't already exist
        var cardDivLineItem = document.createElement("li");
        // logger.log(`created cardDivLineItem:${cardDivLineItem.id}`);
        cardDivLineItem.classList.add("card-div-line-item");
        //cardDivLineItem.classList.add("right-column-div-child");
        cardDivLineItem.id = "card-div-line-item-" + targetCardDivId;
        cardDivLineItem.setAttribute("targetCardDivId", targetCardDivId);
        logger.log('cardDivLineItem bizcardDivId:', bizcardDivId);
        cardDivLineItem.setAttribute("data-color-index", bizcardDivId);

        // add click listener
        addCardDivLineItemClickListener(cardDivLineItem, targetCardDiv);

        // set content
        var cardDivLineItemContent = document.createElement("div");
        cardDivLineItemContent.classList.add("card-div-line-item-content");
        cardDivLineItemContent.setAttribute("data-color-index", bizcardDivId);
        
        // set right column
        var cardDivLineItemRightColumn = document.createElement('div')
        cardDivLineItemRightColumn.classList.add("card-div-line-item-right-column");
        cardDivLineItemRightColumn.setAttribute('data-color-index', bizcardDivId);

        // start with the innerHTML of the targetCardDiv
        var targetInnerHTML = targetCardDiv.innerHTML;
        if (targetInnerHTML && targetInnerHTML.length > 0) {

            // ensure targetInnerHTML includes no img tag markup
            cardDivLineItemContent.innerHTML = targetInnerHTML;
        }

        // if targetCardDiv has a "Description" attribute
        var description = targetCardDiv.getAttribute("Description");
        if (description && description.length > 0) {
            // split the description by BULLET_DELIMITER and return html 
            // of the styled form <p><ul>(<li>text</li>)+</ul></p>
            // where text contains spans that have targetCardDivIds
            var line_items_HTML = convert_description_HTML_to_line_items_HTML(description, cardDivLineItem);
            if (line_items_HTML && line_items_HTML.length > 0) {
                // remove all line breaks <br/> from line_items_HTML
                line_items_HTML = line_items_HTML.replace(/<br\/>/g, "");
                cardDivLineItemContent.innerHTML += line_items_HTML
            }
        }

        // add cardDivLineItem's delete button, which deletes the cardDivLineItem
        var cardDivLineItemDeleteButton = document.createElement("button");
        cardDivLineItemDeleteButton.classList.add("card-div-line-item-delete-button");
        cardDivLineItemDeleteButton.addEventListener("click", function (event) {
            cardDivLineItem.remove();
            event.stopPropagation();
        });
        cardDivLineItemRightColumn.appendChild(cardDivLineItemDeleteButton);

        // add cardDivLineItem "following" button if the targetCardDiv is a bizcardDiv
        if (isBizcardDiv(targetCardDiv)) {
            var cardDivLineItemFollowingButton = document.createElement("button");
            cardDivLineItemFollowingButton.classList.add("card-div-line-item-follow-button");
            addCardDivLineItemFollowingButtonClickHandler(cardDivLineItemFollowingButton);
            cardDivLineItemRightColumn.appendChild(cardDivLineItemFollowingButton);
        }

        if (isCardDiv(targetCardDiv)) {
            addCardDivMonths(targetCardDiv, cardDivLineItemContent);
        }

        cardDivLineItem.appendChild(cardDivLineItemContent);
        cardDivLineItem.appendChild(cardDivLineItemRightColumn);
        rightContentDiv.appendChild(cardDivLineItem);

        // find all tag-link elements of this cardDivLineItemContent and 
        // give them data-color-index and onclick listeners
        var elements = cardDivLineItemContent.getElementsByClassName('tag-link');
        for (let element of elements ) {
            element.setAttribute("data-color-index", bizcardDivId);
            addTagLinkClickListener(element);
        }

        // find all iconElemens of this cardDivLineItemContent and give each an onclick listeners.
        //
        // However, delete any back-icons if the targetCardDiv is a bizcardDiv
        //
        // visit the iconElements in reverse order so that 
        // the removal of the back iconElement does not affect the
        // index of the remaining iconElements.
        let deleteBackIcons = isBizcardDivId(targetCardDivId);
        let iconElements = cardDivLineItemContent.getElementsByClassName("icon");
        for (let i = iconElements.length - 1; i >= 0; i--) {
            addIconClickListener(iconElements[i]);
        }
    } else {
        // logger.log(`returning preexisting cardDivLineItem for targetCardDivId:${targetCardDivId}`);
        cardDivLineItem = existingCardDivLineItem
    }

    // set the selected style
    setSelectedStyle(cardDivLineItem);

    // does not select self
    // does scroll self into view
    scrollElementIntoView(cardDivLineItem);

    const allElements = utils.findAllChildrenRecursively(cardDivLineItem);
    paletteSelector.applyPaletteToElements(allElements);

    return cardDivLineItem;
}

// --------------------------------------------------------------

// return the cardDivLineItem in rightContentDiv for cardDivId or null if not found
function getCardDivLineItem(cardDivId) {
    if (!utils.isString(cardDivId))
        return null;
    var cardDivLineItems = document.getElementsByClassName("card-div-line-item");
    var isABizcardDivId = isBizcardDivId(cardDivId);
    for (var i = 0; i < cardDivLineItems.length; i++) {
        var cardDivLineItem = cardDivLineItems[ i ];
        var isABizCarddivLineItemId = utils.isString(cardDivLineItem.id) && cardDivLineItem.id.includes("bizcard-div-");
        if( String(cardDivLineItem.id).includes(cardDivId) && isABizcardDivId == isABizCarddivLineItemId ) {
            // logger.log(`getCardDivId:${cardDivId} found cardDivLineItem:${cardDivLineItem.id}`);
            return cardDivLineItem;
        }
    }
    return null;
}

function getCardDivOfCardDivLineItem(cardDivLineItem) {
    var cardDivId = cardDivLineItem.id.replace("card-div-line-item-", "");
    return document.getElementById(cardDivId);
}

function addCardDivLineItemFollowingButtonClickHandler(cardDivLineItemFollowingButton) {
    cardDivLineItemFollowingButton.addEventListener("click", function (event) {
        var cardDivLineItem = event.target.parentElement.parentElement;
        // console.assert(cardDivLineItem != null && cardDivLineItem.classList.contains("card-div-line-item"));

        // only bizcardDivs have this cardDivLineItemFollowingButton
        var cardDiv = getCardDivOfCardDivLineItem(cardDivLineItem);
        // console.assert(isBizcardDivId(cardDiv));

        var followingBizcardDivId = getFollowingBizcardDivId(cardDiv.id);
        // console.assert(isBizcardDivId(followingBizcardDivId));

        var followingBizcardDiv = document.getElementById(followingBizcardDivId);
        // console.assert(isBizcardDiv(followingBizcardDiv));

        // select the followingBizcardDiv and its cardDivLineItem
        selectTheCardDiv(followingBizcardDiv, true);

        event.stopPropagation();
    });
}

// get the id of the bizcard that should be
// next (added if needed and) selected
function getFollowingBizcardDivId(bizcardDivId) {

    // find the id of the bizcardDiv with 
    // the latest bizcardDivLineItem or null
    if (!utils.isString(bizcardDivId)) {
        var bizcardDiv = getLastBizcardDivWithLineItem();
        // no bizcardDivs have line items
        // so return the Id of the first bizcardDiv
        if (!bizcardDiv) {
            var allBizcardDivs = document.getElementsByClassName("bizcard-div");
            // console.assert(allBizcardDivs != null && allBizcardDivs.length > 0);
            bizcardDiv = allBizcardDivs[ 0 ];
            return bizcardDiv.id;
        } else {
            // otherwise we continue with the latest
            bizcardDivId = bizcardDiv.id;
        }
    }

    // console.assert(utils.isString(bizcardDivId));
    var index = getBizcardDivIndex(bizcardDivId);
    // console.assert(index != null);

    var followingBizcardDivId = getBizcardDivIdFromIndex(index + 1);
    // if we've reached the end of all bizcardDivs
    // then start over at index 0
    if (followingBizcardDivId == null)
        followingBizcardDivId = getBizcardDivIdFromIndex(0);

    // console.assert(isBizcardDivId(followingBizcardDivId));
    return followingBizcardDivId;
}

// remove multiple img tags from the given html string
function removeImgTagsFromHtml(html) {
    var filtered = html.replace(/<img[^>"']*((("[^"]*")|('[^']*'))[^"'>]*)*>/g, "");
    // console.assert(!filtered.includes("<img"));
    return filtered;
}

// tag_link is an HTML string span#tag_link-card-dive-8.tag_link { title:'', translate"true, dir: '', hidden: false, 
function addTagLinkClickListener(tag_link) {
    // console.assert(tag_link != null);
    tag_link.addEventListener("click", function (event) {
        let cardDivId = tag_link.getAttribute("targetCardDivId");
        // logger.log(`cardDivId:${cardDivId}`);
        var cardDiv = document.getElementById(cardDivId);
        if (cardDiv) {
            // var tagLinkText = cardDiv.getAttribute("tagLinkText");
            // logger.log(`tag_link.text:${tagLinkText}`);
            // console.assert(tagLinkText != null && tagLinkUrl != null);

            // selectTheCardDiv and its cardDivLineItem
            selectTheCardDiv(cardDiv, true);

            // need to scroll cardDiv into view
            // scrollElementIntoView(cardDiv);
        } else {
            // logger.log(`no cardDiv with tag_link found for cardDivId:${cardDivId}`);
        }
        event.stopPropagation();
    });
}

/**
 * applies current depth-based translation to all divs 
 * that are visible in the current viewport
 */
function renderAllTranslateableDivsAtCanvasContainerCenter() {
    
    updateViewport();

    const canvasContainerX = utils.half(canvasContainer.offsetWidth);
    const canvasContainerY = utils.half(canvasContainer.offsetHeight);
    const translateableDivs = getAllTranslateableCardDivs();
    for (const div of translateableDivs) {
        if ( isCardDivWithinViewport(div) ) {
            const divWidth = div.offsetWidth;
            const trans_dx = canvasContainerX - utils.half(divWidth);
            const trans_dy = 0;
            const translateStr = `${trans_dx}px ${trans_dy}px`;
            try {
                div.style.translate = translateStr;
            } catch (error) {
                // logger.log(`leftCenter div:${div.id}`, error);
                // console.error(`leftCenter div:${div.id}`, error);
            }
        }
    }
}

function rightContentScrollToBottom() {
    rightContentDiv.scrollTop = rightContentDiv.scrollHeight;
}

function canvasContainerScrollToTop() {
    console.log("canvasContainerScrollToTop started scrollTo");
    canvasContainer.scrollTo({ top: 0, behavior: 'smooth' });
}

function canvasContainerScrollToBottom() {
    console.log("canvasContainerScrollToBottom started scrollTo");
    canvasContainer.scrollTo({ top: canvasContainer.scrollHeight, behavior: 'smooth' });
}

var focalPointX;
var focalPointY;

// this is called while focalPoint is in motion
function focalPointPositionListener(position, prefix="") {
    focalPointX = position.x;
    focalPointY = position.y;
    handleFocalPointMove(prefix);
    // debugFocalPoint();
}

var parallaxX;
var parallaxY;

function getParallax() {
    const bullsEye = focalPoint.getBullsEye();
    const bullsEyeX = bullsEye['x'];
    const bullsEyeY = bullsEye['y'];
    parallaxX = bullsEyeX - focalPointX;
    parallaxY = bullsEyeY - focalPointY;
    return { parallaxX, parallaxY };
}

// return the min and max years over the list of jobs
function getMinMaxTimelineYears(jobs) {
    var minYear = 10000;
    var maxYear = -10000;
    for (let i = 0; i < jobs.length; i++) {
        var job = jobs[ i ];
        var jobEnd = job[ "end" ].trim().replace("-01", "");
        // utils.validateString(jobEnd);
        var endYearStr = jobEnd.split("-")[ 0 ];
        var endYear = parseInt(endYearStr);
        if ( endYear > maxYear )
            maxYear = endYear;

        var jobStart = job[ "start" ].trim().replace("-01", "");
        // utils.validateString(jobStart);
        var startYearStr = jobStart.split("-")[ 0 ];
        var startYear = parseInt(startYearStr);
        if ( startYear < minYear )
            minYear = startYear;
    }
    minYear -= 1;
    maxYear += 1;
    return [minYear, maxYear];
}

async function createAllElements() { // Add async
    const timelineContainer = document.getElementById("timeline-container");
    const [MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR] = getMinMaxTimelineYears(jobs);
    const DEFAULT_TIMELINE_YEAR = MAX_TIMELINE_YEAR;
    timeline.createTimeline(timelineContainer, canvasContainer, MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR, DEFAULT_TIMELINE_YEAR);
    focalPoint.createFocalPoint(focalPointElement);
    focalPoint.addFocalPointPositionListener(focalPointPositionListener); // starts easing to mouse
    
    // --- Wait for the palette selector ---
    console.log("Requesting palette selector instance...");
    paletteSelector = await getPaletteSelectorInstance(); // Add await
    console.log("Palette selector instance received:", paletteSelector);

    if (!paletteSelector) {
        console.error('Failed to get palette selector instance. Cannot proceed with palette-dependent setup.');
        // Handle this error appropriately - maybe show a message to the user
        return;
    }
    
    // Create bizcards and apply palette
    createBizcardDivs();
    addAllIconClickListeners();

    // Add event listeners after elements are created
    addCanvasContainerEventListener("wheel", handleCanvasContainerWheel, { passive: true });
    addCanvasContainerEventListener('scroll', handleCanvasContainerScroll);
    addCanvasContainerEventListener('click', handleCanvasContainerMouseClick);
    console.log("createAllElements finished.");
}

// createAllElements after DOM is ready
document.addEventListener("DOMContentLoaded", async () => { // Make listener async
    console.log("DOMContentLoaded event fired.");
    try {
        // Call the async function to create elements
        await createAllElements(); // Add await
        console.log("Element creation process complete (async).");

        // Removed the diagnostic block that directly attached listeners
        
        // Add event listeners after elements are created (Duplicate? These are also added in createAllElements)
        // Consider removing these duplicates if createAllElements always runs successfully
        // addCanvasContainerEventListener("wheel", handleCanvasContainerWheel, { passive: true });
        // addCanvasContainerEventListener('scroll', handleCanvasContainerScroll);
        // addCanvasContainerEventListener('click', handleCanvasContainerMouseClick);
        
    } catch (error) {
        // Use logger for consistency
        // console.error('Error during initial setup (DOMContentLoaded):', error);
        logger.error('Error during initial setup (DOMContentLoaded):', error);
    }
});

function handleWindowLoad() {
    focalPoint.handleOnWindowLoad();

    renderAllTranslateableDivsAtCanvasContainerCenter();

    let lastFrameTime = 0;
    const maxFramesPerSecond = 10;
    const frameIntervalMillis = 1000 / maxFramesPerSecond;

    // set up animation loop
    (function drawFrame() {
        const now = performance.now();
        const deltaTime = now - lastFrameTime;
        if (deltaTime >= frameIntervalMillis) {
            lastFrameTime = now;

            // console.time('drawFocalPointAnimationFrame');
            focalPoint.drawFocalPointAnimationFrame();
            // console.timeEnd('drawFocalPointAnimationFrame');
        }
        // Request the next frame.
        window.requestAnimationFrame(drawFrame);

    })();
    // Start the animation loop.
    window.requestAnimationFrame(drawFrame);
}

function drawFrame() {
    focalPoint.drawFocalPointAnimationFrame();
}

const viewport = {};
const VIEWPORT_PADDING = 100;

/**
 * updates the canvas-constainer-relative 
 * geometry of the viewPort, which is used
 * to clip out cardDivs that are not visible.
 */
function updateViewport() {
    const canvasContainer = document.getElementById("canvas-container");
    const canvasContainerRect = canvasContainer.getBoundingClientRect();
    const canvasContainerWidth = canvasContainerRect.right - canvasContainerRect.left;
    const canvasContainerHeight = canvasContainerRect.bottom - canvasContainerRect.top;
    viewport.padding = VIEWPORT_PADDING;
    viewport.top = canvasContainerRect.top - viewport.padding;
    viewport.left = canvasContainerRect.left - viewport.padding;
    viewport.right = canvasContainerRect.right + viewport.padding;
    viewport.bottom = canvasContainerRect.bottom + viewport.padding;
    viewport.centerX = canvasContainerRect.left + canvasContainerWidth / 2;
    viewport.centerY = canvasContainerRect.top + canvasContainerHeight / 2;
}

/**
 * @returns the canvas-container relative position of the viewpoint center
 */
function getViewpointCenter() {
    return {
        x: viewport.centerX,
        y: viewport.centerY
    }
}

/**
 * Checks if any part of the given cardDiv is visible within the 
 * viewport, which is derived from the canvasContainer element.
 * @param {HTMLElement} cardDiv - The cardDiv element to check.
 * @returns {boolean} - True if the cardDiv is within the viewport, false otherwise.
 */
function isRectWithinViewport(rect) {
    const intersects = !(rect.right < (viewport.left) || 
                         rect.left > (viewport.right) || 
                         rect.bottom < (viewport.top) || 
                         rect.top > (viewport.bottom));
    return intersects;
}

function isCardDivWithinViewport(cardDiv) {
    return isRectWithinViewport(cardDiv.getBoundingClientRect());
}

// Attach event listeners
window.addEventListener("load", handleWindowLoad);

// First, ensure the array exists as a global variable
window.canvasContainerEventListeners = [];

// Then modify the function to check if the array exists and create it if needed
function addCanvasContainerEventListener(eventType, listener, options) {
    if (!window.canvasContainerEventListeners) {
        window.canvasContainerEventListeners = [];
    }
    window.canvasContainerEventListeners.push({ eventType, listener, options });
    canvasContainer.addEventListener(eventType, listener, options);
}

function removeCanvasContainerEventListeners() {
    for (let i = 0; i < canvasContainerEventListeners.length; i++) {
        let listener = canvasContainerEventListeners[ i ];
        if (listener.options != null)
            canvasContainer.removeEventListener(listener.eventType, listener.listener, listener.options);
        else
            canvasContainer.removeEventListener(listener.eventType, listener.listener);
    }
}

function restoreCanvasContainerEventListeners() {
    for (let i = 0; i < canvasContainerEventListeners.length; i++) {
        let listener = canvasContainerEventListeners[ i ];
        if (listener.options != null)
            canvasContainer.addEventListener(listener.eventType, listener.listener, listener.options);
        else
            canvasContainer.addEventListener(listener.eventType, listener.listener);
    }
}

//---------------------------------------
// selectAllButton - adds a cardDivLineItem for all bizcardDivs
//
function selectAllBizcards() {
    // delete all cardDivLineItems in reverse order
    clearAllDivCardLineItems();

    var allBizcardDivs = document.getElementsByClassName("bizcard-div");
    if ( allBizcardDivs.length == 0 ) {
        console.error("selectAllBizcards() found zero bizCardDivs.");
        return;
    }
    for (let i = 0; i < allBizcardDivs.length; i++) {
        var bizcardDiv = allBizcardDivs[ i ];

        // select the bizcardDiv and its cardDivLineItem
        selectTheCardDiv(bizcardDiv, true);
    }

    // select and scroll to the first bizcardDiv and its line item
    selectAndScrollToCardDiv(allBizcardDivs[0]);
}

selectAllBizcardsButton.addEventListener("click", selectAllBizcards);

// delete all cardDivLineItems in reverse order
function clearAllDivCardLineItems() {
    var allCardDivLineItems = document.getElementsByClassName("card-div-line-item");
    for (let i=allCardDivLineItems.length-1; i >= 0 ; i--) {
        allCardDivLineItems[i].remove();
    }
    deselectTheSelectedCardDiv();
}

// select the given cardDiv and its line item 
// and scroll each into view
function selectAndScrollToCardDiv(cardDiv) {
    // utils.validateIsCardDivOrBizcardDiv(cardDiv);
    if ( !cardDiv ) {
        logger.log("Ignoring undefined cardDiv");
        return;
    }
    var cardDivLineItem = getCardDivLineItem(cardDiv.id);

    // avoid in case another select would ignore the select
    selectTheCardDiv(cardDiv, true);
}

//---------------------------------------
// clearAllLineItemsButton - remove all cardDivLineItems in reverse order

clearAllLineItemsButton.addEventListener("click", function (event) {
    // delete all cardDivLineItems in reverse order
    clearAllDivCardLineItems();
});

//---------------------------------------
// selectNextBizcardButton dateSortedBizcardIds

var dateSortedBizcardIds = null;

function getDateSortedBizcardIds() {
    if (dateSortedBizcardIds == null) {
        dateSortedBizcardIds = [];
        let bizcardDivs = document.getElementsByClassName("bizcard-div");
        for (let i = 0; i < bizcardDivs.length; i++) {
            var datedDivIdId = {
                id: bizcardDivs[ i ].id,
                endDate: getBizcardDivEndDate(bizcardDivs[ i ])
            };
            dateSortedBizcardIds.push(datedDivIdId);
        }
        // sort in decending order
        dateSortedBizcardIds.sort((a, b) => b.endDate - a.endDate);
    }
    return dateSortedBizcardIds;
}

function getDateSortedBizcards() {
    var dateSortedBizcards = [];
    var dateSortedBizcardIds = getDateSortedBizcardIds();
    for (let bizcardId of dateSortedBizcardIds ) {
        dateSortedBizcards.push(document.getElementById(bizcardId));
    }
    return dateSortedBizcards;
}


function getNextBizcardDivId(fromBizcardDivId) {
    return getSiblingBizcardDivId(fromBizcardDivId, "next");
}

function getPreviousBizcardDivId(fromBizcardDivId) {
    return getSiblingBizcardDivId(fromBizcardDivId, "previous");
}

function selectNextBizcardDivId(fromBizcardDivId) {
    const nextBizcardDivId = getNextBizcardDivId(fromBizcardDivId);
    selectTheCardDiv(nextBizcardDivId, true);
}

function selectPreviousBizcardDivId(fromBizcardDivId) {
    const previousBizcardDivId = getPreviousBizcardDivId(fromBizcardDivId);
    selectTheCardDiv(previousBizcardDivId, true);
}

function getTheSelectedBizcardDivId() {
    return originalCard ? originalCard.id : null;
}

function getFirstBizcardDivId() {
    var sorted = getDateSortedBizcardIds();
    if ( sorted !== undefined && sorted !== null & sorted.length > 0 )
        return sorted[0].id;
    return null;
}

function getLastBizcardDivId() {
    var sorted = getDateSortedBizcardIds();
    if ( sorted !== undefined && sorted !== null & sorted.length > 0 )
        return sorted[sorted.length-1].id;
    return null;
}

function getBizcardDivEndDate(bizcardDiv) {
    // utils.validateIsBizcardDiv(bizcardDiv);
    var endDateStr = bizcardDiv.getAttribute("endDate");
    var endDate = new Date(endDateStr);
    return endDate;
}

function getBizcardDivStartDate(bizcardDiv) {
    // utils.validateIsBizcardDiv(bizcardDiv);
    var startDateStr = bizcardDiv.getAttribute("startDate");
    var startDate = new Date(startDateStr);
    return startDate;
}



// fromBizcardId is the id of the bizcardDiv to start from
// direction is "next" or "previous"
// returns the id of the sibling bizcardDiv in the given direction.
// if fromBizcardId is null then the first or last bizcardDiv is returned
function getSiblinghBizcardId(fromBizcardId, direction) {
    const allOrderedBizcardDivIds = getDateSortedBizcardIds();
    const N = allOrderedBizcardDivIds.length;
    if ( N == 0 ) {
        logger.log("selectBizcard: no bizcardDivs found");
        return;
    }
    if ( fromBizcardId == null ) {
        logger.log("selectBizcard: fromBizcardId is null");
        if ( direction == "next" ) {
            return allOrderedBizcardDivIds[0].id;
        }
        else {
            return allOrderedBizcardDivIds[N-1].id;
        }
    }
    var fromBizcardIndex = allOrderedBizcardDivIds.findIndex(bizcardDivId => bizcardDivId.id === fromBizcardId);
    if ( fromBizcardIndex == -1 ) {
        logger.log("selectBizcard: fromBizcardId not found");
        return;
    }
    if ( direction == "next" ) {
        newBizcardIndex = fromBizcardIndex + 1;
    }
    else {
        newBizcardIndex = fromBizcardIndex - 1;
    }
    if ( newBizcardIndex == -1 ) {
        newBizcardIndex = N - 1;
    } else if ( newBizcardIndex >= N ) {
        newBizcardIndex = 0;
    }
    return allOrderedBizcardDivIds[newBizcardIndex].id;
}

function selectFirstBizcard() {
    const firstBizcardDivId = getSiblinghBizcardId(null, "next");
    const firstBizcardDiv = document.getElementById(firstBizcardDivId);
    if ( firstBizcardDiv == null ) {
        logger.log("selectFirstBizcard: firstBizcardDiv not found");
        return;
    }
    selectTheCardDiv(firstBizcardDiv, true);
}

// return the list of all bizcardDivLineItems or null
function getAllBizcardDivLineItems() {
    const allCardDivLineItems = [ ...document.getElementsByClassName("card-div-line-item") ];
    const allBizcardLineItems = allCardDivLineItems.filter(cardDivLineItem => String(cardDivLineItem.id).includes("bizcard-div"));
    if (allBizcardLineItems.length == 0)
        return null;
    return allBizcardLineItems;
}

// return the Id of the last bizcardDiv that has a
// bizcardDivLineItem, otherwise return null
function getLastBizcardDivWithLineItem() {
    var allBizcardDivLineItems = getAllBizcardDivLineItems();
    if (allBizcardDivLineItems && allBizcardDivLineItems.length > 0) {
        var numBizcardDivLineItems = allBizcardDivLineItems.length;
        var lastBizcardDivLineItem = allBizcardDivLineItems[ numBizcardDivLineItems - 1 ];
        var lastBizcardDivId = lastBizcardDivLineItem.getAttribute("targetCardDivId");
        // console.assert(isBizcardDivId(lastBizcardDivId));
        var lastBizcardDiv = document.getElementById(lastBizcardDivId);
        validateIsBizcardDiv(lastBizcardDiv);
        return lastBizcardDiv;
    }
    return null;
}

// find all iconElements and add their click listeners
// called on DOMContentLoaded
function addAllIconClickListeners() {
    let iconElements = document.getElementsByClassName("icon");
    let N = iconElements.length;
    logger.log(`addAllIconClickListeners found ${N} iconElements`);
    for ( let i=0; i<N; i++ ) {
        let iconElement = iconElements[i];
        addIconClickListener(iconElement);
    }
    let allCardDivElements = document.getElementsByClassName("card-div");
    logger.log(`addAllIconClickListeners found ${allCardDivElements.length} allCardDivElements`);
    let allDateSortedBizcardDivElements = getDateSortedBizcards();
    logger.log(`addAllIconClickListeners found ${allDateSortedBizcardDivElements.length} allDateSortedBizcardDivElements`);
    let allCardDivLineItemElements = document.getElementsByClassName("card-div-line-item");
    logger.log(`addAllIconClickListeners found ${allCardDivLineItemElements.length} allCardDivLineItemElements`); 
}

function addCardDivMonths(cardDiv, cardDivLineItemContent) {
    const days = cardDiv.dataset.bizcardDivDays;
    const months = Math.round(days * 12.0 / 365.25);
    cardDiv.dataset.bizcardDivMonths = months;
    cardDiv.dataset.bizcardDivYears = 0;
    let spanElement = cardDivLineItemContent.querySelector("span.tag-link");
    if( spanElement ) {
        if ( months <= 12 ) {
            const units = months == 1 ? "month" : "months"; 
            spanElement.innerHTML += `<br/>(${months} ${units}  experience)`;
        } else {
            const years = Math.round(months / 12.0);
            const units = years == 1 ? "year" : "years";
            spanElement.innerHTML += `<br/>(${years} ${units} experience)`;
            cardDiv.dataset.bizcardDivYears = years;
        }
    } else {
        console.error(`no spanElement found for cardDiv:${cardDiv.id}`);
    }
} // <--- ADD THIS closing brace for addCardDivMonths function

selectNextBizcardButton.addEventListener("click", function (event) {
    selectNextBizcardDivId();
});
selectFirstBizcardButton.addEventListener("click", function (event) {
    selectFirstBizcard();
});

function selectFirstBizcardDivId() {
    logger.info("selectFirstBizcardDivId");
    const nextBizcardDivId = getSiblinghBizcardId(null, "next");
    const firstBizcardDiv = document.getElementById(firstBizcardDivId);
    selectTheCardDiv(firstBizcardDiv, true);
}

function getSiblingBizcardDivId(fromBizcardDivId, direction) {
    logger.info("getSiblingBizcardDivId direction:", direction);
    
    const allDateOrderedBizcardDivIds = getDateSortedBizcardIds();
    const N = allDateOrderedBizcardDivIds.length;
    
    if (N === 0) {
        logger.warn("No bizcard divs found");
        return null;
    }

    // If no starting point provided, get from currently selected or default to first/last
    if (fromBizcardDivId == null) {
        fromBizcardDivId = getTheSelectedBizcardDivId();
        if (fromBizcardDivId == null) {
            return direction === "previous" ? allDateOrderedBizcardDivIds[N-1].id : allDateOrderedBizcardDivIds[0].id;
        }
    }

    // Find the index of the fromBizcardDivId in our sorted array
    const currentIndex = allDateOrderedBizcardDivIds.findIndex(item => item.id === fromBizcardDivId);
    if (currentIndex === -1) {
        logger.warn("Starting bizcard div not found in ordered list");
        return direction === "previous" ? allDateOrderedBizcardDivIds[N-1].id : allDateOrderedBizcardDivIds[0].id;
    }

    // Calculate new index with wraparound
    const delta = direction === "previous" ? -1 : 1;
    let newIndex = currentIndex + delta;
    
    // Handle wraparound
    if (newIndex < 0) {
        newIndex = N - 1;
    } else if (newIndex >= N) {
        newIndex = 0;
    }

    return allDateOrderedBizcardDivIds[newIndex].id;
}

//---------------------------------------
// canvas container event listeners

addCanvasContainerEventListener("wheel", handleCanvasContainerWheel, { passive: true });

addCanvasContainerEventListener('scroll', handleCanvasContainerScroll);

addCanvasContainerEventListener('click', handleCanvasContainerMouseClick);

// Add wheel event handler for right content div
rightContentDiv.addEventListener("wheel", function(event) {
    // Allow the wheel event to scroll the right content div
    // and prevent it from propagating to the canvas container
    event.stopPropagation();
    
    // Calculate the new scroll position
    const currentScroll = rightContentDiv.scrollTop;
    const delta = event.deltaY;
    const newScroll = currentScroll + delta;
    
    // Apply the scroll
    rightContentDiv.scrollTop = newScroll;
}, { passive: true });

document.addEventListener("keydown", handleKeyDown);

function handleKeyDown(event) {
    logger.log("handleKeyDown code:", event.code);

    const SCROLL_LARGE_STEP = 300; // For PageUp/PageDown
    const SCROLL_SMALL_STEP = 100; // For Arrow Up/Down

    switch (event.code) {
        case 'ArrowLeft':
            selectPreviousBizcardDivId();
            break;
        case 'ArrowRight':
            selectNextBizcardDivId();
            break;
        case 'ArrowUp':
            event.preventDefault();
            canvasContainer.scrollBy({
                top: -SCROLL_SMALL_STEP,
                behavior: 'smooth'
            });
            break;
        case 'ArrowDown':
            event.preventDefault();
            canvasContainer.scrollBy({
                top: SCROLL_SMALL_STEP,
                behavior: 'smooth'
            });
            break;
        case 'PageUp':
            event.preventDefault();
            canvasContainer.scrollBy({
                top: -SCROLL_LARGE_STEP,
                behavior: 'smooth'
            });
            break;
        case 'PageDown':
            event.preventDefault();
            canvasContainer.scrollBy({
                top: SCROLL_LARGE_STEP,
                behavior: 'smooth'
            });
            break;
        case 'Home':
            event.preventDefault();
            canvasContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            break;
        case 'End':
            event.preventDefault();
            canvasContainer.scrollTo({
                top: canvasContainer.scrollHeight,
                behavior: 'smooth'
            });
            break;
        case 'Space':
            event.preventDefault();  // Prevent default space key scrolling
            focalPoint.toggleDraggable();
            updateDraggableButtonState(); // Sync button state
            break;
        default:
            logger.log(`handleKeyDown code: ${event.code}`);
    }
}

// Add key event listener
document.addEventListener('keydown', (event) => {
    // Handle space key for toggling focal point draggable state
    if (event.key === ' ') {
        // This logic is now handled in the main handleKeyDown function above
        // event.preventDefault();
        // focalPoint.toggleDraggable();
        // updateDraggableButtonState(); // Sync button state
        return;
    }
    
    // Handle 'b' key for bulls-eye lock
    if (event.key === 'b') {
        event.preventDefault();
        focalPoint.handleKeyDown(event);
        return;
    }
});

// Add resize handle functionality
const resizeHandle = document.getElementById('resize-handle');
const mainContainer = document.getElementById('main-container');
let isResizing = false;
let startX;
let startLeftWidth;
let lastLeftPercentage = 50; // Store last known left width before collapse
let lastRightPercentage = 50; // Store last known right width before collapse
let draggableButton = null; // Declare draggable button variable

// Create collapse buttons
const collapseLeftButton = document.createElement('button');
collapseLeftButton.id = 'collapse-left-button';
collapseLeftButton.className = 'toggle-collapse-button';
collapseLeftButton.innerHTML = '&lt;'; // < character
collapseLeftButton.title = 'Collapse left panel';

const collapseRightButton = document.createElement('button');
collapseRightButton.id = 'collapse-right-button';
collapseRightButton.className = 'toggle-collapse-button';
collapseRightButton.innerHTML = '&gt;'; // > character
collapseRightButton.title = 'Collapse right panel';

// --- Create Draggable Toggle Button ---
draggableButton = document.createElement('button');
draggableButton.id = 'toggle-draggable-button';
draggableButton.className = 'toggle-state-button d-button'; // Add specific class
draggableButton.innerHTML = 'd';
draggableButton.title = 'Toggle focal point draggable state (Space)';

// Initialize draggable button state immediately after creation
updateDraggableButtonState();

// Add click handler to draggable button
draggableButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent resize handle from handling the click
    focalPoint.toggleDraggable();
    updateDraggableButtonState();
});

// --- Create a container for the collapse buttons ---
const collapseButtonsContainer = document.createElement('div');
collapseButtonsContainer.className = 'collapse-buttons-container';
collapseButtonsContainer.appendChild(collapseLeftButton);
collapseButtonsContainer.appendChild(collapseRightButton);

// Create percentage display
const percentageDisplay = document.createElement('button');
percentageDisplay.className = 'percentage-display';
percentageDisplay.title = 'Click to reset to 50%';
percentageDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    resetLayout();
});

// Add the containers to the handle
resizeHandle.appendChild(collapseButtonsContainer);
resizeHandle.appendChild(draggableButton);
resizeHandle.appendChild(percentageDisplay);

// --- Helper Functions ---

// Add localStorage key constant at the top with other constants
const DIVIDER_POSITION_KEY = 'lastDividerPosition';

// Add function to save divider position
function saveDividerPosition(leftPercentage) {
    try {
        localStorage.setItem(DIVIDER_POSITION_KEY, leftPercentage.toString());
    } catch (error) {
        console.warn('Failed to save divider position:', error);
    }
}

// Add function to load divider position
function loadDividerPosition() {
    try {
        const savedPosition = localStorage.getItem(DIVIDER_POSITION_KEY);
        if (savedPosition) {
            const percentage = parseFloat(savedPosition);
            // Allow full range from 0-100%
            if (percentage >= 0 && percentage <= 100) {
                return percentage;
            }
        }
    } catch (error) {
        console.warn('Failed to load divider position:', error);
    }
    return 50; // Default to 50% if no valid saved position
}

// Modify the setColumnWidths function to save the position
function setColumnWidths(leftPercent, rightPercent) {
    // Allow full range from 0 to 100%
    leftPercent = Math.max(0, Math.min(100, leftPercent));
    rightPercent = 100 - leftPercent;
    
    canvasContainer.style.width = `${leftPercent}%`;
    rightColumn.style.width = `${rightPercent}%`;
    resizeHandle.style.left = `${leftPercent}%`;
    
    // Update percentage display
    percentageDisplay.textContent = `${Math.round(leftPercent)}%`;
    
    // Remove any existing position classes
    mainContainer.classList.remove('left-column-collapsed', 'right-column-collapsed');
    
    // Apply appropriate class based on position
    if (leftPercent === 0) {
        mainContainer.classList.add('left-column-collapsed');
    } else if (leftPercent === 100) {
        mainContainer.classList.add('right-column-collapsed');
    }

    // Update button layout based on divider position
    const buttonsContainer = document.querySelector('.buttons');
    buttonsContainer.classList.remove('layout-vertical', 'layout-2x2', 'layout-horizontal');
    
    if (leftPercent >= 80) {
        // 80-100%: 4 rows × 1 column
        buttonsContainer.classList.add('layout-vertical');
    } else if (leftPercent >= 70 && leftPercent < 80) {
        // 70-80%: 2 rows × 2 columns
        buttonsContainer.classList.add('layout-2x2');
    } else {
        // 0-70%: 1 row × 4 columns
        buttonsContainer.classList.add('layout-horizontal');
    }
    
    // Update button visibility based on divider position
    if (leftPercent <= 10) {
        // Between 0 and 10: show o and >
        collapseLeftButton.style.display = 'none';
        collapseRightButton.style.display = 'block';
        draggableButton.style.display = 'block';
    } else if (leftPercent <= 35) {
        // Between 10 and 35: show all 3
        collapseLeftButton.style.display = 'block';
        collapseRightButton.style.display = 'block';
        draggableButton.style.display = 'block';
    } else if (leftPercent <= 65) {
        // Between 35 and 65: only < and >
        collapseLeftButton.style.display = 'block';
        collapseRightButton.style.display = 'block';
        draggableButton.style.display = 'none';
    } else if (leftPercent <= 90) {
        // Between 65 and 90: show all 3
        collapseLeftButton.style.display = 'block';
        collapseRightButton.style.display = 'block';
        draggableButton.style.display = 'block';
    } else {
        // Between 90 and 100: show < and o
        collapseLeftButton.style.display = 'block';
        collapseRightButton.style.display = 'none';
        draggableButton.style.display = 'block';
    }
    
    saveDividerPosition(leftPercent);
    focalPoint.saveState();
}

// Initialize the divider position when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const savedPosition = loadDividerPosition();
    setColumnWidths(savedPosition, 100 - savedPosition);
    lastLeftPercentage = savedPosition;
    lastRightPercentage = 100 - savedPosition;
});

function updateButtonStates() {
    const leftIsCollapsed = canvasContainer.classList.contains('collapsed');
    const rightIsCollapsed = rightColumn.classList.contains('collapsed');

    if (leftIsCollapsed) {
        collapseLeftButton.innerHTML = '○';
        collapseLeftButton.title = 'Reset layout';
    } else {
        collapseLeftButton.innerHTML = '&lt;';
        collapseLeftButton.title = 'Collapse left panel';
    }

    if (rightIsCollapsed) {
        collapseRightButton.innerHTML = '○';
        collapseRightButton.title = 'Reset layout';
    } else {
        collapseRightButton.innerHTML = '&gt;';
        collapseRightButton.title = 'Collapse right panel';
    }
}

function resetLayout() {
    mainContainer.classList.remove('left-column-collapsed', 'right-column-collapsed');
    canvasContainer.classList.remove('collapsed');
    rightColumn.classList.remove('collapsed');
    setColumnWidths(50, 50);
    lastLeftPercentage = 50;
    lastRightPercentage = 50;
    updateButtonStates();
    // REMOVED immediate call to updateGradientWidths(); 
    // Update bulls-eye and focal point after transition
    setTimeout(() => {
        updateBullsEyePosition();
        focalPoint.handleOnWindowResize();
    }, 310);
}

// --- Event Listeners ---

// Collapse Left Button Click
collapseLeftButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCollapsed = canvasContainer.classList.contains('collapsed');
    if (isCollapsed) {
        resetLayout();
    } else {
        // Unselect card before collapsing
        unselectCardDiv(); 
        
        // Store current widths before collapsing left
        lastLeftPercentage = parseFloat(canvasContainer.style.width) || 50;
        lastRightPercentage = parseFloat(rightColumn.style.width) || 50;
        // Collapse left
        mainContainer.classList.add('left-column-collapsed');
        mainContainer.classList.remove('right-column-collapsed'); // Ensure right isn't marked collapsed
        canvasContainer.classList.add('collapsed');
        rightColumn.classList.remove('collapsed');
        setColumnWidths(0, 100);
        updateButtonStates();
        // Update bulls-eye and focal point after transition
        setTimeout(() => {
            updateBullsEyePosition();
            focalPoint.handleOnWindowResize();
        }, 310);
    }
});

// Collapse Right Button Click
collapseRightButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCollapsed = rightColumn.classList.contains('collapsed');
    if (isCollapsed) {
        resetLayout();
    } else {
        // Store current widths before collapsing right
        lastLeftPercentage = parseFloat(canvasContainer.style.width) || 50;
        lastRightPercentage = parseFloat(rightColumn.style.width) || 50;
        // Collapse right
        mainContainer.classList.remove('left-column-collapsed'); // Ensure left isn't marked collapsed
        mainContainer.classList.add('right-column-collapsed');
        canvasContainer.classList.remove('collapsed');
        rightColumn.classList.add('collapsed');
        setColumnWidths(100, 0);
        updateButtonStates();
        // Update bulls-eye and focal point after transition
        setTimeout(() => {
            updateBullsEyePosition();
            focalPoint.handleOnWindowResize();
        }, 310);
    }
});

// Function to update bulls-eye position based on canvas container
function updateBullsEyePosition() {
    const canvasRect = canvasContainer.getBoundingClientRect();
    const bullsEye = document.getElementById('bulls-eye');
    if (bullsEye) {
        bullsEye.style.left = `${canvasRect.left + (canvasRect.width / 2)}px`;
        bullsEye.style.top = '50%';
    }
}

// --- Resize Handle Logic ---
resizeHandle.addEventListener('mousedown', (e) => {
    // Ignore mousedown if the click is on the buttons
    if (e.target.classList.contains('toggle-collapse-button') || 
        e.target.classList.contains('toggle-state-button') ||
        e.target.classList.contains('percentage-display')) {
        return;
    }

    isResizing = true;
    startX = e.pageX;
    startLeftWidth = canvasContainer.offsetWidth;
    resizeHandle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    // If a column is collapsed, restore to the last known position before starting the drag
    if (mainContainer.classList.contains('left-column-collapsed')) {
        mainContainer.classList.remove('left-column-collapsed');
        canvasContainer.classList.remove('collapsed');
        setColumnWidths(10, 90); // Start from 10% when expanding from left collapse
    } else if (mainContainer.classList.contains('right-column-collapsed')) {
        mainContainer.classList.remove('right-column-collapsed');
        rightColumn.classList.remove('collapsed');
        setColumnWidths(90, 10); // Start from 90% when expanding from right collapse
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const dx = e.pageX - startX;
    const newLeftWidth = startLeftWidth + dx;
    const containerWidth = mainContainer.offsetWidth;
    const rawPercentage = (newLeftWidth / containerWidth) * 100;
    
    // Snap to nearest 5% increment
    const percentage = Math.round(rawPercentage / 5) * 5;
    
    // Allow full range from 0-100%
    if (percentage >= 0 && percentage <= 100) {
        lastLeftPercentage = percentage;
        lastRightPercentage = 100 - percentage;
        setColumnWidths(percentage, 100 - percentage);
        updateBullsEyePosition();
        focalPoint.handleOnWindowResize();
    }
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        resizeHandle.classList.remove('dragging');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // Get the final percentage
        const finalLeftPercentage = parseFloat(canvasContainer.style.width) || 50;
        
        // Only collapse at exact 0% or 100%
        if (finalLeftPercentage === 0) {
            // Collapse left
            mainContainer.classList.add('left-column-collapsed');
            canvasContainer.classList.add('collapsed');
            setColumnWidths(0, 100);
        } else if (finalLeftPercentage === 100) {
            // Collapse right
            mainContainer.classList.add('right-column-collapsed');
            rightColumn.classList.add('collapsed');
            setColumnWidths(100, 0);
        } else {
            // Store the final percentage after dragging
            lastLeftPercentage = finalLeftPercentage;
            lastRightPercentage = 100 - finalLeftPercentage;
        }
        
        updateButtonStates();
        updateBullsEyePosition();
    }
});

// Also update bulls-eye position on window resize
window.addEventListener('resize', () => {
    // Prevent updates if a column is collapsed (CSS handles this)
    if (mainContainer.classList.contains('left-column-collapsed') || 
        mainContainer.classList.contains('right-column-collapsed')) {
        // Still update bulls-eye as container width changes even when collapsed
        updateBullsEyePosition(); 
        return;
    }

    // Reapply last known widths based on the *current* main container width
    // Note: lastLeftPercentage and lastRightPercentage should always sum to 100
    setColumnWidths(lastLeftPercentage, lastRightPercentage);
    
    // Update bulls-eye position relative to potentially resized container
    updateBullsEyePosition();
});

// Initial button state update
updateButtonStates();

// --- New Helper Function for Draggable Button State ---
function updateDraggableButtonState() {
    if (!draggableButton) return; // Guard against early calls
    const isDraggable = focalPoint.isDraggable(); // Use the new getter
    if (isDraggable) {
        draggableButton.classList.add('draggable-on');
        draggableButton.classList.remove('draggable-off');
    } else {
        draggableButton.classList.add('draggable-off');
        draggableButton.classList.remove('draggable-on');
    }
}

// Initial button state update
updateButtonStates();
updateDraggableButtonState(); // Update draggable button initial state

function updateButtonLayout() {
  // Remove any existing layout classes
  buttonsContainer.classList.remove('layout-vertical', 'layout-horizontal', 'layout-2x2');
  
  // Let flexbox handle the layout naturally based on container width
  // No need to add specific layout classes anymore
}