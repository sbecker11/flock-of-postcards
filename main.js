
// @ts-check
'use strict';

import * as utils from './modules/utils.js';
import * as timeline from './modules/timeline.js';
import * as mouseCapture from './modules/mouse_capture.js';


// --------------------------------------
// Element reference globals

const timelineContainer = document.getElementById("timeline-containr");
const rightContentDiv = document.getElementById("right-content-div");
const debugElement = document.getElementById("debugElement");
const debugFocalPointElement = document.getElementById("debugFocalPointElement");
const leftColumn = document.getElementById("left-column");
const canvas = document.getElementById("canvas");
const bottomGradient = document.getElementById("bottom-gradient");
const bullsEye = document.getElementById("bulls-eye");
const focalPoint = document.getElementById("focal-point");

// --------------------------------------
// Miscellaneous globals

const BULLET_DELIMITER = "\u2022";
const BULLET_JOINER = ' ' + BULLET_DELIMITER + ' '

// --------------------------------------
// BizcardDiv globals

// width decreases as zindex increases
const BIZCARD_WIDTH = 200;
const BIZCARD_INDENT = 29;

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
const CARD_BORDER_WIDTH = 5;

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

function isBizcardDiv(cardDiv) {
    return cardDiv != null && cardDiv.classList.contains('bizcard-div') ? true : false;
}

function isCardDiv(cardDiv) {
    return cardDiv != null && cardDiv.classList.contains('card-div') ? true : false;
}
function isBizcardDivId(cardDivId) {
    return utils.isString(cardDivId) && getBizcardDivIndex(cardDivId) == null ? false : true;
}

function isCardDivId(cardDivId) {
    return utils.isString(cardDivId) && getCardDivIndex(cardDivId) == null ? false : true;
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
    var num_valid_rows = 0;
    
    for (let i = 0; i < jobs.length; i++) {
        
        var job = jobs[i];
        var role = job["role"];
        utils.validateString(role);
        var employer = job["employer"].trim();
        utils.validateString(employer);
        var css_hex_background_color_str = job["css RGB"].trim();
        utils.validateHexString(css_hex_background_color_str);
        utils.validateKey(job, "text color");
        var font_color_name = job["text color"].trim();
        utils.validateString(font_color_name);

        // timeline is descending so jobEnd is always above jobStart
        var jobEnd = job["end"].trim().replace("-01", "");
        utils.validateString(jobEnd);
        var endYearStr = jobEnd.split("-")[0];
        utils.validateString(endYearStr);
        var endMonthStr = jobEnd.split("-")[1];
        utils.validateString(endMonthStr);
        
        var endBottomPx =timeline.getTimelineYearMonthBottom(endYearStr, endMonthStr);

        var jobStart = job["start"].trim().replace("-01", "");
        utils.validateString(jobStart);
        var startYearStr = jobStart.split("-")[0];
        utils.validateString(startYearStr);
        var startMonthStr = jobStart.split("-")[1];
        utils.validateString(startMonthStr);
        
        var startBottomPx = timeline.getTimelineYearMonthBottom(startYearStr, startMonthStr);

        var heightPx = startBottomPx - endBottomPx;
        var zIndexStr = job["z-index"];
        var zIndex = parseInt(zIndexStr);
        var z = get_z_from_zIndexStr(zIndexStr);
        var indent = (zIndex - 1) * BIZCARD_INDENT;

        // here we go
        var bizcardDiv = document.createElement("div");
        console.assert(bizcardDiv != null);
        var top = endBottomPx;
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

        // save the original center 
        var originalCtrX = left + width / 2;
        var originalCtrY = top + height / 2;
        var originalZ = z;
        bizcardDiv.setAttribute("originalCtrX", `${originalCtrX}`);
        bizcardDiv.setAttribute("originalCtrY", `${originalCtrY}`);
        bizcardDiv.setAttribute("originalZ", `${originalZ}`);

        bizcardDiv.setAttribute("saved-background-color", css_hex_background_color_str);
        bizcardDiv.setAttribute("saved-color", font_color_name);
        bizcardDiv.setAttribute("saved-selected-background-color", utils.adjustHexBrightness(css_hex_background_color_str, 1.7));
        bizcardDiv.setAttribute("saved-selected-color", font_color_name);

        var description_HTML = job["Description"];
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

        
        canvas.appendChild(bizcardDiv);

        num_valid_rows++;
    }
    // renderAllTranslateableDivsAtLeftColumnCenter();
}

// --------------------------------------
// TagLink globals

// the global set of tagLinks created while creating all .Bizcard-divs from
// the list of all `job` objects defined in "static_content/jobs.js"
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
            var description_item = description_items[i].trim();
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
        const cardDivId = tagLink['cardDivId'];
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
    tagLink['cardDivId'] = cardDiv.id;
}

// this is an Order(N) search that could be optimized.
function findCardDiv(tagLink) {
    var cardDivs = document.getElementsByClassName("card-div");
    for (var i = 0; i < cardDivs.length; i++) {
        var cardDiv = cardDivs[i];
        if (cardDivMatchesTagLink(cardDiv, tagLink))
            return cardDiv;
    }
    return null;
}

function cardDivMatchesTagLink(cardDiv, tagLink) {
    if (cardDiv.getAttribute("tagLinkText") != tagLink["text"])
        return false;
    if (cardDiv.getAttribute("tagLinkUrl") != tagLink["url"])
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
            var description_item = items[i].trim();
            if (description_item.length > 0)
                HTML += "<li class='card-div-line-item-description-list-item'>" + description_item + "</li>";
        }
        HTML += "</ul>"
    } else {
        console.log(`unparsed description: ${description_HTML}`);
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
    var top = vt_top + verticalOffset
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
        'saved-selected-color']);

    cardDiv.setAttribute("saved-zIndexStr", zIndexStr);
    cardDiv.setAttribute("saved-filterStr", get_filterStr_from_z(z));

    cardDiv.style.zIndex = cardDiv.getAttribute("saved-zIndexStr") || "";
    cardDiv.style.filter = cardDiv.getAttribute("saved-filterStr") || "";
    cardDiv.style.backgroundColor = cardDiv.getAttribute("saved-background-color") || "";
    cardDiv.style.color = cardDiv.getAttribute("saved-color") || "";

    // the tagLink is used to define the contents of this cardDiv
    const tagLinkImgUrl = tagLink['url'];
    const tagLinkHtml = tagLink['text'];
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

    renderAllTranslateableDivsAtLeftColumnCenter();

    cardDiv.setAttribute("tagLinkText", tagLink["text"]);
    cardDiv.setAttribute("tagLinkUrl", tagLink["url"]);
    return cardDiv;
}

function copyAttributes(dstDiv, srcDiv, attrs) {
    console.assert(dstDiv != null && srcDiv != null && attrs != null);
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
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
        var attr = attrs[i];
        var dstVal = dstDiv.getAttribute(attr);
        var srcVal = srcDiv.getAttribute(attr);
        if (dstVal = srcVal) {
            console.log(`attr:${attr} dst:${dstVal} != src:${srcVal}`);
            numErrors += 1;
        }
    }
    return numErrors;
}


function animateCardDivTowardsBizcardDiv(cardDivId, bizcardDivId) {
    var cardDiv = document.getElementById(cardDivId);
    var bizcardDiv = document.getElementById(bizcardDivId);

    
    var cardOriginalCtrX = parseInt(cardDiv.getAttribute("originalCtrX") || "0");
    
    var cardOriginalCtrY = parseInt(cardDiv.getAttribute("originalCtrY") || "0");
    
    var cardOriginalZ = parseInt(cardDiv.getAttribute("originalZ") || "0");

    
    var bizcardOriginalCtrX = parseInt(bizcardDiv.getAttribute("originalCtrX") || "0");
    
    var bizcardOriginalCtrY = parseInt(bizcardDiv.getAttribute("originalCtrY") || "0");
    
    var bizcardOriginalZ = parseInt(bizcardDiv.getAttribute("originalZ") || "0");

    
    var deltaX = bizcardOriginalCtrX - cardOriginalCtrX;
    
    var deltaY = bizcardOriginalCtrY - cardOriginalCtrY;
}


function animateCardDivToOriginalPosition(cardDivId) {
    var cardDiv = document.getElementById(cardDivId);
    
    var originalTop = parseInt(cardDiv.getAttribute("originalTop") || "0");
    
    var originalLeft = parseInt(cardDiv.getAttribute("originalLeft") || "0");
    
    var originalZ = parseInt(cardDiv.getAttribute("originalZ") || "0");

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
        
        const filePath = image_paths[randomIndex];

        if (!selected_image_paths.includes(filePath) && !invalid_image_paths.includes(filePath)) {
            const filename = filePath.split('/').pop();
            const regex = /^(.*?)-(\d+)x(\d+)\.(\w+)$/;
            const match = filename.match(regex);
            if (!match) {
                console.log(`Invalid filename format: ${filename}`);
                invalid_image_paths.push(filePath);
                continue;
            }
            
            const name = match[1];
            const random_img_width = parseInt(match[2]);
            const random_img_height = parseInt(match[3]);
            
            const extension = match[4];
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
 * @param {number}  leftColumn_dx    the x value used to convert cardDiv.x to leftColumn-relative position
 * @param {number}  leftColumn_dy    the y value used to convert cardDiv.y to leftColumn-relative position
 *
 * @return {string} Return a string with format "12.02px -156.79px"
 */

function getZTranslateStr(dh, dv, z, leftColumn_dx, leftColumn_dy) {
    // z ranges from 0 (closest) to viewer to MAX_Z furthest from viewer
    // zindex ranges MAX_Z (closest to viewer) to 1 furthest from viewer
    var zIndex = parseInt(get_zIndexStr_from_z(z));
    var zScale = (zIndex <= ALL_CARDS_MAX_Z) ? zIndex : 0.0;

    // by definition, divs have zero mean hzCtrs so canvas translation is required
    var dx = dh * zScale + leftColumn_dx;
    var dy = dv * zScale + 0; // leftColumn_dy;
    var zTranslateStr = `${dx}px ${dy}px`;

    return zTranslateStr;
}

// leftColumn's self-relative center
function getLeftColumnCtr() {
    var leftColumnX = leftColumn.offsetWidth / 2;
    var leftColumnY = leftColumn.offsetHeight / 2;
    return { leftColumnX, leftColumnY };
}
// leftColumn's self-relative horizontal center
function getLeftColumnHzCtr() {
    
    return leftColumn.offsetWidth / 2;
}
// leftColumn's self-relative vertical center
function getLeftColumnVtCtr() {
    
    return leftColumn.offsetHeight / 2;
}

// element's leftColumn-relative center

function getElementCtr(element) {
    var elementX = (element.offsetLeft + element.offsetWidth) / 2;
    var elementY = (element.offsetTop + element.offsetHeight) / 2;
    return { elementX, elementY };
}
// element's self-relative center
function getElementSelfCtr(element) {
    var elementX = element.offsetWidth / 2;
    var elementY = element.offsetHeight / 2;
    return { elementX, elementY };
}
// element's self-relative horizontal center
function getElementSelfHzCtr(element) {
    return element.offsetWidth / 2;
}
// element's self-relative vertical center
function getElementSelfVtCtr(element) {
    return element.offsetHeight / 2;
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

// applies z-depth scaled parallax to all translateableDiv
function applyParallax() {

    var { parallaxX, parallaxY } = getParallax();
    var { leftColumnX, leftColumnY } = getLeftColumnCtr();

    // constants for this parallax
    var dh = parallaxX * PARALLAX_X_EXAGGERATION_FACTOR;
    var dv = parallaxY * PARALLAX_Y_EXAGGERATION_FACTOR;

    // compute and apply translations for all translatableDivs
    var allDivs = getAllTranslateableCardDivs();
    for (var i = 0; i < allDivs.length; i++) {
        var cardDiv = allDivs[i];

        var zIndexStr = cardDiv.style.zIndex;

        var z = get_z_from_zIndexStr(zIndexStr);

        var { elementX, elementY } = getElementSelfCtr(cardDiv);

        // leftColumn-relative cardDiv center
        var leftColumn_dx = leftColumnX - elementX;
        var leftColumn_dy = leftColumnY - elementY;

        var zTranslateStr = getZTranslateStr(dh, dv, z, leftColumn_dx, leftColumn_dy);

        try {
            cardDiv.style.translate = zTranslateStr;
        } catch (error) {
            console.error(`applyParallax cardDiv:${cardDiv.id}`, error);
        }
    }
}

var timeStart = null;
var timeFinish = null;

//function setTimeStart() {
//    timeStart = (new Date()).getTime();
//}
//function setTimeFinish() {
//    timeFinish = (new Date()).getTime();
//}
//function getTimeElapsed() {
//    return timeFinish - timeStart;
//}

let theMouseX;
let theMouseY;

function getTheMouse() {
    return { theMouseX, theMouseY };
}

function handleLeftColumnMouseMove(event) {
    //console.log("starting mouseCapture");

    mouseCapture.startCapturingMouseMovement(
        leftColumn, 
        function handleMouseMotion ( mouseX, mouseY) {
            theMouseX = mouseX;
            theMouseY = mouseY;
            console.log(`handleMouseMotion ${theMouseX} ${theMouseY}`);

            function animate() {
                // console.log(`animate:${mouseX}.${mouseY}`);
    
                var { fpX, fpY } = getFocalPoint();
        
                // Calculate the distance between the current and target position
                const dx = mouseX - fpX;
                const dy = mouseY - fpY;
        
                // Calculate the easing values
                const ease = 1.0;
                const easingX = dx * ease;
                const easingY = dy * ease;
        
                // Update the current position with easing
                fpX += easingX;
                fpY += easingY;
        
                // Apply the new position to the element
                focalPoint.style.transform = `translate(${fpX}px, ${fpY}px)`;
        
                // Keep animating until the current position reaches the target position
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    window.requestAnimationFrame(animate);
                }
            }
            // Start the animation
            animate();
    
        },
        function signalStart() {
            //setTimeStart();
            //console.log("signalStart");
            removeLeftColumnEventListeners();
        },
        function signalFinish() {
            //setTimeFinish();
            //console.log("signalFinish with elapsedTime", getTimeElapsed());

            restoreLeftColumnEventListeners();
        }
    );

}
    




function focalPointInRect(rect) {
    var { fpX, fpY } = getFocalPoint();
    if (fpX >= rect.left && fpX <= rect.right) {
        if (fpY >= rect.top && fpY <= rect.bottom)
            return true;
    }
    return false;
}

var autoScrollingInterval = null;
var autoScrollVelocity = 0;
var oldAutoScrollVelocity = 0;
const AUTOSCROLL_REPEAT_MILLIS = 10;
const MAX_AUTOSCROLL_VELOCITY = 10.0;
const MIN_AUTOSCROLL_VELOCITY = 2.0;
const AUTOSCROLL_CHANGE_THRESHOLD = 2.0;

// set autoScrollVelocity based on current focalPoint 
function updateAutoScrollVelocity() {
    // IMMEDIATE RETURN
    return;
    
    var { fpX, fpY } = getFocalPoint();
    
    var topHeight = leftColumn.offsetHeight / 4;
    var centerTop = topHeight;
    var centerHeight = topHeight * 2;
    var centerBottom = topHeight + centerHeight;
    var bottomHeight = topHeight;

    if (fpY < centerTop) {
        autoScrollVelocity = (fpY - centerTop) / topHeight * MAX_AUTOSCROLL_VELOCITY;
    } else if (fpY > centerBottom) {
        autoScrollVelocity = (fpY - centerBottom) / bottomHeight * MAX_AUTOSCROLL_VELOCITY;
    } else {
        autoScrollVelocity = 0;
    }
}

// implement autoscrolling and then apply 
// parallax transformations to all 
// transformable elements
function handleFocalPointMove() {
    // IMMEDIATE RETURN
    return;

    updateAutoScrollVelocity();

    // if the velocity changed
    if (Math.abs(autoScrollVelocity - oldAutoScrollVelocity) >= AUTOSCROLL_CHANGE_THRESHOLD) {

        // if the velocity is near zero
        if (Math.abs(autoScrollVelocity) < MIN_AUTOSCROLL_VELOCITY) {
            // stop the interval if needed
            if (autoScrollingInterval != null) {
                clearInterval(autoScrollingInterval);
                autoScrollingInterval = null;
            }
        } else {
            // start the inteval if needed
            if (autoScrollingInterval == null) {
                autoScrollingInterval = setInterval(function () {

                    // apply the velocity
                    
                    var currentScrollTop = leftColumn.scrollTop;
                    var newScrollTop = currentScrollTop + autoScrollVelocity;

                    // clamp newScrollTop to the boundaries
                    var minScrollTop = 0;
                    
                    var maxScrollTop = leftColumn.scrollHeight - leftColumn.clientHeight;
                    
                    newScrollTop = utils.clamp(newScrollTop, minScrollTop, maxScrollTop);

                    // if there is room to scroll 
                    
                    if (Math.abs(leftColumn.scrollTop - newScrollTop) > 0) {
                        // go ahead and scroll
                        
                        leftColumn.scrollTop = newScrollTop;
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
    if (scrollVelocityType != null && scrollVelocity != null)
        html += `${scrollVelocityType}:${scrollVelocity}<br/>`;

    debugElement.innerHTML = html;
}

// Display mouse position and delta coordinates in the right-message-div  

var isMouseOverLeftColumn = false;

function handleMouseEnterLeftColumn(event) {
    isMouseOverLeftColumn = true;
    easeFocalPointTo(event.clientX, event.clientY);
}


function handleMouseLeaveLeftColumn(event) {
    isMouseOverLeftColumn = false;
    easeFocalPointToOrigin();
}

var lastScrollTop = null;
var lastScrollTime = null;


function handleLeftColumnScroll(scrollEvent) {

    // IMMEDIATE RETURN
    return;

    var thisTime = (new Date()).getTime();
    
    var thisScrollTop = leftColumn.scrollTop;
    var deltaTime = (lastScrollTime != null) ? (thisTime - lastScrollTime) : null;
    var deltaTop = (lastScrollTop != null) ? (thisScrollTop - lastScrollTop) : null;
    
    var scrollVelocity = (deltaTime && deltaTop) ? (deltaTop) / (deltaTime) : "?";
    debugScrolling("scroll", leftColumn, "scrollVelocity", `${deltaTop}/${deltaTime}`);
    lastScrollTime = thisTime;
    lastScrollTop = thisScrollTop;

}

// calculates dh,dv parallax when
// mouse wheel is moving
// leftColumn_wheel_dh ==  leftColumn_mouse_dh
// leftColumn_wheel_dv ==  leftColumn_mouse_dv
// when mouse wheel is scrolling

var wheelLastY = null;

var wheelLastTime = null;

function handleLeftColumnWheel(wheelEvent) {
    moveFocalPointToMouse(wheelEvent.clientX, wheelEvent.clientY);
}

// handle mouse enter event for any div element with
// cardClass "card-div" or "bizcard-div"
function handleCardDivMouseEnter(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        setSelectedStyle(targetCardDiv);
    }
}

function handleLeftColumnMouseClick() {
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

// works for card-div, bizcard-div, and card-div-line-item
function setSelectedStyle(div) {
    if (div.classList.contains("card-div-line-item") == false) {
        div.style.zIndex = SELECTED_CARD_DIV_ZINDEX_STR;
        div.style.filter = SELECTED_CARD_DIV_FILTER_STR;
    }
    div.style.color = div.getAttribute("saved-selected-color");
    div.style.backgroundColor = div.getAttribute("saved-selected-background-color");
    div.classList.add('selected');
}

// works for card-div, bizcard-div, and card-div-line-item
function restoreSavedStyle(div) {
    if (div.classList.contains("card-div-line-item") == false) {
        div.style.zIndex = div.getAttribute("saved-zIndexStr");
        div.style.filter = div.getAttribute("saved-filterStr");
    }
    div.style.color = div.getAttribute("saved-color");
    div.style.backgroundColor = div.getAttribute("saved-background-color");
    div.classList.remove('selected');
}

// ------------------------------------------------------------
// theSelectedCardDiv vars, constants and functions

var theSelectedCardDiv = null;
var theSelectedCardDivLineItem = null;

const SELECTED_CARD_DIV_Z = -10;
const SELECTED_CARD_DIV_ZINDEX_STR = get_zIndexStr_from_z(SELECTED_CARD_DIV_Z);
const SELECTED_CARD_DIV_FILTER_STR = get_filterStr_from_z(SELECTED_CARD_DIV_Z);


const DEFAULT_TRANSITION_MILLIS = 2000;

const NO_TRANSITION = 0;

const NO_TIMEOUT = 0;

const DEFAULT_SCROLL_INTO_VIEW_OPTIONS = { behavior: 'smooth', block: 'center', inline: 'center' };

function selectTheCardDiv(cardDiv) {
    // click on selected to deselect
    if (theSelectedCardDiv != null &&
        cardDiv.id == theSelectedCardDiv.id) {
        deselectTheSelectedCardDiv();
        return;
    }
    // calls deselectTheSelectedCardDiv
    deselectTheSelectedCardDiv();
    // saves self as theSelected
    theSelectedCardDiv = cardDiv;
    // styles self as selected
    setSelectedStyle(theSelectedCardDiv);
    // does not scroll itself into view
}

function deselectTheSelectedCardDiv() {
    // if theSelectedCardDiv is defined
    if (theSelectedCardDiv != null) {
        // styles self as saved
        restoreSavedStyle(theSelectedCardDiv);
        // sets the theSelectedCardDiv to null
        theSelectedCardDiv = null;
    }
}

// handle mouse click event for any div element with
// cardClass "card-div" or "bizcard-div".
function addCardDivClickListener(cardDiv) {
    cardDiv.addEventListener("click", function (event) {
        if (theSelectedCardDiv != null &&
            cardDiv.id == theSelectedCardDiv.id) {
            // click on selected card to deselect
            deselectTheSelectedCardDiv();
            return;
        }
        // calls selectTheCardDiv(cardDiv)
        selectTheCardDiv(cardDiv);
        // calls addCardDivLineItem()
        addCardDivLineItem(cardDiv.id);
        var cardDivLineItem = getCardDivLineItem(cardDiv.id);
        console.assert(cardDivLineItem != null);
        // calls selectCardDivLineItem - does scroll self into view
        selectTheCardDivLineItem(cardDivLineItem);

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


function selectTheCardDivLineItem(cardDivLineItem) {
    // click on selected to deselect
    if (theSelectedCardDivLineItem !== null &&
        cardDivLineItem.id == theSelectedCardDivLineItem.id) {
        deselectTheSelectedCardDivLineItem();
        return;
    }
    // calls  deselectTheSelectedCardDivLineItem
    deselectTheSelectedCardDivLineItem();
    // saves self as theSelected
    theSelectedCardDivLineItem = cardDivLineItem;
    // styles self as selected
    setSelectedStyle(theSelectedCardDivLineItem);
    // does scroll self into view
    console.log(`scrollCardDivLineItemIntoView id:${theSelectedCardDivLineItem.id}`);
    theSelectedCardDivLineItem.scrollIntoView(DEFAULT_SCROLL_INTO_VIEW_OPTIONS);
}

function deselectTheSelectedCardDivLineItem() {
    // if theSelectedCardDivLineItem is defined
    if (theSelectedCardDivLineItem != null) {
        // styles self as saved
        restoreSavedStyle(theSelectedCardDivLineItem);
        // sets the theSelectedCardDivLineItem to null
        theSelectedCardDivLineItem = null;
    }
}

function addCardDivLineItemClickListener(cardDivLineItem, cardDiv) {

    cardDivLineItem.addEventListener("click", function (event) {

        // cardDivLineItem selected not clicked
        // does scroll self into view
        selectTheCardDivLineItem(cardDivLineItem);

        // selectTheCardDiv not clicked
        // does not scroll self into view
        selectTheCardDiv(cardDiv);

        console.log(`scrollIntoView id:${cardDiv.id}`);
        cardDiv.scrollIntoView(DEFAULT_SCROLL_INTO_VIEW_OPTIONS);

        event.stopPropagation();
    })
}

// add a new card-div-line-item to right-column-content
// if one doesn't aleady exist
// returns the newly addedCardDivLineItem or null
function addCardDivLineItem(targetCardDivId) {

    if (targetCardDivId == null) {
        console.log(`ignoring request to add cardDivLineItem with null targetCardDivId`);
        return;
    }

    // check to see if the cardDiv exists
    var targetCardDiv = document.getElementById(targetCardDivId);
    if (targetCardDiv == null) {
        console.log(`no cardDiv found for targetCardDivId:${targetCardDivId}`);
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
            addTagLinkClickListener(tagLinks[i]);
        }
    } else {
        console.log(`returning preexisting cardDivLineItem for targetCardDivId:${targetCardDivId}`);
        
        cardDivLineItem = existingCardDivLineItem
    }
    // does not select self
    // does scroll self into view
    return cardDivLineItem;
}

// --------------------------------------------------------------

// return the cardDivLineItem in rightCOntentDiv for cardDivId or null if not found
function getCardDivLineItem(cardDivId) {
    console.assert(utils.isString(cardDivId));
    
    for (var i = 0; i < rightContentDiv.children.length; i++) {
        
        var child = rightContentDiv.children[i];
        if (child.className == "card-div-line-item") {
            if (child.hasAttribute("targetCardDivId") &&
                child.getAttribute("targetCardDivId") == cardDivId) {
                return child;
            }
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
        console.assert(cardDivLineItem != null && cardDivLineItem.classList.contains("card-div-line-item"));
        var cardDiv = getCardDivOfCardDivLineItem(cardDivLineItem);
        
        var followingBizcardDivId = getFollowingBizcardDivId(cardDiv.id);
        console.assert(isBizcardDivId(followingBizcardDivId));
        
        var followingBizcardDiv = document.getElementById(followingBizcardDivId);
        console.assert(isBizcardDiv(followingBizcardDiv));

        // select the followingBizcardDiv
        selectTheCardDiv(followingBizcardDiv);
        
        console.log(`scrollIntoView id:${followingBizcardDiv.id}`);
        
        followingBizcardDiv.scrollIntoView(DEFAULT_SCROLL_INTO_VIEW_OPTIONS);

        // find or add the nextCardDivLineItem
        var nextCardDivLineItem =
            addCardDivLineItem(followingBizcardDivId);
        // scrolls self into view
        selectTheCardDivLineItem(nextCardDivLineItem);

        event.stopPropagation();
    });
}

// return the next bizcardDivId if one exists and has not
// already been added to rightColumnContentDiv, else null
function getFollowingBizcardDivId(bizcardDivId) {
    console.assert(utils.isString(bizcardDivId));
    var index = getBizcardDivIndex(bizcardDivId);
    if (index != null) {
        var followingBizcardDivId = getBizcardDivIdFromIndex(index + 1);
        // if we've reached the end of all bizcardDivs
        // then start over at index 0
        if (followingBizcardDivId == null)
            followingBizcardDivId = getBizcardDivIdFromIndex(0);

        if (followingBizcardDivId) {
            // has a cardDivLineItem not already been added for followingBizcardDivId?
            var cardDivLineItem = getCardDivLineItem(bizcardDivId);
            if (cardDivLineItem == null) {
                return followingBizcardDivId;
            }
        }
    }
    // this should never be reached
    return null;
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

            // calls selectTheCardDiv
            console.log(`tagLink with text:[${tagLinkText}] url:(${tagLinkUrl}) selected cardDiv:%{cardDiv.id}`);
            selectTheCardDiv(cardDiv);
            // does scroll cardDiv into view
            console.log(`scrollIntoView id:${cardDiv.id}`);
            
            cardDiv.scrollIntoView(DEFAULT_SCROLL_INTO_VIEW_OPTIONS);
        } else {
            console.log(`no cardDiv with tagLink found for cardDivId:${cardDivId}`);
        }
        event.stopPropagation();
    });
}


function renderAllTranslateableDivsAtLeftColumnCenter() {
    const { leftColumnX, leftColumnY } = getLeftColumnCtr();
    const translateableDivs = getAllTranslateableCardDivs();
    for (const div of translateableDivs) {
        const divWidth = div.offsetWidth;
        const trans_dx = leftColumnX - divWidth / 2.0;
        const trans_dy = 0;
        const translateStr = `${trans_dx}px ${trans_dy}px`;
        try {
            div.style.translate = translateStr;
        } catch (error) {
            console.log(`leftCenter div:${div.id}`, error);
            console.error(`leftCenter div:${div.id}`, error);
        }
    }
    // console.log(`leftColumn.scrollHeight:${leftColumn.scrollHeight}`);
}

function positionGradients() {
    const canvasHeight = canvas.scrollHeight;
    const bottomGradientHeight = bottomGradient.offsetHeight;
    bottomGradient.style.top = `${canvasHeight - bottomGradientHeight}px`;
}


function rightContentScrollToBottom() {
    rightContentDiv.scrollTop = rightContentDiv.scrollHeight;
}


function leftColumnScrollToTop() {
    leftColumn.scrollTo({ top: 0, behavior: 'smooth' });
}

function leftColumnScrollToBottom() {
    leftColumn.scrollTo({ top: leftColumn.scrollHeight, behavior: 'smooth' });
}

function centerBullsEye() {
    var top = getLeftColumnVtCtr() - getElementSelfVtCtr(bullsEye);
    var left = getLeftColumnHzCtr() - getElementSelfHzCtr(bullsEye);
    bullsEye.style.top = `${top}px`;
    bullsEye.style.left = `${left}px`;
    // console.log(`bulls-eye top:${top} left:${left}`);
}

// returns the leftCanvas-relative 
// location of the focalPoint's origin center
function getFocalPointOrigin() {
    var { leftColumnX, leftColumnY } = getLeftColumnCtr();
    var originX = leftColumnX;
    var originY = leftColumnY;
    return { originX, originY };
}

// returns the current leftCanvas-relative 
// location of the focalPoint center
function getFocalPoint() {
    var fpX = focalPoint.offsetLeft + focalPoint.offsetWidth / 2;
    var fpY = focalPoint.offsetTop + focalPoint.offsetHeight / 2;
    return { fpX, fpY };
}

function getParallax() {
    var { originX, originY } = getFocalPointOrigin();
    var { fpX, fpY } = getFocalPoint();
    var parallaxX = originX - fpX;
    var parallaxY = originY - fpY;
    return { parallaxX, parallaxY };
}

function moveFocalPointToOrigin() {
    var { originX, originY } = getFocalPointOrigin();
    moveFocalPointTo(originX, originY);
}
function easeFocalPointToOrigin() {
    var { originX, originY } = getFocalPointOrigin();
    easeFocalPointTo(originX, originY);
}

// move focalPoint to the given leftCanvas-relative location
function moveFocalPointTo(x, y) {
    var { fpX, fpY } = getFocalPoint();
    var newLeft = x - focalPoint.offsetWidth / 2;
    var newTop = y - focalPoint.offsetHeight / 2;
    focalPoint.style.left = `${newLeft}px`;
    focalPoint.style.top = `${newTop}px`;
    debugFocalPoint();
    handleFocalPointMove();
}

function easeFocalPointTo(x, y) {
    moveFocalPointTo(x, y);
}

function debugFocalPoint() {
    var { theMouseX, theMouseY } = getTheMouse();
    var { originX, originY } = getFocalPointOrigin();
    var { fpX, fpY } = getFocalPoint();
    var { parallaxX, parallaxY } = getParallax();
    
    debugFocalPointElement.innerHTML = `mm:[${theMouseX},${theMouseY}] org:${originX},${originY} fp:[${fpX},${fpY}] px:[${parallaxX},${parallaxY}]`;
}

function moveFocalPointToMouse(mouseX, mouseY) {
    // adjust relative to tip of default cursor
    var newX = mouseX+1;
    var newY = mouseY+1;
    moveFocalPointTo(newX, newY);
}


function updateSkillsFromAllTagLinks(allTagLinks) {
    if (allTagLinks && allTagLinks.length > 0) {
        const html = allTagLinks.map((list) => list.text).join(BULLET_JOINER);
        const skills = document.getElementById("skills");
        
        skills.innerHTML = html;
    } else {
        console.log("no skills yet");
    }
}

const DEFAULT_TIMELINE_YEAR = 2023;
function handleWindowLoad() {
    timeline.createTimeline(timelineContainer, leftColumn, DEFAULT_TIMELINE_YEAR);
    //createBizcardDivs();
    //renderAllTranslateableDivsAtLeftColumnCenter();
    positionGradients();
    centerBullsEye();
    moveFocalPointToOrigin();
}

function handleWindowResize() {
    // resize the left-column and the canvas since they don't do it themselves?
    var windowWidth = window.innerWidth;
    var leftColumnWidth = windowWidth / 2;
    
    leftColumn.style.width = leftColumnWidth + "px";
    
    canvas.style.width = leftColumnWidth + "px";
    renderAllTranslateableDivsAtLeftColumnCenter();
    positionGradients();
    centerBullsEye();
}

console.log("WELCOME");

// Attach event listeners
window.addEventListener("load", handleWindowLoad);
window.addEventListener("resize", handleWindowResize);

var leftColumnEventListeners = [];

function addLeftColumnEventListener(eventType, listener, options) {
    leftColumnEventListeners.push({eventType, listener, options});
    leftColumn.addEventListener(eventType, listener, options);
}

function removeLeftColumnEventListeners() {
    for ( let i=0; i<leftColumnEventListeners.length; i++ ) {
        let listener = leftColumnEventListeners[i];
        if ( listener.options != null )
            leftColumn.removeEventListener(listener.eventType, listener.listener, listener.options);
        else
            leftColumn.removeEventListener(listener.eventType, listener.listener);
    }
}

function restoreLeftColumnEventListeners() {
    for ( let i=0; i<leftColumnEventListeners.length; i++ ) {
        let listener = leftColumnEventListeners[i];
        if ( listener.options != null )
            leftColumn.addEventListener(listener.eventType, listener.listener, listener.options);
        else
            leftColumn.addEventListener(listener.eventType, listener.listener);
    }
}


addLeftColumnEventListener("mousemove", handleLeftColumnMouseMove);

addLeftColumnEventListener("load", handleLeftColumnMouseMove);

addLeftColumnEventListener("wheel", handleLeftColumnWheel, {passive: true});

addLeftColumnEventListener('mouseenter', handleMouseEnterLeftColumn);

addLeftColumnEventListener('mouseleave', handleMouseLeaveLeftColumn);

addLeftColumnEventListener('scroll', handleLeftColumnScroll);

addLeftColumnEventListener('click', handleLeftColumnMouseClick);




