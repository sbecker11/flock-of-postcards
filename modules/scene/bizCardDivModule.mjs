// scene/bizCardDivModule.mjs

import * as viewPort from '../core/viewPort.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import * as colorPalettes from '../colors/colorPalettes.mjs';
import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as sceneContainer from './sceneContainer.mjs';
import * as zUtils from '../utils/zUtils.mjs';
import * as timeline from '../timeline/timeline.mjs';
import * as dateUtils from '../utils/dateUtils.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("bizCardDivModule", LogLevel.INFO);

// Business card constants
export const BIZCARD_MIN_HEIGHT = 200;
export const BIZCARD_MEAN_WIDTH = 200;
export const BIZCARD_MAX_WIDTH_OFFSET = 40; // Maximum random width offset in pixels
export const BIZCARD_MAX_X_OFFSET = 100; // Maximum random horizontal offset in pixels
export const BIZCARD_MIN_Z_DIFF = 2; // Minimum difference in Z between adjacent bizCardDivs

// Track the currently selected element
let currentSelected = null;

// Constants for element states
const ELEMENT_STATE = {
    SELECTED: 'selected'
};

export function isBizCardDiv(obj) {
    return obj && domUtils.isDivElement(obj) && obj.classList.contains('biz-card-div');
}

// returns the id of the bizCardDiv using the jobIndex
export function createBizCardDivId(jobIndex) {
    const jobInt = utils.getNumericValue(jobIndex);
    const bizCardDivId = `biz-card-div-${jobInt}`;
    return bizCardDivId;
}

// scrolls the bizCardDiv into view
export function scrollBizCardDivIntoView(bizCardDiv) {
    if (!bizCardDiv) return;
    
    // Scroll the biz card div into view
    bizCardDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Also scroll to the employer section if it exists
    const bizDetailsDiv = bizCardDiv.querySelector('.biz-details-div');
    if (bizDetailsDiv) {
        const bizDetailsClass = '.biz-details-employer';
        const bizDetailsElement = bizDetailsDiv.querySelector(bizDetailsClass);
        if (bizDetailsElement) {
            bizDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

/**
 * Creates a business card div for a job. Does NOT appends itself
 * to the scenePlane. This is done in main.mjs
 * 
 * @param {Object} job - The job object
 * @param {number} jobIndex - The index of the job in the original un-sorted array
 * @returns {HTMLElement} The created business card div
 */
export function createBizCardDiv(job, jobIndex) {
    // Create the bizCardDiv element first
    const bizCardDiv = document.createElement("div");
    bizCardDiv.id = `biz-card-div-${jobIndex}`;
    bizCardDiv.className = "biz-card-div";
    bizCardDiv.setAttribute("data-job-index", jobIndex.toString());
    
    // Set scene geometry BEFORE appending to DOM
    setBizCardDivSceneGeometry(bizCardDiv, job);
    
    // Assign color index
    colorPalettes.assignColorIndex(bizCardDiv, jobIndex);
    
    // create and append bizCardDetails
    const bizCardDetailsDiv = BizDetailsDivModule.createBizCardDetailsDiv(bizCardDiv, job);
    bizCardDiv.appendChild(bizCardDetailsDiv);
    
    // Apply the color set to bizCardDiv
    colorPalettes.applyCurrentColorPaletteToElement(bizCardDiv);
    
    // Append to scene plane
    const scenePlane = document.getElementById("scene-plane");
    scenePlane.appendChild(bizCardDiv);
    bizCardDiv.style.opacity = "0.5";
    
    return bizCardDiv;
}

function setAndVerifyAttribute(bizCardDiv,attributeName, value) {
    bizCardDiv.setAttribute(`data-${attributeName}`, value);
    const checkValue = parseFloat(bizCardDiv.getAttribute(`data-${attributeName}`));
    if ( !utils.isNumber(checkValue) ) throw new Error(`check${attributeName} is not a number`);
    // console.log(`   ${attributeName}:`, checkValue);
}

let lastSceneZ = -1;
let lastSceneTop = -1;
let lastSceneBottom = -1;
/**
 * Sets the scene-relative geometry of a business card div
 * @param {HTMLElement} bizCardDiv - The business card div
 * @param {Object} job - The job object
 */
function setBizCardDivSceneGeometry(bizCardDiv, job) {
    // console.log(`Setting geometry for ${bizCardDiv.id} with job:`, job);
    
    if (!job) {
        console.error(`Job not found for bizCardDiv ${bizCardDiv.id}`);
        return;
    }
        
    try {
        // Validate job dates
        if (!job.start || !job.end) {
            throw new Error(`Job ${bizCardDiv.id} is missing start or end date`);
        }
        
        // console.log(`Job dates: start=${job.start}, end=${job.end}`);
        
        
        // Get vertical positions - based on job start and end dates
        const start_year_str = job.start.split("-")[0];
        const start_month_str = job.start.split("-")[1];
        const sceneBottom = timeline.getTimelineYearMonthBottom(start_year_str, start_month_str);

        let sceneTop = "";
        if ( job.end == "CURRENT_DATE" ) {
            const end_YYYY_MM_DD = dateUtils.formatISO8601DateOnly(new Date());
            const end_year_str = end_YYYY_MM_DD.split("-")[0];
            const end_month_str = end_YYYY_MM_DD.split("-")[1];
            sceneTop = timeline.getTimelineYearMonthBottom(end_year_str, end_month_str);
        } else {
            const end_year_str = job.end.split("-")[0];
            const end_month_str = job.end.split("-")[1];
            sceneTop = timeline.getTimelineYearMonthBottom(end_year_str, end_month_str);
        }
        const sceneHeight = sceneBottom - sceneTop;
        const sceneCenterY = sceneTop + sceneHeight/2;
        
        // Set data attributes for scene geometry (used by parallax)
        bizCardDiv.setAttribute("data-sceneTop", sceneTop);
        bizCardDiv.setAttribute("data-sceneBottom", sceneBottom);
        bizCardDiv.setAttribute("data-sceneHeight", sceneHeight);
        bizCardDiv.setAttribute("data-sceneCenterY", sceneCenterY);
        
        const sceneCenterX = mathUtils.getRandomSignedOffset(BIZCARD_MAX_X_OFFSET);
        const sceneWidth = BIZCARD_MEAN_WIDTH + mathUtils.getRandomSignedOffset(BIZCARD_MAX_WIDTH_OFFSET);
        const sceneLeft = sceneCenterX - sceneWidth / 2;
        const sceneRight = sceneCenterX + sceneWidth / 2;
        
        bizCardDiv.setAttribute("data-sceneLeft", sceneLeft);
        bizCardDiv.setAttribute("data-sceneRight", sceneRight);
        bizCardDiv.setAttribute("data-sceneWidth", sceneWidth);
        bizCardDiv.setAttribute("data-sceneCenterX", sceneCenterX);
        
        let sceneZ = 0;
        while (true) {
            sceneZ = mathUtils.getRandomInt(zUtils.ALL_CARDS_Z_MIN, zUtils.ALL_CARDS_Z_MAX);
            if (utils.abs_diff(sceneZ, lastSceneZ) >= BIZCARD_MIN_Z_DIFF) {
                lastSceneZ = sceneZ;
                break;
            }
        }
        utils.validateNumberInRange(sceneZ, zUtils.ALL_CARDS_Z_MIN, zUtils.ALL_CARDS_Z_MAX);
        bizCardDiv.setAttribute("data-sceneZ", sceneZ);
        
        // console.log(`Set geometry for ${bizCardDiv.id}:`);
        // console.log(` sceneTop: ${sceneTop}`);
        // console.log(` sceneBottom: ${sceneBottom}`);
        // console.log(` sceneHeight: ${sceneHeight}`);
        // console.log(` sceneCenterY: ${sceneCenterY}`);

        // console.log(` sceneLeft: ${sceneLeft}`);
        // console.log(` sceneRight: ${sceneRight}`);
        // console.log(` sceneWidth: ${sceneWidth}`);
        // console.log(` sceneCenterX: ${sceneCenterX}`);

        // console.log(` sceneZ: ${sceneZ}`);
        // console.log(` zIndex: ${zUtils.get_zIndexStr_from_z(sceneZ)}`);
        
        function verifyAttribute(attrName, sceneValue) {
            const attrValue = parseFloat(bizCardDiv.getAttribute(`data-${attrName}`));
            if (isNaN(attrValue)) {
                console.error(`Failed to set ${attrName} for ${bizCardDiv.id}`);
            }
            const checkValue = parseFloat(bizCardDiv.getAttribute(`data-${attrName}`));
            if ( !utils.isNumber(checkValue) ) throw new Error(`check${attrName} is not a number`);
            if (checkValue !== sceneValue) throw new Error("Attribute mismatch: set sceneValue=${sceneValue}, got ${checkValue} for ${attrName}");
        }
        verifyAttribute("sceneTop", sceneTop);
        verifyAttribute("sceneBottom", sceneBottom);
        verifyAttribute("sceneHeight", sceneHeight);
        verifyAttribute("sceneCenterY", sceneCenterY);
        verifyAttribute("sceneLeft", sceneLeft);
        verifyAttribute("sceneRight", sceneRight);
        verifyAttribute("sceneWidth", sceneWidth);
        verifyAttribute("sceneCenterX", sceneCenterX);
        verifyAttribute("sceneZ", sceneZ);
    } catch (error) {
        console.error(`Error setting geometry for ${bizCardDiv.id}:`, error);
    }
    
    // Verify attributes were set
    const requiredAttributes = [
        "data-sceneCenterX", 
        "data-sceneCenterY", 
        "data-sceneTop", 
        "data-sceneBottom",
        "data-sceneLeft",
        "data-sceneRight",
        "data-sceneWidth",
        "data-sceneZ"
    ];
    
    let numErrors = 0;
    for (const attr of requiredAttributes) {
        if (!bizCardDiv.hasAttribute(attr)) {
            console.error(`Failed to set ${attr} for ${bizCardDiv.id}`);
            numErrors++;
        }
    }
    if ( numErrors !== 0 ) {
        throw new Error("numErrors:", numErrors);
    }

}

// Handle click events on biz card divs
export function handleClickEvent(element) {
    if (!element) return;
    
    // If the element is already selected, unselect it
    if (element.classList.contains(ELEMENT_STATE.SELECTED)) {
        console.log(`bizCardDivModule: Unselecting element ${element.id}`);
        clearSelected();
        return;
    }

    // Otherwise, select the element
    console.log(`bizCardDivModule: Selecting element ${element.id}`);
    selectBizCardDiv(element);
}

// Select a biz card div and its paired resume div
export function selectBizCardDiv(bizCardDiv) {
    if (!bizCardDiv) return;
    
    // Clear any existing selection
    clearSelected();
    
    // Set as selected
    bizCardDiv.classList.add(ELEMENT_STATE.SELECTED);
    currentSelected = bizCardDiv;
    
    // Find the corresponding resume div
    const pairedId = bizCardDiv.getAttribute('data-paired-id');
    if (pairedId) {
        const bizResumeDiv = document.getElementById(pairedId);
        if (bizResumeDiv) {
            bizResumeDiv.classList.add(ELEMENT_STATE.SELECTED);
            
            // Get the job index
            const jobIndex = parseInt(bizCardDiv.getAttribute('data-job-index'), 10);
            if (!isNaN(jobIndex)) {
                // Get the resume manager and scroll to the correct resume div
                const resumeManager = getResumeManager();
                if (resumeManager) {
                    resumeManager.syncWithSceneSelection(jobIndex);
                    console.log(`Scrolled resume div ${bizResumeDiv.id} into view`);
                }
            }
        }
    }
}

// Clear all selections
export function clearSelected() {
    if (!currentSelected) return;
    
    // Remove selected class from current element
    currentSelected.classList.remove(ELEMENT_STATE.SELECTED);
    
    // Find and unselect the paired element
    const pairedId = currentSelected.getAttribute('data-paired-id');
    if (pairedId) {
        const pairedElement = document.getElementById(pairedId);
        if (pairedElement) {
            pairedElement.classList.remove(ELEMENT_STATE.SELECTED);
        }
    }
    
    // Find and clear all selected elements (as a safety measure)
    document.querySelectorAll(`.${ELEMENT_STATE.SELECTED}`).forEach(element => {
        element.classList.remove(ELEMENT_STATE.SELECTED);
    });
    
    // Reset the current selection
    currentSelected = null;
    console.log('bizCardDivModule: Selection cleared');
}

// Set up the scene plane click handler for unselection
export function setupScenePlaneClickHandler() {
    const scenePlane = document.getElementById('scene-plane');
    if (!scenePlane) {
        console.error('bizCardDivModule: setupScenePlaneClickHandler: scene-plane not found');
        return;
    }
    
    // Remove any existing click handler to avoid duplicates
    scenePlane.removeEventListener('click', handleScenePlaneClick);
    
    // Add the click handler
    scenePlane.addEventListener('click', handleScenePlaneClick);
    console.log('bizCardDivModule: Added scene plane click handler for unselection');
}

// Handle clicks on the scene plane
function handleScenePlaneClick(event) {
    // Only handle direct clicks on the scene plane, not on its children
    if (event.target.id !== 'scene-plane') {
        return;
    }
    
    console.log('scene-plane click detected');
    
    // If there's a current selection, clear it
    if (currentSelected) {
        clearSelected();
    }
}

// Get the resume manager instance
function getResumeManager() {
    // This should be implemented based on how your application manages the resume manager
    // For example, it might be stored in a global variable or accessible through another module
    return window.resumeManager; // Adjust as needed
}

export function handleMouseEnterEvent(element) {
    if ( !element ) throw new Error('bizCardDivModule:handleMouseEnterEvent: given null element');
    //console.log('bizCardDivModule:handleMouseEnterEvent: element.id', element.id);
    const jobIndex = element.getAttribute('data-job-index');
    if ( !utils.isNumericString(jobIndex)) throw new Error('bizCardDivModule:handleMouseEnterEvent: element has non-numeric data-job-index attribute string');
    if ( !domUtils.hasClass(element, "selected")) {
        domUtils.addClass(element, "hovered");
        resumeManager.addClassItem(jobIndex,'hovered');
        console.log("element:",element.id,"hovered");
    } else {
        console.log("element:",element.id,"not hovered");
    }
}
export function handleMouseLeaveEvent(element) {
    if ( !element ) throw new Error('bizCardDivModule:handleMouseLeaveEvent: given null element');
    //console.log('bizCardDivModule:handleMouseLeaveEvent: element.id', element.id);
    const jobIndex = element.getAttribute('data-job-index');
    if ( !utils.isNumericString(jobIndex) ) throw new Error('bizCardDivModule:handleMouseLeaveEvent: element has non-numeric data-job-index attribute string');
    if ( !domUtils.hasClass(element, "selected")) {
        domUtils.removeClass(element, "hovered");
        resumeManager.removeClassItem(jobIndex, "hovered");
        console.log("element:",element.id,"unhovered");
    } else {
        console.log("element:",element.id,"not unhovered");
    }
}

/**
 * Emergency function to set geometry for all existing bizCardDivs
 * Call this if cards are missing attributes
 * @param {Array} jobsArray - The array of job objects
 */
export function setGeometryForAllBizCardDivs(jobsArray) {
    if (!jobsArray || !Array.isArray(jobsArray)) {
        console.error("setGeometryForAllBizCardDivs: jobsArray is not defined or not an array");
        throw new Error("jobsArray is required and must be an array");
    }
    
    const bizCardDivs = document.getElementsByClassName("biz-card-div");
    // console.log(`Setting geometry for ${bizCardDivs.length} existing bizCardDivs with ${jobsArray.length} jobs`);
    
    for (let i = 0; i < bizCardDivs.length; i++) {
        const bizCardDiv = bizCardDivs[i];
        const jobIndex = parseInt(bizCardDiv.getAttribute("data-job-index"), 10) || i;
        
        // Get the corresponding job
        if (jobIndex >= jobsArray.length) {
            console.error(`Job index ${jobIndex} is out of bounds (max: ${jobsArray.length - 1})`);
            continue;
        }
        
        const job = jobsArray[jobIndex];
        if (!job) {
            console.error(`Job at index ${jobIndex} is null or undefined`);
            continue;
        }
        
        // Set geometry
        setBizCardDivSceneGeometry(bizCardDiv, job);
        
        // Verify
        // console.log(`Verified ${bizCardDiv.id} has sceneCenterX:`, 
        //     bizCardDiv.getAttribute("data-sceneCenterX"));
    }
}
