// @ts-nocheck
'use strict';

import * as utils from './modules/utils.mjs';
import * as timeline from './modules/timeline.mjs';
import * as focalPoint from './modules/focal_point.mjs';
import * as alerts from './modules/alerts.mjs';
import { getPaletteSelectorInstance } from './modules/color_palettes.mjs';
import { Logger, LogLevel } from "./modules/logger.mjs";
const logger = new Logger("main", LogLevel.DEBUG);


utils.testColorUtils();

// --------------------------------------
// Element reference globals

const rightContentDiv = document.getElementById("right-content-div");
// const debugScrollingElement = null; //  = document.getElementById("debugScrollingElement");
// const debugFocalPointElement = null; //  = document.getElementById("debugFocalPointElement");
// const debugTheSelectedCardDivIdElement = null; //  = document.getElementById("debugTheSelectedCardDivIdElement");
const canvasContainer = document.getElementById("canvas-container");
const canvas = document.getElementById("canvas");
const canvasBtmGradient = document.getElementById("canvas-btm-gradient");
const canvasTopGradient = document.getElementById("canvas-top-gradient");
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

const SELECTED_CARD_Z_INDEX = 91;       // no parallax
const SELECTED_CARD_FILTER = "brightness(1.25) blur(0px)";
const BULLSEYE_Z_INDEX = 98;            // no parallax
const FOCAL_POINT_Z_INDEX = 99;         // no parallax
const AIM_POINT_Z_INDEX = 100;          // no parallax

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

    // add the cardDivClickListener to all cardDiv descendants 
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
    var allDivs = getAllTranslateableCardDivs();    
    for (var i = 0; i < allDivs.length; i++) {
        var cardDiv = allDivs[i];
        if ( isCardDivWithinViewport(cardDiv) ) {
            applyParallaxToOneCardDiv(cardDiv); // Apply parallax to the cloned cardDiv
            // numVisible += 1;
        }
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
const MAX_AUTOSCROLL_VELOCITY = 40.0;
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
function handleFocalPointMove() {

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
        setSelectedStyle(targetCardDiv);
    }
}

function handleCanvasContainerMouseClick() {
    deselectTheSelectedCardDiv();
    deselectTheSelectedCardDivLineItem();
}

// handle mouse leave event for any div element with
// cardClass "card-div" or "bizcard-div"
function handleCardDivMouseLeave(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        restoreSavedStyle(targetCardDiv);
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

// works for card-div, bizcard-div, and card-div-line-item
// override all saved style and appeend the card to the 
// parent and position of the bullsEye element.
function setSelectedStyle(element) {
    logger.info(`setSelectedStyle:${element.id}`);
    if ( isCardDivLineItem(element) ) {
        element.classList.add("selected");
    } else {
        showElement(element, "before setSelectedStyle");
        element.classList.add("selected");

        // move the element to the center of the bulls-eye
        moveElementCenter(element, focalPoint.getBullsEye())

        element.setAttribute('z', ""); // no parallax
        element.style.zIndex = SELECTED_CARD_Z_INDEX;
        element.style.filter = SELECTED_CARD_FILTER;
        
        // showElement(element, "after setSelectedStyle");

        // render the repositioned element
        applyParallaxToOneCardDiv(element);
    }
}

function log_saved_and_current_styles(element, prefix) {
    const saved_width = element.getAttribute("saved_width");
    const saved_height = element.getAttribute("saved_height");
    const saved_top = element.getAttribute("saved_top");
    const saved_left = element.getAttribute("saved_left");
    const saved_ctrX = element.getAttribute("saved_ctrX");
    const saved_ctrY = element.getAttribute("saved_ctrY");
    logger.info(`${prefix} saved ctrX:${saved_ctrX} ctrY:${saved_ctrY}`);
    const saved_filterStr = element.getAttribute("saved_filterStr");
    const saved_zIndexStr = element.getAttribute("saved_zIndexStr");
    const saved_z = element.getAttribute("saved_z");
    const saved_next_sibling = element['saved-next-sibling'];
    const saved_next_sibling_id = (saved_next_sibling != null) ? saved_next_sibling.id : "";

    logger.info(`${prefix} saved filterStr:${saved_filterStr} zIndexStr:${saved_zIndexStr} z:${saved_z} nextSiblingId:${saved_next_sibling_id}`);

    const current_left = parseInt(element.style.left).toFixed(2);
    const current_top = parseInt(element.style.top).toFixed(2);
    const current_width = parseInt(element.style.width).toFixed(2);
    const current_height = parseInt(element.style.height).toFixed(2);
    const current_ctrX = (current_left + current_width / 2);
    const current_ctrY = (current_top + current_height / 2);
    logger.info(`${prefix} current_ctrX:${current_ctrX} ctrY:${current_ctrY}`);
    const current_filterStr = element.style.filter;
    const current_zIndexStr = element.style.zIndex;
    const current_z = element.getAttribute("z");
    const current_next_sibling = element.nextSibling;
    const current_next_sibling_id = (current_next_sibling != null) ? current_next_sibling.id : "";

    logger.info(`${prefix} current filterStr:${current_filterStr} zIndexStr:${current_zIndexStr} z:${current_z} nextSiblingId:${current_next_sibling_id}`);
}

// restore all saved style properties
function restoreSavedStyle(element) {
    logger.info('restoreSavedStyle:${element.id}');
    if ( isCardDivLineItem(element) ) {
        element.classList.remove("selected");
    } else {
        showElement(element, "before restoreSavedStyle");
        element.classList.remove("selected");
        
        // log_saved_and_current_styles(element, "before restoreSavedStyle");

        const saved_width = element.getAttribute("saved_width");
        const saved_height = element.getAttribute("saved_height");
        const saved_top = element.getAttribute("saved_top");
        const saved_left = element.getAttribute("saved_left");
        const saved_filterStr = element.getAttribute("saved_filterStr");
        const saved_zIndexStr = element.getAttribute("saved_zIndexStr");
        const saved_z = element.getAttribute("saved_z");
        element.style.width = `${saved_width}px`;
        element.style.height = `${saved_height}px`;
        element.style.top = `${saved_top}px`;
        element.style.left = `${saved_left}px`;
        element.style.filter = saved_filterStr;
        element.style.zIndex = saved_zIndexStr;
        element.setAttribute("z", saved_z);

        // log_saved_and_current_styles(element, "after restoreSavedStyle");

        showElement(element, "after restoreSavedStyle");

        applyParallaxToOneCardDiv(element);
    }
} 

var theSelectedCardDiv = null;
var theSelectedCardDivLineItem = null;

function scrollElementIntoView(element) {
    // utils.validateIsElement(element);
    if ( element == null )
        throw new Error("null element");
    else if ( element.id == null )
        throw new Error("null element.id");
    else if (isBizcardDiv(element) || isCardDivLineItem(element))
        scrollElementToTop(element);
    else if (isCardDiv(element) )
        scrollElementToCenter(element);
    else if (isCardDivLineItem(element) )
        scrollElementToTop(element);
    else
        throw new Error("unhandled element with id:" + element.id)
}

function scrollElementToTop(element) {
    const container = findNearestAncestorWithClassName(element, "scrollable-container");
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop + elementRect.top - containerRect.top;
    container.scrollTo({ top: scrollTop, behavior: 'smooth' });
}

function scrollElementToCenter(element) {
    // logger.log(`scrollElementToCenter element:${element.id}`);
    const container = findNearestAncestorWithClassName(element, "scrollable-container");
    const containerHeight = container.clientHeight;
    const elementTop = element.offsetTop;
    const elementHeight = element.clientHeight;
    const scrollTop = elementTop + (elementHeight / 2) - (containerHeight / 2);
    container.scrollTo({ top: scrollTop, behavior: 'smooth' });
}

// returns the nearest ancestor with className or null
function findNearestAncestorWithClassName(element, className) {
    // utils.validateIsElement(element);
    while ((element = element.parentElement) && !element.classList.contains(className));
    return element;
}

// returns the index of the child of the parent or null
function findChildIndexOfOfParent(element) {
    const parent = element.parentElement;
    if ( parent == null ) {
        return null;
    }
    for ( let i = 0; i < parent.children.length; i++ ) {
        if ( parent.children[i] == element ) {
            return i;
        }
    }
    return null;
}   

function selectTheCardDiv(cardDiv) {
    // re-select an alread selected cardDiv to unselect it. 
    if ( cardDiv == null ) {
        logger.warn('selectTheCardDiv given a null cardDiv');
        return;
    }
    if ( utils.isString(cardDiv) ) {
        const cardDivId = cardDiv;
        cardDiv = document.getElementById(cardDivId);
    }
    if ( isCardDivLineItem(cardDiv) ) {
        logger.warn(`selectTheCardDiv.id:${cardDiv.id} is a cardDivLineItem so not selecting`);
        return;
    }
    if ( ! isCardDivId(cardDiv.id) && ! isCardDivId(cardDiv) ) {
        logger.warn(`selectTheCardDiv.id:${cardDiv.id} is not a cardDivId or bizcardId so not selecting`);
        return;
    }

    if ( cardDiv == theSelectedCardDiv ) {
        logger.warn(`selectTheCardDiv.id:${cardDiv.id} is already selected so unselect it`);
        unselectCardDiv(theSelectedCardDiv);
        return;
    }

    const parent = cardDiv.parentElement;
    if ( parent == null ) {
        logger.warn(`selectTheCardDiv.id:${cardDiv.id} tagName:${cardDiv.tagName} obj:${cardDiv} has no parent`);
        return;
    }
    const childIndex = findChildIndexOfOfParent(cardDiv);
    if ( childIndex == null ) {
        logger.warn(`selectedTheCardDiv.id:${cardDiv.id} childIndex is null`);
        return;
    }
    cardDiv['saved-index'] = childIndex;

    // remove cardDiv from its current parent
    cardDiv.parentElement.removeChild(cardDiv);

    // append the cardDiv to the bulls-eye parent
    const bullsEyeElement = document.getElementById("bulls-eye");
    const bullsEyeParent = bullsEyeElement.parentElement;
    bullsEyeParent.appendChild(cardDiv);
    setSelectedStyle(cardDiv);


    theSelectedCardDiv = cardDiv;
    applyParallaxToOneCardDiv(cardDiv);
}

function showPosition(position, prefix="") {
    logger.log(prefix, JSON.stringify(position, utils.formatNumbersReplacer, 2));
}
function showElement(element, prefix="") {
    return;
    if ( element == null ) {
        logger.warn(prefix,`showElement given null element`);
        return;
    }

    const parentElementId = (element.parentElement != null) ? element.parentElement.id : "";

    let nextSiblingId = null;
    if ( element.classList.contains("card-div") ) {
        const nextSibling = utils.findNextSiblingWithClass(element, "card-div");
        nextSiblingId = (nextSibling != null) ? nextSibling.id : "";
    } else if ( element.classList.contains("bizcard-div") ) {
        const nextSibling = utils.findNextSiblingWithClass(element, "bizcard-div");
        nextSiblingId = (nextSibling != null) ? nextSibling.id : "";
    }
      
    const center = {
        x: element.offsetLeft + element.clientWidth / 2,
        y: element.offsetTop + element.clientHeight / 2
    }
    const dims = {
        width: element.clientWidth,
        height: element.clientHeight
    }
    const elementStyle = {
        id: element.id,
        parent_id: parentElementId,
        next_sibling_id: nextSiblingId,
        center: center,
        dims: dims,
        zIndex: element.style.zIndex,
        filter: element.style.filter
    }
    logger.info(prefix, JSON.stringify(elementStyle, utils.formatNumbersReplacer, 2));
}

function unselectCardDiv(cardDiv) {
    if ( cardDiv == null ) {
        return;
    }
    if ( utils.isString(cardDiv) ) {
        const cardDivId = cardDiv;
        cardDiv = document.getElementById(cardDivId);
    }
    if ( cardDiv.id == null ) {
        logger.warn(`unselectCardDiv:${cardDiv.tagName} has no id`);
        return;
    }
    if ( isCardDivLineItem(cardDiv) ) {
        logger.warn(`unselectCardDiv:${cardDiv.id} is a cardDivLineItem so not unselecting`);
        return;
    }
    if ( cardDiv.parentElement == null ) {
        logger.warn(`unselectCardDiv:${cardDiv.id} has no parent`);
        return;
    }
    const savedParent = cardDiv['saved-parent'];
    if ( savedParent == null ) {
        logger.warn(`unselectCardDiv:${cardDiv.id} has no saved parent`);
        return;
    }

    // remove cardDiv from its current parent
    cardDiv.parentElement.removeChild(cardDiv);

    const childIndex = cardDiv['saved-index'];
    if ( childIndex == null ) {
        logger.warn(`unselectCardDiv:${cardDiv.id} has no saved index so append to savedParent`);
        savedParent.appendChild(cardDiv);
    }
    else {
        const referenceNode = savedParent.children[childIndex] || null; 
        if ( referenceNode == null ) {
            savedParent.appendChild(cardDiv);
        } else {
            savedParent.insertBefore(cardDiv, referenceNode);
        }
    }

    restoreSavedStyle(cardDiv);
   
    if ( cardDiv == theSelectedCardDiv ) {
        theSelectedCardDiv = null;
    }
}

function getTheSelectedCardDivId() {
    if ( theSelectedCardDiv != null )
       return theSelectedCardDiv.id;
    return null;
}

function deselectTheSelectedCardDiv(deselectTheSelectedCardDivLineItemFlag=false) {
    // if theSelectedCardDiv is defined
    if (theSelectedCardDiv != null) {
        // utils.validateIsCardDivOrBizcardDiv(theSelectedCardDiv);
        // styles self as saved
        restoreSavedStyle(theSelectedCardDiv);

        if ( deselectTheSelectedCardDivLineItemFlag )
            deselectTheSelectedCardDivLineItem();

        // sets the theSelectedCardDiv to null
        theSelectedCardDiv = null;

    }
    // debugTheSelectedCardDivId();
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
    if ( !utils.isCardDivOrBizcardDiv(cardDiv) ) {
        cardDiv = cardDiv.closest('.card-div, .bizcard-div');
    }
    if ( cardDiv && !element.classList.contains('icon') ) {
        selectTheCardDiv(cardDiv, true);
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

        event.stopPropagation();
    })
}

// add a new card-div-line-item to right-column-content
// if one doesn't aleady exist
// returns the newly addedCardDivLineItem or null
function addCardDivLineItem(targetCardDivId) {

    if (targetCardDivId == null) {
        // logger.log(`ignoring request to add cardDivLineItem with null targetCardDivId`);
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

function positionGradients() {
    const canvasHeight = canvas.scrollHeight;
    const btmGrdHeight = canvasBtmGradient.offsetHeight;
    canvasBtmGradient.style.top = `${canvasHeight - btmGrdHeight}px`;
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
function focalPointPositionListener(position) {
    focalPointX = position.x;
    focalPointY = position.y;
    handleFocalPointMove();
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
    focalPoint.createFocalPointWithPositionListener(focalPointElement, focalPointPositionListener); // starts easing to mouse
    
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
    positionGradients();

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
    positionGradients();

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

function handleWindowResize() {
    // resize the canvas-container and the canvas since they don't do it themselves?
    var canvasContainerWidth = window.innerWidth/2;
    var canvasContainerHeight = window.innerHeight;
    logger.log("windowResize width:", canvasContainerWidth, "height:", canvasContainerHeight);
    canvasContainer.style.width = canvasContainerWidth + "px";
    canvas.style.width = canvasContainerWidth + "px";
    renderAllTranslateableDivsAtCanvasContainerCenter();
    positionGradients();
}

// Attach event listeners
window.addEventListener("load", handleWindowLoad);
window.addEventListener("resize", handleWindowResize);

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
    const selectedCardDivId = getTheSelectedCardDivId();
    if ( (selectedCardDivId != null) && isBizcardDivId(selectedCardDivId) ) {
        return selectedCardDivId;
    }
    return null;
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

    if (event.code === 'ArrowLeft') {
        selectPreviousBizcardDivId();
    } else if (event.code === 'ArrowRight') {
        selectNextBizcardDivId();
    } else if (event.code === 'ArrowUp') {
        canvasContainerScrollToTop();
    } else if (event.code === 'ArrowDown') {
        canvasContainerScrollToBottom();
    } else if (event.code === 'Space') {
        focalPoint.toggleDraggable();
    } else {
        logger.log(`handleKeyDown code: ${event.code}`);
    }
}