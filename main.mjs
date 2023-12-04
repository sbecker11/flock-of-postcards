
// @ts-nocheck
'use strict';

import * as utils from './modules/utils.mjs';
import * as timeline from './modules/timeline.mjs';
import * as focalPoint from './modules/focal_point.mjs';

// --------------------------------------
// Element reference globals

const rightContentDiv = document.getElementById("right-content-div");
const debugScrollingElement = document.getElementById("debugScrollingElement");
const debugFocalPointElement = document.getElementById("debugFocalPointElement");
const debugTheSelectedCardDivIdElement = document.getElementById("debugTheSelectedCardDivIdElement");
const canvasContainer = document.getElementById("canvas-container");
const canvas = document.getElementById("canvas");
const bottomGradient = document.getElementById("bottom-gradient");
const bullsEye = document.getElementById("bulls-eye");
const selectFirstBizcardButton = document.getElementById("select-first-bizcard");
const selectNextBizcardButton = document.getElementById("select-next-bizcard");
const selectAllBizcardsButton = document.getElementById("select-all-bizcards");
const clearAllLineItemsButton = document.getElementById("clear-all-line-items");

// --------------------------------------
// Miscellaneous globals

const BULLET_DELIMITER = "\u2022";
const BULLET_JOINER = ' ' + BULLET_DELIMITER + ' '


// --------------------------------------
// Animation globals

const NUM_ANIMATION_FRAMES = 5;
const ANIMATION_DURATION_MILLIS = 1000;

// this must be set to true before starting the animation
// and then this is set to false at animation end.
var ANIMATION_IN_PROGRESS = false;

// --------------------------------------  
// BizcardDiv globals

// width decreases as zindex increases
const BIZCARD_WIDTH = 200;
const BIZCARD_INDENT = 29;
const MIN_BIZCARD_HEIGHT = 200;

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
// Motion parallax constants

const PARALLAX_X_EXAGGERATION_FACTOR = 0.05;
const PARALLAX_Y_EXAGGERATION_FACTOR = 0.1;

// --------------------------------------
// Z globals

// ground is zindex = 0 and zindex is offset from ground,
// and z is distance to viewer, so 
// z = MAX_Z - zindex,
// conversely 
// zindex = MAX_Z - z.
const ALL_CARDS_MAX_Z = 15;

const BIZCARD_MAX_Z = 14;

const BIZCARD_MIN_Z = 12;
const CARD_MAX_Z = 8;
const CARD_MIN_Z = 1;

const ALL_CARDS_MIN_Z = 1;

// brightness decreases to MIN_BRIGHTNESS_PERCENT as z increases
const MIN_BRIGHTNESS_PERCENT = 75;

// card blur increases as z increases
const BLUR_Z_SCALE_FACTOR = 4;

//--------------------------------------
// Z functions

function get_zIndexStr_from_z(z) {
    return `${ALL_CARDS_MAX_Z - z}`;
}
function get_z_from_zIndexStr(zindex) {
    return ALL_CARDS_MAX_Z - parseInt(zindex);
}
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
    var blur = (z > 0) ? (z - CARD_MIN_Z) / BLUR_Z_SCALE_FACTOR : 0;
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
    return div != null && div.classList.contains('card-div-line-item') ? true : false;
}

// returns 99 for bizcard-div-99' or null
function getBizcardDivIndex(cardDivId) {
    console.assert(utils.isString(cardDivId));
    if (cardDivId.startsWith("bizcard-div-")) {
        var index = parseInt(cardDivId.replace("bizcard-div-", ""));
        return isNaN(index) ? null : index;
    }
    return null;
}

// returns 99 for 'card-div-99' or null
function getCardDivIndex(cardDivId) {
    console.assert(utils.isString(cardDivId));
    if (cardDivId.startsWith("card-div-")) {
        var index = parseInt(cardDivId.replace("card-div-", ""));
        return isNaN(index) ? null : index;
    }
    return null;
}

// returns true if a bizcardDiv exists for the given index, else null
function getBizcardDivIdFromIndex(index) {
    console.assert(utils.isNumber(index));
    var bizcardDivId = `bizcard-div-${index}`;
    var bizcardDiv = document.getElementById(bizcardDivId);
    return (bizcardDiv && bizcardDiv.id == bizcardDivId) ? bizcardDivId : null;
}

// .Bizcard-divs are never deleted so next id
// is just the current number of the .Bizcard-divs
function getNextBizcardDivId() {
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

    for (let i = 0; i < sortedJobs.length; i++) {

        var job = sortedJobs[ i ];
        var role = job[ "role" ];
        utils.validateString(role);
        var employer = job[ "employer" ].trim();
        utils.validateString(employer);
        var css_hex_background_color_str = job[ "css RGB" ].trim();
        utils.validateHexString(css_hex_background_color_str);
        utils.validateKey(job, "text color");
        var font_color_name = job[ "text color" ].trim();
        utils.validateString(font_color_name);

        // timeline is descending so jobEnd is always above jobStart
        var jobEnd = job[ "end" ].trim().replace("-01", "");
        utils.validateString(jobEnd);
        var endYearStr = jobEnd.split("-")[ 0 ];
        utils.validateString(endYearStr);
        var endMonthStr = jobEnd.split("-")[ 1 ];
        utils.validateString(endMonthStr);

        var endDate = new Date(`${endYearStr}-${endMonthStr}-01`);
        var endBottomPx = timeline.getTimelineYearMonthBottom(endYearStr, endMonthStr);

        var jobStart = job[ "start" ].trim().replace("-01", "");
        utils.validateString(jobStart);
        var startYearStr = jobStart.split("-")[ 0 ];
        utils.validateString(startYearStr);
        var startMonthStr = jobStart.split("-")[ 1 ];
        utils.validateString(startMonthStr);

        var startDate = new Date(`${startYearStr}-${startMonthStr}-01`);
        var startBottomPx = timeline.getTimelineYearMonthBottom(startYearStr, startMonthStr);

        var heightPx = Math.max(startBottomPx - endBottomPx, MIN_BIZCARD_HEIGHT);
        var zIndexStr = job[ "z-index" ];
        var zIndex = parseInt(zIndexStr);
        var z = get_z_from_zIndexStr(zIndexStr);
        var indent = (zIndex - 1) * BIZCARD_INDENT;

        // here we go
        var bizcardDiv = document.createElement("div");
        console.assert(bizcardDiv != null);
        var top = endBottomPx;
        console.assert(top > 0, "Q");
        var height = heightPx;
        var left = indent;
        var width = BIZCARD_WIDTH;

        bizcardDiv.id = getNextBizcardDivId();
        bizcardDiv.classList.add("bizcard-div");
        bizcardDiv.style.top = `${top}px`;
        bizcardDiv.style.height = `${height}px`;
        bizcardDiv.style.left = `${left}px`;
        bizcardDiv.style.width = `${width}px`;
        bizcardDiv.style.zIndex = zIndexStr;

        canvas.appendChild(bizcardDiv);

        bizcardDiv.setAttribute("endDate", utils.getIsoDateString(endDate));
        bizcardDiv.setAttribute("startDate", utils.getIsoDateString(endDate));

        // save the original center 
        var originalCtrX = left + width / 2;
        var originalCtrY = top + height / 2;
        var originalZ = z;
        bizcardDiv.setAttribute("originalLeft", `${bizcardDiv.offsetLeft}`);
        bizcardDiv.setAttribute("originalTop", `${bizcardDiv.offsetTop}`);
        console.assert(bizcardDiv.offsetTop > 0, 'L');
        console.assert(parseInt(bizcardDiv.getAttribute("originalTop")) > 0, 'M');
        bizcardDiv.setAttribute("originalWidth", `${bizcardDiv.offsetWidth}`);
        bizcardDiv.setAttribute("originalHeight", `${bizcardDiv.offsetHeight}`);
        bizcardDiv.setAttribute("originalCtrX", `${originalCtrX}`);
        bizcardDiv.setAttribute("originalCtrY", `${originalCtrY}`);
        bizcardDiv.setAttribute("originalZ", `${originalZ}`);

        bizcardDiv.setAttribute("saved-background-color", css_hex_background_color_str);
        bizcardDiv.setAttribute("saved-color", font_color_name);
        bizcardDiv.setAttribute("saved-selected-background-color", utils.adjustHexBrightness(css_hex_background_color_str, 1.7));
        bizcardDiv.setAttribute("saved-selected-color", font_color_name);

        var description_HTML = job[ "Description" ];
        if (description_HTML && description_HTML.length > 0) {
            utils.validateString(description_HTML);
            // description.replace("•","<br/j>*");
            description_HTML = process_bizcard_description_HTML(bizcardDiv, description_HTML);
            bizcardDiv.setAttribute("Description", description_HTML);
        }
        bizcardDiv.setAttribute("saved-zIndexStr", zIndexStr);
        bizcardDiv.setAttribute("saved-filterStr", get_filterStr_from_z(z));

        bizcardDiv.style.zIndex = bizcardDiv.getAttribute("saved-zIndexStr") || "";
        bizcardDiv.style.filter = bizcardDiv.getAttribute("saved-filterStr") || "";
        bizcardDiv.style.backgroundColor = bizcardDiv.getAttribute("saved-background-color") || "";
        bizcardDiv.style.color = bizcardDiv.getAttribute("saved-color") || "";

        var html = "";
        html += `<span class="bizcard-div-role">${role}</span><br/>`;
        html += `(${bizcardDiv.id})<br/>`;
        html += `<span class="bizcard-div-employer">${employer}</span><br/>`;
        html += `<span class="bizcard-div-dates">${jobStart} - ${jobEnd}</span><br/>`;
        bizcardDiv.innerHTML = html;

        bizcardDiv.addEventListener("mouseenter", handleCardDivMouseEnter);
        bizcardDiv.addEventListener("mouseleave", handleCardDivMouseLeave);

        addCardDivClickListener(bizcardDiv);
        // does not select self
        // does not scroll self into view

    }
}

// --------------------------------------
// TagLink globals

// the global set of tagLinks created while creating all .Bizcard-divs from
// the list of all `job` objects defined in "static_content/jobs.mjs"
var allTagLinks = [];

function initAllTagLinks() {
    allTagLinks = [];
}

// Use the BULLET_DELIMITER point character as separator to split the
// `bizcard_description` into a list of `description_items`.
//
// Parse each description_item to find the pattern `[skill_phrase](skill_img_url)`.
// Finds or creates a `card-div` for each `skill_phrase` and replaces the 
// original html with 
//    `<card-link card-div-id="id" card-img-url="url">skill</card-link>`
// The `card-img-url` is ignored if its value if "url" or blank.
//
// Uses the BULLET_DELIMITER separator to join the list of description_items 
// back into an updated HTML description so it can be used to create an ordered 
// list with list items.
//
function process_bizcard_description_HTML(bizcardDiv, description_HTML) {
    console.assert(bizcardDiv != null);
    var processed_items = [];
    var description_items = description_HTML.split();
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
            }
        }
    }
    var processed_bizcard_description_HTML = description_HTML;
    if (processed_items.length > 0)
        processed_bizcard_description_HTML = processed_items.join(BULLET_JOINER);
    return processed_bizcard_description_HTML;
}

function process_bizcard_description_item(bizcardDiv, inputString) {
    console.assert(bizcardDiv != null);
    const tagRegex = /\[(.*?)\]\((.*?)\)/g;
    const newTagLinks = [];
    const updatedString = inputString.replace(tagRegex, function (match, text, url) {
        const tagLink = { text, url };
        addCardDivId(bizcardDiv, tagLink);
        newTagLinks.push(tagLink);
        const cardDivId = tagLink[ 'cardDivId' ];
        const spanId = `tagLink-${cardDivId}`;

        const tagLinkImgUrl = url;
        const tagLinkHtml = text;
        return `<span id="${spanId}" class="tagLink" targetCardDivId="${cardDivId}">${tagLinkHtml}</span>`;
    });
    return { newTagLinks, updatedString };
}

// find or create a cardDiv and use it
// to set the tagLink's "cardDivId" property
function addCardDivId(bizcardDiv, tagLink) {
    console.assert(bizcardDiv != null && tagLink != null);
    var cardDiv = findCardDiv(tagLink);
    if (!cardDiv) {
        cardDiv = createCardDiv(bizcardDiv, tagLink);
    }
    tagLink[ 'cardDivId' ] = cardDiv.id;
}

// this is an Order(N) search that could be optimized.
function findCardDiv(tagLink) {
    var cardDivs = document.getElementsByClassName("card-div");
    for (var i = 0; i < cardDivs.length; i++) {
        var cardDiv = cardDivs[ i ];
        if (cardDivMatchesTagLink(cardDiv, tagLink))
            return cardDiv;
    }
    return null;
}

function cardDivMatchesTagLink(cardDiv, tagLink) {
    if (cardDiv.getAttribute("tagLinkText") != tagLink[ "text" ])
        return false;
    if (cardDiv.getAttribute("tagLinkUrl") != tagLink[ "url" ])
        return false;
    return true;
}

// takes the description_HTML stored as innerHTML
// of a card-div (or bizcard-div) and splits it by
// the BULLLET delimiter and returns the HTML of an 
// unordered list of description items.
function convert_description_HTML_to_line_items_HTML(description_HTML) {
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
        // console.log(`unparsed description: ${description_HTML}`);
        HTML += description_HTML;
    }
    HTML += "</p>"
    return HTML;
}

// --------------------------------------
// CardDiv functions

// card-divs are never deleted so next id
// is just the current number of the card-divs
function getNextCardDivId() {
    const cardDivs = document.getElementsByClassName("card-div");
    const nextCardDivId = `card-div-${cardDivs.length}`;
    return nextCardDivId;
}

var prev_z = null; // to track the previous z value

// adds a new cardDivs to #canvas
// default center x to zero and center y to
// id * TOP_TO_TOP.
// give each random x,y offsets and random
// z levels, and z-varied brightness and blur.
// return the newly created cardDiv that has 
// been appended to its parent canvas.
function createCardDiv(bizcardDiv, tagLink) {
    console.assert(bizcardDiv != null && tagLink != null);
    var cardDivId = getNextCardDivId();
    var cardDiv = document.createElement('div');
    cardDiv.classList.add("card-div");
    cardDiv.id = cardDivId;

    canvas.appendChild(cardDiv);

    const cardDivIndex = getCardDivIndex(cardDivId) || 0;

    const total_vt_distance = timeline.getTimelineHeight();
    const vt_top_to_top = total_vt_distance / ESTIMATED_NUMBER_CARD_DIVS;
    const vt_top = cardDivIndex * vt_top_to_top - vt_top_to_top / 2;

    // card-div tops can be UNIFORMLY REDISTRIBUTED
    // and given random offsets after all card-divs 
    // have been created

    const verticalOffset = utils.getRandomInt(-MAX_CARD_POSITION_OFFSET, MAX_CARD_POSITION_OFFSET);

    var top = vt_top + verticalOffset;
    if ( top < 200 )
        top += 200;
    cardDiv.style.top = `${top}px`;


    const horizontalOffset = utils.getRandomInt(-MAX_CARD_POSITION_OFFSET, MAX_CARD_POSITION_OFFSET);
    var left = MEAN_CARD_LEFT + horizontalOffset;
    cardDiv.style.left = `${left}px`;


    var z = utils.getRandomInt(CARD_MIN_Z, CARD_MAX_Z);
    while (z === prev_z) {
        // Generate a new z if it's the same as the previous one

        z = utils.getRandomInt(CARD_MIN_Z, CARD_MAX_Z);
    }
    prev_z = z;

    var zIndexStr = get_zIndexStr_from_z(z);

    // inherit colors of bizcardDiv
    cardDiv.setAttribute("bizcardDivId", bizcardDiv.id);
    copyAttributes(cardDiv, bizcardDiv, [
        'saved-background-color',
        'saved-color',
        'saved-selected-background-color',
        'saved-selected-color' ]);

    cardDiv.setAttribute("saved-zIndexStr", zIndexStr);
    cardDiv.setAttribute("saved-filterStr", get_filterStr_from_z(z));

    cardDiv.style.zIndex = cardDiv.getAttribute("saved-zIndexStr") || "";
    cardDiv.style.filter = cardDiv.getAttribute("saved-filterStr") || "";
    cardDiv.style.backgroundColor = cardDiv.getAttribute("saved-background-color") || "";
    cardDiv.style.color = cardDiv.getAttribute("saved-color") || "";

    // the tagLink is used to define the contents of this cardDiv
    const tagLinkImgUrl = tagLink[ 'url' ];
    const tagLinkHtml = tagLink[ 'text' ];
    const spanId = `tagLink-${cardDivId}`;
    cardDiv.innerHTML = `<span id="${spanId}" class="tagLink" targetCardDivId="${cardDivId}">${tagLinkHtml}<br/>(${cardDivId})</span>`;

    // ==================================================================
    // divCard img_src and dimensions

    var img_src = null;
    var img_width = MEAN_CARD_WIDTH;
    var img_height = MEAN_CARD_HEIGHT;

    // given a tagLinkImgUrl try to get the real img_src and dimensions of the actual image
    var result = get_real_img_src_from_img_url(tagLinkImgUrl);
    if (result) {
        const { real_img_src, real_img_width, real_img_height } = result;
        img_src = real_img_src;
        img_width = real_img_width;
        img_height = real_img_height;
    }

    // try to select a random image path
    // if ( !img_src ) {
    //   var result = select_random_img_src();
    //   if ( result ) {
    //     const { random_img_src, random_img_width, random_img_height} = result;
    //     img_src = random_img_src;
    //     img_width = random_img_width;
    //     img_height = random_img_height;
    //   }
    // }

    // just generate a random img_src using a random img_width and img_height
    // if( !img_src ) {
    //   img_width = MEAN_CARD_WIDTH + getRandomInt(-MAX_CARD_SIZE_OFFSET,MAX_CARD_SIZE_OFFSET);
    //   img_height = MEAN_CARD_HEIGHT + getRandomInt(-MAX_CARD_SIZE_OFFSET,MAX_CARD_SIZE_OFFSET);
    //   img_src = `https://picsum.photos/${img_width}/${img_height}`;
    // }

    var width = img_width + 2 * CARD_BORDER_WIDTH;
    var height = img_height + 2 * CARD_BORDER_WIDTH
    cardDiv.style.borderWidth = `${CARD_BORDER_WIDTH}px`;
    cardDiv.style.borderStyle = "solid";
    cardDiv.style.borderColor = "white";
    cardDiv.style.width = `${width}px`;
    cardDiv.style.height = `${height}px`;

    // save the original center 
    var originalCtrX = left + width / 2;
    var originalCtrY = top + height / 2;
    var originalZ = z;
    cardDiv.setAttribute("originalLeft", `${cardDiv.offsetLeft}`);
    cardDiv.setAttribute("originalTop", `${cardDiv.offsetTop}`);
    cardDiv.setAttribute("originalWidth", `${cardDiv.offsetWidth}`);
    cardDiv.setAttribute("originalHeight", `${cardDiv.offsetHeight}`);
    cardDiv.setAttribute("originalCtrX", `${originalCtrX}`);
    cardDiv.setAttribute("originalCtrY", `${originalCtrY}`);
    cardDiv.setAttribute("originalZ", `${originalZ}`);

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
    // does not select self
    // does not scroll self into view

    renderAllTranslateableDivsAtCanvasContainerCenter();

    cardDiv.setAttribute("tagLinkText", tagLink[ "text" ]);
    cardDiv.setAttribute("tagLinkUrl", tagLink[ "url" ]);
    return cardDiv;
}

function copyAttributes(dstDiv, srcDiv, attrs) {
    console.assert(dstDiv != null && srcDiv != null && attrs != null);
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[ i ];
        var srcVal = srcDiv.getAttribute(attr);
        console.assert(utils.isString(srcVal), `attr:${attr} src:${srcVal}`);
        dstDiv.setAttribute(attr, srcVal);
        var dstVal = dstDiv.getAttribute(attr);
        console.assert(dstVal == srcVal, `attr:${attr} dst:${dstVal} != src:${srcVal}`);
    }
}

// returns the number of attribute value differences 
function diffAttributes(dstDiv, srcDiv, attrs) {
    var numErrors = 0;
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[ i ];
        var dstVal = dstDiv.getAttribute(attr);
        var srcVal = srcDiv.getAttribute(attr);
        if (dstVal = srcVal) {
            // console.log(`attr:${attr} dst:${dstVal} != src:${srcVal}`);
            numErrors += 1;
        }
    }
    return numErrors;
}

// these are used by select_random_img_src
var selected_image_paths = [];
var invalid_image_paths = [];

// returns { image_src, width, height } or null
function select_random_img_src() {

    // immedately return null if image_paths are not available
    if ((typeof image_paths === 'undefined') ||

        (image_paths == null) ||

        (image_paths.length == 0)) {
        return null;
    }

    if (selected_image_paths.length + invalid_image_paths.length === image_paths.length) {
        return null; // All image paths have been selected or marked as invalid
    }
    while (true) {
        const randomIndex = Math.floor(Math.random() * image_paths.length);
        const filePath = image_paths[ randomIndex ];
        if (!selected_image_paths.includes(filePath) && !invalid_image_paths.includes(filePath)) {
            const filename = filePath.split('/').pop();
            const regex = /^(.*?)-(\d+)x(\d+)\.(\w+)$/;
            const match = filename.match(regex);
            if (!match) {
                // console.log(`Invalid filename format: ${filename}`);
                invalid_image_paths.push(filePath);
                continue;
            }
            const name = match[ 1 ];
            const random_img_width = parseInt(match[ 2 ]);
            const random_img_height = parseInt(match[ 3 ]);

            const extension = match[ 4 ];
            selected_image_paths.push(filePath);
            const random_img_src = filePath;
            return { random_img_src, random_img_width, random_img_height };
        }
    }
}

// Given an img_url returns null if its format is invalid
// of if an actual image file cannot be loaded using that url.
// Otherwise returns an object with real values
// 

function get_real_img_src_from_img_url(img_url) {
    // return { real_img_src, real_img_width, real_img_height };
    return null;
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
 * @param {number}    z            the random Z depth assigned to every cardDiv
 *                              where z ranges from 1 as max dist to viewer
 *                              to ALL_CARDS_MAX_Z being closest to viewer
 *                              with an integer value between CARD_MIN_Z and CARD_MAX_Z
 * @param {number}  canvasContainer_dx    the x value used to convert cardDiv.x to canvasContainer-relative position
 * @param {number}  canvasContainer_dy    the y value used to convert cardDiv.y to canvasContainer-relative position
 *
 * @return {string} Return a string with format "12.02px -156.79px"
 */

function getZTranslateStr(dh, dv, z, canvasContainer_dx, canvasContainer_dy) {
    // z ranges from 0 (closest) to viewer to MAX_Z furthest from viewer
    // zindex ranges MAX_Z (closest to viewer) to 1 furthest from viewer
    var zIndex = parseInt(get_zIndexStr_from_z(z));
    var zScale = (zIndex <= ALL_CARDS_MAX_Z) ? zIndex : 0.0;

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

function applyParallaxToOneCardDivStyle(cardDiv, divStyle ) {
    var { parallaxX, parallaxY } = getParallax();
    const canvasContainerX = utils.half(canvasContainer.offsetWidth);
    const canvasContainerY = utils.half(canvasContainer.offsetHeight);

    // constants for this parallax
    const dh = parallaxX * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = parallaxY * PARALLAX_Y_EXAGGERATION_FACTOR;

    // compute and apply translations to this translatableDiv
    var zIndexStr = divStyle.zIndex;

    var z = get_z_from_zIndexStr(zIndexStr);

    var cardDivX = utils.half(cardDiv.offsetWidth);
    var cardDivY = utils.half(cardDiv.offsetHeight);

    // canvasContainer-relative cardDiv center
    var canvasContainer_dx = canvasContainerX - cardDivX;
    var canvasContainer_dy = canvasContainerY - cardDivY;

    var zTranslateStr = getZTranslateStr(dh, dv, z, canvasContainer_dx, canvasContainer_dy);

    try {
        divStyle.translate = zTranslateStr;
    } catch (error) {
        console.error(`applyParallax cardDiv:${cardDiv.id}`, error);
    }
    return divStyle;
}

function applyParallaxToOneCardDiv(cardDiv) {
    applyParallaxToOneCardDivStyle(cardDiv, cardDiv.style);
}

// applies z-depth scaled parallax to all translateableDiv
function applyParallax() {
    var allDivs = getAllTranslateableCardDivs();
    for (var i = 0; i < allDivs.length; i++) {
        var cardDiv = allDivs[ i ];
        applyParallaxToOneCardDiv(cardDiv)
    }
}

let mouseX;
let mouseY;

function handleCanvasContainerMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    focalPoint.easeFocalPointTo(mouseX, mouseY);
    debugFocalPoint();
}

var autoScrollingInterval = null;
var autoScrollVelocity = 0;
var oldAutoScrollVelocity = 0;
var autoScrollEase = 0;
const AUTOSCROLL_REPEAT_MILLIS = 10;
const MAX_AUTOSCROLL_VELOCITY = 10.0;
const MIN_AUTOSCROLL_VELOCITY = 2.0;
const AUTOSCROLL_CHANGE_THRESHOLD = 2.0;

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
            }
        } else {
            // start the inteval if needed
            if (autoScrollingInterval == null) {
                autoScrollingInterval = setInterval(function () {

                    // apply the velocity
                    var currentScrollTop = canvasContainer.scrollTop;
                    var newScrollTop = currentScrollTop + autoScrollVelocity;

                    // clamp newScrollTop to the boundaries
                    var minScrollTop = 0;

                    var maxScrollTop = canvasContainer.scrollHeight - canvasContainer.clientHeight;

                    newScrollTop = utils.clamp(newScrollTop, minScrollTop, maxScrollTop);

                    // if there is room to scroll 

                    if (Math.abs(canvasContainer.scrollTop - newScrollTop) > 0) {
                        // go ahead and scroll

                        canvasContainer.scrollTop = newScrollTop;
                    } else {
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

function debugScrolling(event, scrollable, scrollVelocityType, scrollVelocity) {
    var scrollTop = scrollable.scrollTop;
    var scrollHeight = scrollable.scrollHeight;
    var windowHeight = scrollable.clientHeight;
    var scrollBottom = scrollHeight - scrollTop - windowHeight;

    var html = "";
    html += `event:${event}<br/>`;
    html += `scrollTop:${scrollTop}<br/>`;
    html += `scrollBottom:${scrollBottom}<br/>`;
    html += `autoScrollEase:${autoScrollEase}<br/>`;
    if (scrollVelocityType != null && scrollVelocity != null)
        html += `${scrollVelocityType}:${scrollVelocity}<br/>`;
    debugScrollingElement.innerHTML = html;
}

// Display mouse position and delta coordinates in the right-message-div  

var isMouseOverCanvasContainer = false;

function handleMouseEnterCanvasContainer(event) {
    isMouseOverCanvasContainer = true;
    focalPoint.easeFocalPointTo(event.clientX, event.clientY);
    debugFocalPoint();
}

function handleMouseLeaveCanvasContainer(event) {
    isMouseOverCanvasContainer = false;
    easeFocalPointToBullsEye();
    debugFocalPoint();
}

var lastScrollTop = null;
var lastScrollTime = null;

function handleCanvasContainerScroll(scrollEvent) {
    var thisTime = (new Date()).getTime();
    var thisScrollTop = canvasContainer.scrollTop;
    var deltaTime = (lastScrollTime != null) ? (thisTime - lastScrollTime) : null;
    var deltaTop = (lastScrollTop != null) ? (thisScrollTop - lastScrollTop) : null;
    var scrollVelocity = (deltaTime && deltaTop) ? (deltaTop) / (deltaTime) : "?";
    debugScrolling("scroll", canvasContainer, "scrollVelocity", `${deltaTop}/${deltaTime}`);
    lastScrollTime = thisTime;
    lastScrollTop = thisScrollTop;
}

function handleCanvasContainerWheel(wheelEvent) {
    focalPoint.easeFocalPointTo(wheelEvent.clientX, wheelEvent.clientY);
}

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
    handleFocalPointMove();
}

// handle mouse leave event for any div element with
// cardClass "card-div" or "bizcard-div"
function handleCardDivMouseLeave(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        restoreSavedStyle(targetCardDiv);
    }
}

function endAnimation(div, funcName, targetDivStyleArray) {
    // console.log(`animationend for ${funcName} ${div.id}`);
    // apply the targetStyle on animationend
    if ( targetDivStyleArray != null ) {
        applyDivStyleArray(div, targetDivStyleArray);
        // console.log(`${funcName} styling reached for ${div.id}`)
    } else {
        // console.log(`ERROR ${funcName} styling not reached for ${div.id}`);
    }
    if ( funcName == 'setSelectedStyle' )
        div.classList.add('selected');
    else
        div.classList.remove('selected');
    // console.log(`animationend for ${funcName} ${div.id}`);
    ANIMATION_IN_PROGRESS = false;
}

document.addEventListener('click', function(event) {
    if (ANIMATION_IN_PROGRESS) {
      event.preventDefault();
      event.stopPropagation();
      console.log("Click blocked, animation in progress");
    }
  }, { capture: true });


// works for card-div, bizcard-div, and card-div-line-item
// currentDivStyleArray describes current styling
// targetDivStyleArray describes target styling
function setSelectedStyle(div) {
    // console.log("setSelectedStyle() for div.id: " + div.id)
    var notLineItem = !isCardDivLineItem(div);
    // futzing required to use createDivStyleArray
    if ( notLineItem ) {
        // save these for restoreSavedStyle
        div.setAttribute("saved-left", `${div.offsetLeft}`);
        div.setAttribute("saved-top", `${div.offsetTop}`);
        div.setAttribute("saved-zIndex", div.style.zIndex);

        // set these for createDivStyleArray
        div.setAttribute("saved-selected-left", div.getAttribute("originalLeft"));
        div.setAttribute("saved-selected-top", div.getAttribute("originalTop"));
        div.setAttribute("saved-selected-zIndex", SELECTED_CARD_DIV_ZINDEX_STR);

        var top = parseInt(div.getAttribute("saved-top"))
        console.assert( top> 0, `A saved-top is ${top}`);
        top = parseInt(div.getAttribute("saved-selected-top"))
        console.assert( top > 0,`B saved-selected-top is ${top}`);
    }
    var currentDivStyleArray = createDivStyleArray(div,"saved");
    var targetDivStyleArray = createDivStyleArray(div,"saved-selected");

    if (notLineItem && currentDivStyleArray[8] < 0) {
        currentDivStyleArray[8] = parseInt(div.getAttribute('originalZ'));
        console.log("select div.id:", div.id, "currentZ should not be negative so reset to", currentDivStyleArray[8]);
    }
    if (notLineItem && targetDivStyleArray[8] > 0)
        console.log("select div.id:", div.id, "targetZ should not be positive");

    if ( notLineItem ) {
        var keyframes = [];
        for( let frame=0; frame<NUM_ANIMATION_FRAMES; frame++ ) {
            var t = frame / (NUM_ANIMATION_FRAMES-1);
            var interpDivStyleArray = utils.linearInterpArray(t, currentDivStyleArray, targetDivStyleArray);
            // if ( notLineItem ) {
            //     if ( frame == 0 )
            //         console.log('------ select div.id:', div.id, '------------------------------');
            //     console.log( 'f:', frame, 't:',t, 'x:', interpDivStyleArray[6], 'y:', interpDivStyleArray[7], 'z:', interpDivStyleArray[8]);
            // }
            keyframes.push( createKeyFrame(div, interpDivStyleArray) );
        } 

        setTimeout( function() { endAnimation(div, 'setSelectedStyle', targetDivStyleArray); }, ANIMATION_DURATION_MILLIS);
        ANIMATION_IN_PROGRESS = true;
        div.animate( keyframes, {duration:ANIMATION_DURATION_MILLIS, iterations:1} );
    } else {
        applyDivStyleArray(div, targetDivStyleArray);
    }
    div.classList.add('selected');
}



// works for card-div, bizcard-div, and card-div-line-item
// currentDivStyleArray describes current styling
// targetDivStyleArray describes target styling
function restoreSavedStyle(div) {
    // console.log("restoreSavedStyle() for div.id: " + div.id)
    var notLineItem =  !isCardDivLineItem(div);
    var currentDivStyleArray = createDivStyleArray(div, null);
    var targetDivStyleArray = createDivStyleArray(div,"saved");

    if (notLineItem && currentDivStyleArray[8] > 0) {
        currentDivStyleArray[8] = -25;
        console.log("select div.id:", div.id, "currentZ should not be positive so reset to", currentDivStyleArray[8]);
    }
    if (notLineItem && targetDivStyleArray[8] < 0) {
        console.log("div:",div);
        currentDivStyleArray[8] = parseInt(div.getAttribute('originalZ'))
        console.log("restore div.id:", div.id,"targetZ should not be negative so reset to", currentDivStyleArray[8]);
    }

    // restore the div to it's parallax affected stute
    var targetParallaxedDivStyleArray;
    if (notLineItem) {
        var targetDivStyle = getDivStyleFromDivStyleArray(div, targetDivStyleArray);
        var targetParallaxedDivStyle  = applyParallaxToOneCardDivStyle(div, targetDivStyle);
        targetParallaxedDivStyleArray = getDivStyleArrayFromDivStyle(div,targetParallaxedDivStyle);
    } else {
        targetParallaxedDivStyleArray = targetDivStyleArray;
    }

    if( notLineItem ) {
        var keyframes = [];
        for( let frame=0; frame<NUM_ANIMATION_FRAMES; frame++ ) {
            var t = frame / (NUM_ANIMATION_FRAMES-1);
            var interpDivStyleArray = utils.linearInterpArray(t, currentDivStyleArray, targetParallaxedDivStyleArray);
            // if ( notLineItem ) {
            //     if ( frame == 0 )
            //         console.log('------------------------ restore div.id:', div.id, '------------');
            //     console.log('f:', frame, 't:',t, 'x:', interpDivStyleArray[6], 'y:', interpDivStyleArray[7], 'z:', interpDivStyleArray[8])
            // }
            keyframes.push( createKeyFrame(div, interpDivStyleArray) );
        }
        setTimeout( function() { endAnimation(div, 'restoreSavedStyle', targetParallaxedDivStyleArray); }, ANIMATION_DURATION_MILLIS);
        ANIMATION_IN_PROGRESS = true;
        div.animate( keyframes, {duration:ANIMATION_DURATION_MILLIS, iterations:1} );
    } else {
        applyDivStyleArray(div, targetDivStyleArray);
    }
    div.classList.remove('selected');
}


// prefix can be "saved" or "saved-selected"
function createDivStyleArray(div, prefix) {
    let array = [];
    var RGB;
    if (prefix) { // use div.getAttribute
        array = array.concat(utils.get_RGB_from_ColorStr(div.getAttribute(`${prefix}-color`)));
        array = array.concat(utils.get_RGB_from_ColorStr(div.getAttribute(`${prefix}-background-color`)));
        if ( !isCardDivLineItem(div) ) { // positionals
            var left = parseInt(div.getAttribute(`${prefix}-left`));
            array.push(left);
            var top = parseInt(div.getAttribute(`${prefix}-top`));
            array.push(top);
            array.push(get_z_from_zIndexStr(div.getAttribute(`${prefix}-zIndex`)))
        } else {
            array = array.concat([0,0,0]);
        }
    } else { // use div or div.style
        array = array.concat(utils.get_RGB_from_ColorStr(div.style.color));
        array = array.concat(utils.get_RGB_from_ColorStr(div.style.backgroundColor));
        if ( !isCardDivLineItem(div) ) { // positionals
            var left = div.offsetLeft;
            array.push(left);
            var top = div.offsetTop;
            array.push(top);
            array.push(get_z_from_zIndexStr(div.style.zIndex));
        } else {
            array = array.concat([0,0,0]);
        }
    }
    if ( utils.array_has_NaNs(array))
        throw new Error("createDivStyleArray has NaNs");
    return array;
}

// return a keyFrame dict
function createKeyFrame(div, divStyleArray) {
    var keyFrame = {};
    keyFrame['color'] = utils.get_Hex_from_RGB(divStyleArray.slice(0,3));
    keyFrame['background-color'] = utils.get_Hex_from_RGB(divStyleArray.slice(3,6));
    if ( !isCardDivLineItem(div) ) { // positionals
        keyFrame['left'] = `${divStyleArray[6]}px`;
        keyFrame['top'] = `${divStyleArray[7]}px`;
        var z = divStyleArray[8];
        keyFrame['zIndex'] = get_zIndexStr_from_z(z);
        keyFrame['filter'] = get_filterStr_from_z(z);
    } 
    //keyFrame['offset'] = `${offset}`;
    return keyFrame;
}

function applyDivStyleArray(div, array) {
    div.style.color = utils.get_Hex_from_RGB(array.slice(0,3));
    div.style.backgroundColor = utils.get_Hex_from_RGB(array.slice(3,6));
    if ( !isCardDivLineItem(div) ) { // positionals
        div.style.left = array[6] + 'px';
        div.style.top = array[7] + 'px';
        var z = array[8];
        div.style.zIndex = get_zIndexStr_from_z(z);
        div.style.filter = get_filterStr_from_z(z);
    }
}

function getDivStyleArrayFromDivStyle(div, divStyle) {
    var array = [];
    var RGB = utils.get_RGB_from_Hex(divStyle.color);
    array.push(...RGB);
    var RGB = utils.get_RGB_from_Hex(divStyle.backgroundColor);
    array.push(...RGB);
    if ( !isCardDivLineItem(div) ) { // positionals
        array.push(div.offsetLeft)
        array.push(div.offsetTop)
        var z = get_z_from_zIndexStr(divStyle.zIndex);
        array.push(z);
    } else {
        array = array.concat([0,0,0]);
    }
    if ( utils.array_has_NaNs(array))
        throw new Error("getDivStyleArrayFromDivStyle has NaNs");
    return array;
}

function getDivStyleFromDivStyleArray(div, array) {
    var divStyle = document.createElement('style');
    divStyle.color = utils.get_Hex_from_RGB(array.slice(0,3));
    divStyle.backgroundColor = utils.get_Hex_from_RGB(array.slice(3,6));
    if ( !isCardDivLineItem(div) ) { // positionals
        divStyle.left = array[6] + 'px';
        divStyle.top = array[7] + 'px';
        var z = array[8];
        divStyle.zIndex = get_zIndexStr_from_z(z);
        divStyle.filter = get_filterStr_from_z(z);
    }
    return divStyle;
}


// ------------------------------------------------------------
// theSelectedCardDiv vars, constants and functions

var theSelectedCardDiv = null;
var theSelectedCardDivLineItem = null;

const SELECTED_CARD_DIV_Z = -10;
const SELECTED_CARD_DIV_ZINDEX_STR = get_zIndexStr_from_z(SELECTED_CARD_DIV_Z);
const SELECTED_CARD_DIV_FILTER_STR = get_filterStr_from_z(SELECTED_CARD_DIV_Z);

function getScrollIntoViewOptions(element) {
    return { behavior: 'smooth', block: getScrollIntoViewBlockOption(element) };
}

function getScrollIntoViewBlockOption(element) {
    if ( element == null )
        throw new Error("null element");
    else if ( element.id == null )
        throw new Error("null element.id");
    else if (isBizcardDiv(element))
        return 'start';
    else if (isCardDiv(element) )
        return 'center';
    else if (isCardDivLineItem(element) )
        return 'start';
    else
        throw new Error("unhandled element with id:" + element.id)
}
// returns the nearest ancestor with className or null
function findNearestAncestorWithClassName(element, className) {
    while ((element = element.parentElement) && !element.classList.contains(className));
    return element;
}

function scrollElementIntoView(element) {
    easeFocalPointToBullsEye();
    var scrollIntoViewOptions = getScrollIntoViewOptions(element);

    // if ( scrollIntoViewOptions.block == 'start' ) {
    //     var container = utils.findScrollableAncestor(element);
    //     const elementTop = element.offsetTop;
    //     container.scrollTo({ top: elementTop, behavior: 'smooth' });
    // } else {
    //     element.scrollIntoView( scrollIntoViewOptions );
    // }

    var scrollingContainer = findNearestAncestorWithClassName(element, "scrollable-container");
    if (!scrollingContainer) {
        element.scrollIntoView( scrollIntoViewOptions );
    } else {
        var topOffset = 0;
        if ( isCardDivLineItem(element) ) {
            var topOffset = rightContentDiv.getBoundingClientRect().top;
        }
        // console.log('topOffset: ' + topOffset);
        let  top = element.offsetTop - scrollingContainer.scrollTop - topOffset;
        scrollingContainer.scrollBy(Object.assign({}, { top: top, left: 0 }, scrollIntoViewOptions));
    }
};

// select the given cardDiv
function selectTheCardDiv(cardDiv, selectTheCardDivLineItemFlag=false) {
    if ( cardDiv == null )
        return;

    // if the top of the selected cardDiv is not
    // already visible then scroll it into view
    scrollElementIntoView(cardDiv);

    // click on selected to deselect
    if (theSelectedCardDiv != null && cardDiv.id == theSelectedCardDiv.id ) {
        // change the style of the selectedCardDiv if defined
        deselectTheSelectedCardDiv(selectTheCardDivLineItemFlag);
        return;
    }
    // change the style of the selectedCardDiv if defined
    deselectTheSelectedCardDiv(selectTheCardDivLineItemFlag);

    // saves self as theSelected
    theSelectedCardDiv = cardDiv;
    // style self as selected
    setSelectedStyle(theSelectedCardDiv);

    if ( selectTheCardDivLineItemFlag ) {
        // calls addCardDivLineItem()
        var cardDivLineItem = addCardDivLineItem(cardDiv.id);
        console.assert( cardDivLineItem != null );
        // calls selectCardDivLineItem - does scroll self into view
        selectTheCardDivLineItem(cardDivLineItem); 
    }

    debugTheSelectedCardDivId();
}

function getTheSelectedCardDivId() {
    if ( theSelectedCardDiv != null )
       return theSelectedCardDiv.id;
    return null;
}

function deselectTheSelectedCardDiv(deselectTheSelectedCardDivLineItemFlag=false) {
    // if theSelectedCardDiv is defined
    if (theSelectedCardDiv != null) {
        // styles self as saved
        restoreSavedStyle(theSelectedCardDiv);

        if ( deselectTheSelectedCardDivLineItemFlag )
            deselectTheSelectedCardDivLineItem();

        // sets the theSelectedCardDiv to null
        theSelectedCardDiv = null;

    }
    debugTheSelectedCardDivId();
}

// handle mouse click event for any div element with
// cardClass "card-div" or "bizcard-div".
function addCardDivClickListener(cardDiv) {
    cardDiv.addEventListener("click", function (event) {

        // select the cardDiv and its cardDivLineItem
        selectTheCardDiv(cardDiv, true);

        event.stopPropagation();
    })
}

// ----------------------------------------------
// cardDiv and cardDivLineItems state transitions
//
// cardDiv created
// see createBizcardDivs
// see createCardDiv
//    adds self to document
//    calls addCardDivClickListener
//    does not select self
//    does not scroll self into view

// selectTheCardDiv(cardDiv)
//    calls deselectTheSelectedCardDiv()
//    saves self as theSelected
//    styles self as selected
//    does not scroll itself into view

// deselectTheSelectedCardDiv()
//    if theSelectedCardDiv is defined
//      styles self as saved
//      sets the theSelectedCardDiv to null

// addCardDivClickListener(cardDiv)
//    calls selectTheCardDiv(cardDiv)
//    calls addCardDivLineItem()
//    calls selectCardDivLineItem
//    does not scroll self into view

// addCardDivLineItem(cardDiv)
//    adds self to document if needed
//      adds click listener
//    does not select self
//    does scroll self into view

// addTagLinkClickListener(cardDiv)
//    calls selectTheCardDiv
//    does scroll cardDiv into view

// selectTheCardDivLineItem(cardDivLineItem)
//    calls  deselectTheSelectedCardDivLineItem
//    saves self as theSelected
//    styles self as selected
//    does scroll self into view

// deselectTheSelectedCardDivLineItem()
//    if theSelectedCardDivLineItem is defined
//      styles self as saved
//      sets the theSelectedCardDivLineItem to null

// addCardDivLineItemClickListener(cardDivLineItem, cardDiv)
//    cardDivLineItem selected not clicked
//    selectTheCardDiv not clicked
//    does scroll theSelectedCardDiv into view
// ----------------------------------------------


function selectTheCardDivLineItem(cardDivLineItem, selectTheCardDivFlag=false) {
    if ( cardDivLineItem == null )
        return;

    // does scroll self into view
    scrollElementIntoView(cardDivLineItem);

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
        console.assert(cardDiv != null);
        selectTheCardDiv(cardDiv);
    }
    
    debugTheSelectedCardDivId();
}

function deselectTheSelectedCardDivLineItem(deselectTheSelectedCardDivFlag=false) {
    // if theSelectedCardDivLineItem is defined
    if (theSelectedCardDivLineItem != null) {
        // styles self as saved
        restoreSavedStyle(theSelectedCardDivLineItem);

        if (deselectTheSelectedCardDivFlag) {
            deselectTheSelectedCardDiv();
        }
        // sets the theSelectedCardDivLineItem to null
        theSelectedCardDivLineItem = null;
    }
    debugTheSelectedCardDivId();
}

function addCardDivLineItemClickListener(cardDivLineItem, cardDiv) {

    cardDivLineItem.addEventListener("click", function (event) {

        // cardDivLineItem selected not clicked
        // scrolls self into view
        // then select its cardDiv
        selectTheCardDivLineItem(cardDivLineItem, true);

        event.stopPropagation();
    })
}

// add a new card-div-line-item to right-column-content
// if one doesn't aleady exist
// returns the newly addedCardDivLineItem or null
function addCardDivLineItem(targetCardDivId) {

    if (targetCardDivId == null) {
        // console.log(`ignoring request to add cardDivLineItem with null targetCardDivId`);
        return;
    }

    // check to see if the cardDiv exists
    var targetCardDiv = document.getElementById(targetCardDivId);
    if (targetCardDiv == null) {
        // console.log(`no cardDiv found for targetCardDivId:${targetCardDivId}`);
        return;
    }

    // only add a card-div-line-item for this targetCardDivId if
    // it hasn't already been added
    var existingCardDivLineItem = getCardDivLineItem(targetCardDivId);
    if (existingCardDivLineItem == null) {

        var cardDivLineItem = document.createElement("li");
        cardDivLineItem.classList.add("card-div-line-item");
        cardDivLineItem.id = "card-div-line-item-" + targetCardDivId;
        cardDivLineItem.setAttribute("targetCardDivId", targetCardDivId);

        // add click listener
        addCardDivLineItemClickListener(cardDivLineItem, targetCardDiv);

        // inherit colors of targetCardDiv
        copyAttributes(cardDivLineItem, targetCardDiv, [
            "saved-background-color",
            "saved-color",
            "saved-selected-background-color",
            "saved-selected-color"
        ])

        cardDivLineItem.style.backgroundColor = cardDivLineItem.getAttribute("saved-background-color") || "";
        cardDivLineItem.style.color = cardDivLineItem.getAttribute("saved-color") || "";

        // set content
        var cardDivLineItemContent = document.createElement("div");
        cardDivLineItemContent.classList.add("card-div-line-item-content");
        cardDivLineItemContent.style.backgroundColor = targetCardDiv.getAttribute("saved-background-color") || "";
        cardDivLineItemContent.style.color = targetCardDiv.getAttribute("saved-color") || "";

        // set right column
        var cardDivLineItemRightColumn = document.createElement('div')
        cardDivLineItemRightColumn.classList.add("card-div-line-item-right-column");
        cardDivLineItemRightColumn.style.backgroundColor = targetCardDiv.getAttribute("saved-background-color") || "";
        cardDivLineItemRightColumn.style.color = targetCardDiv.getAttribute("saved-color") || "";

        // start with the innerHTML of the targetCardDiv
        var targetInnerHTML = targetCardDiv.innerHTML;
        if (targetInnerHTML && targetInnerHTML.length > 0) {

            // ensure targetInnerHTML includes no img tag markup
            if (targetInnerHTML.includes("<img"))
                targetInnerHTML = removeImgTagsFromHtml(targetInnerHTML);

            cardDivLineItemContent.innerHTML = targetInnerHTML;
        }

        // if targetCardDiv has a "Description" attribute
        var description = targetCardDiv.getAttribute("Description");
        if (description && description.length > 0) {
            // split the description by BULLET_SEPARATORS and return html 
            // of the styled form <p><ul>(<li>text</li>)+</ul></p>
            // where text contains spans that have targetCardDivIds
            var line_items_HTML = convert_description_HTML_to_line_items_HTML(description);
            if (line_items_HTML && line_items_HTML.length > 0) {

                // ensure line_items_HTML includes no img tag markup
                if (line_items_HTML.includes("<img"))
                    line_items_HTML = removeImgTagsFromHtml(line_items_HTML);

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

        cardDivLineItem.appendChild(cardDivLineItemContent);
        cardDivLineItem.appendChild(cardDivLineItemRightColumn);
        rightContentDiv.appendChild(cardDivLineItem);

        // find all .tagLinks of this cardDivLineItem
        // and give them onclick listeners
        var tagLinks = cardDivLineItem.querySelectorAll('.tagLink');
        for (let i = 0; i < tagLinks.length; i++) {
            addTagLinkClickListener(tagLinks[ i ]);
        }
    } else {
        //// console.log(`returning preexisting cardDivLineItem for targetCardDivId:${targetCardDivId}`);
        cardDivLineItem = existingCardDivLineItem
    }
    // does not select self
    // does scroll self into view
    scrollElementIntoView(cardDivLineItem);
    return cardDivLineItem;
}

// --------------------------------------------------------------

// return the cardDivLineItem in rightCOntentDiv for cardDivId or null if not found
function getCardDivLineItem(cardDivId) {
    if (!utils.isString(cardDivId))
        return null;
    var cardDivLineItems = document.getElementsByClassName("card-div-line-item");
    for (var i = 0; i < cardDivLineItems.length; i++) {
        var cardDivLineItem = cardDivLineItems[ i ];
        if( String(cardDivLineItem.id).includes(cardDivId) )
            return cardDivLineItem;
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
        console.assert(cardDivLineItem != null && cardDivLineItem.classList.contains("card-div-line-item"));

        // only bizcardDivs have this cardDivLineItemFollowingButton
        var cardDiv = getCardDivOfCardDivLineItem(cardDivLineItem);
        console.assert(isBizcardDivId(cardDiv));

        var followingBizcardDivId = getFollowingBizcardDivId(cardDiv.id);
        console.assert(isBizcardDivId(followingBizcardDivId));

        var followingBizcardDiv = document.getElementById(followingBizcardDivId);
        console.assert(isBizcardDiv(followingBizcardDiv));

        // select the followingBizcardDiv and its cardDivLineItem
        selectTheCardDiv(followingBizcardDiv, true);

        event.stopPropagation();
    });
}

function getLatestBizcardDivId() {
    var dateSortedIds = getdateSortedBizcardIds();
    if (dateSortedIds != null) {
        return dateSortedIds[ 0 ].id;
    }
    // there are zero bizcardDivsId
    return null;
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
            console.assert(allBizcardDivs != null && allBizcardDivs.length > 0);
            bizcardDiv = allBizcardDivs[ 0 ];
            return bizcardDiv.id;
        } else {
            // otherwise we continue with the latest
            bizcardDivId = bizcardDiv.id;
        }
    }

    console.assert(utils.isString(bizcardDivId));
    var index = getBizcardDivIndex(bizcardDivId);
    console.assert(index != null);

    var followingBizcardDivId = getBizcardDivIdFromIndex(index + 1);
    // if we've reached the end of all bizcardDivs
    // then start over at index 0
    if (followingBizcardDivId == null)
        followingBizcardDivId = getBizcardDivIdFromIndex(0);

    console.assert(isBizcardDivId(followingBizcardDivId));
    return followingBizcardDivId;
}

// remove multiple img tags from the given html string
function removeImgTagsFromHtml(html) {
    var filtered = html.replace(/<img[^>"']*((("[^"]*")|('[^']*'))[^"'>]*)*>/g, "");
    console.assert(!filtered.includes("<img"));
    return filtered;
}

function addTagLinkClickListener(tagLink) {
    console.assert(tagLink != null);
    tagLink.addEventListener("click", function (event) {
        var tagLinkId = event.target.id;
        // get the cardDivId from the tagLinkId
        var cardDivId = tagLinkId.replace("tagLink-", "");
        // find the cardDivId is of the form "card-div-<int>""
        var cardDiv = document.getElementById(cardDivId);
        if (cardDiv) {
            var tagLinkText = cardDiv.getAttribute("tagLinkText");
            var tagLinkUrl = cardDiv.getAttribute("tagLinkUrl");
            console.assert(tagLinkText != null && tagLinkUrl != null);

            // selectTheCardDiv and its cardDivLineItem
            selectTheCardDiv(cardDiv, true);

            // need to scroll cardDiv into view
            scrollElementIntoView(cardDiv);
        } else {
            // console.log(`no cardDiv with tagLink found for cardDivId:${cardDivId}`);
        }
        event.stopPropagation();
    });
}

function renderAllTranslateableDivsAtCanvasContainerCenter() {

    const canvasContainerX = utils.half(canvasContainer.offsetWidth);
    const canvasContainerY = utils.half(canvasContainer.offsetHeight);
    const translateableDivs = getAllTranslateableCardDivs();
    for (const div of translateableDivs) {
        const divWidth = div.offsetWidth;
        const trans_dx = canvasContainerX - utils.half(divWidth);
        const trans_dy = 0;
        const translateStr = `${trans_dx}px ${trans_dy}px`;
        try {
            div.style.translate = translateStr;
        } catch (error) {
            // console.log(`leftCenter div:${div.id}`, error);
            console.error(`leftCenter div:${div.id}`, error);
        }
    }
}

function positionGradients() {
    const canvasHeight = canvas.scrollHeight;
    const bottomGradientHeight = bottomGradient.offsetHeight;
    bottomGradient.style.top = `${canvasHeight - bottomGradientHeight}px`;
}


function rightContentScrollToBottom() {
    rightContentDiv.scrollTop = rightContentDiv.scrollHeight;
}


function canvasContainerScrollToTop() {
    canvasContainer.scrollTo({ top: 0, behavior: 'smooth' });
}

function canvasContainerScrollToBottom() {
    canvasContainer.scrollTo({ top: canvasContainer.scrollHeight, behavior: 'smooth' });
}

var bullsEyeX;
var bullsEyeY;

// center bullsEye at canvasContainerCenter
function centerBullsEye() {
    bullsEyeX = utils.half(canvasContainer.offsetWidth);
    bullsEyeY = utils.half(canvasContainer.offsetHeight);
    var newLeft = bullsEyeX - utils.half(bullsEye.offsetWidth);
    var newTop = bullsEyeY - utils.half(bullsEye.offsetHeight);
    bullsEye.style.left = `${newLeft}px`;
    bullsEye.style.top = `${newTop}px`;
}

var focalPointX;
var focalPointY;

function focalPointListener(x, y) {
    focalPointX = x;
    focalPointY = y;
    handleFocalPointMove();
    debugFocalPoint();
}

var parallaxX;
var parallaxY;

function getParallax() {
    parallaxX = bullsEyeX - focalPointX;
    parallaxY = bullsEyeY - focalPointY;
    return { parallaxX, parallaxY };
}

// smoothly move the focalPoint to the bullsEye
function easeFocalPointToBullsEye() {
    focalPoint.easeFocalPointTo(bullsEyeX, bullsEyeY);
}

function debugFocalPoint() {
    var html = "";
    if (isMouseOverCanvasContainer && mouseX && mouseY)
        html += `mouse in canvas [${mouseX},${mouseY}]<br/>`;
    else
        html += "mouse not in canvas<br/>";

    html += `bullsEye:[${bullsEyeX},${bullsEyeY}]<br/>`;
    html += `focalPoint:[${focalPointX},${focalPointY}]<br/>`;
    const { parallaxX, parallaxY } = getParallax();
    html += `parallax:[${parallaxX},${parallaxY}]<br/>`;

    var time = (new Date()).getTime();
    html += `time:${time}<br/>`;
    
    debugFocalPointElement.innerHTML = html;
}

function debugTheSelectedCardDivId() {
    var html = "";
    var theSelectedCardDivIdStr = theSelectedCardDiv == null ? 'null' : `${theSelectedCardDiv.id}`;
    var theSelectedCardDivLineItemIdStr = theSelectedCardDivLineItem == null ? 'null' : `${theSelectedCardDivLineItem.id}`;
    html += `theSelectedCardDivIdStr:${theSelectedCardDivIdStr}<br/>`;
    html += `theSelectedCardDivLineItemIdStr:${theSelectedCardDivLineItemIdStr}<br/>`;
    debugTheSelectedCardDivIdElement.innerHTML = html;
}

// return the min and max years over the list of jobs
function getMinMaxTimelineYears(jobs) {
    var minYear = 10000;
    var maxYear = -10000;
    for (let i = 0; i < jobs.length; i++) {
        var job = jobs[ i ];
        var jobEnd = job[ "end" ].trim().replace("-01", "");
        utils.validateString(jobEnd);
        var endYearStr = jobEnd.split("-")[ 0 ];
        var endYear = parseInt(endYearStr);
        if ( endYear > maxYear )
            maxYear = endYear;

        var jobStart = job[ "start" ].trim().replace("-01", "");
        utils.validateString(jobStart);
        var startYearStr = jobStart.split("-")[ 0 ];
        var startYear = parseInt(startYearStr);
        if ( startYear < minYear )
            minYear = startYear;
    }
    minYear -= 1;
    maxYear += 1;
    return [minYear, maxYear];
}

function handleWindowLoad() {
    const focal_point = document.getElementById("focal-point");
    focalPoint.createFocalPoint(focal_point, focalPointListener);

    const timelineContainer = document.getElementById("timeline-container");

    const [MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR] = getMinMaxTimelineYears(jobs);
    const DEFAULT_TIMELINE_YEAR = MAX_TIMELINE_YEAR;

    timeline.createTimeline(timelineContainer, canvasContainer, MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR, DEFAULT_TIMELINE_YEAR);

    createBizcardDivs();
    renderAllTranslateableDivsAtCanvasContainerCenter();
    positionGradients();
    centerBullsEye();
    easeFocalPointToBullsEye();

    // set up animation loop
    (function drawFrame() {
        window.requestAnimationFrame(drawFrame);
        focalPoint.drawFocalPointAnimationFrame();
    })();
}

function handleWindowResize() {
    // resize the canvas-container and the canvas since they don't do it themselves?
    var windowWidth = window.innerWidth;
    var canvasContainerWidth = windowWidth / 2;
    canvasContainer.style.width = canvasContainerWidth + "px";
    canvas.style.width = canvasContainerWidth + "px";
    renderAllTranslateableDivsAtCanvasContainerCenter();
    positionGradients();
    centerBullsEye();
    easeFocalPointToBullsEye();
}

// Attach event listeners
window.addEventListener("load", handleWindowLoad);
window.addEventListener("resize", handleWindowResize);

var canvasContainerEventListeners = [];

function addCanvasContainerEventListener(eventType, listener, options) {
    canvasContainerEventListeners.push({ eventType, listener, options });
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
function selectAllBizCards() {
    // delete all cardDivLineItems in reverse order
    clearAllDivCardLineItems();

    var allBizcardDivs = document.getElementsByClassName("bizcard-div");
    for (let i = 0; i < allBizcardDivs.length; i++) {
        var bizcardDiv = allBizcardDivs[ i ];

        // select the bizcardDiv and its cardDivLineItem
        selectTheCardDiv(bizcardDiv, true);

        // select the bizcardDiv and scroll it into view
        // selectTheCardDiv(bizcardDiv)
        // scrollElementIntoView(bizcardDiv);

        // add == find or create a cardDivLineItem
        // var bizcardDivLineItem = addCardDivLineItem(bizcardDiv.id);
        // select brings the cardDivLineItem into viw
        // selectTheCardDivLineItem(bizcardDivLineItem);
    }

    // select and scroll to the first bizcardDiv and its line item
    selectAndScrollToCardDiv(allBizcardDivs[0]);
}

selectAllBizcardsButton.addEventListener("click", selectAllBizCards);

// delete all cardDivLineItems in reverse order
function clearAllDivCardLineItems() {
    var allCardDivLineItems = document.getElementsByClassName("card-div-line-item");
    for (let i=allCardDivLineItems.length-1; i >= 0 ; i--) {
        allCardDivLineItems[i].remove();
    }
}

// select the given cardDiv and its line item 
// and scroll each into view
function selectAndScrollToCardDiv(cardDiv) {
    var cardDivLineItem = getCardDivLineItem(cardDiv.id)

    // avoid in case another select would ignore the select
    //deselectTheSelectedCardDivLineItem();
    //selectTheCardDivLineItem(cardDivLineItem);

    // extra umph
    // cardDivLineItem.scrollIntoView({behavior: 'instant', block: 'start'});

    // avoid in case another select would ignore the select
    //deselectTheSelectedCardDiv();
    selectTheCardDiv(cardDiv, true);
    // and bring it into view
    //scrollElementIntoView(cardDiv);

    // extra umph
    // cardDiv.scrollIntoView({behavior: 'instant', block: 'start'});
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

function getdateSortedBizcardIds() {
    if (dateSortedBizcardIds == null) {
        dateSortedBizcardIds = [];
        let bizcardDivs = document.getElementsByClassName("bizcard-div");
        let sortedBizcardDivDatedIds = [];
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

function getFirstBizcardDivId() {
    var sorted = getdateSortedBizcardIds();
    if ( sorted )
        return sorted[0].id;
    return null;
}

function getBizcardDivEndDate(bizcardDiv) {
    var endDateStr = bizcardDiv.getAttribute("endDate");
    var endDate = new Date(endDateStr);
    return endDate;
}

// find bizcardDivId of the last bizcardDivLineItem and
// get the next bizcardDivId that should be selected
// if no bizcardDivLineItems exist then use the 
// newest bizcardDivId that should be selected.
//
// This assumes that when a bizcardDiv is selected
// The existing line item is created if needed and then
// selected and the container slides it into view. 
// 
// Related note, the "selectNextButton" must always be 
// moved to be after the last lineItem.
//
function selectNextBizcard() {
    var nextBizcardDivId = null;
    var theSelectedBizcardDivId = getTheSelectedCardDivId();
    if ( theSelectedBizcardDivId == null )
        nextBizcardDivId = getFirstBizcardDivId();
    else
        nextBizcardDivId = getFollowingBizcardDivId(theSelectedBizcardDivId);
    console.assert(nextBizcardDivId !== null);
    var nextBizcardDiv = document.getElementById(nextBizcardDivId);
    console.assert(nextBizcardDiv !== null);

    // select the nextBizcardDiv and its cardDivItem
    selectTheCardDiv(nextBizcardDiv, true);

    // var bizcardDivLineItem = null;
    // if (nextBizcardDivId != null) {
        
    //     // look for this bizcard's line item
    //     var bizcardDivLineItemId = `${nextBizcardDivId}-line-item`;
    //     bizcardDivLineItem = document.getElementById(bizcardDivLineItemId);
    //     // create the line item for this bizcard
    //     if (bizcardDivLineItem == null)
    //         bizcardDivLineItem = addCardDivLineItem(nextBizcardDivId);
    // }
    // // select the new or existing bizcardDivLineItem which
    // // scroll it into view
    // console.assert(bizcardDivLineItem != null);
    // selectTheCardDivLineItem(bizcardDivLineItem);

    // // select the nextBizcardDiv and scroll it into view
    // var nextBizCardDiv = document.getElementById(nextBizcardDivId);
    // selectTheCardDiv(nextBizCardDiv);
    // // scrollElementIntoView(nextBizCardDiv);
}

function selectFirstBizcard() {
    var firstDivId = getFirstBizcardDivId();
    var firstDiv = document.getElementById(firstDivId);

    console.assert(firstDiv != null);

    // select the cardDiv and its cardDivLineItem
    selectTheCardDiv(firstDiv, true);
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
        console.assert(isBizcardDivId(lastBizcardDivId));
        var lastBizcardDiv = document.getElementById(lastBizcardDivId);
        return lastBizcardDiv;
    }
    return null;
}

selectNextBizcardButton.addEventListener("click", function (event) {
    selectNextBizcard();
});
selectFirstBizcardButton.addEventListener("click", function (event) {
    selectFirstBizcard();
});

//---------------------------------------
// canvas container event listeners

addCanvasContainerEventListener("mousemove", handleCanvasContainerMouseMove);

addCanvasContainerEventListener("wheel", handleCanvasContainerWheel, { passive: true });

addCanvasContainerEventListener('mouseenter', handleMouseEnterCanvasContainer);

addCanvasContainerEventListener('mouseleave', handleMouseLeaveCanvasContainer);

addCanvasContainerEventListener('scroll', handleCanvasContainerScroll);

addCanvasContainerEventListener('click', handleCanvasContainerMouseClick);

