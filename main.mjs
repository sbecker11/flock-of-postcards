// @ts-nocheck
'use strict';

import * as utils from './modules/utils.mjs';
import * as timeline from './modules/timeline/timeline.mjs';
import * as focalPoint from './modules/focal_point/focal_point.mjs';
import * as alerts from './modules/alerts/alerts.mjs';
import { getPaletteSelectorInstance } from './modules/colors/color_palettes.mjs';
import { Logger, LogLevel } from "./modules/logger.mjs";
import { jobs } from './static_content/jobs/jobs.mjs';
import { 
    // ... existing imports ...
    handleKeyDown as handleFocalPointKeyDown,
} from './modules/focal_point/focal_point.mjs';
const logger = new Logger("main", LogLevel.DEBUG);


utils.testColorUtils();

// --------------------------------------
// Element reference globals

const resumeDivContainer = document.getElementById("resume-div-container");
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
// const selectAllBizcardsButton = document.getElementById("select-all-bizcards");
// const clearAllResumeDivsButton = document.getElementById("clear-all-resume-divs");
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
// bizCardDiv globals

// width decreases as zindex increases
const BIZCARD_WIDTH = 200;
const BIZCARD_INDENT = 29;
const MIN_BIZCARD_HEIGHT = 200;

// brightness decreases to MIN_BRIGHTNESS_PERCENT as z increases
const MIN_BRIGHTNESS_PERCENT = 70;

// card blur increases as z increases
const BLUR_Z_SCALE_FACTOR = 0.1;

// --------------------------------------
// skillCardDiv globals

// TO DO: tune or replace
const ESTIMATED_NUMBER_CARD_DIVS = 159;

// card metrics are in pixels
const MAX_CARD_POSITION_OFFSET = 200;
const MEAN_CARD_LEFT = 0;
const MEAN_CARD_HEIGHT = 75;
const MEAN_CARD_WIDTH = 100;

const MAX_CARD_SIZE_OFFSET = 20;
const CARD_BORDER_WIDTH = 3;


const BIZCARD_MAX_JITTER_Y = 10;
const BIZCARD_MAX_JITTER_X = 70;
const BIZCARD_MAX_JITTER_HEIGHT = 10;
const BIZCARD_MAX_JITTER_WIDTH = 20;
const BIZCARD_MEAN_WIDTH = 150;

const SKILLCARD_MIN_JITTER_Y = 10;
const SKILLCARD_MAX_JITTER_Y = 20;
const SKILLCARD_MIN_JITTER_X = 10;
const SKILLCARD_MAX_JITTER_X = 20;
const SKILLCARD_MEAN_HEIGHT = 75;
const SKILLCARD_HEIGHT_JITTER = 10;
const SKILLCARD_MEAN_WIDTH = 100;
const SKILLCARD_WIDTH_JITTER = 10;

// --------------------------------------
// resumeDiv globals
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
const SKILLCARD_MAX_Z = 20;
const SKILLCARD_MIN_Z = 10;
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
        const z_range = SKILLCARD_MAX_Z - SKILLCARD_MIN_Z;
        const z_index_offset = z_index - MIN_CARD_Z_INDEX;
        return Math.round(SKILLCARD_MIN_Z + (z_index_offset * z_range / z_index_range));
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
    } else if (z >= SKILLCARD_MIN_Z && z <= SKILLCARD_MAX_Z) {
        // For cards
        const z_range = SKILLCARD_MAX_Z - SKILLCARD_MIN_Z;
        const z_index_range = MAX_CARD_Z_INDEX - MIN_CARD_Z_INDEX;
        const z_offset = z - SKILLCARD_MIN_Z;
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
    for (let z = SKILLCARD_MIN_Z; z <= SKILLCARD_MAX_Z; z++) {
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
        SKILLCARD_MIN_Z, 1.0,
        SKILLCARD_MAX_Z, MIN_BRIGHTNESS_PERCENT / 100.0
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
    var blur = (z > 0) ? (z - SKILLCARD_MIN_Z) * BLUR_Z_SCALE_FACTOR : 0;
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
// bizCardDiv and skillCardDiv functions

function isbizCardDiv(div) {
    return div != null && div.classList.contains('biz-card-div') ? true : false;
}
function isSkillCardDiv(div) {
    return div != null && div.classList.contains('skill-card-div') ? true : false;
}
function isBizCardDivId(divId) {
    return utils.isString(divId) && getBizCardDivIndex(divId) == null ? false : true;
}
function isSkillCardDivId(divId) {
    return utils.isString(divId) && getSkillCardDivIndex(divId) == null ? false : true;
}

// returns 99 for biz-card-div-99' or null
function getBizCardDivIndex(bizCardDivId) {
    // console.assert(utils.isString(bizCardDivId));
    if (bizCardDivId.startsWith("biz-card-div-")) {
        var index = parseInt(bizCardDivId.replace("biz-card-div-", ""));
        return Number.isNaN(index) ? null : index;
    }
    return null;
}

// returns 99 for 'skill-card-div-99' or null
function getSkillCardDivIndex(cardDivId) {
    // console.assert(utils.isString(cardDivId));
    if (cardDivId.startsWith("skill-card-div-")) {
        var index = parseInt(cardDivId.replace("skill-card-div-", ""));
        return Number.isNaN(index) ? null : index;
    }
    return null;
}

// returns true if a bizCardDiv exists for the given index, else null
function getBizCardDivIdFromIndex(index) {
    // console.assert(utils.isNumber(index));
    var bizCardDivId = `biz-card-div-${index}`;
    var bizCardDiv = document.getElementById(bizCardDivId);
    return (bizCardDiv && bizCardDiv.id == bizCardDivId) ? bizCardDivId : null;
}

function getBizCardDivIdFromAnyDiv(anyDiv) {
    if ( isbizCardDiv(anyDiv) ) {
        return anyDiv.id;
    }
    console.error("getBizCardDivIdFromAnyDiv: illegal div type");
    return null;
}

// .biz-card-divs are never deleted so next id
// is just the current number of the .biz-card-divs
function getNextNewBizCardDivId() {
    const bizCardDivs = document.getElementsByClassName("biz-card-div");
    const nextbizCardDivId = `biz-card-div-${bizCardDivs.length}`;
    return nextbizCardDivId;
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
    for ( let i = 0; i < sortedJobs.length; i++ ) {
        const job = sortedJobs[i];
        const job_id = i;  // Use array index as job_id
        const bizCardDivId = `biz-card-div-${job_id}`;
        // utils.validateKey(job, "role");
        const role = job[ "role" ];

        // utils.validateString(role);
        const employer = job[ "employer" ].trim();
                
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
        var bizCardTop = endBottomPx;
        var jobStartParts = job[ "start" ].split("-");
        var startYearStr = jobStartParts[0];
        var startMonthStr = jobStartParts[1];

        var startDate = new Date(`${startYearStr}-${startMonthStr}-01`);
        // jobStartStr is used for display purposes only
        var jobStartStr = startDate.toISOString().slice(0,7);
        var startBottomPx = timeline.getTimelineYearMonthBottom(startYearStr, startMonthStr);
        var bizCardBottom = startBottomPx;
        var bizCardHeight = Math.max(bizCardBottom - bizCardTop, MIN_BIZCARD_HEIGHT);
        
        var z_index = utils.getRandomInt(MIN_BIZCARD_Z_INDEX, MAX_BIZCARD_Z_INDEX);
        if ( z_index < MIN_BIZCARD_Z_INDEX || z_index > MAX_BIZCARD_Z_INDEX ) {
            console.error(`ERROR: z_index:${z_index} is out of z_index range of ${MIN_BIZCARD_Z_INDEX}..${MAX_BIZCARD_Z_INDEX}`);
        }
        var zIndexStr = `${z_index}`;
        var z = get_z_from_zIndexStr(zIndexStr); // z is distance to viewer = ALL_CARDS_MAX_ZINDEX - z_index
        if ( z < BIZCARD_MIN_Z || z > BIZCARD_MAX_Z ) {
            console.error(`ERROR: z:${z} is out of bizcard_z range of ${BIZCARD_MIN_Z}..${BIZCARD_MAX_Z}`);
        }

        // apply jitters
        bizCardTop += utils.getRandomInt(-BIZCARD_MAX_JITTER_Y, BIZCARD_MAX_JITTER_Y);
        bizCardHeight += utils.getRandomInt(-BIZCARD_MAX_JITTER_HEIGHT, BIZCARD_MAX_JITTER_HEIGHT);
        var bizCardWidth = BIZCARD_WIDTH;
        var bizCardCtrX = utils.getRandomInt(-BIZCARD_MAX_JITTER_X, BIZCARD_MAX_JITTER_X);
        var bizCardLeft = bizCardCtrX - bizCardWidth / 2;
        
        // here we go
        var bizCardDiv = document.createElement("div");
        bizCardDiv.id = `biz-card-div-${job_id}`;
        bizCardDiv.classList.add("biz-card-div");
        bizCardDiv.style.top = `${bizCardTop}px`;
        bizCardDiv.style.height = `${bizCardHeight}px`;
        bizCardDiv.style.left = `${bizCardLeft}px`;
        bizCardDiv.style.width = `${bizCardWidth}px`;
        bizCardDiv.style.zIndex = get_zIndexStr_from_z(z);
        bizCardDiv.style.filter = get_filterStr_from_z(z);
        bizCardDiv.setAttribute("data-color-index", bizCardDiv.id);
        
        canvas.appendChild(bizCardDiv);
        bizCardDiv.dataset.employer = employer;
        bizCardDiv.dataset.cardDivIds = [];
        bizCardDiv.setAttribute("endDate", utils.getIsoDateString(endDate));
        bizCardDiv.setAttribute("startDate", utils.getIsoDateString(startDate));

        // bizCardDiv.setAttribute("saved_left", `${bizCardDiv.offsetLeft}`);
        // bizCardDiv.setAttribute("saved_top", `${bizCardDiv.offsetTop}`);
        // bizCardDiv.setAttribute("saved_width", `${bizCardDiv.offsetWidth}`);
        // bizCardDiv.setAttribute("saved_height", `${bizCardDiv.offsetHeight}`);
        // bizCardDiv.setAttribute("saved_z", `${z}`);
        // bizCardDiv.setAttribute("saved_zIndexStr", zIndexStr);
        // bizCardDiv.setAttribute("saved_filterStr", get_filterStr_from_z(z));

        // bizCardDiv.style.zIndex = bizCardDiv.getAttribute("saved_zIndexStr") || "";
        // bizCardDiv.style.filter = bizCardDiv.getAttribute("saved_filterStr") || "";

        var description_raw = job[ "Description" ];
        if (description_raw && description_raw.length > 0) {
            const description_HTML = get_decription_HTML(description_raw);
            bizCardDiv.setAttribute("Description", description_HTML);
        }

        var html = "";
        html += `<span class="biz-card-div-role">${role}</span><br/>`;
        html += `(${bizCardDiv.id} z_index:${z_index} z:${z})<br/>`;
        html += `<span class="biz-card-div-employer">${employer}</span><br/>`;
        html += `<span class="biz-card-div-dates">${jobStartStr} - ${jobEndStr}</span><br/>`;
        bizCardDiv.innerHTML = html;

        bizCardDiv.addEventListener("mouseenter", handleCardDivMouseEnter);
        bizCardDiv.addEventListener("mouseleave", handleCardDivMouseLeave);
        bizCardDiv.addEventListener("click", handleCardDivMouseClick);  // Fixed event name

        bizCardDiv.style.display = "block";
        appendCloneDiv(bizCardDiv);
        appendResumeDivOfBizCardDiv(bizCardDiv);

        // now find or create skillCardDivs
        const bizCardDivDays = getBizCardDivDays(bizCardDiv);
        const skillCardDivIds = [];
        Object.entries(job['job-skills']).forEach(([skill_id, skill_name]) => {
            const skillCardDivId = `skill-card-${skill_id}`;
            // find existing skillCardDiv
            let skillCardDiv = document.getElementById(skillCardDivId);
            if ( !skillCardDiv ) {
                // or create a new skillCardDiv and append to canvas
                skillCardDiv = createSkillCardDiv(bizCardDiv, skill_id, skill_name);
                canvas.appendChild(skillCardDiv);
            }

            // increment the total bizcard div days for this skillCardDiv
            let total_bizcard_div_days = skillCardDiv.getAttribute('total-bizcard-div-days') || 0;
            total_bizcard_div_days += bizCardDivDays;
            skillCardDiv.setAttribute('total-bizcard-div-days', total_bizcard_div_days);

            // add the skillCardDivId to the bizCardDiv's list of skillCardDivIds
            skillCardDivIds.push(skillCardDivId);
        });
        bizCardDiv['skill-card-div-ids'] = skillCardDivIds;
    
    } // all jobs loop
    paletteSelector.applyPaletteToElements();
}


// Use the BULLET_DELIMITER as separator to split the
// `bizcard_description` into a list of `description_items`.
//
// Uses the BULLET_JOINER to join the list of description_items 
// back into an updated HTML description so it can be used to create an ordered 
// list of description items.
function get_decription_HTML(description_HTML) {
    // console.assert(bizCardDiv != null);
    var processed_items = [];
    var description_items = description_HTML.split(BULLET_DELIMITER);
    for (var i = 0; i < description_items.length; i++) {
        var description_item = description_items[ i ].trim();
        if (description_item.length > 0) {
            processed_items.push(description_item);
        }
    } 
    if (processed_items.length > 0) {
        return processed_items.join(BULLET_JOINER);
    }
    return null;
}

function getBizCardDivDays(bizCardDiv) {
    const endMillis = getBizCardDivEndDate(bizCardDiv).getTime();
    const startMillis = getBizCardDivStartDate(bizCardDiv).getTime();
    const bizcardMillis = endMillis - startMillis;
    // logger.log(`bizCardDiv.id:${bizCardDiv.id} bizcardMillis:${bizcardMillis}`);
    const bizCardDivDays = bizcardMillis / (1000 * 60 * 60 * 24);
    // logger.log(`bizCardDiv.id:${bizCardDiv.id} bizCardDivDays:${bizCardDivDays}`);
    return parseInt(bizCardDivDays);
}



// --------------------------------------
// skillCardDiv functions

var prev_z = null; // to track the previous z value 

// adds a new skillCardDiv to #canvas
// default center x to zero and center y to
// id * TOP_TO_TOP.
// give each random x,y offsets and random
// z levels, and z-varied brightness and blur.
// return the newly created skillCardDiv that has 
// been appended to canvas.
function createSkillCardDiv(bizCardDiv, job_skill_id, job_skill_name) {
    // console.assert(bizCardDiv != null && tag_link != null);
    const skillCardDiv = document.createElement('div');
    skillCardDiv.id = `skill-card-${job_skill_id}`;
    skillCardDiv.classList.add("skill-card-div");
    skillCardDiv.classList.add("card-div");

    // to be filled in later
    skillCardDiv.dataset.bizCardDivDays = 0;
    
    // cardDivs distributed mostly around the bizCardDiv min and max y
    const bizCardMinY = bizCardDiv.offsetTop;
    const bizCardMaxY = bizCardMinY + bizCardDiv.offsetHeight;
    const skillCardYJitter = utils.getRandomInt(SKILLCARD_MIN_JITTER_Y, SKILLCARD_MAX_JITTER_Y);
    let skillCardCenterY = 0;
    if ( utils.getRandomSign() == 1 ) {
        skillCardCenterY = bizCardMinY - skillCardYJitter;
    } else {
        skillCardCenterY = bizCardMaxY + skillCardYJitter;
    }
    const skillCardHeight = SKILLCARD_MEAN_HEIGHT + utils.getRandomInt(-SKILLCARD_HEIGHT_JITTER, SKILLCARD_HEIGHT_JITTER);

    const skillCardXJitter = utils.getRandomInt(SKILLCARD_MIN_JITTER_X, SKILLCARD_MAX_JITTER_X);
    const skillCardWidth = SKILLCARD_MEAN_WIDTH + utils.getRandomInt(-SKILLCARD_WIDTH_JITTER, SKILLCARD_WIDTH_JITTER);

    const skillCardTop = skillCardCenterY - skillCardHeight / 2;
    const skillCardLeft = 0 - skillCardWidth / 2;

    skillCardDiv.style.top = `${skillCardTop}px`;
    skillCardDiv.style.left = `${skillCardLeft}px`;
    skillCardDiv.style.width = `${skillCardWidth}px`;
    skillCardDiv.style.height = `${skillCardHeight}px`; 

    var z = prev_z = SKILLCARD_MIN_Z;
    while (z === prev_z) {
        // Generate a new z if it's the same as the previous one
        z = utils.getRandomInt(SKILLCARD_MIN_Z, SKILLCARD_MAX_Z);
    }
    skillCardDiv.style.zIndex = get_zIndexStr_from_z(z);

    // inherit colors of bizCardDiv
    skillCardDiv.setAttribute("bizCardDivId", bizCardDiv.id);
    skillCardDiv.setAttribute("data-color-index", bizCardDiv.id);
    
    // define the innerHTML when skillCardDiv is added to #canvas
    skillCardDiv.innerHTML = "<p>${skill_name}</p>";

    skillCardDiv.addEventListener("mouseenter", handleCardDivMouseEnter);
    skillCardDiv.addEventListener("mouseleave", handleCardDivMouseLeave);

    appendCloneDiv(skillCardDiv);
    appendResumeDivOfSkillCardDiv(skillCardDiv);

    return skillCardDiv;
}

// not appended to resumeDivContainer
function appendResumeDivOfBizCardDiv(bizCardDiv) {
    const resumeDiv = document.createElement('div');
    resumeDiv.id = `resume-div-${bizCardDiv.id}`;
    resumeDiv.classList.add("resume-div");
    resumeDiv.classList.add("biz-card-resume-div");
    resumeDiv.setAttribute("card-div-id", bizCardDiv.id);
    resumeDiv.setAttribute("data-color-index", bizCardDiv.getAttribute("data-color-index"));
    resumeDiv.innerHTML = bizCardDiv.innerHTML;  // Fixed property name
    resumeDiv.style.display = "none";
    bizCardDiv.appendChild(resumeDiv);
}

// not appended to resumeDivContainer
function appendResumeDivOfSkillCardDiv(skillCardDiv) {
    const resumeDiv = document.createElement('div');
    resumeDiv.id = `resume-div-${skillCardDiv.id}`;
    resumeDiv.classList.add("resume-div");
    resumeDiv.classList.add("skill-card-resume-div");
    resumeDiv.setAttribute("card-div-id", skillCardDiv.id);
    resumeDiv.setAttribute("data-color-index", skillCardDiv.getAttribute("data-color-index"));
    resumeDiv.innerHtml = skillCardDiv.innerHtml;
    resumeDiv.style.display = "none";
    skillCardDiv.appendChild(resumeDiv);
}

function appendCloneDiv(cardDiv) {
    const cloneDiv = cardDiv.cloneNode(true);
    cloneDiv.id = `clone-div-${cardDiv.id}`;
    cloneDiv.classList.add("clone-div");
    cloneDiv.classList.add("card-div");
    cloneDiv.setAttribute("card-div-id", cardDiv.id);
    cloneDiv.setAttribute("data-color-index", cardDiv.getAttribute("data-color-index"));
    cardDiv.setAttribute("clone-div-id", cloneDiv.id);
 
    const z_index = SELECTED_CARD_Z_INDEX;
    const z = get_z_from_zIndexStr(z_index);
    cloneDiv.style.filter = get_filterStr_from_z(z);
    cloneDiv.style.blur = "0px";
    cloneDiv.style.brightness = "1.25";
    setDivCenterAtViewportCenter(cloneDiv);
    cloneDiv.style.display = "none";

    cardDiv.appendChild(cloneDiv);
    cardDiv.style.display = "block";
}

function setDivCenterAtViewportCenter(div) {
    const divLeft = (canvasContainer.offsetWidth - div.offsetWidth) / 2;
    const divTop = (canvasContainer.offsetHeight - div.offsetHeight) / 2;
    div.style.left = `${divLeft}px`;
    div.style.top = `${divTop}px`;
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
 * any skillCardDiv's x,y coordinates into canvas-relative coordinates.
 * this assortment of divs has only a fixed number of possible
 * z values so the results of this function are cashed for
 * speed of access.
 *
 * Description. (use period)
 * @param {number}  dh           the horizontal parallax offset value
 * @param {number}  dv           the vertical parallax offet value
 * @param {number}   z           the random Z depth assigned to every skillCardDiv
 *                              where z ranges from 1 as max dist to viewer
 *                              to ALL_CARDS_MAX_Z being closest to viewer
 *                              with an integer value between CARD_MIN_Z and CARD_MAX_Z
 * @param {number}  canvasContainer_dx    the x value used to convert skillCardDiv.x to canvasContainer-relative position
 * @param {number}  canvasContainer_dy    the y value used to convert skillCardDiv.y to canvasContainer-relative position
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

// return all bizCardDivs and cardDivs lazy-loaded
function getAllTranslateableCardDivs() {
    var allDivs = [];
    allDivs = Array.prototype.concat.apply(
        allDivs,
        canvas.getElementsByClassName("biz-card-div")
    );
    allDivs = Array.prototype.concat.apply(
        allDivs,
        canvas.getElementsByClassName("skill-card-div")
    );
    return allDivs;
}

// apply parallax to the given cardDiv and returns
// the translate string used to transform. The transform
// will be applied on the next animation frame
function applyParallaxToOneCardDiv(cardDiv) {
    const zIndexStr = cardDiv.style.zIndex;
    if ( (zIndexStr == SELECTED_CARD_Z_INDEX) || (zIndexStr == null) || cardDiv.classList.contains("clone-div") ){
        return null;
    }

    var { parallaxX, parallaxY } = getParallax();
    const canvasContainerCtrX = utils.half(canvasContainer.offsetWidth);
    const canvasContainerCtrY = utils.half(canvasContainer.offsetHeight);

    // constants for this parallax
    const dh = parallaxX * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = parallaxY * PARALLAX_Y_EXAGGERATION_FACTOR;

    // compute and apply translations to this translatableDiv
    var z = get_z_from_zIndexStr(zIndexStr);

    var cardDivCtrX = utils.half(cardDiv.offsetWidth);
    var cardDivCtrY = utils.half(cardDiv.offsetHeight);

    // canvasContainer-relative skillCardDiv center
    var canvasContainer_dx = canvasContainerCtrX - cardDivCtrX;
    var canvasContainer_dy = canvasContainerCtrY - cardDivCtrY;

    var zTranslateStr = getZTranslateStr(dh, dv, z, canvasContainer_dx, canvasContainer_dy);

    try {
        skillCardDiv.style.translate = zTranslateStr;
    } catch (error) {
        // console.error(`applyParallax skillCardDiv:${skillCardDiv.id}`, error);
    }
    return zTranslateStr;
}

/**
 * applyz-depth scaled parallax to all translateableDiv 
 * currently visible in the canvasContainer viewport
 */
function applyParallax() {
    //logger.log("applyParallax");
    var allCardDivs = getAllTranslateableCardDivs();   
    for ( var skillCardDiv of allCardDivs) {
        applyParallaxToOneCardDiv(skillCardDiv); // Apply parallax to the cloned skillCardDiv
    }
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
// cardClass "skill-card-div" or "biz-card-div"
function handleCardDivMouseEnter(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        logger.info("handleCardDivMouseEnter", targetCardDiv);
    }
}

// handle mouse leave event for any div element with
// cardClass "skill-card-div" or "biz-card-div"
function handleCardDivMouseLeave(event, cardClass) {
    var targetCardDiv = event.target.closest('.' + cardClass);
    if (targetCardDiv) {
        logger.info("handleCardDivMouseLeave", targetCardDiv);
    }
}

// handle mouse click event for any div element with
// cardClass "skill-card-div" or "biz-card-div"
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
    } else if (target.classList.contains("skill-card-div")) {
        logger.info(`canvasContainer calling handleCardDivMouseClick(event, skill-card-div`);
        handleCardDivMouseClick(event, "skill-card-div");
    } else if (target.classList.contains("biz-card-div")) {
        logger.info(`canvasContainer calling handleCardDivMouseClick(event, biz-card-div`);
        handleCardDivMouseClick(event, "biz-card-div");
    } else if (target.classList.contains("skill-resume-div")) {
        logger.info(`canvasContainer calling handleCardDivMouseClick(event, skill-resume-div`);
        handleCardDivMouseClick(event, "skill-resume-div");
    } else if (target.id == "focal-point" ) {
        // Save original pointer-events style
        const originalPointerEvents = target.style.pointerEvents;
        
        // Get all elements at the click point, hiding focal point temporarily
        target.style.pointerEvents = 'none';
        const elementsAtPoint = document.elementsFromPoint(event.clientX, event.clientY);
        // Restore original pointer-events style
        target.style.pointerEvents = originalPointerEvents;
        
        // Find the first skill-card-div or biz-card-div under the focal point
        const cardDivUnder = elementsAtPoint.find(element => 
            element.classList.contains('skill-card-div') || element.classList.contains('biz-card-div')
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

// Track selected state
let selectedClone = null;
let originalCard = null;
let theSelectedresumeDiv = null;  // Add this line

function selectTheCardDiv(skillCardDiv) {
    // Add logging to see when/why this is called during parallax
    logger.log(`[selectTheCardDiv ENTRY] Triggered for card: ${skillCardDiv ? skillCardDiv.id : 'null'}. Current selectedClone: ${selectedClone ? selectedClone.id : 'null'}. OriginalCard: ${originalCard ? originalCard.id : 'null'}`);
    
    if (!skillCardDiv) return;
    
    // Convert ID to element if needed
    if (typeof skillCardDiv === 'string') {
        logger.log(`[selectTheCardDiv] Converting ID string '${skillCardDiv}' to element.`);
        skillCardDiv = document.getElementById(skillCardDiv);
        if (!skillCardDiv) {
            logger.warn(`[selectTheCardDiv] Element with ID '${skillCardDiv}' not found.`);
            return;
        }
    }

    // Validate card type
    if (isSkillCardDiv(skillCardDiv) || (!isSkillCardDivId(skillCardDiv.id) && !isBizCardDivId(skillCardDiv.id))) {
        logger.warn(`[selectTheCardDiv] Invalid card type for element: ${skillCardDiv.id}`);
        return;
    }

    // If clicking same card, unselect it
    if (skillCardDiv === originalCard) {
        logger.log(`[selectTheCardDiv] Clicked same card (${skillCardDiv.id}), calling unselectCardDiv.`);
        unselectCardDiv();
        return;
    }

    // Unselect any previously selected card
    if (selectedClone) {
        logger.log(`[selectTheCardDiv] Found existing clone (${selectedClone.id}), calling unselectCardDiv.`);
        unselectCardDiv();
    }

    // Create and style clone
    logger.log(`[selectTheCardDiv] Creating clone for card: ${skillCardDiv.id}`);
    const clone = skillCardDiv.cloneNode(true);
    clone.id = `${skillCardDiv.id}-clone`;
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
    if (isBizCardDivId(skillCardDiv.id)) {
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
        
        if (isBizCardDivId(skillCardDiv.id)) {
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
            if (isBizCardDivId(skillCardDiv.id)) {
                logger.info(`Final bizcard position - Center X: ${(finalRect.left + finalRect.width/2).toFixed(2)}, Top: ${finalRect.top.toFixed(2)}`);
                logger.info(`Target position was - Center X: ${bullsEyeCenterX.toFixed(2)}, Top: ${(bullsEyeCenterY - 100).toFixed(2)}`);
            } else {
                logger.info(`Final card position - Center: x=${(finalRect.left + finalRect.width/2).toFixed(2)}, y=${(finalRect.top + finalRect.height/2).toFixed(2)}`);
                logger.info(`Target position was - Center: x=${bullsEyeCenterX.toFixed(2)}, y=${bullsEyeCenterY.toFixed(2)}`);
            }
        });
    });
    
    // Hide original
    logger.log(`[selectTheCardDiv] Hiding original card: ${skillCardDiv.id}`);
    skillCardDiv.style.visibility = 'hidden';
    
    // Update state
    logger.log(`[selectTheCardDiv] Updating state: selectedClone=${clone.id}, originalCard=${skillCardDiv.id}`);
    selectedClone = clone;
    originalCard = skillCardDiv;
    
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
    logger.log(`[selectTheCardDiv EXIT] Finished selecting ${skillCardDiv.id}`);
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

// Update any existing functions that reference old selection state
function deselectTheSelectedCardDiv(deselectResumeDiv = false) {
    unselectCardDiv();
    if (deselectResumeDiv) {
        deselectTheSelectedresumeDiv();
    }
}

// add the mouse click event handler to any div element with
// class skill-card-div or biz-card-div or to any child
// element that has a skillCardDiv or biz-card-div ancestor
function addCardDivClickListener(skillCardDiv) {
    skillCardDiv.addEventListener("click", cardDivClickListener);
}

// handle mouse click event for any div element with
// cardClass "skill-card-div" or "biz-card-div" or any child
// element that has a skillCardDiv or biz-card-div ancestor.
function cardDivClickListener(event) {
    let element = event.target;
    let skillCardDiv = element;
    if ( utils.isSkillCardDivOrbizCardDiv(skillCardDiv) ) {
        skillCardDiv = skillCardDiv.closest('.skill-card-div, .biz-card-div');
        selectTheCardDiv(skillCardDiv, true);
    }
    // stop event propagation if the element is not an icon
    if ( skillCardDiv && !element.classList.contains('icon') ) {
        event.stopPropagation();
    }
}

// select the given resumeDiv after scrolling it into view 
function selectTheresumeDiv(resumeDiv, selectTheCardDivFlag=false) {
    if ( resumeDiv == null )
        return;
    // utils.validateisSkillCardDiv(resumeDiv);
    // utils.validateIsBoolean(selectTheCardDivFlag);

    // does scroll self into view
    scrollElementToTop(resumeDiv);

    // click on selected to deselect and deselect its skillCardDiv
    if (theSelectedresumeDiv !== null &&
        resumeDiv.id == theSelectedresumeDiv.id) {
            deselectTheSelectedresumeDiv(selectTheCardDivFlag);
            return;
    }
    // calls  deselectTheSelectedresumeDiv and deselect its skillCardDiv
    deselectTheSelectedresumeDiv(selectTheCardDivFlag);
    // saves self as theSelected
    theSelectedresumeDiv = resumeDiv;
    // styles self as selected

    // option to select its skillCardDiv
    if ( selectTheCardDivFlag ) {
        var skillCardDiv = getCardDivOfResumeDiv(resumeDiv);
        // console.assert(skillCardDiv != null);
        selectTheCardDiv(skillCardDiv);
        // scrollElementIntoView(skillCardDiv);
    }
    
    // debugTheSelectedCardDivId();
}

function deselectTheSelectedresumeDiv(deselectTheSelectedCardDivFlag=false) {
    // if theSelectedresumeDiv is defined
    if (theSelectedresumeDiv != null) {
        // utils.validateisSkillCardDiv(theSelectedresumeDiv);

        if (deselectTheSelectedCardDivFlag) {
            deselectTheSelectedCardDiv();
        }
        // sets the theSelectedresumeDiv to null
        theSelectedresumeDiv = null;
    }
    // debugTheSelectedCardDivId();
}

function addresumeDivClickListener(resumeDiv, skillCardDiv) {

    resumeDiv.addEventListener("click", function (event) {

        // resumeDiv selected not clicked
        // scrolls self into view
        // then select its skillCardDiv and bring it into view
        selectTheresumeDiv(resumeDiv, true);

        // stop event propagation after selecting the resumeDiv
        event.stopPropagation();
    })
}

// add a new skill-resume-div to right-column-content
// if one doesn't aleady exist
// returns the newly addedresumeDiv or null
function addresumeDiv(targetCardDivId) {

    if ( targetCardDivId == null) {
        logger.log(`ignoring request to add resumeDiv with null targetCardDivId`);
        return;
    }

    // check to see if the skillCardDiv exists
    var targetCardDiv = document.getElementById(targetCardDivId);
    if (targetCardDiv == null) {
        throw new Error(`no cardDiv found for targetCardDivId:${targetCardDivId}`);
    }

    // only add a skill-resume-div for this targetCardDivId if
    // it hasn't already been added
    var exitingResumeDiv = getResumeDiv(targetCardDivId);
    if (exitingResumeDiv == null) {

        // create the resume-div if one doesn't already exist
        var resumeDiv = document.createElement("li");
        // logger.log(`created resumeDiv:${resumeDiv.id}`);
        resumeDiv.classList.add("resume-div");
        //resumeDiv.classList.add("right-column-div-child");
        resumeDiv.id = "resume-div-" + targetCardDivId;
        resumeDiv.setAttribute("targetCardDivId", targetCardDivId);
        resumeDiv.setAttribute("data-color-index", targetCardDiv.get);

        // add click listener
        addresumeDivClickListener(resumeDiv, targetCardDiv);

        // set content
        var resumeDivContent = document.createElement("div");
        resumeDivContent.classList.add("resume-div-content");
        const targetDataColorIndex = targetCardDiv.getAttribute("data-color-index");
        resumeDivContent.setAttribute("data-color-index", targetDataColorIndex);
        
        // set right column
        var resumeDivRightColumn = document.createElement('div')
        resumeDivRightColumn.classList.add("resume-div-right-column");
        resumeDivRightColumn.setAttribute('data-color-index', targetDataColorIndex);

        // start with the innerHTML of the targetCardDiv
        var targetInnerHTML = targetCardDiv.innerHTML;

        // if targetCardDiv has a "Description" attribute
        var description = targetCardDiv.getAttribute("Description");
        if (description && description.length > 0) {
            // split the description by BULLET_DELIMITER and return html 
            // of the styled form <p><ul>(<li>text</li>)+</ul></p>
            // where text contains spans that have targetCardDivIds
            var line_items_HTML = get_description_line_items_HTML(description);
            if (line_items_HTML && line_items_HTML.length > 0) {
                // remove all line breaks <br/> from line_items_HTML
                line_items_HTML = line_items_HTML.replace(/<br\/>/g, "");
                resumeDivContent.innerHTML += line_items_HTML
            }
        }

        // add resumeDiv's delete button, which removes it from the resume-div-container
        var resumeDivDeleteButton = document.createElement("button");
        resumeDivDeleteButton.classList.add("resume-div-delete-button");
        resumeDivDeleteButton.addEventListener("click", function (event) {
            resumeDiv.parentElement.removeChild(resumeDiv);
            event.stopPropagation();
        });
        resumeDivRightColumn.appendChild(resumeDivDeleteButton);

        // add resumeDiv "following" button if the targetCardDiv is a bizCardDiv
        if (isbizCardDiv(targetCardDiv)) {
            var resumeDivFollowingButton = document.createElement("button");
            resumeDivFollowingButton.classList.add("resume-div-follow-button");
            addResumeDivFollowingButtonClickHandler(resumeDivFollowingButton);
            resumeDivRightColumn.appendChild(resumeDivFollowingButton);
        }

        if (isSkillCardDiv(targetCardDiv)) {
            addCardDivMonths(targetCardDiv, resumeDivContent);
        }

        resumeDiv.appendChild(resumeDivContent);
        resumeDiv.appendChild(resumeDivRightColumn);
        resumeDivContainer.appendChild(resumeDiv);

    } else {
        // logger.log(`returning preexisting resumeDiv for targetCardDivId:${targetCardDivId}`);
        resumeDiv = exitingResumeDiv
    }

    // set the selected style
    (resumeDiv);

    // does not select self
    // does scroll self into view
    scrollElementIntoView(resumeDiv);

    const allElements = utils.findAllChildrenRecursively(resumeDiv);
    paletteSelector.applyPaletteToElements(allElements);

    return resumeDiv;
}

// --------------------------------------------------------------

// return the resumeDiv in resumeDivContainer for cardDivId or null if not found
function getResumeDiv(cardDivId) {
    const resumeDivId = "resume-div-" + cardDivId;
    return document.getElementsById(resumeDivId);
}

function getCardDivOfResumeDiv(resumeDiv) {
    var cardDivId = resumeDiv.getAttribure('card-div-id')
    return document.getElementById(cardDivId);
}

function addResumeDivFollowingButtonClickHandler(resumeDivFollowingButton) {
    resumeDivFollowingButton.addEventListener("click", function (event) {
        var resumeDiv = event.target.parentElement.parentElement;
        // console.assert(resumeDiv != null && resumeDiv.classList.contains("skill-resume-div"));

        // only bizCardDivs have this resumeDivFollowingButton
        var cardDiv = getCardDivOfResumeDiv(resumeDiv);
        if ( isbizCardDiv(cardDiv) ) {
            var followingbizCardDivId = getFollowingBizCardDivId(skillCardDiv.id);
            if ( followingbizCardDivId != null ) {
                var followingbizCardDiv = document.getElementById(followingbizCardDivId);
                if ( followingbizCardDiv != null ) {
                    selectTheCardDiv(followingbizCardDiv, true);
                }
            }
        }
        getFollowingbizCardDivId
    });
}

// get the id of the bizcard that should be
// next (added if needed and) selected
function getFollowingBizCardDivId(bizCardDivId) {

    // find the id of the bizCardDiv with 
    // the latest bizresumeDiv or null
    if (!utils.isString(bizCardDivId)) {
        var bizCardDiv = getLastbizCardDivWithResumeDiv();
        // no bizCardDivs have line items
        // so return the Id of the first bizCardDiv
        if (!bizCardDiv) {
            var allbizCardDivs = document.getElementsByClassName("biz-card-div");
            // console.assert(allbizCardDivs != null && allbizCardDivs.length > 0);
            bizCardDiv = allbizCardDivs[ 0 ];
            return bizCardDiv.id;
        } else {
            // otherwise we continue with the latest
            bizCardDivId = bizCardDiv.id;
        }
    }

    // console.assert(utils.isString(bizCardDivId));
    var index = getBizCardDivIndex(bizCardDivId);
    // console.assert(index != null);

    var followingbizCardDivId = getBizCardDivIdFromIndex(index + 1);
    // if we've reached the end of all bizCardDivs
    // then start over at index 0
    if (followingbizCardDivId == null)
        followingbizCardDivId = getBizCardDivIdFromIndex(0);

    // console.assert(isBizCardDivId(followingbizCardDivId));
    return followingbizCardDivId;
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
        var skillCardDiv = document.getElementById(cardDivId);
        if (skillCardDiv) {
            // var tagLinkText = skillCardDiv.getAttribute("tagLinkText");
            // logger.log(`tag_link.text:${tagLinkText}`);
            // console.assert(tagLinkText != null && tagLinkUrl != null);

            // selectTheCardDiv and its resumeDiv
            selectTheCardDiv(skillCardDiv, true);

            // need to scroll skillCardDiv into view
            // scrollElementIntoView(skillCardDiv);
        } else {
            // logger.log(`no skillCardDiv with tag_link found for cardDivId:${cardDivId}`);
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

function resumeDivContainerScrollToBottom() {
    resumeDivContainer.scrollTop = resumeDivContainer.scrollHeight;
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
    createBizCardDivs();
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
 * Checks if any part of the given skillCardDiv is visible within the 
 * viewport, which is derived from the canvasContainer element.
 * @param {HTMLElement} skillCardDiv - The skillCardDiv element to check.
 * @returns {boolean} - True if the skillCardDiv is within the viewport, false otherwise.
 */
function isRectWithinViewport(rect) {
    const intersects = !(rect.right < (viewport.left) || 
                         rect.left > (viewport.right) || 
                         rect.bottom < (viewport.top) || 
                         rect.top > (viewport.bottom));
    return intersects;
}

function isCardDivWithinViewport(skillCardDiv) {
    return isRectWithinViewport(skillCardDiv.getBoundingClientRect());
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
// selectAllButton - adds a resumeDiv for all bizCardDivs
//
function selectAllBizcards() {
    // delete all resumeDivs in reverse order
    clearAllDivCardResumeDivs();

    var allbizCardDivs = document.getElementsByClassName("biz-card-div");
    if ( allbizCardDivs.length == 0 ) {
        console.error("selectAllBizcards() found zero bizCardDivs.");
        return;
    }
    for (let i = 0; i < allbizCardDivs.length; i++) {
        var bizCardDiv = allbizCardDivs[ i ];

        // select the bizCardDiv and its resumeDiv
        selectTheCardDiv(bizCardDiv, true);
    }

    // select and scroll to the first bizCardDiv and its line item
    selectAndScrollToCardDiv(allbizCardDivs[0]);
}

// selectAllBizcardsButton.addEventListener("click", selectAllBizcards);

// // delete all resumeDivs in reverse order
// function clearAllDivCardResumeDivs() {
//     var allresumeDivs = document.getElementsByClassName("skill-resume-div");
//     for (let i=allresumeDivs.length-1; i >= 0 ; i--) {
//         allresumeDivs[i].remove();
//     }
//     deselectTheSelectedCardDiv();
// }

// select the given skillCardDiv and its line item 
// and scroll each into view
function selectAndScrollToCardDiv(skillCardDiv) {
    // utils.validateisSkillCardDivOrbizCardDiv(skillCardDiv);
    if ( !skillCardDiv ) {
        logger.log("Ignoring undefined skillCardDiv");
        return;
    }
    var resumeDiv = getResumeDiv(skillCardDiv.id);

    // avoid in case another select would ignore the select
    selectTheCardDiv(skillCardDiv, true);
}

// //---------------------------------------
// // clearAllResumeDivsButton - remove all resumeDivs in reverse order

// clearAllResumeDivsButton.addEventListener("click", function (event) {
//     // delete all resumeDivs in reverse order
//     clearAllDivCardResumeDivs();
// });

//---------------------------------------
// selectNextBizcardButton dateSortedBizcardIds

var dateSortedBizcardIds = null;

function getDateSortedBizcardIds() {
    if (dateSortedBizcardIds == null) {
        dateSortedBizcardIds = [];
        let bizCardDivs = document.getElementsByClassName("biz-card-div");
        for (let i = 0; i < bizCardDivs.length; i++) {
            var datedDivIdId = {
                id: bizCardDivs[ i ].id,
                endDate: getBizCardDivEndDate(bizCardDivs[ i ])
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


function getNextbizCardDivId(frombizCardDivId) {
    return getSiblingbizCardDivId(frombizCardDivId, "next");
}

function getPreviousbizCardDivId(frombizCardDivId) {
    return getSiblingbizCardDivId(frombizCardDivId, "previous");
}

function selectNextbizCardDivId(frombizCardDivId) {
    const nextbizCardDivId = getNextbizCardDivId(frombizCardDivId);
    selectTheCardDiv(nextbizCardDivId, true);
}

function selectPreviousbizCardDivId(frombizCardDivId) {
    const previousbizCardDivId = getPreviousbizCardDivId(frombizCardDivId);
    selectTheCardDiv(previousbizCardDivId, true);
}

function getTheSelectedbizCardDivId() {
    return originalCard ? originalCard.id : null;
}

function getFirstbizCardDivId() {
    var sorted = getDateSortedBizcardIds();
    if ( sorted !== undefined && sorted !== null & sorted.length > 0 )
        return sorted[0].id;
    return null;
}

function getLastbizCardDivId() {
    var sorted = getDateSortedBizcardIds();
    if ( sorted !== undefined && sorted !== null & sorted.length > 0 )
        return sorted[sorted.length-1].id;
    return null;
}

function getBizCardDivEndDate(bizCardDiv) {
    // utils.validateIsbizCardDiv(bizCardDiv);
    var endDateStr = bizCardDiv.getAttribute("endDate");
    var endDate = new Date(endDateStr);
    return endDate;
}

function getBizCardDivStartDate(bizCardDiv) {
    // utils.validateIsbizCardDiv(bizCardDiv);
    var startDateStr = bizCardDiv.getAttribute("startDate");
    var startDate = new Date(startDateStr);
    return startDate;
}



// fromBizcardId is the id of the bizCardDiv to start from
// direction is "next" or "previous"
// returns the id of the sibling bizCardDiv in the given direction.
// if fromBizcardId is null then the first or last bizCardDiv is returned
function getSiblinghBizcardId(fromBizcardId, direction) {
    const allOrderedbizCardDivIds = getDateSortedBizcardIds();
    const N = allOrderedbizCardDivIds.length;
    if ( N == 0 ) {
        logger.log("selectBizcard: no bizCardDivs found");
        return;
    }
    if ( fromBizcardId == null ) {
        logger.log("selectBizcard: fromBizcardId is null");
        if ( direction == "next" ) {
            return allOrderedbizCardDivIds[0].id;
        }
        else {
            return allOrderedbizCardDivIds[N-1].id;
        }
    }
    var fromBizcardIndex = allOrderedbizCardDivIds.findIndex(bizCardDivId => bizCardDivId.id === fromBizcardId);
    if ( fromBizcardIndex == -1 ) {
        logger.log("selectBizcard: fromBizcardId not found");
        return;
    }
    let newBizcardIndex;  // Added variable declaration
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
    return allOrderedbizCardDivIds[newBizcardIndex].id;
}

function selectFirstBizcard() {
    const firstbizCardDivId = getSiblinghBizcardId(null, "next");
    const firstbizCardDiv = document.getElementById(firstbizCardDivId);
    if ( firstbizCardDiv == null ) {
        logger.log("selectFirstBizcard: firstbizCardDiv not found");
        return;
    }
    selectTheCardDiv(firstbizCardDiv, true);
}

// return the list of all bizresumeDivs or null
function getAllbizresumeDivs() {
    const allresumeDivs = [ ...document.getElementsByClassName("skill-resume-div") ];
    const allBizcardResumeDivs = allresumeDivs.filter(resumeDiv => String(resumeDiv.id).includes("biz-card-div"));
    if (allBizcardResumeDivs.length == 0)
        return null;
    return allBizcardResumeDivs;
}

// return the Id of the last bizCardDiv that has a
// bizresumeDiv, otherwise return null
function getLastbizCardDivWithResumeDiv() {
    var allbizresumeDivs = getAllbizresumeDivs();
    if (allbizresumeDivs && allbizresumeDivs.length > 0) {
        var numbizresumeDivs = allbizresumeDivs.length;
        var lastbizresumeDiv = allbizresumeDivs[ numbizresumeDivs - 1 ];
        var lastbizCardDivId = lastbizresumeDiv.getAttribute("targetCardDivId");
        // console.assert(isBizCardDivId(lastbizCardDivId));
        var lastbizCardDiv = document.getElementById(lastbizCardDivId);
        validateIsbizCardDiv(lastbizCardDiv);
        return lastbizCardDiv;
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
    let allCardDivElements = document.getElementsByClassName("skill-card-div");
    logger.log(`addAllIconClickListeners found ${allCardDivElements.length} allCardDivElements`);
    let allDateSortedbizCardDivElements = getDateSortedBizcards();
    logger.log(`addAllIconClickListeners found ${allDateSortedbizCardDivElements.length} allDateSortedbizCardDivElements`);
    let allresumeDivElements = document.getElementsByClassName("skill-resume-div");
    logger.log(`addAllIconClickListeners found ${allresumeDivElements.length} allresumeDivElements`); 
}

function addCardDivMonths(skillCardDiv, resumeDivContent) {
    const days = skillCardDiv.dataset.bizCardDivDays;
    const months = Math.round(days * 12.0 / 365.25);
    skillCardDiv.dataset.bizCardDivMonths = months;
    skillCardDiv.dataset.bizCardDivYears = 0;
    let spanElement = resumeDivContent.querySelector("span.tag-link");
    if( spanElement ) {
        if ( months <= 12 ) {
            const units = months == 1 ? "month" : "months"; 
            spanElement.innerHTML += `<br/>(${months} ${units}  experience)`;
        } else {
            const years = Math.round(months / 12.0);
            const units = years == 1 ? "year" : "years";
            spanElement.innerHTML += `<br/>(${years} ${units} experience)`;
            skillCardDiv.dataset.bizCardDivYears = years;
        }
    } else {
        console.error(`no spanElement found for skillCardDiv:${skillCardDiv.id}`);
    }
} // <--- ADD THIS closing brace for addCardDivMonths function

selectNextBizcardButton.addEventListener("click", function (event) {
    selectNextbizCardDivId();
});
selectFirstBizcardButton.addEventListener("click", function (event) {
    selectFirstBizcard();
});

function selectFirstbizCardDivId() {
    logger.info("selectFirstbizCardDivId");
    const nextbizCardDivId = getSiblinghBizcardId(null, "next");
    const firstbizCardDiv = document.getElementById(firstbizCardDivId);
    selectTheCardDiv(firstbizCardDiv, true);
}

function getSiblingbizCardDivId(frombizCardDivId, direction) {
    logger.info("getSiblingbizCardDivId direction:", direction);
    
    const allDateOrderedbizCardDivIds = getDateSortedBizcardIds();
    const N = allDateOrderedbizCardDivIds.length;
    
    if (N === 0) {
        logger.warn("No bizcard divs found");
        return null;
    }

    // If no starting point provided, get from currently selected or default to first/last
    if (frombizCardDivId == null) {
        frombizCardDivId = getTheSelectedbizCardDivId();
        if (frombizCardDivId == null) {
            return direction === "previous" ? allDateOrderedbizCardDivIds[N-1].id : allDateOrderedbizCardDivIds[0].id;
        }
    }

    // Find the index of the frombizCardDivId in our sorted array
    const currentIndex = allDateOrderedbizCardDivIds.findIndex(item => item.id === frombizCardDivId);
    if (currentIndex === -1) {
        logger.warn("Starting bizcard div not found in ordered list");
        return direction === "previous" ? allDateOrderedbizCardDivIds[N-1].id : allDateOrderedbizCardDivIds[0].id;
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

    return allDateOrderedbizCardDivIds[newIndex].id;
}

//---------------------------------------
// canvas container event listeners

addCanvasContainerEventListener("wheel", handleCanvasContainerWheel, { passive: true });

addCanvasContainerEventListener('scroll', handleCanvasContainerScroll);

addCanvasContainerEventListener('click', handleCanvasContainerMouseClick);

// Add wheel event handler for right content div
resumeDivContainer.addEventListener("wheel", function(event) {
    // Allow the wheel event to scroll the right content div
    // and prevent it from propagating to the canvas container
    event.stopPropagation();
    
    // Calculate the new scroll position
    const currentScroll = resumeDivContainer.scrollTop;
    const delta = event.deltaY;
    const newScroll = currentScroll + delta;
    
    // Apply the scroll
    resumeDivContainer.scrollTop = newScroll;
}, { passive: true });

document.addEventListener("keydown", handleKeyDown);

function handleKeyDown(event) {
    logger.log("handleKeyDown code:", event.code);

    const SCROLL_LARGE_STEP = 300; // For PageUp/PageDown
    const SCROLL_SMALL_STEP = 100; // For Arrow Up/Down

    switch (event.code) {
        case 'ArrowLeft':
            selectPreviousbizCardDivId();
            break;
        case 'ArrowRight':
            selectNextbizCardDivId();
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
        case 'Period':
            event.preventDefault();
            focalPoint.toggleFollowPointerOutsideContainer();
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

// ResumeSection globals
// ... existing code ...

function isResumeSection(div) {
    return div && div.classList && div.classList.contains("resume-section");
}

