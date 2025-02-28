
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
        var text_color = job[ "text color" ].trim().toUpperCase();
        var css_hex_color_str = utils.get_Hex_from_ColorStr(text_color);
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
        bizcardDiv.dataset.employer = employer;
        bizcardDiv.dataset.cardDivIds = [];
        try {
            //console.log(`startDate:[${endDate}]`);
            bizcardDiv.setAttribute("endDate", utils.getIsoDateString(endDate));
        } catch (e) {
            console.error(e);
        }
        bizcardDiv.setAttribute("startDate", utils.getIsoDateString(startDate));

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
        bizcardDiv.setAttribute("saved-color", css_hex_color_str);
        var adjustedHexBackgroundColor = utils.adjustHexBrightness(css_hex_background_color_str, 1.7);
        utils.validateHexColorString(adjustedHexBackgroundColor);
        bizcardDiv.setAttribute("saved-selected-background-color", adjustedHexBackgroundColor);
        utils.validateHexColorString(css_hex_color_str);
        bizcardDiv.setAttribute("saved-selected-color", css_hex_color_str);

        bizcardDiv.setAttribute("saved-zIndexStr", zIndexStr);
        bizcardDiv.setAttribute("saved-filterStr", get_filterStr_from_z(z));

        bizcardDiv.style.zIndex = bizcardDiv.getAttribute("saved-zIndexStr") || "";
        bizcardDiv.style.filter = bizcardDiv.getAttribute("saved-filterStr") || "";
        bizcardDiv.style.backgroundColor = bizcardDiv.getAttribute("saved-background-color") || "";
        bizcardDiv.style.color = bizcardDiv.getAttribute("saved-color") || "";

        var description_raw = job[ "Description" ];
        if (description_raw && description_raw.length > 0) {
            // utils.validateString(description_raw);
            const [description_HTML, bizcardTagLinks] = process_bizcard_description_HTML(bizcardDiv, description_raw);
            bizcardDiv.setAttribute("Description", description_HTML);
            bizcardDiv.setAttribute("TagLinks", JSON.stringify(bizcardTagLinks));
        }

        var html = "";
        html += `<span class="bizcard-div-role">${role}</span><br/>`;
        html += `(${bizcardDiv.id})<br/>`;
        html += `<span class="bizcard-div-employer">${employer}</span><br/>`;
        html += `<span class="bizcard-div-dates">${jobStartStr} - ${jobEndStr}</span><br/>`;
        bizcardDiv.innerHTML = html;

        bizcardDiv.addEventListener("mouseenter", handleCardDivMouseEnter);
        bizcardDiv.addEventListener("mouseleave", handleCardDivMouseLeave);

        utils.validateIsCardDivOrBizcardDiv(bizcardDiv);
        addCardDivClickListener(bizcardDiv);
        // does not select self
        // does not scroll self into view

    }
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

function createBackAnchorTag(bizcard_id, savedColor, isMonocolorSensitive=true) {
    let iconColor = monoColor.getIconColor(savedColor);
    let iconType = "back";
    let monoColorSensitiveClass = isMonocolorSensitive ? "mono-color-sensitive" : '';
    let html = `<img class="icon back-icon ${monoColorSensitiveClass}" src="static_content/icons/icons8-${iconType}-16-${iconColor}.png" data-bizcard-id="${bizcard_id}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
    return html;
}

// This function takes an inputString, applies the regular expression to extract the 
// newTagLink objects with properties text, img, url, and html, and then replaces 
// these newTagLinks in the original string with their html values. The function return 
// both the list of newTagLinks and the updatedString with embedded HTML elements.

function process_bizcard_description_item(bizcardDiv, inputString) {
    if ( typeof bizcardDiv.id === 'undefined' || bizcardDiv.id === null || bizcardDiv.id === '')
        throw new Error(`bizcardDiv:${bizcardDiv} must have an id attribute`);
    if ( typeof bizcardDiv.style.color === 'undefined' || bizcardDiv.style.color === null || bizcardDiv.style.color === '')     
        throw new Error(`bizcardDiv:${bizcardDiv.id} must have a style.color attribute`);

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
            bizcardDivId: bizcardDiv.id
        };
    });

    // create an htmlElement for each newTagLink
    let updatedString = inputString;

    newTagLinks.forEach(tag_link => {
        const text = tag_link.text;
        const img = tag_link.img ? tag_link.img : '';
        const url = tag_link.url ? tag_link.url : '';

        var savedColor = bizcardDiv.getAttribute('saved-color') || '';

        if (typeof savedColor === 'undefined' || savedColor === null || savedColor === '') {
            throw new Error(`bizcardDiv:${bizcardDiv.id} must have a saved-color attribute`);
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
            line2 += createBackAnchorTag(bizcardDiv.id, savedColor);

            htmlElementStr += '<br/>' + line2;
            if ( htmlElementStr.includes('undefined')) {
                throw new Error(`htmlElementStr:${htmlElementStr} must not have any undefined values`);
            }
        }
        tag_link.html = htmlElementStr;

        // find or create the cardDiv that matches this tag_link and use it to set the tag_link's "cardDivId" property
        setCardDivIdOfTagLink(bizcardDiv, tag_link);
        
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
                    const bizcardId = iconElement.dataset.bizcardId; // from data-bizcard-id
                    if (bizcardId) {
                        const bizcardDiv = document.getElementById(bizcardId);
                        if (bizcardDiv) {
                            console.log(`iconElement click: ${bizcardId}`);
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

function getBizcardDivDays(bizcardDiv) {
    const endMillis = getBizcardDivEndDate(bizcardDiv).getTime();
    const startMillis = getBizcardDivStartDate(bizcardDiv).getTime();
    const bizcardMillis = endMillis - startMillis;
    // console.log(`bizcardDiv.id:${bizcardDiv.id} bizcardMillis:${bizcardMillis}`);
    const bizcardDivDays = bizcardMillis / (1000 * 60 * 60 * 24);
    // console.log(`bizcardDiv.id:${bizcardDiv.id} bizcardDivDays:${bizcardDivDays}`);
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
                var savedColor = cardDiv.getAttribute('saved-color') || '';
                let newBackAnchorTag = createBackAnchorTag(bizcardDiv.id, savedColor, false);
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
    copyHexColorAttributes(cardDiv, bizcardDiv, [
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

    // define the innerHTML when cardDiv is added to #canvas
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

    // add the cardDivClickListener to all cardDiv descendants 
    // except icon elements
    let cardDivDescendants = cardDiv.querySelectorAll('*');
    for ( let decendent of cardDivDescendants ) {
        if ( !decendent.classList.contains('icon') ) {
            addCardDivClickListener(cardDiv);
        }
    }

    renderAllTranslateableDivsAtCanvasContainerCenter();

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
  
// write the exmployer of each bizcardDiv and the ext of each of its cardDivs
export function logAllBizcardDivs() {
    let allBizcardDivs = document.getElementsByClassName("bizcard-div");
    let showSkips = false;
    var log = "";
    console.log('---------------------------------------------------');
    for (let bizcardDiv of allBizcardDivs) {
        let employer = bizcardDiv.dataset.employer;
        if (employer === undefined || employer === null) {
            continue;
        }
        let cardDivIds = bizcardDiv.dataset.cardDivIds;
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
                let months = Math.round(cardDiv.dataset.bizcardDivDays * 12 / 365.25);
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
        // console.error(`applyParallax cardDiv:${cardDiv.id}`, error);
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

var isMouseOverCanvasContainer = false;

function handleMouseEnterCanvasContainer(event) {
    isMouseOverCanvasContainer = true;
    focalPoint.easeFocalPointTo(event.clientX, event.clientY);
    // debugFocalPoint();
}

function handleMouseLeaveCanvasContainer(event) {
    isMouseOverCanvasContainer = false;
    easeFocalPointToBullsEye();
    // debugFocalPoint();
}

var lastScrollTop = null;
var lastScrollTime = null;

function handleCanvasContainerScroll(scrollEvent) {
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

    if ( !notLineItem ) {
        let cardDivId = obj.getAttribute("targetCardDivId");
        if ( cardDivId !== null ) {
            let cardDiv = document.getElementById(cardDivId);
        }
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
    if( !utils.isCardDivOrBizcardDiv(cardDiv) ) {
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
            var line_items_HTML = convert_description_HTML_to_line_items_HTML(description);
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
        // However, delete any back-icons if the targetCardDiv is a bizcardDiv
        //
        // visit the iconElements in reverse order so that 
        // the removal of the back iconElement does not affect the
        // index of the remaining iconElements.
        let deleteBackIcons = isBizcardDivId(targetCardDivId);
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
    var isABizcardDivId = isBizcardDivId(cardDivId);
    for (var i = 0; i < cardDivLineItems.length; i++) {
        var cardDivLineItem = cardDivLineItems[ i ];
        var isABizCarddivLineItemId = utils.isString(cardDivLineItem.id) && cardDivLineItem.id.includes("bizcard-div-");
        if( String(cardDivLineItem.id).includes(cardDivId) && isABizcardDivId == isABizCarddivLineItemId ) {
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
    var dateSortedIds = getDateSortedBizcardIds();
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
            // console.error(`leftCenter div:${div.id}`, error);
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
    focalPoint.easeFocalPointTo(bullsEyeX, bullsEyeY);
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

    timeline.createTimeline(timelineContainer, canvasContainer, MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR, DEFAULT_TIMELINE_YEAR);

    createBizcardDivs();
    renderAllTranslateableDivsAtCanvasContainerCenter();
    positionGradients();
    centerBullsEye();
    easeFocalPointToBullsEye();

    // set up animation loop
    (function drawFrame() {
        focalPoint.drawFocalPointAnimationFrame();
        // Request the next frame.
        window.requestAnimationFrame(drawFrame);
    })();
    // Start the animation loop.
    window.requestAnimationFrame(drawFrame);
}

function drawFrame() {
    focalPoint.drawFocalPointAnimationFrame();
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
export function selectAllBizcards() {
    // delete all cardDivLineItems in reverse order
    clearAllDivCardLineItems();

    var allBizcardDivs = document.getElementsByClassName("bizcard-div");
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
    var cardDivLineItem = getCardDivLineItem(cardDiv.id)

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

function getFirstBizcardDivId() {
    var sorted = getDateSortedBizcardIds();
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

function getBizcardDivStartDate(bizcardDiv) {
    // utils.validateIsBizcardDiv(bizcardDiv);
    var startDateStr = bizcardDiv.getAttribute("startDate");
    var startDate = new Date(startDateStr);
    return startDate;
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
    let allDateSortedBizcardDivElements = getDateSortedBizcards();
    console.log(`addAllIconClickListeners found ${allDateSortedBizcardDivElements.length} allDateSortedBizcardDivElements`);
    let allCardDivLineItemElements = document.getElementsByClassName("card-div-line-item");
    console.log(`addAllIconClickListeners found ${allCardDivLineItemElements.length} allCardDivLineItemElements`); 
}

export function addCardDivMonths(cardDiv, cardDivLineItemContent) {
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

export function onCloseWelcomeAlert() {
    selectAllBizcards();
    addAllIconClickListeners();
    // logAllBizcardDivs();
    // utils.testColorFunctions();
}
