
// @ts-nocheck
'use strict';

import * as utils from './modules/utils.mjs';
import * as alerts from './modules/alerts.mjs';
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
    // console.assert(utils.isString(cardDivId));
    if (cardDivId.startsWith("bizcard-div-")) {
        var index = parseInt(cardDivId.replace("bizcard-div-", ""));
        return isNaN(index) ? null : index;
    }
    return null;
}

// returns 99 for 'card-div-99' or null
function getCardDivIndex(cardDivId) {
    // console.assert(utils.isString(cardDivId));
    if (cardDivId.startsWith("card-div-")) {
        var index = parseInt(cardDivId.replace("card-div-", ""));
        return isNaN(index) ? null : index;
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
        // utils.validateString(role);
        var employer = job[ "employer" ].trim();
        // utils.validateString(employer);
        var css_hex_background_color_str = job[ "css RGB" ].trim();
        // utils.validateHexString(css_hex_background_color_str);
        // utils.validateKey(job, "text color");
        var font_color_name = job[ "text color" ].trim();
        // utils.validateString(font_color_name);

        // timeline is descending so jobEnd is always above jobStart
        var jobEnd = job[ "end" ].trim().replace("-01", "");
        // utils.validateString(jobEnd);
        var endYearStr = jobEnd.split("-")[ 0 ];
        // utils.validateString(endYearStr);
        var endMonthStr = jobEnd.split("-")[ 1 ];
        // utils.validateString(endMonthStr);

        var endDate = new Date(`${endYearStr}-${endMonthStr}-01`);
        var endBottomPx = timeline.getTimelineYearMonthBottom(endYearStr, endMonthStr);

        var jobStart = job[ "start" ].trim().replace("-01", "");
        // utils.validateString(jobStart);
        var startYearStr = jobStart.split("-")[ 0 ];
        // utils.validateString(startYearStr);
        var startMonthStr = jobStart.split("-")[ 1 ];
        // utils.validateString(startMonthStr);

        var startDate = new Date(`${startYearStr}-${startMonthStr}-01`);
        var startBottomPx = timeline.getTimelineYearMonthBottom(startYearStr, startMonthStr);

        var heightPx = Math.max(startBottomPx - endBottomPx, MIN_BIZCARD_HEIGHT);
        var zIndexStr = job[ "z-index" ];
        var zIndex = parseInt(zIndexStr);
        var z = get_z_from_zIndexStr(zIndexStr);
        var indent = (zIndex - 1) * BIZCARD_INDENT;

        // here we go
        var bizcardDiv = document.createElement("div");
        // console.assert(bizcardDiv != null);
        var top = endBottomPx;
        // console.assert(top > 0, "Q");
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
        // console.assert(bizcardDiv.offsetTop > 0, 'L');
        // console.assert(parseInt(bizcardDiv.getAttribute("originalTop")) > 0, 'M');
        bizcardDiv.setAttribute("originalWidth", `${bizcardDiv.offsetWidth}`);
        bizcardDiv.setAttribute("originalHeight", `${bizcardDiv.offsetHeight}`);
        bizcardDiv.setAttribute("originalCtrX", `${originalCtrX}`);
        bizcardDiv.setAttribute("originalCtrY", `${originalCtrY}`);
        bizcardDiv.setAttribute("originalZ", `${originalZ}`);

        bizcardDiv.setAttribute("saved-background-color", css_hex_background_color_str);
        bizcardDiv.setAttribute("saved-color", font_color_name);
        bizcardDiv.setAttribute("saved-selected-background-color", utils.adjustHexBrightness(css_hex_background_color_str, 1.7));
        bizcardDiv.setAttribute("saved-selected-color", font_color_name);

        var description_raw = job[ "Description" ];
        if (description_raw && description_raw.length > 0) {
            // utils.validateString(description_raw);
            const [description_HTML, bizcardTagLinks] = process_bizcard_description_HTML(bizcardDiv, description_raw);
            bizcardDiv.setAttribute("Description", description_HTML);
            bizcardDiv.setAttribute("TagLinks", JSON.stringify(bizcardTagLinks));
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

// Use the BULLET_DELIMITER as separator to split the
// `bizcard_description` into a list of `description_items`.
//
// Parse each description_item to find the pattern `[skill_phrase](skill_img_url)(skill_url)`.
// Finds or creates a `card-div` for each `skill_phrase` and replaces the 
// original html with `<card-link card-div-id="id" card-img-url="url">skill</card-link>`
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
    // console.log("bizcardTagLinks:" + bizcardTagLinks.length  + " [" + debugTagLinksToStr(bizcardTagLinks) + "]")
    return [processed_bizcard_description_HTML, bizcardTagLinks];
}

function debugTagLinksToStr(tagLinks) {
    var tagLinkStrs = [];
    for( var i=0; i<tagLinks.length; i++ ) {
        var tagLink = tagLinks[i];
        if ( tagLink.url != "url" )
            var tagLinkStr = tagLink.text + '<br/>' + tagLink.url;
        else
            var tagLinkStr = tagLink.text;
        tagLinkStrs.push(tagLinkStr);
    }
    return tagLinkStrs.join("|");
}

// This function takes an inputString, applies the regular expression to extract the 
// newTagLink objects with properties text, img, url, and html, and then replaces 
// these newTagLinks in the original string with their html values. The function return 
// both the list of newTagLinks and the updatedString with embedded HTML elements.

function process_bizcard_description_item(bizcardDiv, inputString) {
    const regex = /\[([\w\s\:\-\|\/]+)\](\{[\w\/\-\.]+\})?(\(https?:\/\/[\w\/\.\-\?\=\&]+\))?/;
    const matches = inputString.match(new RegExp(regex, 'g'));

    if (!matches) {
        return { newTagLinks: [], updatedString: inputString };
    }
    // create a newTagLink for each match
    const newTagLinks = matches.map(match => {
        const parsed = match.match(regex);
        return {
            text: parsed[1] || '',
            img: (parsed[2] && parsed[2] !== 'img') ? parsed[2] : '',
            url: (parsed[3] && parsed[3] !== 'url') ? parsed[3] : ''
        };
    });
    
    // create an htmlElement for each newTagLink
    let updatedString = inputString;
    newTagLinks.forEach(item => {
        const text = item.text;
        const img = item.img ? item.img.slice(1, -1) : ''; // Remove surrounding braces
        const url = item.url ? item.url.slice(1, -1) : ''; // Remove surrounding parentheses
    
        let htmlElement = '';
    
        if (text) {
        
            // Initialize the htmlElement with just underlined text
            htmlElement = `<u>${text}</u>`;
        
            // If url is defined, wrap the geo icon in an anchor tag
            if (url) {
                const geoAnchorHTML = `<a href="${url}" target="_blank"><img src="static_content/icons/icons8-geography-16.png"/></a>`;
                htmlElement += ` ${geoAnchorHTML}`;
            }
        
            // If img is defined, add an anchor tag wrapping the local image.svg
            if (img) {
                const imageAnchor = `<a href="${img}" target="_blank"><img src="static_content/icons/icons8-edit-image-16.png"/></a>`;
                htmlElement += ` ${imageAnchor}`;
            }
        }
            
        // Replace the original pattern with the new HTML element
        const originalPattern = `[${text}]${item.img}${item.url}`;
        updatedString = updatedString.replace(originalPattern, htmlElement);
        updatedString = updatedString.replace('(url)', '');
        updatedString = updatedString.replace('{img}', '');
            
        // save the htmlElement in the newTagLink
        item.html = htmlElement;
    });

    // use each newTagLink to add a spanElement to the cardDiv
    newTagLinks.forEach(item => {
        // find or create a carddiv for each newTagLink  
        setCardDivIdOfTagLink(bizcardDiv, item); //xx
    });

    return { newTagLinks, updatedString };
}

function test_process_bizcard_description_item() {
    // Example usage
    const inputString = "Your string with [words]{path}(url) patterns goes here";
    const result = processString(inputString);
    // console.log(result.newTagLinks); // Logs the list of words-path-url tagLinks
    // console.log(result.updatedString); // Logs the revised text with embedded HTML elements
}

// find or create a cardDiv and use it
// to set the tagLink's "cardDivId" property
// otherwise create a new cardDiv
function setCardDivIdOfTagLink(bizcardDiv, tagLink) {
    // console.assert(bizcardDiv != null && tagLink != null);
    var cardDiv = findCardDiv(tagLink);
    if (!cardDiv) {
        cardDiv = createCardDiv(bizcardDiv, tagLink);
    }
    tagLink.cardDivId = cardDiv.id;
}

// this is an Order(N) search that could be optimized.
function findCardDiv(tagLink) {
    var cardDivs = document.getElementsByClassName("card-div");
    for (const cardDiv of cardDivs) {
        if (cardDivMatchesTagLink(cardDiv, tagLink))
            return cardDiv;
    }
    return null;
}

function cardDivMatchesTagLink(cardDiv, tagLink) {
    // Check if the required text attribute matches
    if (tagLink.text !== cardDiv.getAttribute("tagLinkText")) {
        return false;
    }

    // Check if the optional img attribute matches or both are absent
    if (tagLink.img !== cardDiv.getAttribute("tagLinkImg")) {
        if (tagLink.img !== undefined && cardDiv.getAttribure("tagLinkImg") !== undefined) {
            return false;
        }
    }

    // Check if the optional url attribute matches or both are absent
    if (tagLink.url !== cardDiv.getAttribute("tagLinkUrl")) {
        if (tagLink.url !== undefined && cardDiv.getAttribute("tagLinkUrl") !== undefined) {
            return false;
        }
    }

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
    // console.assert(bizcardDiv != null && tagLink != null);
    var cardDivId = getNextCardDivId();
    var cardDiv = document.createElement('div');
    cardDiv.classList.add("card-div");
    cardDiv.tagLink = tagLink;
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
    const tagLinkHtml = cardDiv.tagLink.html;
    const spanId = `tagLink-${cardDivId}`;
    // define the innerHTML when cardDiv is added to #canvas
    cardDiv.innerHTML = `<span id="${spanId}" class="tagLink" targetCardDivId="${cardDivId}">${tagLinkHtml}</span>`;

    // Select the newly added span element and give it the colors of its parent cardDiv
    const spanElement = document.getElementById(spanId);
    if (spanElement) {
        spanElement.style.color = cardDiv.style.color;
    }

    // ==================================================================
    // divCard img_src and dimensions

    var img_src = null;
    var img_width = MEAN_CARD_WIDTH;
    var img_height = MEAN_CARD_HEIGHT;

    // given a tagLinkImgUrl try to get the real img_src and dimensions of the actual image
    var result = get_real_img_src_from_img_url(tagLink.img);
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
    cardDiv.setAttribute("tagLinkImg", tagLink[ "img" ]);
    return cardDiv;
}

function copyAttributes(dstDiv, srcDiv, attrs) {
    // console.assert(dstDiv != null && srcDiv != null && attrs != null);
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[ i ];
        var srcVal = srcDiv.getAttribute(attr);
        // console.assert(utils.isString(srcVal), `attr:${attr} src:${srcVal}`);
        dstDiv.setAttribute(attr, srcVal);
        var dstVal = dstDiv.getAttribute(attr);
        // console.assert(dstVal == srcVal, `attr:${attr} dst:${dstVal} != src:${srcVal}`);
        // console.log(`${dstDiv.id} ${attr} = ${srcDiv.id} ${srcVal}`);
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

// uses the given newStyleProps to apply parallax to the given cardDiv
// and returns the updated styleProps of the parallaxed cardDiv
function applyParallaxToOneCardDivStyleProps(cardDiv, newStyleProps ) {
    // utils.validateIsCardDivOrBizcardDiv(cardDiv);
    // utils.validateIsStyleProps(newStyleProps);

    var { parallaxX, parallaxY } = getParallax();
    const canvasContainerX = utils.half(canvasContainer.offsetWidth);
    const canvasContainerY = utils.half(canvasContainer.offsetHeight);

    // constants for this parallax
    const dh = parallaxX * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = parallaxY * PARALLAX_Y_EXAGGERATION_FACTOR;

    // compute and apply translations to this translatableDiv
    var zIndexStr = newStyleProps.zIndex;

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
        console.error(`applyParallax cardDiv:${cardDiv.id}`, error);
    }
    const parallaxedStyleProps = utils.getStyleProps(cardDiv);
    return parallaxedStyleProps;
}

function applyParallaxToOneCardDiv(cardDiv) {
    // utils.validateIsCardDivOrBizcardDiv(cardDiv);
    const cardDivStyleProps = utils.getStyleProps(cardDiv);
    // utils.validateIsStyleProps(cardDivStyleProps);
    applyParallaxToOneCardDivStyleProps(cardDiv,cardDivStyleProps);
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

document.addEventListener('click', function(event) {
    if (ANIMATION_IN_PROGRESS) {
      event.preventDefault();
      event.stopPropagation();
      console.log("Click blocked, animation in progress");
    }
  }, { capture: true });

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
        });

    requestAnimationFrame(step);
}

function endAnimation(div, targetStyleFrame) {
    // utils.validateIsDivElement(div);
    // utils.validateIsStyleFrame(targetStyleFrame);
    // apply the targetProps 
    if ( targetStyleFrame != null ) {
        console.log(`endAnimation targetStyleFrame:${targetStyleFrame}`)
        const targetStyleArray = targetStyleFrame;
        // utils.validateIsStyleArray(targetStyleArray);
        applyStyleArray(div, targetStyleArray);
    }
    // console.log(`animationend for ${funcName} ${div.id}`);
    ANIMATION_IN_PROGRESS = false;
}

// works for card-div, bizcard-div, and card-div-line-item
// currentProps describes current styling
// targetProps describes target styling
function setSelectedStyle(obj) {
    // utils.validateIsElement(obj);
    var notLineItem = !isCardDivLineItem(obj);
    // futzing required to use createStyleArray
    if ( notLineItem ) {
        // save these for restoreSavedStyle
        obj.setAttribute("saved-left", `${obj.offsetLeft}`);
        obj.setAttribute("saved-top", `${obj.offsetTop}`);
        obj.setAttribute("saved-zIndex", obj.style.zIndex);

        // set these for createStyleArray
        obj.setAttribute("saved-selected-left", obj.getAttribute("originalLeft"));
        obj.setAttribute("saved-selected-top", obj.getAttribute("originalTop"));
        obj.setAttribute("saved-selected-zIndex", SELECTED_CARD_DIV_ZINDEX_STR);

        var top = parseInt(obj.getAttribute("saved-top"))
        // console.assert( top> 0, `A saved-top is ${top}`);
        top = parseInt(obj.getAttribute("saved-selected-top"))
        // console.assert( top > 0,`B saved-selected-top is ${top}`);
    }
    var currentStyleArray = createStyleArray(obj,"saved");
    var targetStyleArray = createStyleArray(obj,"saved-selected");

    if (notLineItem && currentStyleArray[8] < 0) {
        currentStyleArray[8] = parseInt(obj.getAttribute('originalZ'));
        // console.log("select div.id:", div.id, "currentZ should not be negative so reset to", currentProps[8]);
    }
    if (notLineItem && targetStyleArray[8] > 0) {
        targetStyleArray[8] = parseInt(obj.getAttribute('saved-selected-zIndex'));
        // console.log("select div.id:", div.id, "targetZ should not be positive so reset to", targetProps[8]);
    }

    if ( notLineItem && NUM_ANIMATION_FRAMES > 0) { // xxx
        var styleFrameArray = [];
        for( let frame=0; frame<validateIsBizcardDiv; frame++ ) {
            var t = frame / (NUM_ANIMATION_FRAMES-1);
            const interpStyleArray = utils.linearInterpArray(t, currentStyleArray, targetStyleArray);
            // utils.validateIsStyleArray(interpStyleArray);
            const styleFrame = interpStyleArray;
            // utils.validateIsStyleFrame(styleFrame);
            styleFrameArray.push( styleFrame );
        }
        // utils.validateIsStyleFrameArray(styleFrameArray);
        startAnimationWithParallax(obj, styleFrameArray);
    } else {
        applyStyleArray(obj, targetStyleArray);
    }
    obj.classList.add('selected');
}


// works for card-div, bizcard-div, and card-div-line-item
// currentProps describes current styling
// targetProps describes target styling
function restoreSavedStyle(obj) {
    // utils.validateIsElement(obj);
    var notLineItem =  !isCardDivLineItem(obj);
    var currentStyleArray = createStyleArray(obj, null);
    var targetStyleArray = createStyleArray(obj,"saved");

    if (notLineItem && currentStyleArray[8] > 0) {
        currentStyleArray[8] = -25;
        // console.log("select div.id:", div.id, "currentZ should not be positive so reset to", currentProps[8]);
    }
    if (notLineItem && targetStyleArray[8] < 0) {
        targetStyleArray[8] = parseInt(obj.getAttribute('originalZ'))
        // console.log("restore div.id:", div.id,"targetZ should not be negative so reset to", currentProps[8]);
    }

    // // restore the div to it's parallax affected state
    // var targetParallaxedStyleProps;
    // if (notLineItem) {
    //     var targetDivStyleProps = getStylePropsFromStyleArray(div, targetStyleArray);
    //     targetParallaxedDivStyleProps  = applyParallaxToOneCardDivStyleProps(div, targetDivStyleProps);
    // } else {
    //     targetParallaxedProps = targetProps;
    // }
    // // utils.validateIsStyleProps(targetParallaxedStyleProps);

    if( notLineItem && NUM_ANIMATION_FRAMES > 0) {
        var styleFrameArray = [];
        for( let frame=0; frame<NUM_ANIMATION_FRAMES; frame++ ) {
            var t = frame / (NUM_ANIMATION_FRAMES-1);
            var interpStyleArray = utils.linearInterpArray(t, currentStyleArray, targetStyleArray);
            // utils.validateIsStyleArray(interpStyleArray);
            var styleFrame = interpStyleArray;
            // utils.validateIsStyleFrame(styleFrame);
            styleFrameArray.push( styleFrame );
        }
        // utils.validateIsStyleFrameArray(styleFrameArray);
        startAnimationWithParallax(obj,styleFrameArray);
    } else {
        applyStyleArray(obj, targetStyleArray);
    }
    obj.classList.remove('selected');
}


// prefix can be "saved" or "saved-selected"
function createStyleArray(obj, prefix) {
    // utils.validateIsElement(obj);
    let array = [];
    var RGB;
    if (prefix) { // use div.getAttribute
        array = array.concat(utils.get_RGB_from_ColorStr(obj.getAttribute(`${prefix}-color`)));
        array = array.concat(utils.get_RGB_from_ColorStr(obj.getAttribute(`${prefix}-background-color`)));
        if ( !isCardDivLineItem(obj) ) { // positionals
            var left = parseInt(obj.getAttribute(`${prefix}-left`));
            array.push(left);
            var top = parseInt(obj.getAttribute(`${prefix}-top`)); 
            array.push(top);
            array.push(get_z_from_zIndexStr(obj.getAttribute(`${prefix}-zIndex`)))
        } else {
            array = array.concat([0,0,0]);
        }
    } else { // use div or div.style
        array = array.concat(utils.get_RGB_from_ColorStr(obj.style.color));
        array = array.concat(utils.get_RGB_from_ColorStr(obj.style.backgroundColor));
        if ( !isCardDivLineItem(obj) ) { // positionals
            var left = obj.offsetLeft;
            array.push(left);
            var top = obj.offsetTop;
            array.push(top);
            array.push(get_z_from_zIndexStr(obj.style.zIndex));
        } else {
            array = array.concat([0,0,0]);
        }
    }
    // utils.validateIsStyleArray(array);
    return array;
}

// return a styleProps object from a styleArray
function createStyleProps(div, styleArray) {
    // utils.validateIsDivElement(div);
    // utils.validateIsStyleArray(styleArray);
    var styleProps = {};
    styleProps['color'] = utils.get_Hex_from_RGB(styleArray.slice(0,3));
    styleProps['background-color'] = utils.get_Hex_from_RGB(styleArray.slice(3,6));
    if ( !isCardDivLineItem(div) ) { // positionals
        styleProps['left'] = `${styleArray[6]}px`;
        styleProps['top'] = `${styleArray[7]}px`;
        var z = styleArray[8];
        styleProps['zIndex'] = get_zIndexStr_from_z(z);
        styleProps['filter'] = get_filterStr_from_z(z);
    } 
    //styleProps['offset'] = `${offset}`;
    // utils.validateIsStyleProps(styleProps);
    return styleProps;
}

function applyStyleArray(obj, styleArray) {
    // utils.validateIsElement(obj);
    // utils.validateIsStyleArray(styleArray);
    const rgb = styleArray.slice(0,3);
    obj.style.color = utils.get_Hex_from_RGB(rgb);
    obj.style.backgroundColor = utils.get_Hex_from_RGB(styleArray.slice(3,6));
    if ( !isCardDivLineItem(obj) ) { // positionals
        obj.style.left = styleArray[6] + 'px';
        obj.style.top = styleArray[7] + 'px';
        var z = styleArray[8];
        obj.style.zIndex = get_zIndexStr_from_z(z);
        obj.style.filter = get_filterStr_from_z(z);
    }
}

// function getStyleArrayFromStyleProps(div, styleProps) {
//     // utils.validateIsDivElement(div);
//     // utils.validateIsStyleProps(styleProps);
//     var styleArray = [];
//     var RGB = utils.get_RGB_from_Hex(styleProps.color);
//     styleArray.push(...RGB);
//     var RGB = utils.get_RGB_from_Hex(styleProps.backgroundColor);
//     styleArray.push(...RGB);
//     if ( !isCardDivLineItem(div) ) { // positionals
//         styleArray.push(div.offsetLeft)
//         styleArray.push(div.offsetTop)
//         var z = get_z_from_zIndexStr(styleProps.zIndex);
//         styleArray.push(z);
//     } else {
//         styleArray = styleArray.concat([0,0,0]);
//     }
//     // utils.validateIsStyleArray(styleArray);
//     return styleArray;
// }

// function getStylePropsFromStyleArray(div, styleArray) {
//     // utils.validateIsDivElement(div);
//     // utils.validateIsStyleArray(styleArray); 
//     var styleProps={};
//     styleProps.color = utils.get_Hex_from_RGB(styleArray.slice(0,3));
//     styleProps.backgroundColor = utils.get_Hex_from_RGB(styleArray.slice(3,6));
//     if ( !isCardDivLineItem(div) ) { // positionals
//         styleProps.left = styleArray[6] + 'px';
//         styleProps.top = styleArray[7] + 'px';
//         var z = styleArray[8];
//         styleProps.zIndex = get_zIndexStr_from_z(z);
//         styleProps.filter = get_filterStr_from_z(z);
//     }
//     // utils.validateIsStyleProps(styleProps);
//     return styleProps;
// }


// ------------------------------------------------------------
// theSelectedCardDiv vars, constants and functions

var theSelectedCardDiv = null;
var theSelectedCardDivLineItem = null;

const SELECTED_CARD_DIV_Z = -10;
const SELECTED_CARD_DIV_ZINDEX_STR = get_zIndexStr_from_z(SELECTED_CARD_DIV_Z);
const SELECTED_CARD_DIV_FILTER_STR = get_filterStr_from_z(SELECTED_CARD_DIV_Z);

function scrollElementIntoView(element) {
    // utils.validateIsElement(element);
    if ( element == null )
        throw new Error("null element");
    else if ( element.id == null )
        throw new Error("null element.id");
    else if (isBizcardDiv(element) || isCardDivLineItem(element))
        scrollElementToStart(element);
    else if (isCardDiv(element) )
        scrollElementToCenter(element);
    else
        throw new Error("unhandled element with id:" + element.id)
}

function scrollElementToStart(element) {
    // utils.validateIsElement(element);
    element.scrollIntoView({ behavior:'smooth',block: 'start'});
}

function scrollElementToCenter(element) {
    // utils.validateIsElement(element);
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

// select the given cardDiv
function selectTheCardDiv(cardDiv, selectTheCardDivLineItemFlag=false) {
    if ( cardDiv == null )
        return;
    // utils.validateIsCardDivOrBizcardDiv(cardDiv);
    // utils.validateIsBoolean(selectTheCardDivLineItemFlag);

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
        // console.assert( cardDivLineItem != null );
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
        // utils.validateIsCardDivOrBizcardDiv(theSelectedCardDiv);
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

function selectTheCardDivLineItem(cardDivLineItem, selectTheCardDivFlag=false) {
    if ( cardDivLineItem == null )
        return;
    // utils.validateIsCardDivLineItem(cardDivLineItem);
    // utils.validateIsBoolean(selectTheCardDivFlag);

    // does scroll self into view
    scrollElementToStart(cardDivLineItem);

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
        scrollElementIntoView(cardDiv);
    }
    
    debugTheSelectedCardDivId();
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
    debugTheSelectedCardDivId();
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
            cardDivLineItemContent.innerHTML = targetInnerHTML;
        }

        // if targetCardDiv has a "Description" attribute
        var description = targetCardDiv.getAttribute("Description");
        if (description && description.length > 0) {
            // split the description by BULLET_DELIMITER and return html 
            // of the styled form <p><ul>(<li>text</li>)+</ul></p>
            // where text contains spans that have targetCardDivIds
            var line_items_HTML = convert_description_HTML_to_line_items_HTML(description);
            if (line_items_HTML && line_items_HTML.length > 0) {

                // ensure line_items_HTML includes no img tag markup
                // if (line_items_HTML.includes("<img"))
                //     line_items_HTML = removeImgTagsFromHtml(line_items_HTML);

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
        // console.log(`returning preexisting cardDivLineItem for targetCardDivId:${targetCardDivId}`);
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

// tagLink is an HTML string span#tagLink-card-dive-8.tagLink { title:'', translate"true, dir: '', hidden: false, 
function addTagLinkClickListener(tagLink) {
    // console.assert(tagLink != null);
    tagLink.addEventListener("click", function (event) {
        var tagLinkId = event.target.id;
        // get the cardDivId from the tagLinkId
        var cardDivId = tagLinkId.replace("tagLink-", "");
        // find the cardDivId is of the form "card-div-<int>""
        var cardDiv = document.getElementById(cardDivId);
        if (cardDiv) {
            var tagLinkText = cardDiv.getAttribute("tagLinkText");
            var tagLinkUrl = cardDiv.getAttribute("tagLinkUrl");
            // console.assert(tagLinkText != null && tagLinkUrl != null);

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
    // utils.validateIsCardDivOrBizcardDiv(cardDiv);
    var cardDivLineItem = getCardDivLineItem(cardDiv.id)

    // avoid in case another select would ignore the select
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
    // utils.validateIsBizcardDiv(bizcardDiv);
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
    // console.assert(nextBizcardDivId !== null);
    var nextBizcardDiv = document.getElementById(nextBizcardDivId);
    // console.assert(nextBizcardDiv !== null);

    // select the nextBizcardDiv and its cardDivItem
    selectTheCardDiv(nextBizcardDiv, true);

}

function selectFirstBizcard() {
    var firstDivId = getFirstBizcardDivId();
    var firstDiv = document.getElementById(firstDivId);
    // utils.validateIsBizcardDiv(firstDiv);

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
        // console.assert(isBizcardDivId(lastBizcardDivId));
        var lastBizcardDiv = document.getElementById(lastBizcardDivId);
        validateIsBizcardDiv(lastBizcardDiv);
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

