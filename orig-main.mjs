
// @ts-nocheck
'use strict';

import * as utils from './modules/utils.mjs';
import * as timeline from './modules/timeline.mjs';
import * as focalPoint from './modules/focal_point.mjs';
import * as monoColor from './modules/monoColor.mjs';
import * as alerts from './modules/alerts.mjs';

// --------------------------------------
// Element reference globals

const rightContentDiv = document.getElementById("right-content-div");
// const debugScrollingElement = null; //  = document.getElementById("debugScrollingElement");
// const debugFocalPointElement = null; //  = document.getElementById("debugFocalPointElement");
// const debugTheSelectedCardDivIdElement = null; //  = document.getElementById("debugTheSelectedCardDivIdElement");
const sceneContainer = document.getElementById("scene-container");
const scene-div = document.getElementById("scene-div");
const bottomGradient = document.getElementById("bottom-gradient");
const bullsEye = document.getElementById("bulls-eye");
const selectFirstBizCardButton = document.getElementById("select-first-bizCard");
const selectNextBizCardButton = document.getElementById("select-next-bizCard");
const selectAllBizCardsButton = document.getElementById("select-all-bizCards");
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
// BizCardDiv globals

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
// Default mouse behavior: prevent selections while mouse is fown
document.addEventListener('mousedown', function() {
    document.body.classList.add('no-select');
    document.getElementById("scene-container").classList.add('no-select');
});

document.addEventListener('mouseup', function() {
    document.body.classList.remove('no-select');
    document.getElementById("scene-container").classList.remove('no-select');
});

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
// BizCardDiv and cardDiv functions

function isBizCardDiv(div) {
    return div != null && div.classList.contains('bizCard-div') ? true : false;
}
function isAnyCardDiv(div) {
    return div != null && div.classList.contains('card-div') ? true : false;
}
function isBizCardDivId(divId) {
    return utils.isString(divId) && getBizCardDivIndex(divId) == null ? false : true;
}
function isCardDivId(divId) {
    return utils.isString(divId) && getCardDivIndex(divId) == null ? false : true;
}
function isCardDivLineItem(div) {
    return div != null && div.classList.contains('card-div-line-item') ? true : false;
}

// returns 99 for bizCard-div-99' or null
function getBizCardDivIndex(cardDivId) {
    // console.assert(utils.isString(cardDivId));
    if (cardDivId.startsWith("bizCard-div-")) {
        var index = parseInt(cardDivId.replace("bizCard-div-", ""));
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

// returns true if a bizCardDiv exists for the given index, else null
function getBizCardDivIdFromIndex(index) {
    // console.assert(utils.isNumber(index));
    var bizCardDivId = `bizCard-div-${index}`;
    var bizCardDiv = document.getElementById(bizCardDivId);
    return (bizCardDiv && bizCardDiv.id == bizCardDivId) ? bizCardDivId : null;
}

// .BizCard-divs are never deleted so next id
// is just the current number of the .BizCard-divs
function getNextBizCardDivId() {
    const bizCardDivs = document.getElementsByClassName("bizCard-div");
    const nextBizCardDivId = `bizCard-div-${bizCardDivs.length}`;
    return nextBizCardDivId;
}

// Use the "jobs" array to gather data used for
// the large "business cards" floating near 
// the ground level describing employment history.
//
// Also parse each job's description to pull out 
// the shared "skills" from the narrative pf each.
//  
function createBizCardDivs() {
    
    var sortedJobs = structuredClone(jobs);
    sortedJobs.sort((a,b) => new Date(b['end']) - new Date(a['end']));

    for ( const job of sortedJobs ) {
        // utils.validateKey(job, "role");
        var role = job[ "role" ];

        // utils.validateString(role);
        var employer = job[ "employer" ].trim();
        // utils.validateString(employer);

        // utils.validateKey(job, "css RGB");
        var css_hex_background_color_str = job[ "css RGB" ].trim().toUpperCase();
        utils.validateHexColorString(css_hex_background_color_str);

        // utils.validateKey(job, "text color");
        var css_hex_color_str = utils.computeTextColor(css_hex_background_color_str);
        utils.validateHexColorString(css_hex_color_str);

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
        var zIndexStr = job[ "z-index" ];
        var zIndex = parseInt(zIndexStr);
        var z = get_z_from_zIndexStr(zIndexStr);
        var indent = (zIndex - 1) * BIZCARD_INDENT;

        // here we go
        var bizCardDiv = document.createElement("div");
        // console.assert(bizCardDiv != null);
        var top = endBottomPx;
        // console.assert(top > 0, "Q");
        var height = heightPx;
        var left = indent;
        var width = BIZCARD_WIDTH;

        bizCardDiv.id = getNextBizCardDivId();
        bizCardDiv.classList.add("bizCard-div");
        bizCardDiv.style.top = `${top}px`;
        bizCardDiv.style.height = `${height}px`;
        bizCardDiv.style.left = `${left}px`;
        bizCardDiv.style.width = `${width}px`;
        bizCardDiv.style.zIndex = zIndexStr;

        scene-div.appendChild(bizCardDiv);
        bizCardDiv.dataset.employer = employer;
        bizCardDiv.dataset.cardDivIds = [];
        try {
            //console.log(`startDate:[${endDate}]`);
            bizCardDiv.setAttribute("endDate", utils.getIsoDateString(endDate));
        } catch (e) {
            console.error(e);
        }
        bizCardDiv.setAttribute("startDate", utils.getIsoDateString(startDate));

        // save the bizCardDiv's original center 
        var originalCtrX = left + width / 2;
        var originalCtrY = top + height / 2;
        var originalZ = z;
        bizCardDiv.setAttribute("originalLeft", `${bizCardDiv.offsetLeft}`);
        bizCardDiv.setAttribute("originalTop", `${bizCardDiv.offsetTop}`);
        // console.assert(bizCardDiv.offsetTop > 0, 'L');
        // console.assert(parseInt(bizCardDiv.getAttribute("originalTop")) > 0, 'M');
        bizCardDiv.setAttribute("originalWidth", `${bizCardDiv.offsetWidth}`);
        bizCardDiv.setAttribute("originalHeight", `${bizCardDiv.offsetHeight}`);
        bizCardDiv.setAttribute("originalCtrX", `${originalCtrX}`);
        bizCardDiv.setAttribute("originalCtrY", `${originalCtrY}`);
        bizCardDiv.setAttribute("originalZ", `${originalZ}`);

        bizCardDiv.setAttribute("saved-background-color", css_hex_background_color_str);
        bizCardDiv.setAttribute("saved-color", css_hex_color_str);
        var adjustedHexBackgroundColor = utils.adjustHexBrightness(css_hex_background_color_str, 1.7);
        utils.validateHexColorString(adjustedHexBackgroundColor);
        bizCardDiv.setAttribute("saved-selected-background-color", adjustedHexBackgroundColor);
        utils.validateHexColorString(css_hex_color_str);
        bizCardDiv.setAttribute("saved-selected-color", css_hex_color_str);

        bizCardDiv.setAttribute("saved-zIndexStr", zIndexStr);
        bizCardDiv.setAttribute("saved-filterStr", get_filterStr_from_z(z));

        bizCardDiv.style.zIndex = bizCardDiv.getAttribute("saved-zIndexStr") || "";
        bizCardDiv.style.filter = bizCardDiv.getAttribute("saved-filterStr") || "";
        bizCardDiv.style.backgroundColor = bizCardDiv.getAttribute("saved-background-color") || "";
        bizCardDiv.style.color = bizCardDiv.getAttribute("saved-color") || "";

        var description_raw = job[ "Description" ];
        if (description_raw && description_raw.length > 0) {
            // utils.validateString(description_raw);
            const [description_HTML, bizCardTagLinks] = process_bizCard_description_HTML(bizCardDiv, description_raw);
            bizCardDiv.setAttribute("Description", description_HTML);
            bizCardDiv.setAttribute("TagLinks", JSON.stringify(bizCardTagLinks));
        }

        var html = "";
        html += `<span class="bizCard-div-role">${role}</span><br/>`;
        html += `(${bizCardDiv.id})<br/>`;
        html += `<span class="bizCard-div-employer">${employer}</span><br/>`;
        html += `<span class="bizCard-div-dates">${jobStartStr} - ${jobEndStr}</span><br/>`;
        bizCardDiv.innerHTML = html;

        bizCardDiv.addEventListener("mouseenter", handleCardDivMouseEnter);
        bizCardDiv.addEventListener("mouseleave", handleCardDivMouseLeave);

        utils.validateIsCardDivOrBizCardDiv(bizCardDiv);
        addCardDivClickListener(bizCardDiv);
        // does not select self
        // does not scroll self into view

    }

    // Dispatch a custom event after appending all bizCards
    const event = new Event('bizCardsAppended');
    document.dispatchEvent(event);
}


// --------------------------------------
// tag_link globals

// the global set of tagLinks created while creating all .BizCard-divs from
// the list of all `job` objects defined in "static_content/jobs.mjs"
var allTagLinks = [];

function initAllTagLinks() {
    allTagLinks = [];
}

// Use the BULLET_DELIMITER as separator to split the
// `bizCard_description` into a list of `description_items`.
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
function process_bizCard_description_HTML(bizCardDiv, description_HTML) {
    // console.assert(bizCardDiv != null);
    var processed_items = [];
    var bizCardTagLinks = [];
    var description_items = description_HTML.split(BULLET_DELIMITER);
    if (description_items.length > 0) {
        for (var i = 0; i < description_items.length; i++) {
            var description_item = description_items[ i ].trim();
            if (description_item.length > 0) {
                var { newTagLinks, updatedString } = process_bizCard_description_item(bizCardDiv, description_item);
                if (updatedString && updatedString.length > 0)
                    processed_items.push(updatedString);
                if (newTagLinks && newTagLinks.length > 0)
                    // update the global list of allTagLinks 
                    // created from description_HTML of all .BizCard-divs
                    allTagLinks = allTagLinks.concat(newTagLinks);
                    bizCardTagLinks = bizCardTagLinks.concat(newTagLinks);
            }
        }
    } 
    var processed_bizCard_description_HTML = description_HTML;
    if (processed_items.length > 0)
        processed_bizCard_description_HTML = processed_items.join(BULLET_JOINER);
    // console.log("bizCardTagLinks:" + bizCardTagLinks.length  + " [" + debugTagLinksToStr(bizCardTagLinks) + "]")
    return [processed_bizCard_description_HTML, bizCardTagLinks];
}

function createUrlAnchorTag(url, savedColor) {
    let iconColor = monoColor.getIconColor(savedColor);
    let iconType = "url";
    let html = `<img class="icon ${iconType}-icon mono-color-sensitive" src="static_content/icons/icons8-${iconType}-16-${iconColor}.png" data-url="${url}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
    return html;
}

function createImgAnchorTag(img, savedColor) {
    let iconColor = monoColor.getIconColor(savedColor);
    let iconType = "img";
    let html = `<img class="icon img-icon mono-color-sensitive" src="static_content/icons/icons8-${iconType}-16-${iconColor}.png" data-img="${img}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
    return html;
}

function createBackAnchorTag(bizCard_id, savedColor, isMonocolorSensitive=true) {
    let iconColor = monoColor.getIconColor(savedColor);
    let iconType = "back";
    let monoColorSensitiveClass = isMonocolorSensitive ? "mono-color-sensitive" : '';
    let html = `<img class="icon back-icon ${monoColorSensitiveClass}" src="static_content/icons/icons8-${iconType}-16-${iconColor}.png" data-bizCard-id="${bizCard_id}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
    return html;
}

// This function takes an inputString, applies the regular expression to extract the 
// newTagLink objects with properties text, img, url, and html, and then replaces 
// these newTagLinks in the original string with their html values. The function return 
// both the list of newTagLinks and the updatedString with embedded HTML elements.

function process_bizCard_description_item(bizCardDiv, inputString) {
    if ( typeof bizCardDiv.id === 'undefined' || bizCardDiv.id === null || bizCardDiv.id === '')
        throw new Error(`bizCardDiv:${bizCardDiv} must have an id attribute`);
    if ( typeof bizCardDiv.style.color === 'undefined' || bizCardDiv.style.color === null || bizCardDiv.style.color === '')     
        throw new Error(`bizCardDiv:${bizCardDiv.id} must have a style.color attribute`);

    // remove the ignorable placeholders
    inputString = inputString.replace(/\(url\)/g, '');
    inputString = inputString.replace(/\{img\}/g, '');
        
    //const regex = /\[([^\]]+)\](\{(.+?)\})?\((.+?)\)/;
    //const regex = /\[([\w\s\:\-\|\/]+)\](\{[\w\/\-\.]+\})?(\(https?:\/\/[\w\/\.\-\?\=\&]+\))?/;
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
            bizCardDivId: bizCardDiv.id
        };
    });

    // create an htmlElement for each newTagLink
    let updatedString = inputString;

    newTagLinks.forEach(tag_link => {
        const text = tag_link.text;
        const img = tag_link.img ? tag_link.img : '';
        const url = tag_link.url ? tag_link.url : '';

        var savedColor = bizCardDiv.getAttribute('saved-color') || '';

        if (typeof savedColor === 'undefined' || savedColor === null || savedColor === '') {
            throw new Error(`bizCardDiv:${bizCardDiv.id} must have a saved-color attribute`);
        } 
    
        let htmlElementStr = '';
    
        if (text) {
            // Initialize the htmlElement with just underlined text
            htmlElementStr = `<u>${text}</u>`;
            var line2 = '';
        
            // If img is defined, add an anchor tag wrapping the local img.png
            if (img) {
                line2 += createImgAnchorTag(img, savedColor);
            }
            
            // If url is defined, add an anchor tag wrapping the local geo.png
            if (url) {
                line2 += createUrlAnchorTag(url, savedColor);
            }

            // always add the initial backAnchorTag
            line2 += createBackAnchorTag(bizCardDiv.id, savedColor);

            htmlElementStr += '<br/>' + line2;
            if ( htmlElementStr.includes('undefined')) {
                throw new Error(`htmlElementStr:${htmlElementStr} must not have any undefined values`);
            }
        }
        tag_link.html = htmlElementStr;

        // find or create the cardDiv that matches this tag_link and use it to set the tag_link's "cardDivId" property
        setCardDivIdOfTagLink(bizCardDiv, tag_link);
        
        // create a tag_link span element with the targetCardDivId attribute and the htmlElementStr as its innerHTML
        let htmlSpanElementStr = `<span class="tag-link" data-saved-color="${savedColor}" targetCardDivId="${tag_link.cardDivId}">${htmlElementStr}</span>`;

        // reconstruct the original pattern
        let originalPattern = `[${text}]`;
        if ( tag_link.img.length > 0 )
            originalPattern += `{${tag_link.img}}`;
        if (tag_link.url.length > 0) 
            originalPattern += `(${tag_link.url})`;

         // Replace the original pattern with the new HTML element
         updatedString = updatedString.replace(originalPattern, htmlSpanElementStr);
         if ( updatedString.includes('undefined') ) {
            throw new Error(`updatedString:${updatedString} must not have an undefined attribute`);
        }
    });

    return { newTagLinks, updatedString };
}

// find or create a cardDiv and use it
// to set the tag_link's "cardDivId" property
// otherwise create a new cardDiv
function setCardDivIdOfTagLink(bizCardDiv, tag_link) {
    // console.assert(bizCardDiv != null && tag_link != null);
    var cardDiv = findCardDiv(bizCardDiv, tag_link);
    if (!cardDiv) {
        cardDiv = createCardDiv(bizCardDiv, tag_link);
    }
    tag_link.cardDivId = cardDiv.id;
    let comma = (bizCardDiv.dataset.cardDivIds.length > 0) ? ',' : '';
    bizCardDiv.dataset.cardDivIds += comma + cardDiv.id;
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
                        console.log(`iconElement iconType:${iconType} click: ${url} title: [${title}]`);
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
                        console.log(`iconElement iconType:${iconType} click: ${img} title: [${title}]`);
                        alerts.confirmOpenNewBrowserWindow(title, img);
                    } else {
                        console.error(`iconElement iconType:${iconType} click: no img`);
                    }
                    break;
                }
                case 'back': {
                    const bizCardId = iconElement.dataset.bizCardId; // from data-bizCard-id
                    if (bizCardId) {
                        const bizCardDiv = document.getElementById(bizCardId);
                        if (bizCardDiv) {
                            console.log(`iconElement click: ${bizCardId}`);
                            selectTheCardDiv(bizCardDiv, true);
                            // scrollElementIntoView(bizCardDiv);
                        } else {
                            console.error(`iconElement iconType:${iconType} click: no bizCardDiv with id:${bizCardId}`);
                        }   
                    }
                    else {
                        console.error(`iconElement iconType:${iconType} click: no bizCard_id`);
                    }
                    break;
                }
                default: {
                    console.error(`iconElement click: illegal iconType:${iconType}`);
                    break;
                }
            }
        } else {
            // console.log(`iconElement click: no iconElement`);
        }
        event.stopPropagation();
    });

    const linkedinIcon = document.querySelector('img.linkedin.icon');
    linkedinIcon.addEventListener("click", (event) => {
        const iconElement = event.target;
        event.stopPropagation();
        const url = "https://www.linkedin.com/in/shawnbecker";
        const title = "Shawn's LinkedIn profile";
        console.log(`linkedinIcon click: ${url} title: [${title}]`);
        alerts.confirmOpenNewBrowserWindow(title, url);
    });

    const sankeyIcon = document.querySelector('img.sankey.icon');
    sankeyIcon.addEventListener("click", (event) => {
        const iconElement = event.target;
        event.stopPropagation();
        const img = "static_content/graphics/sankeymatic_20240104_204625_2400x1600.png";
        const title = "a SankeyMatic&copy; diagram of Shawn's technical proficiencies";
        console.log(`sankeyIcon click: ${img} title: [${title}]`);
        alerts.confirmOpenNewBrowserWindow(title, img);
    });


}

function getBizCardDivDays(bizCardDiv) {
    const endMillis = getBizCardDivEndDate(bizCardDiv).getTime();
    const startMillis = getBizCardDivStartDate(bizCardDiv).getTime();
    const bizCardMillis = endMillis - startMillis;
    // console.log(`bizCardDiv.id:${bizCardDiv.id} bizCardMillis:${bizCardMillis}`);
    const bizCardDivDays = bizCardMillis / (1000 * 60 * 60 * 24);
    // console.log(`bizCardDiv.id:${bizCardDiv.id} bizCardDivDays:${bizCardDivDays}`);
    return parseInt(bizCardDivDays);
}

// this is an Order(N) search that could be optimized.
function findCardDiv(bizCardDiv, tag_link) {
    var cardDivs = document.getElementsByClassName("card-div");
    for (let cardDiv of cardDivs) {
        if (cardDivMatchesTagLink(cardDiv, tag_link)) {
            // found a match so add a backIcon if needed
            let backIcons = cardDiv.getElementsByClassName("back-icon");
            var numFound = 0;
            for ( let i = 0; i < backIcons.length; i++ ) {
                let backIcon = backIcons[i];
                if ( backIcon.dataset.bizCardId === bizCardDiv.id ) {
                    numFound++;
                }
            }
            // if no backIcon found for this bizCardDiv then add one
            if ( numFound === 0 ) {
                // default the colors from the bizCardDiv
                var savedColor = cardDiv.getAttribute('saved-color') || '';
                let newBackAnchorTag = createBackAnchorTag(bizCardDiv.id, savedColor, false);
                let spanTagLink = cardDiv.querySelector('span.tag-link');
                if ( spanTagLink ) {
                    spanTagLink.innerHTML += newBackAnchorTag;
                } else {
                    throw new Error(`cardDiv:${cardDiv.id} must have a span.tag-link element`);
                }
                let days = parseInt(cardDiv.dataset.bizCardDivDays);
                days += getBizCardDivDays(bizCardDiv);
                cardDiv.dataset.bizCardDivDays = days
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
// of a card-div (or bizCard-div) and splits it by
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

// adds a new cardDivs to #scene-div
// default center x to zero and center y to
// id * TOP_TO_TOP.
// give each random x,y offsets and random
// z levels, and z-varied brightness and blur.
// return the newly created cardDiv that has 
// been appended to its parent scene-div.
function createCardDiv(bizCardDiv, tag_link) {
    // console.assert(bizCardDiv != null && tag_link != null);
    var cardDivId = getNextCardDivId();
    var cardDiv = document.createElement('div');
    cardDiv.classList.add("card-div");
    utils.validateIsCardDivOrBizCardDiv(cardDiv);

    cardDiv.tag_link = tag_link;
    cardDiv.id = cardDivId; 
    scene-div.appendChild(cardDiv); 
    cardDiv.dataset.bizCardDivDays = getBizCardDivDays(bizCardDiv);

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

    // inherit colors of bizCardDiv
    cardDiv.setAttribute("bizCardDivId", bizCardDiv.id);
    copyHexColorAttributes(cardDiv, bizCardDiv, [
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

    // the tag_link is used to define the contents of this cardDiv
    const spanId = `tag_link-${cardDivId}`;
    let savedColor = cardDiv.getAttribute("saved-color");

    // define the innerHTML when cardDiv is added to #scene-div
    cardDiv.innerHTML = `<span id="${spanId}" data-saved-color="${savedColor}" class="tag-link" targetCardDivId="${cardDivId}">${tag_link.html}</span>`;

    const spanElement = document.getElementById(spanId);
    if (spanElement) {
        spanElement.style.color = cardDiv.style.color;
    }

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

    // add the cardDivClickListener to all cardDiv descendants 
    // except icon elements
    let cardDivDescendants = cardDiv.querySelectorAll('*');
    for ( let decendent of cardDivDescendants ) {
        if ( !decendent.classList.contains('icon') ) {
            addCardDivClickListener(cardDiv);
        }
    }

    renderAllTranslateableDivsAtsceneContainerCenter();

    cardDiv.setAttribute("tagLinkText", tag_link[ "text" ]);
    cardDiv.setAttribute("tagLinkUrl", tag_link[ "url" ]);
    cardDiv.setAttribute("tagLinkImg", tag_link[ "img" ]);

    // all elements of cardDiv are not mono-color-sensitive
    let monocolorElements = Array.from(cardDiv.getElementsByClassName("mono-color-sensitive"));
    for (let monocolorElement of monocolorElements) {
        monocolorElement.classList.remove("mono-color-sensitive");
    }

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
  
// write the exmployer of each bizCardDiv and the ext of each of its cardDivs
export function logAllBizCardDivs() {
    let allBizCardDivs = document.getElementsByClassName("bizCard-div");
    let showSkips = false;
    var log = "";
    console.log('---------------------------------------------------');
    for (let bizCardDiv of allBizCardDivs) {
        let employer = bizCardDiv.dataset.employer;
        if (employer === undefined || employer === null) {
            continue;
        }
        let cardDivIds = bizCardDiv.dataset.cardDivIds;
        if ( cardDivIds.length > 0 ) {
            var cardDivTuples = [];
            for (let cardDivId of cardDivIds.split(',')) {
                let cardDiv = document.getElementById(cardDivId);
                if (cardDiv === null) {
                    console.log(`No element with id cardDivId:${cardDivId}`);
                    continue;
                }
                let cardDivText = cardDiv.getAttribute('tagLinkText').trim();
                if ( cardDivText === undefined || cardDivText == null ) {
                    continue;
                }
                let months = Math.round(cardDiv.dataset.bizCardDivDays * 12 / 365.25);
                let years = Math.round(months / 12);
                if ( cardDivText.includes('“') ) {
                    if ( showSkips ) console.log("skip", cardDivText, years);
                    continue;
                }
                if ( cardDivText == "CentOS Linux" ) {
                    cardDivText = "Linux";
                }
                if ( cardDivText == 'Linix' ) {
                    cardDivText = 'Linux';
                }
                if ( employer == 'Greenseed Tech' ) {
                    employer = 'Data Laboratory';
                }
                if ( employer == 'Warner Brothers Interactive Entertainment' ) {
                    employer = 'Warner Bros';
                }
                let keep = [
                    "Python",
                    "Redshift",
                    "Glue",
                    "PostgreSQL",
                    "Airflow",
                    "Kinesis",
                    "AWS",
                    "REST",
                    "REST API",
                    "Docker",
                    "Linux",
                    "bash",
                    "Spring",
                    "Cimmetrix",
                    "Akamai",
                    "Jenkins",
                    "Jira",
                    "PySpark",
                    "Oracle",
                    "MySQL",
                    "Vue"
                ];
                if ( isWordSubstringInList(cardDivText, keep) || years >= 8) {
                } else {
                    if ( showSkips ) console.log("skip", cardDivText, years);
                    continue;
                }
                let ignores = [
                    "Massachusetts Institute of Technology",
                    "Trimble Mobile Solutions",
                    "OneCall",
                    "HomePortfolio.com",
                    "HomePortfolio",
                    "Brigham Young University",
                    "four patents",
                    "X11",
                    "XMotif",
                    "API Gateway",
                    "OpenAPI",
                ];
                if ( ignores.includes(cardDivText) ) {
                    if ( showSkips ) console.log("skip", cardDivText, years);
                    continue;
                }
                if ( employer.includes(cardDivText) ) {
                    if ( showSkips ) console.log("skip", cardDivText, years);
                    continue;
                }
                if ( cardDivText.includes(employer) ) {
                    if ( showSkips ) console.log("skip", cardDivText, years);
                    continue;
                }
                cardDivTuples.push([employer,cardDivText]);
            }
            // Sorting function to compare the uppercase values of tuple[1]
            const sortByUppercaseValue = (a, b) => {
                const uppercaseA = a[1].toUpperCase();
                const uppercaseB = b[1].toUpperCase();
            
                if (uppercaseA < uppercaseB) return -1;
                if (uppercaseA > uppercaseB) return 1;
                return 0;
            };

            // Sort the array using the sorting function
            cardDivTuples.sort(sortByUppercaseValue);

            // Filter the array to keep only the first occurrence of each uppercase value
            const uniqueTuples = cardDivTuples.filter((tuple, index, arr) => {
                const currentUppercaseValue = tuple[1].toUpperCase();
                const firstIndexOfValue = arr.findIndex((t) => t[1].toUpperCase() === currentUppercaseValue);
                return index === firstIndexOfValue;
            });

            for( let tpl of uniqueTuples ) {
                log += `${tpl[0]} [1] ${tpl[1]}\n`;
            }
        }
    }
    console.log(log);
    console.log('---------------------------------------------------');
}

function copyHexColorAttributes(dstDiv, srcDiv, attrs) {
    // console.assert(dstDiv != null && srcDiv != null && attrs != null);
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[ i ];
        var srcVal = srcDiv.getAttribute(attr);
        utils.validateHexColorString(srcVal);
        if (typeof srcVal === 'undefined' || srcVal === null || srcVal === '')
            throw new Error(`srcDiv:${srcDiv.id} must have a ${attr} attribute`);
        // console.assert(utils.isString(srcVal), `attr:${attr} src:${srcVal}`);
        dstDiv.setAttribute(attr, srcVal);
        var dstVal = dstDiv.getAttribute(attr);
        // console.assert(dstVal == srcVal, `attr:${attr} dst:${dstVal} != src:${srcVal}`);
        // console.log(`${dstDiv.id} ${attr} = ${srcDiv.id} ${srcVal}`);
    }
}

/**
 * Summary. Returns the translate string used to transform
 * any cardDiv's x,y coordinates into scene-div-relative coordinates.
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
 * @param {number}  sceneContainer_dx    the x value used to convert cardDiv.x to sceneContainer-relative position
 * @param {number}  sceneContainer_dy    the y value used to convert cardDiv.y to sceneContainer-relative position
 *
 * @return {string} Return a string with format "12.02px -156.79px"
 */

function getZTranslateStr(dh, dv, z, sceneContainer_dx, sceneContainer_dy) {
    // z ranges from 0 (closest) to viewer to MAX_Z furthest from viewer
    // zindex ranges MAX_Z (closest to viewer) to 1 furthest from viewer
    var zIndex = parseInt(get_zIndexStr_from_z(z));
    var zScale = (zIndex <= ALL_CARDS_MAX_Z) ? zIndex : 0.0;

    // by definition, divs have zero mean hzCtrs so scene-div translation is required
    var dx = dh * zScale + sceneContainer_dx;
    var dy = dv * zScale + 0; // sceneContainer_dy;
    var zTranslateStr = `${dx}px ${dy}px`;

    return zTranslateStr;
}

// return all bizCardDivs and cardDivs lazy-loaded
function getAllTranslateableCardDivs() {
    var allDivs = [];
    allDivs = Array.prototype.concat.apply(
        allDivs,
        scene-div.getElementsByClassName("bizCard-div")
    );
    allDivs = Array.prototype.concat.apply(
        allDivs,
        scene-div.getElementsByClassName("card-div")
    );
    return allDivs;
}

// uses the given newStyleProps to apply parallax to the given cardDiv
// and returns the updated styleProps of the parallaxed cardDiv
function applyParallaxToOneCardDivStyleProps(cardDiv, newStyleProps ) {
    // utils.validateIsCardDivOrBizCardDiv(cardDiv);
    // utils.validateIsStyleProps(newStyleProps);

    var { parallaxX, parallaxY } = getParallax();
    const sceneContainerX = utils.half(sceneContainer.offsetWidth);
    const sceneContainerY = utils.half(sceneContainer.offsetHeight);

    // constants for this parallax
    const dh = parallaxX * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = parallaxY * PARALLAX_Y_EXAGGERATION_FACTOR;

    // compute and apply translations to this translatableDiv
    var zIndexStr = newStyleProps.zIndex;

    var z = get_z_from_zIndexStr(zIndexStr);

    var cardDivX = utils.half(cardDiv.offsetWidth);
    var cardDivY = utils.half(cardDiv.offsetHeight);

    // sceneContainer-relative cardDiv center
    var sceneContainer_dx = sceneContainerX - cardDivX;
    var sceneContainer_dy = sceneContainerY - cardDivY;

    var zTranslateStr = getZTranslateStr(dh, dv, z, sceneContainer_dx, sceneContainer_dy);

    try {
        cardDiv.style.translate = zTranslateStr;
    } catch (error) {
        // console.error(`applyParallax cardDiv:${cardDiv.id}`, error);
    }
    const parallaxedStyleProps = utils.getStyleProps(cardDiv);
    return parallaxedStyleProps;
}

function applyParallaxToOneCardDiv(cardDiv) {
    // utils.validateIsCardDivOrBizCardDiv(cardDiv);
    const cardDivStyleProps = utils.getStyleProps(cardDiv);
    // utils.validateIsStyleProps(cardDivStyleProps);
    applyParallaxToOneCardDivStyleProps(cardDiv,cardDivStyleProps);
}

/**
 * applyz-depth scaled parallax to all translateableDiv 
 * currently visible in the sceneContainer viewPort
 */
function applyParallax() {
    // let numVisible = 0;
    var allDivs = getAllTranslateableCardDivs();    
    for (var i = 0; i < allDivs.length; i++) {
        var cardDiv = allDivs[i];
        if ( isCardDivWithinViewPort(cardDiv) ) {
            applyParallaxToOneCardDiv(cardDiv); // Apply parallax to the cloned cardDiv
            // numVisible += 1;
        }
    } 
    // console.log("numVisible:", numVisible, "numDivs:", allDivs.length);
}

let mouseX;
let mouseY;

function handlesceneContainerMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    focalPoint.easeFocalPointTo(mouseX, mouseY);
    // debugFocalPoint();
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

    const topHeight = Math.floor(sceneContainer.offsetHeight / 4);
    const centerTop = topHeight;
    const centerHeight = topHeight * 2;
    const centerBottom = topHeight + centerHeight;
    const bottomHeight = topHeight;
    const scrollHeight = sceneContainer.scrollHeight;
    const scrollTop = sceneContainer.scrollTop;
    const windowHeight = sceneContainer.clientHeight;
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
                    var currentScrollTop = sceneContainer.scrollTop;
                    var newScrollTop = currentScrollTop + autoScrollVelocity;

                    // clamp newScrollTop to the boundaries
                    var minScrollTop = 0;

                    var maxScrollTop = sceneContainer.scrollHeight - sceneContainer.clientHeight;

                    newScrollTop = utils.clamp(newScrollTop, minScrollTop, maxScrollTop);

                    // if there is room to scroll 

                    if (Math.abs(sceneContainer.scrollTop - newScrollTop) > 0) {
                        // go ahead and scroll

                        sceneContainer.scrollTop = newScrollTop;
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

var isMouseOversceneContainer = false;

function handleMouseEntersceneContainer(event) {
    isMouseOversceneContainer = true;
    focalPoint.easeFocalPointTo(event.clientX, event.clientY);
    // debugFocalPoint();
}

function handleMouseLeavesceneContainer(event) {
    isMouseOversceneContainer = false;
    easeFocalPointToBullsEye();
    // debugFocalPoint();
}

var lastScrollTop = null;
var lastScrollTime = null;

function handlesceneContainerScroll(scrollEvent) {
    var thisTime = (new Date()).getTime();
    var thisScrollTop = sceneContainer.scrollTop;
    var deltaTime = (lastScrollTime != null) ? (thisTime - lastScrollTime) : null;
    var deltaTop = (lastScrollTop != null) ? (thisScrollTop - lastScrollTop) : null;
    var scrollVelocity = (deltaTime && deltaTop) ? (deltaTop) / (deltaTime) : "?";
    // debugScrolling("scroll", sceneContainer, "scrollVelocity", `${deltaTop}/${deltaTime}`);
    lastScrollTime = thisTime;
    lastScrollTop = thisScrollTop;
}

function handlesceneContainerWheel(wheelEvent) {
    focalPoint.easeFocalPointTo(wheelEvent.clientX, wheelEvent.clientY);
}

// handle mouse enter event for any div element with
// cardClass "card-div" or "bizCard-div"
function handleCardDivMouseEnter(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        setSelectedStyle(targetCardDiv);
    }
}

function handlesceneContainerMouseClick() {
    deselectTheSelectedCardDiv();
    deselectTheSelectedCardDivLineItem();
    handleFocalPointMove();
}

// handle mouse leave event for any div element with
// cardClass "card-div" or "bizCard-div"
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
      // console.log("Click blocked, animation in progress");
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
        // console.log(`endAnimation targetStyleFrame:${targetStyleFrame}`)
        const targetStyleArray = targetStyleFrame;
        // utils.validateIsStyleArray(targetStyleArray);
        applyStyleArray(div, targetStyleArray);
    }
    // console.log(`animationend for ${funcName} ${div.id}`);
    ANIMATION_IN_PROGRESS = false;
}

// works for card-div, bizCard-div, and card-div-line-item
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

        // ensure that the saved-selected-color is a hex string
        utils.ensureHexColorStringAttribute(obj, "saved-selected-color");
        utils.ensureHexColorStringAttribute(obj, "saved-selected-background-color");

        // obj.style.color = obj.getAttribute('saved-selected-color')
        // obj.style.backgroundColor = obj.getAttribute('saved-selected-background-color')

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
        for( let frame=0; frame<validateIsBizCardDiv; frame++ ) {
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

    if ( !notLineItem ) {
        let cardDivId = obj.getAttribute("targetCardDivId");
        if ( cardDivId !== null ) {
            let cardDiv = document.getElementById(cardDivId);
        }
    }

    obj.classList.add('selected');
}


// works for card-div, bizCard-div, and card-div-line-item
// currentProps describes current styling
// targetProps describes target styling
function restoreSavedStyle(obj) {
    // utils.validateIsElement(obj);
    var notLineItem =  !isCardDivLineItem(obj);
    var currentStyleArray = createStyleArray(obj, null);
    var targetStyleArray = createStyleArray(obj,"saved");

    obj.style.color = obj.getAttribute("saved-color");
    obj.style.backgroundColor = obj.getAttribute("saved-background-color");

    if (notLineItem && currentStyleArray[8] > 0) {
        currentStyleArray[8] = -25;
        // console.log("select div.id:", div.id, "currentZ should not be positive so reset to", currentProps[8]);
    }
    if (notLineItem && targetStyleArray[8] < 0) {
        targetStyleArray[8] = parseInt(obj.getAttribute('originalZ'))
        // console.log("restore div.id:", div.id,"targetZ should not be negative so reset to", currentProps[8]);
    }

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

    if ( !notLineItem ) {
        let cardDivId = obj.getAttribute("targetCardDivId");
        if ( cardDivId !== null ) { 
            let cardDiv = document.getElementById(cardDivId);
            // console.log(`RESTORED`);
            // console.log(`cardDiv.saved-background-color: ${cardDiv.getAttribute("saved-background-color")}`);
            // console.log(`lineitem.saved-background-color:${obj.getAttribute("saved-background-color")}`);
        }
    }

    obj.classList.remove('selected');
}


// prefix can be "saved" or "saved-selected"
function createStyleArray(obj, prefix) {
    // utils.validateIsElement(obj);
    let array = [];
    var RGB;
    if (prefix) { // use div.getAttribute
        array = array.concat(utils.get_RGB_from_AnyStr(obj.getAttribute(`${prefix}-color`)));
        array = array.concat(utils.get_RGB_from_AnyStr(obj.getAttribute(`${prefix}-background-color`)));
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
        array = array.concat(utils.get_RGB_from_AnyStr(obj.style.color));
        array = array.concat(utils.get_RGB_from_AnyStr(obj.style.backgroundColor));
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
    var rgbStr;
    rgbStr = utils.get_RgbStr_from_RGB(styleArray.slice(0,3));
    obj.style.color = rgbStr;
    console.assert(obj.style.color === rgbStr);

    rgbStr = utils.get_RgbStr_from_RGB(styleArray.slice(3,6));
    obj.style.backgroundColor = rgbStr;
    console.assert(obj.style.backgroundColor === rgbStr);

    if ( !isCardDivLineItem(obj) ) { // positionals
        obj.style.left = styleArray[6] + 'px';
        obj.style.top = styleArray[7] + 'px';
        var z = styleArray[8];
        obj.style.zIndex = get_zIndexStr_from_z(z);
        obj.style.filter = get_filterStr_from_z(z);
    }
}

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
    else if (isBizCardDiv(element) || isCardDivLineItem(element))
        scrollElementToTop(element);
    else if (isAnyCardDiv(element) )
        scrollElementToCenter(element);
    else if (isCardDivLineItem(element) )
        scrollElementToTop(element);
    else
        throw new Error("unhandled element with id:" + element.id)
}

function scrollElementToTop(element) {
    // console.log(`scrollElementToTop element:${element.id}`);
    const container = findNearestAncestorWithClassName(element, "scrollable-container");
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop + elementRect.top - containerRect.top;
    container.scrollTo({ top: scrollTop, behavior: 'smooth' });
}

function scrollElementToCenter(element) {
    // console.log(`scrollElementToCenter element:${element.id}`);
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

// select the given cardDiv and scroll it into view
function selectTheCardDiv(cardDiv, selectTheCardDivLineItemFlag=false) {
    if ( cardDiv == null )
        return;
    if( !utils.isCardDivOrBizCardDiv(cardDiv) ) {
        console.warn(`selectTheCardDiv ignoring invalid argument: ${cardDiv}`);
        return;
    }
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
    // console.log(`selectTheCardDiv cardDiv:${cardDiv.id}`);

    // style self as selected
    setSelectedStyle(theSelectedCardDiv);

    if ( selectTheCardDivLineItemFlag ) {
        // calls addCardDivLineItem()
        var cardDivLineItem = addCardDivLineItem(cardDiv.id);
        // console.log(`added cardDivLineItem:${cardDivLineItem.id}`);

        // console.assert( cardDivLineItem != null );
        // calls selectCardDivLineItem - does scroll self into view
        selectTheCardDivLineItem(cardDivLineItem); 
    }

    scrollElementIntoView(theSelectedCardDiv);

    // debugTheSelectedCardDivId();
}

function getTheSelectedCardDivId() {
    if ( theSelectedCardDiv != null )
       return theSelectedCardDiv.id;
    return null;
}

function deselectTheSelectedCardDiv(deselectTheSelectedCardDivLineItemFlag=false) {
    // if theSelectedCardDiv is defined
    if (theSelectedCardDiv != null) {
        // utils.validateIsCardDivOrBizCardDiv(theSelectedCardDiv);
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
// class card-div or bizCard-div or to any child
// element that has a cardDiv or bizCard-div ancestor
function addCardDivClickListener(cardDiv) {
    cardDiv.addEventListener("click", cardDivClickListener);
}

// handle mouse click event for any div element with
// cardClass "card-div" or "bizCard-div" or any child
// element that has a cardDiv or bizCard-div ancestor.
function cardDivClickListener(event) {
    let element = event.target;
    let cardDiv = element;
    if ( !utils.isCardDivOrBizCardDiv(cardDiv) ) {
        cardDiv = cardDiv.closest('.card-div, .bizCard-div');
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
        // console.log(`ignoring request to add cardDivLineItem with null targetCardDivId`);
        return;
    }

    // check to see if the cardDiv exists
    var targetCardDiv = document.getElementById(targetCardDivId);
    if (targetCardDiv == null) {
        // console.log(`no cardDiv found for targetCardDivId:${targetCardDivId}`);
        return;
    }
    // console.log(`addCardDivLineItem targetCardDivId:${targetCardDivId}`);
    // only add a card-div-line-item for this targetCardDivId if
    // it hasn't already been added
    var existingCardDivLineItem = getCardDivLineItem(targetCardDivId);
    // console.log(`existingCardDivLineItem:${existingCardDivLineItem} found for targetCardDivId:${targetCardDivId}`);
    if (existingCardDivLineItem == null) {

        var cardDivLineItem = document.createElement("li");
        // console.log(`created cardDivLineItem:${cardDivLineItem.id}`);
        cardDivLineItem.classList.add("card-div-line-item");
        //cardDivLineItem.classList.add("right-column-div-child");
        cardDivLineItem.id = "card-div-line-item-" + targetCardDivId;
        cardDivLineItem.setAttribute("targetCardDivId", targetCardDivId);

        // add click listener
        addCardDivLineItemClickListener(cardDivLineItem, targetCardDiv);

        // inherit colors of targetCardDiv
        copyHexColorAttributes(cardDivLineItem, targetCardDiv, [
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
        cardDivLineItemContent.classList.add("mono-color-sensitive");
        cardDivLineItemContent.style.backgroundColor = 'transparent';
        cardDivLineItemContent.style.color = targetCardDiv.getAttribute("saved-color") || "";
        cardDivLineItemContent.dataset.savedColor = targetCardDiv.getAttribute("saved-color") || "";

        // set right column
        var cardDivLineItemRightColumn = document.createElement('div')
        cardDivLineItemRightColumn.classList.add("card-div-line-item-right-column");
        cardDivLineItemRightColumn.classList.add("mono-color-sensitive");
        cardDivLineItemRightColumn.style.backgroundColor = 'transparent';
        cardDivLineItemRightColumn.style.color = targetCardDiv.getAttribute("saved-color") || "";
        cardDivLineItemRightColumn.dataset.savedColor = targetCardDiv.getAttribute("saved-color") || "";

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

        // add cardDivLineItem "following" button if the targetCardDiv is a bizCardDiv
        if (isBizCardDiv(targetCardDiv)) {
            var cardDivLineItemFollowingButton = document.createElement("button");
            cardDivLineItemFollowingButton.classList.add("card-div-line-item-follow-button");
            addCardDivLineItemFollowingButtonClickHandler(cardDivLineItemFollowingButton);
            cardDivLineItemRightColumn.appendChild(cardDivLineItemFollowingButton);
        }

        if (isAnyCardDiv(targetCardDiv)) {
            addCardDivMonths(targetCardDiv, cardDivLineItemContent);
        }

        cardDivLineItem.appendChild(cardDivLineItemContent);
        cardDivLineItem.appendChild(cardDivLineItemRightColumn);
        rightContentDiv.appendChild(cardDivLineItem);

        // find all tag-link elements of this cardDivLineItemContent and make
        // them mono-color-sensitive and give them onclick listeners
        var elements = cardDivLineItemContent.getElementsByClassName('tag-link');
        for (let element of elements ) {
            element.classList.add("mono-color-sensitive");
            addTagLinkClickListener(element);
        }

        // find all iconElemens of this cardDivLineItemContent and make 
        // each mono-color-sensitive and give each an onclick listeners.
        //
        // However, delete any back-icons if the targetCardDiv is a bizCardDiv
        //
        // visit the iconElements in reverse order so that 
        // the removal of the back iconElement does not affect the
        // index of the remaining iconElements.
        let deleteBackIcons = isBizCardDivId(targetCardDivId);
        let iconElements = cardDivLineItemContent.getElementsByClassName("icon");
        for (let i = iconElements.length - 1; i >= 0; i--) {
            let iconElement = iconElements[i];
            if ( !iconElement.classList.contains('mono-color-sensitive') ) {
                iconElement.classList.add('mono-color-sensitive');
            }
            let iconType = iconElement.dataset.icontype;
            if (deleteBackIcons && iconType === "back") {
                iconElement.parentNode.removeChild(iconElement);
            } else {
                addIconClickListener(iconElement);
            }
        }
        // finish up by applying monocolor rules to the cardDivLineItem's mono-color-sensitive child elements
        for ( let element of cardDivLineItem.getElementsByClassName("mono-color-sensitive") ) {
            monoColor.applyMonoColorToElement(element);
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
    var isABizCardDivId = isBizCardDivId(cardDivId);
    for (var i = 0; i < cardDivLineItems.length; i++) {
        var cardDivLineItem = cardDivLineItems[ i ];
        var isABizCarddivLineItemId = utils.isString(cardDivLineItem.id) && cardDivLineItem.id.includes("bizCard-div-");
        if( String(cardDivLineItem.id).includes(cardDivId) && isABizCardDivId == isABizCarddivLineItemId ) {
            // console.log(`getCardDivId:${cardDivId} found cardDivLineItem:${cardDivLineItem.id}`);
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

        // only bizCardDivs have this cardDivLineItemFollowingButton
        var cardDiv = getCardDivOfCardDivLineItem(cardDivLineItem);
        // console.assert(isBizCardDivId(cardDiv));

        var followingBizCardDivId = getFollowingBizCardDivId(cardDiv.id);
        // console.assert(isBizCardDivId(followingBizCardDivId));

        var followingBizCardDiv = document.getElementById(followingBizCardDivId);
        // console.assert(isBizCardDiv(followingBizCardDiv));

        // select the followingBizCardDiv and its cardDivLineItem
        selectTheCardDiv(followingBizCardDiv, true);

        event.stopPropagation();
    });
}

function getLatestBizCardDivId() {
    var dateSortedIds = getDateSortedBizCardIds();
    if (dateSortedIds != null) {
        return dateSortedIds[ 0 ].id;
    }
    // there are zero bizCardDivsId
    return null;
}

// get the id of the bizCard that should be
// next (added if needed and) selected
function getFollowingBizCardDivId(bizCardDivId) {

    // find the id of the bizCardDiv with 
    // the latest bizCardDivLineItem or null
    if (!utils.isString(bizCardDivId)) {
        var bizCardDiv = getLastBizCardDivWithLineItem();
        // no bizCardDivs have line items
        // so return the Id of the first bizCardDiv
        if (!bizCardDiv) {
            var allBizCardDivs = document.getElementsByClassName("bizCard-div");
            // console.assert(allBizCardDivs != null && allBizCardDivs.length > 0);
            bizCardDiv = allBizCardDivs[ 0 ];
            return bizCardDiv.id;
        } else {
            // otherwise we continue with the latest
            bizCardDivId = bizCardDiv.id;
        }
    }

    // console.assert(utils.isString(bizCardDivId));
    var index = getBizCardDivIndex(bizCardDivId);
    // console.assert(index != null);

    var followingBizCardDivId = getBizCardDivIdFromIndex(index + 1);
    // if we've reached the end of all bizCardDivs
    // then start over at index 0
    if (followingBizCardDivId == null)
        followingBizCardDivId = getBizCardDivIdFromIndex(0);

    // console.assert(isBizCardDivId(followingBizCardDivId));
    return followingBizCardDivId;
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
        // console.log(`cardDivId:${cardDivId}`);
        var cardDiv = document.getElementById(cardDivId);
        if (cardDiv) {
            // var tagLinkText = cardDiv.getAttribute("tagLinkText");
            // console.log(`tag_link.text:${tagLinkText}`);
            // console.assert(tagLinkText != null && tagLinkUrl != null);

            // selectTheCardDiv and its cardDivLineItem
            selectTheCardDiv(cardDiv, true);

            // need to scroll cardDiv into view
            // scrollElementIntoView(cardDiv);
        } else {
            // console.log(`no cardDiv with tag_link found for cardDivId:${cardDivId}`);
        }
        event.stopPropagation();
    });
}

/**
 * applies current depth-based translation to all divs 
 * that are visible in the current viewPort
 */
function renderAllTranslateableDivsAtsceneContainerCenter() {

    updateViewPort();

    const sceneContainerX = utils.half(sceneContainer.offsetWidth);
    const sceneContainerY = utils.half(sceneContainer.offsetHeight);
    const translateableDivs = getAllTranslateableCardDivs();
    for (const div of translateableDivs) {
        if ( isCardDivWithinViewPort(div) ) {
            const divWidth = div.offsetWidth;
            const trans_dx = sceneContainerX - utils.half(divWidth);
            const trans_dy = 0;
            const translateStr = `${trans_dx}px ${trans_dy}px`;
            try {
                div.style.translate = translateStr;
            } catch (error) {
                // console.log(`leftCenter div:${div.id}`, error);
                // console.error(`leftCenter div:${div.id}`, error);
            }
        }
    }
}

function positionGradients() {
    const canvasHeight = scene-div.scrollHeight;
    const bottomGradientHeight = bottomGradient.offsetHeight;
    bottomGradient.style.top = `${canvasHeight - bottomGradientHeight}px`;
}


function rightContentScrollToBottom() {
    rightContentDiv.scrollTop = rightContentDiv.scrollHeight;
}


function sceneContainerScrollToTop() {
    sceneContainer.scrollTo({ top: 0, behavior: 'smooth' });
}

function sceneContainerScrollToBottom() {
    sceneContainer.scrollTo({ top: sceneContainer.scrollHeight, behavior: 'smooth' });
}

var bullsEyeX;
var bullsEyeY;

// center bullsEye at sceneContainerCenter
function centerBullsEye() {
    bullsEyeX = utils.half(sceneContainer.offsetWidth);
    bullsEyeY = utils.half(sceneContainer.offsetHeight);
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
    // debugFocalPoint();
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
    // focalPoint is actually focalPointElement.left/top, 
    // so true focalPoint center is at left,top + halfWidth,
    // which is 25 from styles.css.
    const dd = 12.5; 
    focalPoint.easeFocalPointTo(bullsEyeX-dd, bullsEyeY-dd);
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
    const isDraggable = true;
    focalPoint.createFocalPoint(focal_point, focalPointListener, isDraggable);

    const timelineContainer = document.getElementById("timeline-container");

    const [MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR] = getMinMaxTimelineYears(jobs);
    const DEFAULT_TIMELINE_YEAR = MAX_TIMELINE_YEAR;

    timeline.createTimeline(timelineContainer, sceneContainer, MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR, DEFAULT_TIMELINE_YEAR);

    createBizCardDivs();
    renderAllTranslateableDivsAtsceneContainerCenter();
    positionGradients();
    centerBullsEye();
    easeFocalPointToBullsEye();

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

const viewPort = {};
const VIEWPORT_PADDING = 1000;

/**
 * updates the scene-div-constainer-relative 
 * geometry of the viewPort, which is used
 * to clip out cardDivs that are not visible.
 */
function updateViewPort() {
    const sceneContainer = document.getElementById("scene-container");
    const sceneContainerRect = sceneContainer.getBoundingClientRect();
    const sceneContainerWidth = sceneContainerRect.right - sceneContainerRect.left;
    const sceneContainerHeight = sceneContainerRect.bottom - sceneContainerRect.top;
    viewPort.padding = VIEWPORT_PADDING;
    viewPort.top = sceneContainerRect.top - viewPort.padding;
    viewPort.left = sceneContainerRect.left - viewPort.padding;
    viewPort.right = sceneContainerRect.right + viewPort.padding;
    viewPort.bottom = sceneContainerRect.bottom + viewPort.padding;
    viewPort.centerX = sceneContainerRect.left + sceneContainerWidth / 2;
    viewPort.centerY = sceneContainerRect.top + sceneContainerHeight / 2;
}

/**
 * @returns the scene-container relative position of the viewpoint center
 */
function getViewpointCenter() {
    return {
        x: viewPort.centerX,
        y: viewPort.centerY
    }
}

/**
 * Checks if any part of the given cardDiv is visible within the 
 * viewPort, which is derived from the sceneContainer element.
 * @param {HTMLElement} cardDiv - The cardDiv element to check.
 * @returns {boolean} - True if the cardDiv is within the viewPort, false otherwise.
 */
function isRectWithinViewPort(rect) {
    const intersects = !(rect.right < viewPort.left || 
                         rect.left > viewPort.right || 
                         rect.bottom < viewPort.top || 
                         rect.top > viewPort.bottom);
    return intersects;
}
function isCardDivWithinViewPort(cardDiv) {
    return isRectWithinViewPort(cardDiv.getBoundingClientRect());
}

function handleWindowResize() {
    // resize the scene-container and the scene-div since they don't do it themselves?
    var sceneContainerWidth = window.innerWidth/2;
    var sceneContainerHeight = window.innerHeight;
    console.log("windowResize width:", sceneContainerWidth, "height:", sceneContainerHeight);
    sceneContainer.style.width = sceneContainerWidth + "px";
    scene-div.style.width = sceneContainerWidth + "px";
    renderAllTranslateableDivsAtsceneContainerCenter();
    positionGradients();
    centerBullsEye();
    easeFocalPointToBullsEye();
}

// Attach event listeners
window.addEventListener("load", handleWindowLoad);
window.addEventListener("resize", handleWindowResize);

var sceneContainerEventListeners = [];

function addsceneContainerEventListener(eventType, listener, options) {
    sceneContainerEventListeners.push({ eventType, listener, options });
    sceneContainer.addEventListener(eventType, listener, options);
}

function removesceneContainerEventListeners() {
    for (let i = 0; i < sceneContainerEventListeners.length; i++) {
        let listener = sceneContainerEventListeners[ i ];
        if (listener.options != null)
            sceneContainer.removeEventListener(listener.eventType, listener.listener, listener.options);
        else
            sceneContainer.removeEventListener(listener.eventType, listener.listener);
    }
}

function restoresceneContainerEventListeners() {
    for (let i = 0; i < sceneContainerEventListeners.length; i++) {
        let listener = sceneContainerEventListeners[ i ];
        if (listener.options != null)
            sceneContainer.addEventListener(listener.eventType, listener.listener, listener.options);
        else
            sceneContainer.addEventListener(listener.eventType, listener.listener);
    }
}

//---------------------------------------
// selectAllButton - adds a cardDivLineItem for all bizCardDivs
//
export function selectAllBizCards() {
    // delete all cardDivLineItems in reverse order
    clearAllDivCardLineItems();

    var allBizCardDivs = document.getElementsByClassName("bizCard-div");
    if ( allBizCardDivs.length == 0 ) {
        console.error("selectAllBizCards() found zero bizCardDivs.");
        return;
    }
    for (let i = 0; i < allBizCardDivs.length; i++) {
        var bizCardDiv = allBizCardDivs[ i ];

        // select the bizCardDiv and its cardDivLineItem
        selectTheCardDiv(bizCardDiv, true);
    }

    // select and scroll to the first bizCardDiv and its line item
    selectAndScrollToCardDiv(allBizCardDivs[0]);
}

selectAllBizCardsButton.addEventListener("click", selectAllBizCards);

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
    // utils.validateIsCardDivOrBizCardDiv(cardDiv);
    if ( !cardDiv ) {
        console.log("Ignoring undefined cardDiv");
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
// selectNextBizCardButton dateSortedBizCardIds

var dateSortedBizCardIds = null;

function getDateSortedBizCardIds() {
    if (dateSortedBizCardIds == null) {
        dateSortedBizCardIds = [];
        let bizCardDivs = document.getElementsByClassName("bizCard-div");
        for (let i = 0; i < bizCardDivs.length; i++) {
            var datedDivIdId = {
                id: bizCardDivs[ i ].id,
                endDate: getBizCardDivEndDate(bizCardDivs[ i ])
            };
            dateSortedBizCardIds.push(datedDivIdId);
        }
        // sort in decending order
        dateSortedBizCardIds.sort((a, b) => b.endDate - a.endDate);
    }
    return dateSortedBizCardIds;
}

function getDateSortedBizCards() {
    var dateSortedBizCards = [];
    var dateSortedBizCardIds = getDateSortedBizCardIds();
    for (let bizCardId of dateSortedBizCardIds ) {
        dateSortedBizCards.push(document.getElementById(bizCardId));
    }
    return dateSortedBizCards;
}

function getFirstBizCardDivId() {
    var sorted = getDateSortedBizCardIds();
    if ( sorted )
        return sorted[0].id;
    return null;
}

function getBizCardDivEndDate(bizCardDiv) {
    // utils.validateIsBizCardDiv(bizCardDiv);
    var endDateStr = bizCardDiv.getAttribute("endDate");
    var endDate = new Date(endDateStr);
    return endDate;
}

function getBizCardDivStartDate(bizCardDiv) {
    // utils.validateIsBizCardDiv(bizCardDiv);
    var startDateStr = bizCardDiv.getAttribute("startDate");
    var startDate = new Date(startDateStr);
    return startDate;
}


// find bizCardDivId of the last bizCardDivLineItem and
// get the next bizCardDivId that should be selected
// if no bizCardDivLineItems exist then use the 
// newest bizCardDivId that should be selected.
//
// This assumes that when a bizCardDiv is selected
// The existing line item is created if needed and then
// selected and the container slides it into view. 
// 
// Related note, the "selectNextButton" must always be 
// moved to be after the last lineItem.
//
function selectNextBizCard() {
    var nextBizCardDivId = null;
    var theSelectedBizCardDivId = getTheSelectedCardDivId();
    if ( theSelectedBizCardDivId == null )
        nextBizCardDivId = getFirstBizCardDivId();
    else
        nextBizCardDivId = getFollowingBizCardDivId(theSelectedBizCardDivId);
    // console.assert(nextBizCardDivId !== null);
    var nextBizCardDiv = document.getElementById(nextBizCardDivId);
    // console.assert(nextBizCardDiv !== null);

    // select the nextBizCardDiv and its cardDivItem
    selectTheCardDiv(nextBizCardDiv, true);
}

export function selectFirstBizCard() {
    var firstDivId = getFirstBizCardDivId();
    var firstDiv = document.getElementById(firstDivId);
    // utils.validateIsBizCardDiv(firstDiv);

    // select the cardDiv and its cardDivLineItem
    selectTheCardDiv(firstDiv, true);
}

// return the list of all bizCardDivLineItems or null
function getAllBizCardDivLineItems() {
    const allCardDivLineItems = [ ...document.getElementsByClassName("card-div-line-item") ];
    const allBizCardLineItems = allCardDivLineItems.filter(cardDivLineItem => String(cardDivLineItem.id).includes("bizCard-div"));
    if (allBizCardLineItems.length == 0)
        return null;
    return allBizCardLineItems;
}

// return the Id of the last bizCardDiv that has a
// bizCardDivLineItem, otherwise return null
function getLastBizCardDivWithLineItem() {
    var allBizCardDivLineItems = getAllBizCardDivLineItems();
    if (allBizCardDivLineItems && allBizCardDivLineItems.length > 0) {
        var numBizCardDivLineItems = allBizCardDivLineItems.length;
        var lastBizCardDivLineItem = allBizCardDivLineItems[ numBizCardDivLineItems - 1 ];
        var lastBizCardDivId = lastBizCardDivLineItem.getAttribute("targetCardDivId");
        // console.assert(isBizCardDivId(lastBizCardDivId));
        var lastBizCardDiv = document.getElementById(lastBizCardDivId);
        validateIsBizCardDiv(lastBizCardDiv);
        return lastBizCardDiv;
    }
    return null;
}

// find all iconElements and add their click listeners
// called on DOMContentLoaded
export function addAllIconClickListeners() {
    let iconElements = document.getElementsByClassName("icon");
    let N = iconElements.length;
    console.log(`addAllIconClickListeners found ${N} iconElements`);
    for ( let i=0; i<N; i++ ) {
        let iconElement = iconElements[i];
        addIconClickListener(iconElement);
    }
    let allCardDivElements = document.getElementsByClassName("card-div");
    console.log(`addAllIconClickListeners found ${allCardDivElements.length} allCardDivElements`);
    let allDateSortedBizCardDivElements = getDateSortedBizCards();
    console.log(`addAllIconClickListeners found ${allDateSortedBizCardDivElements.length} allDateSortedBizCardDivElements`);
    let allCardDivLineItemElements = document.getElementsByClassName("card-div-line-item");
    console.log(`addAllIconClickListeners found ${allCardDivLineItemElements.length} allCardDivLineItemElements`); 
}

export function addCardDivMonths(cardDiv, cardDivLineItemContent) {
    const days = cardDiv.dataset.bizCardDivDays;
    const months = Math.round(days * 12.0 / 365.25);
    cardDiv.dataset.bizCardDivMonths = months;
    cardDiv.dataset.bizCardDivYears = 0;
    let spanElement = cardDivLineItemContent.querySelector("span.tag-link");
    if( spanElement ) {
        if ( months <= 12 ) {
            const units = months == 1 ? "month" : "months"; 
            spanElement.innerHTML += `<br/>(${months} ${units}  experience)`;
        } else {
            const years = Math.round(months / 12.0);
            const units = years == 1 ? "year" : "years";
            spanElement.innerHTML += `<br/>(${years} ${units} experience)`;
            cardDiv.dataset.bizCardDivYears = years;
        }
    } else {
        console.error(`no spanElement found for cardDiv:${cardDiv.id}`);
    }
}

selectNextBizCardButton.addEventListener("click", function (event) {
    selectNextBizCard();
});
selectFirstBizCardButton.addEventListener("click", function (event) {
    selectFirstBizCard();
});

//---------------------------------------
// scene-div container event listeners



addsceneContainerEventListener("mousemove", handlesceneContainerMouseMove);

addsceneContainerEventListener("wheel", handlesceneContainerWheel, { passive: true });

addsceneContainerEventListener('mouseenter', handleMouseEntersceneContainer);

addsceneContainerEventListener('mouseleave', handleMouseLeavesceneContainer);

addsceneContainerEventListener('scroll', handlesceneContainerScroll);

addsceneContainerEventListener('click', handlesceneContainerMouseClick);

