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
import * as resumeManagerModule from '../resume/resumeManager.mjs';
import * as bizResumeDivModule from './bizResumeDivModule.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("bizCardDivModule", LogLevel.INFO);

// Add a function to get the resumeManager when needed
/**
 * Gets the resumeManager instance and verifies it's initialized
 * @returns {Object|null} The resumeManager instance or null if not available/initialized
 */
function getResumeManager() {
    const resumeManager = window.resumeManager;
    
    // Check if resumeManager exists
    if (!resumeManager) {
        console.warn("getResumeManager: resumeManager not found on window object");
        return null;
    }
    
    // Check if it's initialized
    if (!resumeManager.isInitialized()) {
        console.warn("getResumeManager: resumeManager exists but is not initialized");
        return null;
    }
    
    return resumeManager;
}

// Add a function to get the viewPort when needed
/**
 * Gets the viewPort instance and verifies it's initialized
 * @returns {Object|null} The viewPort instance or null if not available/initialized
 */
function getViewPort() {
    const viewPort = window.viewPort;
    
    // Check if viewPort exists
    if (!viewPort) {
        console.warn("getViewPort: viewPort not found on window object");
        return null;
    }
    
    // Check if it's initialized (if the method exists)
    if (typeof viewPort.isViewPortInitialized === 'function' && !viewPort.isViewPortInitialized()) {
        console.warn("getViewPort: viewPort exists but is not initialized");
        return null;
    }
    
    return viewPort;
}

// Business card constants
export const BIZCARD_MIN_HEIGHT = 200;
export const BIZCARD_MEAN_WIDTH = 200;
export const BIZCARD_MAX_WIDTH_OFFSET = 40; // Maximum random width offset in pixels
export const BIZCARD_MAX_X_OFFSET = 100; // Maximum random horizontal offset in pixels
export const BIZCARD_MIN_Z_DIFF = 2; // Minimum difference in Z between adjacent bizCardDivs

// Track the currently selected element
let currentSelected = null;

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
    if (!bizCardDiv) {
        console.error("scrollBizCardDivIntoView: bizCardDiv is null");
        return;
    }
    
    console.log(`bizCardDivModule: Attempting to scroll ${bizCardDiv.id} into view`);
    
    // Get the scene container
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error("scrollBizCardDivIntoView: scene-container not found");
        return;
    }
    
    // Force the scene container to be scrollable
    sceneContainer.style.overflow = 'auto';
    
    // Get the scene position data from the bizCardDiv's data attributes
    const sceneTop = parseFloat(bizCardDiv.getAttribute('data-sceneTop'));
    const sceneBottom = parseFloat(bizCardDiv.getAttribute('data-sceneBottom'));
    
    if (isNaN(sceneTop) || isNaN(sceneBottom)) {
        console.error(`scrollBizCardDivIntoView: Invalid scene position data for ${bizCardDiv.id}`);
        console.log(`sceneTop: ${bizCardDiv.getAttribute('data-sceneTop')}`);
        console.log(`sceneBottom: ${bizCardDiv.getAttribute('data-sceneBottom')}`);
        return;
    }
    
    // Calculate the height of the bizCardDiv in the scene
    const sceneHeight = sceneBottom - sceneTop;
    
    console.log(`bizCardDiv ${bizCardDiv.id} scene position: top=${sceneTop}, bottom=${sceneBottom}, height=${sceneHeight}`);
    
    // Check if the bizCardDiv is taller than the viewport
    const isTallerThanViewport = sceneHeight > sceneContainer.clientHeight;
    console.log(`bizCardDiv is ${isTallerThanViewport ? 'taller' : 'shorter'} than viewport`);
    
    let scrollPosition;
    
    if (isTallerThanViewport) {
        // For tall bizCardDivs, scroll to show the top portion with a small margin
        const topMargin = 30; // Pixels from the top of the viewport
        scrollPosition = sceneTop - topMargin;
        console.log(`Using top-aligned scrolling for tall bizCardDiv with margin: ${topMargin}px`);
    } else {
        // For normal-sized bizCardDivs, center them in the viewport
        const sceneCenterY = (sceneTop + sceneBottom) / 2;
        scrollPosition = sceneCenterY - (sceneContainer.clientHeight / 2);
        console.log(`Using center-aligned scrolling for normal-sized bizCardDiv`);
    }
    
    console.log(`Calculated scroll position: ${scrollPosition}`);
    console.log(`Current scroll position: ${sceneContainer.scrollTop}`);
    
    // Ensure the scroll position is within bounds
    const maxScroll = sceneContainer.scrollHeight - sceneContainer.clientHeight;
    const boundedScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));
    
    if (boundedScrollPosition !== scrollPosition) {
        console.log(`Adjusted scroll position to stay within bounds: ${boundedScrollPosition}`);
    }
    
    // Scroll to the calculated position
    console.log(`Scrolling scene container to ${boundedScrollPosition}`);
    
    // First try with smooth behavior
    sceneContainer.scrollTo({
        top: boundedScrollPosition,
        behavior: 'smooth'
    });
    
    // Check if scrolling worked after a delay
    setTimeout(() => {
        console.log(`After scrolling, scene container scrollTop: ${sceneContainer.scrollTop}`);
        
        // If we're not close to the target position, try with auto behavior
        if (Math.abs(sceneContainer.scrollTop - boundedScrollPosition) > 50) {
            console.log("Smooth scrolling didn't work, trying with auto behavior");
            
            sceneContainer.scrollTo({
                top: boundedScrollPosition,
                behavior: 'auto'
            });
            
            // Check again after a short delay
            setTimeout(() => {
                console.log(`After auto scrolling, scene container scrollTop: ${sceneContainer.scrollTop}`);
                
                // If we're still not close, try direct assignment
                if (Math.abs(sceneContainer.scrollTop - boundedScrollPosition) > 50) {
                    console.log("Auto scrolling didn't work, trying direct assignment");
                    sceneContainer.scrollTop = boundedScrollPosition;
                    
                    console.log(`After direct assignment, scene container scrollTop: ${sceneContainer.scrollTop}`);
                }
            }, 100);
        }
    }, 500);
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
    // Remove the initialization check completely
    // if (!_isBizCardDivModuleInitialized) {
    //     console.warn("bizCardDivModule not initialized, initializing now");
    //     initializeBizCardDivModule();
    // }
    
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
    
    console.log(`bizCardDivModule: Selecting element ${element.id}`);
    selectBizCardDiv(element);
}

/**
 * Select a biz card div and its paired bizResumeDiv 
 * but don't scroll bizCardDiv into view
 * @param {*} bizCardDiv 
 * @returns 
 */
export function selectBizCardDiv(bizCardDiv) {
    if (!bizCardDiv) return;
    console.log(`bizCardDivModule: Selecting bizCardDiv ${bizCardDiv.id}`);
    const isSelected = bizCardDiv.classList.contains("selected");
    clearAllSelected();
    if (isSelected) {
        return;
    }

    // mark the bizCardDiv as selected
    bizCardDiv.classList.remove("hovered");
    bizCardDiv.classList.add("selected");

    // select the paired bizResumeDiv and scroll it into view
    const pairedId = bizCardDiv.getAttribute('data-paired-id');
    const bizResumeDiv = document.getElementById(pairedId);
    selectBizResumeDivAndScrollIntoView(bizResumeDiv);
}

export function selectBizResumeDivAndScrollIntoView(bizResumeDiv) {
    if (!bizResumeDiv) return;
    console.log(`bizCardDivModule: Selecting bizResumeDiv ${bizResumeDiv.id}`);
         
    // mark it as selected
    bizResumeDiv.classList.remove("hovered");
    bizResumeDiv.classList.add("selected");

    const jobIndex = parseInt(bizResumeDiv.getAttribute('data-job-index'), 10);
    const resumeManager = getResumeManager();
    if (resumeManager) {
        resumeManager.syncWithSceneSelection(jobIndex);
        resumeManager.scrollBizResumeDivIntoView(bizResumeDiv);
    }
}

/**
 * Clear all selections called by both 
 * bizCardDivModule and bizResumeDivModule
 * before any new selection is made
 * or when the scene plane is clicked
 * or when the current element is selected
 */
export function clearAllSelected() {
    const selectedElements = document.querySelectorAll('.selected');
    console.log(`bizCardDivModule: Found ${selectedElements.length} selected elements to clear`);
    selectedElements.forEach(element => {
        element.classList.remove("selected");    
    });
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
    console.log('scene-plane click detected')
    console.log('bizCardDivModule: Clearing all selected');
    clearAllSelected();
}

// // Fallback function to scroll a bizResumeDiv into view
// function scrollBizResumeDivIntoView(bizResumeDiv) {
//     if (!bizResumeDiv) {
//         console.error("scrollBizResumeDivIntoView: bizResumeDiv is null");
//         return;
//     }
    
//     console.log(`bizCardDivModule: Attempting to scroll ${bizResumeDiv.id} into view (fallback method)`);
    
//     // Try multiple approaches to ensure the bizResumeDiv is scrolled into view
    
//     // Approach 1: Direct scrollIntoView on the bizResumeDiv
//     try {
//         bizResumeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         console.log(`bizCardDivModule: Called scrollIntoView directly on ${bizResumeDiv.id}`);
//     } catch (error) {
//         console.error(`bizCardDivModule: Error with direct scrollIntoView:`, error);
//     }
    
//     // Approach 2: Find the resume content div and scroll it
//     const resumeContentDiv = document.getElementById('resume-content-div');
//     if (resumeContentDiv) {
//         console.log(`bizCardDivModule: Found resume-content-div, calculating scroll position`);
        
//         try {
//             // Calculate the scroll position needed to center the bizResumeDiv
//             const offsetTop = bizResumeDiv.offsetTop;
//             const resumeHeight = resumeContentDiv.clientHeight;
//             const divHeight = bizResumeDiv.clientHeight;
            
//             // Center the div in the viewport
//             const scrollTop = offsetTop - (resumeHeight / 2) + (divHeight / 2);
            
//             console.log(`bizCardDivModule: Calculated scroll position: ${scrollTop}`);
//             console.log(`bizCardDivModule: Current scroll position: ${resumeContentDiv.scrollTop}`);
            
//             // Scroll to the calculated position
//             resumeContentDiv.scrollTo({
//                 top: scrollTop,
//                 behavior: 'smooth'
//             });
            
//             console.log(`bizCardDivModule: Scrolled resume-content-div to ${scrollTop}`);
            
//             // Check if scrolling worked after a delay
//             setTimeout(() => {
//                 console.log(`bizCardDivModule: After scrolling, resume-content-div scrollTop: ${resumeContentDiv.scrollTop}`);
                
//                 // If we're not close to the target position, try with auto behavior
//                 if (Math.abs(resumeContentDiv.scrollTop - scrollTop) > 50) {
//                     console.log("bizCardDivModule: Smooth scrolling didn't work, trying with auto behavior");
                    
//                     resumeContentDiv.scrollTo({
//                         top: scrollTop,
//                         behavior: 'auto'
//                     });
                    
//                     // Check again after a short delay
//                     setTimeout(() => {
//                         console.log(`bizCardDivModule: After auto scrolling, resume-content-div scrollTop: ${resumeContentDiv.scrollTop}`);
                        
//                         // If we're still not close, try direct assignment
//                         if (Math.abs(resumeContentDiv.scrollTop - scrollTop) > 50) {
//                             console.log("bizCardDivModule: Auto scrolling didn't work, trying direct assignment");
//                             resumeContentDiv.scrollTop = scrollTop;
                            
//                             console.log(`bizCardDivModule: After direct assignment, resume-content-div scrollTop: ${resumeContentDiv.scrollTop}`);
//                         }
//                     }, 100);
//                 }
//             }, 500);
//         } catch (error) {
//             console.error(`bizCardDivModule: Error scrolling resume-content-div:`, error);
//         }
//     }
    
//     // Approach 3: If the infinite scroller is available, try to use it
//     if (window.infiniteScroller) {
//         const jobIndex = parseInt(bizResumeDiv.getAttribute('data-job-index'), 10);
//         if (!isNaN(jobIndex)) {
//             console.log(`bizCardDivModule: Attempting to use infiniteScroller to scroll to job index ${jobIndex}`);
//             try {
//                 window.infiniteScroller.scrollToItem(jobIndex);
//                 console.log(`bizCardDivModule: Scrolled to job index ${jobIndex} using infiniteScroller`);
//             } catch (error) {
//                 console.error(`bizCardDivModule: Error scrolling to job index ${jobIndex} using infiniteScroller:`, error);
//             }
//         } else {
//             console.error(`bizCardDivModule: Could not get job index from bizResumeDiv ${bizResumeDiv.id}`);
//         }
//     }
    
//     console.log(`bizCardDivModule: Completed all attempts to scroll bizResumeDiv ${bizResumeDiv.id} into view`);
// }

export function handleMouseEnterEvent(element) {
    if (!element) return;
    
    try {
        console.log(`bizCardDivModule: Mouse enter on ${element.id}`);
        
        // Always apply hover state regardless of focal point state
        if (!element.classList.contains("selected")) {
            // Force add the hovered class with high specificity
            element.classList.add("hovered");
            element.setAttribute("data-hovered", "true");
            
            // Find and hover the paired resume div
            const pairedId = element.getAttribute('data-paired-id');
            if (pairedId) {
                const bizResumeDiv = document.getElementById(pairedId);
                if (bizResumeDiv && !bizResumeDiv.classList.contains("selected")) {
                    bizResumeDiv.classList.add("hovered");
                    bizResumeDiv.setAttribute("data-hovered", "true");
                    console.log(`bizCardDivModule: Added hover to paired bizResumeDiv ${pairedId}`);
                }
            }
            
            console.log(`bizCardDivModule: Element ${element.id} hovered`);
        } else {
            console.log(`bizCardDivModule: Element ${element.id} not hovered (already selected)`);
        }
    } catch (error) {
        console.error("Error in handleMouseEnterEvent:", error);
        
        // Fallback to simple hover
        if (element && !element.classList.contains("selected")) {
            element.classList.add("hovered");
            element.setAttribute("data-hovered", "true");
        }
    }
}

export function handleMouseLeaveEvent(element) {
    if (!element) return;
    
    try {
        console.log(`bizCardDivModule: Mouse leave on ${element.id}`);
        
        // Always remove hover state regardless of focal point state
        if (!element.classList.contains("selected")) {
            element.classList.remove("hovered");
            element.removeAttribute("data-hovered");
            
            // Find and unhover the paired resume div
            const pairedId = element.getAttribute('data-paired-id');
            if (pairedId) {
                const bizResumeDiv = document.getElementById(pairedId);
                if (bizResumeDiv && !bizResumeDiv.classList.contains("selected")) {
                    bizResumeDiv.classList.remove("hovered");
                    bizResumeDiv.removeAttribute("data-hovered");
                    console.log(`bizCardDivModule: Removed hover from paired bizResumeDiv ${pairedId}`);
                }
            }
            
            console.log(`bizCardDivModule: Element ${element.id} unhovered`);
        } else {
            console.log(`bizCardDivModule: Element ${element.id} not unhovered (selected)`);
        }
    } catch (error) {
        console.error("Error in handleMouseLeaveEvent:", error);
        
        // Fallback to simple unhover
        if (element && !element.classList.contains("selected")) {
            element.classList.remove("hovered");
            element.removeAttribute("data-hovered");
        }
    }
}

/**
 * Simplified mouse enter handler that doesn't rely on resumeManager
 * This is used as a fallback when resumeManager is not available
 */
export function simpleMouseEnterHandler(element) {
    if (!element) return;
    
    // Just add the hovered class to the element
    if (!element.classList.contains("selected")) {
        element.classList.add("hovered");
        console.log(`Simple hover applied to ${element.id}`);
        
        // Try to find and hover the paired element
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const pairedElement = document.getElementById(pairedId);
            if (pairedElement && !pairedElement.classList.contains("selected")) {
                pairedElement.classList.add("hovered");
            }
        }
    }
}

/**
 * Simplified mouse leave handler that doesn't rely on resumeManager
 * This is used as a fallback when resumeManager is not available
 */
export function simpleMouseLeaveHandler(element) {
    if (!element) return;
    
    // Just remove the hovered class from the element
    if (!element.classList.contains("selected")) {
        element.classList.remove("hovered");
        console.log(`Simple hover removed from ${element.id}`);
        
        // Try to find and unhover the paired element
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const pairedElement = document.getElementById(pairedId);
            if (pairedElement && !pairedElement.classList.contains("selected")) {
                pairedElement.classList.remove("hovered");
            }
        }
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

// Function to check if the scene container is properly set up for scrolling
export function checkSceneContainerScrolling() {
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error("Scene container not found");
        return false;
    }
    
    console.log("Scene container properties:");
    console.log("- offsetHeight:", sceneContainer.offsetHeight);
    console.log("- scrollHeight:", sceneContainer.scrollHeight);
    console.log("- clientHeight:", sceneContainer.clientHeight);
    console.log("- scrollTop:", sceneContainer.scrollTop);
    console.log("- style.overflow:", getComputedStyle(sceneContainer).overflow);
    console.log("- style.position:", getComputedStyle(sceneContainer).position);
    
    // Check if it's scrollable
    const isScrollable = sceneContainer.scrollHeight > sceneContainer.clientHeight;
    console.log("- Is scrollable:", isScrollable);
    
    if (!isScrollable) {
        console.warn("Scene container is not scrollable. This may prevent scrolling bizCardDivs into view.");
    }
    
    // Check if overflow is set correctly
    const overflow = getComputedStyle(sceneContainer).overflow;
    if (overflow !== 'auto' && overflow !== 'scroll') {
        console.warn(`Scene container overflow is set to '${overflow}'. Should be 'auto' or 'scroll'.`);
        console.log("Setting overflow to 'auto'");
        sceneContainer.style.overflow = 'auto';
    }
    
    return isScrollable;
}

// Function to check if all bizCardDivs have the required scene position data
export function checkBizCardDivsSceneData() {
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    console.log(`Found ${bizCardDivs.length} bizCardDivs`);
    
    let missingDataCount = 0;
    
    bizCardDivs.forEach((bizCardDiv, index) => {
        const sceneTop = bizCardDiv.getAttribute('data-sceneTop');
        const sceneBottom = bizCardDiv.getAttribute('data-sceneBottom');
        
        if (!sceneTop || !sceneBottom || isNaN(parseFloat(sceneTop)) || isNaN(parseFloat(sceneBottom))) {
            console.error(`bizCardDiv ${bizCardDiv.id} is missing valid scene position data`);
            console.log(`sceneTop: ${sceneTop}`);
            console.log(`sceneBottom: ${sceneBottom}`);
            missingDataCount++;
        } else if (index < 5) {  // Only log the first 5 to avoid console spam
            console.log(`bizCardDiv ${bizCardDiv.id} scene position: top=${sceneTop}, bottom=${sceneBottom}`);
        }
    });
    
    if (missingDataCount > 0) {
        console.error(`${missingDataCount} bizCardDivs are missing valid scene position data`);
    } else {
        console.log("All bizCardDivs have valid scene position data");
    }
    
    return missingDataCount === 0;
}

// Function to check if a bizCardDiv is properly visible in the viewport
export function isBizCardDivProperlyVisible(bizCardDiv) {
    if (!bizCardDiv) {
        console.error("isBizCardDivProperlyVisible: bizCardDiv is null");
        return false;
    }
    
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error("isBizCardDivProperlyVisible: scene-container not found");
        return false;
    }
    
    // Get the scene position data
    const sceneTop = parseFloat(bizCardDiv.getAttribute('data-sceneTop'));
    const sceneBottom = parseFloat(bizCardDiv.getAttribute('data-sceneBottom'));
    
    if (isNaN(sceneTop) || isNaN(sceneBottom)) {
        console.error(`isBizCardDivProperlyVisible: Invalid scene position data for ${bizCardDiv.id}`);
        return false;
    }
    
    // Calculate the height of the bizCardDiv in the scene
    const sceneHeight = sceneBottom - sceneTop;
    
    // Check if the bizCardDiv is taller than the viewport
    const isTallerThanViewport = sceneHeight > sceneContainer.clientHeight;
    
    // Get the current scroll position
    const scrollTop = sceneContainer.scrollTop;
    const viewportBottom = scrollTop + sceneContainer.clientHeight;
    
    let isProperlyVisible;
    
    if (isTallerThanViewport) {
        // For tall bizCardDivs, check if the top portion is visible
        const topMargin = 30; // Same margin used in scrollBizCardDivIntoView
        isProperlyVisible = (
            sceneTop >= scrollTop - topMargin &&
            sceneTop <= viewportBottom - 100 // Ensure at least 100px of the top is visible
        );
    } else {
        // For normal-sized bizCardDivs, check if it's fully or mostly visible
        const visibleTop = Math.max(sceneTop, scrollTop);
        const visibleBottom = Math.min(sceneBottom, viewportBottom);
        const visibleHeight = visibleBottom - visibleTop;
        
        // Consider it properly visible if at least 70% is visible
        isProperlyVisible = visibleHeight >= sceneHeight * 0.7;
    }
    
    console.log(`bizCardDiv ${bizCardDiv.id} visibility check:`);
    console.log(`- sceneTop: ${sceneTop}, sceneBottom: ${sceneBottom}, sceneHeight: ${sceneHeight}`);
    console.log(`- scrollTop: ${scrollTop}, viewportBottom: ${viewportBottom}`);
    console.log(`- isTallerThanViewport: ${isTallerThanViewport}`);
    console.log(`- isProperlyVisible: ${isProperlyVisible}`);
    
    return isProperlyVisible;
}

// Make these functions available globally for debugging
window.bizCardDivUtils = {
    scrollBizCardDivIntoView,
    isBizCardDivProperlyVisible,
    checkBizCardDivsSceneData,
    checkSceneContainerScrolling
};

/**
 * Ensure all bizCardDivs have pointer events enabled
 * This is especially important when the focal point is locked
 */
export function ensurePointerEventsEnabled() {
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    bizCardDivs.forEach(div => {
        if (div.style.pointerEvents === 'none') {
            console.log(`Fixing pointer-events for ${div.id}`);
            div.style.pointerEvents = 'auto';
        }
    });
}

/**
 * Set up a MutationObserver to monitor and fix any changes to pointer-events
 */
export function setupPointerEventsObserver() {
    // Check if we already have an observer
    if (window._pointerEventsObserver) {
        window._pointerEventsObserver.disconnect();
    }
    
    // Create a new observer
    const observer = new MutationObserver((mutations) => {
        let needsCheck = false;
        
        // Check if any mutations affect pointer-events
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' &&
                mutation.target.classList.contains('biz-card-div')) {
                needsCheck = true;
            }
        });
        
        // If needed, ensure pointer events are enabled
        if (needsCheck) {
            ensurePointerEventsEnabled();
        }
    });
    
    // Start observing
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    bizCardDivs.forEach(div => {
        observer.observe(div, { attributes: true });
    });
    
    // Store the observer for later reference
    window._pointerEventsObserver = observer;
    
    console.log('Set up pointer-events observer for bizCardDivs');
    
    // Initial check
    ensurePointerEventsEnabled();
}

/**
 * Check if bizCardDivs are receiving mouse events
 * This is a diagnostic function to help debug pointer events issues
 */
export function checkMouseEvents() {
    console.log("Checking if bizCardDivs are receiving mouse events...");
    
    // Get all bizCardDivs
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    console.log(`Found ${bizCardDivs.length} bizCardDivs`);
    
    if (bizCardDivs.length === 0) {
        console.warn("No bizCardDivs found!");
        return;
    }
    
    // Check the first bizCardDiv
    const firstDiv = bizCardDivs[0];
    console.log(`Checking first bizCardDiv: ${firstDiv.id}`);
    
    // Check computed styles
    const style = getComputedStyle(firstDiv);
    console.log(`- pointer-events: ${style.pointerEvents}`);
    console.log(`- position: ${style.position}`);
    console.log(`- z-index: ${style.zIndex}`);
    console.log(`- display: ${style.display}`);
    console.log(`- visibility: ${style.visibility}`);
    console.log(`- opacity: ${style.opacity}`);
    
    // Add a temporary mouse event listener for testing
    const oldEnterHandler = firstDiv._tempEnterHandler;
    if (oldEnterHandler) {
        firstDiv.removeEventListener('mouseenter', oldEnterHandler);
    }
    
    const tempEnterHandler = (e) => {
        console.log(`TEST MOUSEENTER on ${firstDiv.id}`);
        console.log(`- Target: ${e.target.tagName} ${e.target.className}`);
        console.log(`- Current target: ${e.currentTarget.tagName} ${e.currentTarget.className}`);
    };
    
    firstDiv._tempEnterHandler = tempEnterHandler;
    firstDiv.addEventListener('mouseenter', tempEnterHandler);
    
    // Add a temporary click handler for testing
    const oldClickHandler = firstDiv._tempClickHandler;
    if (oldClickHandler) {
        firstDiv.removeEventListener('click', oldClickHandler);
    }
    
    const tempClickHandler = (e) => {
        console.log(`TEST CLICK on ${firstDiv.id}`);
        console.log(`- Target: ${e.target.tagName} ${e.target.className}`);
        console.log(`- Current target: ${e.currentTarget.tagName} ${e.currentTarget.className}`);
    };
    
    firstDiv._tempClickHandler = tempClickHandler;
    firstDiv.addEventListener('click', tempClickHandler);
    
    console.log("Added temporary test mouse event listeners to first bizCardDiv");
    console.log("Try hovering over and clicking the first bizCardDiv now.");
    
    // Make this function available globally for debugging
    window.checkBizCardDivMouseEvents = checkMouseEvents;
    console.log("This function is now available globally as window.checkBizCardDivMouseEvents()");
}

// Set up event listeners for all biz card divs
export function setupEventListeners() {
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    
    console.log(`bizCardDivModule: Setting up event listeners for ${bizCardDivs.length} biz card divs`);
    
    bizCardDivs.forEach(div => {
        // Remove any existing handlers to avoid duplicates
        const oldClickHandler = div._clickHandler;
        const oldEnterHandler = div._enterHandler;
        const oldLeaveHandler = div._leaveHandler;
        
        if (oldClickHandler) div.removeEventListener('click', oldClickHandler);
        if (oldEnterHandler) div.removeEventListener('mouseenter', oldEnterHandler);
        if (oldLeaveHandler) div.removeEventListener('mouseleave', oldLeaveHandler);
        
        // Create new handlers
        const clickHandler = (e) => {
            console.log(`bizCardDivModule: Click detected on ${div.id}`);
            handleClickEvent(div);
        };
        
        const enterHandler = (e) => {
            console.log(`bizCardDivModule: Mouse enter detected on ${div.id}`);
            handleMouseEnterEvent(div);
        };
        
        const leaveHandler = (e) => {
            console.log(`bizCardDivModule: Mouse leave detected on ${div.id}`);
            handleMouseLeaveEvent(div);
        };
        
        // Store handlers for later removal
        div._clickHandler = clickHandler;
        div._enterHandler = enterHandler;
        div._leaveHandler = leaveHandler;
        
        // Add event listeners
        div.addEventListener('click', clickHandler);
        div.addEventListener('mouseenter', enterHandler);
        div.addEventListener('mouseleave', leaveHandler);
        
        // Add data attributes to confirm handlers were attached
        div.setAttribute('data-has-click-handler', 'true');
        div.setAttribute('data-has-hover-handlers', 'true');
        
        console.log(`bizCardDivModule: Added event handlers to ${div.id}`);
    });
    
    // Set up the scene plane click handler for unselection
    setupScenePlaneClickHandler();
    
    console.log(`bizCardDivModule: Set up event handlers for ${bizCardDivs.length} biz card divs`);
}

// Event handler functions
function bizCardClickHandler(event) {
    console.log(`bizCardDivModule: Click detected on ${event.currentTarget.id}`);
    handleClickEvent(event.currentTarget);
}

function bizCardMouseEnterHandler(event) {
    console.log(`bizCardDivModule: Mouse enter detected on ${event.currentTarget.id}`);
    handleMouseEnterEvent(event.currentTarget);
}

function bizCardMouseLeaveHandler(event) {
    console.log(`bizCardDivModule: Mouse leave detected on ${event.currentTarget.id}`);
    handleMouseLeaveEvent(event.currentTarget);
}

// Debug function to check hover state
export function checkHoverState() {
    console.log("Checking hover state of all bizCardDivs...");
    
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    bizCardDivs.forEach(div => {
        const isHovered = div.classList.contains('hovered') || div.hasAttribute('data-hovered');
        const isSelected = div.classList.contains('selected');
        
        console.log(`${div.id}: hovered=${isHovered}, selected=${isSelected}`);
        
        // Check computed styles
        const style = getComputedStyle(div);
        console.log(`- border: ${style.border}`);
        console.log(`- filter: ${style.filter}`);
        console.log(`- z-index: ${style.zIndex}`);
        
        // Check event listeners
        console.log(`- has click handler: ${!!div._clickHandler}`);
        console.log(`- has enter handler: ${!!div._enterHandler}`);
        console.log(`- has leave handler: ${!!div._leaveHandler}`);
    });
    
    // Make this function available globally for debugging
    window.checkBizCardDivHoverState = checkHoverState;
    console.log("This function is now available globally as window.checkBizCardDivHoverState()");
}

// Debug function to manually set hover state
export function setHoverState(divId, isHovered) {
    const div = document.getElementById(divId);
    if (!div) {
        console.error(`setHoverState: Could not find div with ID ${divId}`);
        return;
    }
    
    console.log(`Setting hover state of ${divId} to ${isHovered}`);
    
    if (isHovered) {
        div.classList.add('hovered');
        div.setAttribute('data-hovered', 'true');
        
        // Also set inline styles as a fallback
        div.style.filter = 'brightness(1.25)';
        div.style.border = '3px solid blue';
        div.style.zIndex = '10';
    } else {
        div.classList.remove('hovered');
        div.removeAttribute('data-hovered');
        
        // Remove inline styles
        div.style.removeProperty('filter');
        div.style.removeProperty('border');
        div.style.removeProperty('z-index');
    }
    
    console.log(`Hover state set for ${divId}`);
    
    // Make this function available globally for debugging
    window.setBizCardDivHoverState = (id, state) => setHoverState(id, state);
    console.log("This function is now available globally as window.setBizCardDivHoverState(id, state)");
}

// Add a flag to track initialization
let _isBizCardDivModuleInitialized = false;

/**
 * Initialize the bizCardDivModule
 * This should be called after viewPort and resumeManager are initialized
 */
export function initializeBizCardDivModule() {
    if (_isBizCardDivModuleInitialized) {
        console.warn("bizCardDivModule already initialized");
        return;
    }
    
    // Check if resumeManager exists and is initialized
    const resumeManager = getResumeManager();
    if (!resumeManager) {
        console.warn("Cannot initialize bizCardDivModule: resumeManager not found or not initialized");
        // Continue anyway - we'll use fallback behavior
    }

    // Check if viewPort exists and is initialized
    const viewPort = getViewPort();
    if (!viewPort) {
        console.warn("Cannot initialize bizCardDivModule: viewPort not found or not initialized");
        // Continue anyway - we'll use fallback behavior
    }

    // Set up event listeners
    setupEventListeners();
    
    // Set up scene plane click handler
    setupScenePlaneClickHandler();
    
    _isBizCardDivModuleInitialized = true;
    console.log("bizCardDivModule initialized successfully");
}

/**
 * Check if bizCardDivModule is initialized
 * @returns {boolean} True if initialized
 */
export function isBizCardDivModuleInitialized() {
    return _isBizCardDivModuleInitialized;
}

/**
 * Creates all bizCardDivs and bizResumeDivs for the given jobs
 * @param {Array} jobs - Array of job objects
 * @returns {Array} Array of created bizResumeDivs
 */
export function createAllBizCardDivs(jobs) {
    if (!jobs || !Array.isArray(jobs)) {
        throw new Error('createAllBizCardDivs: jobs must be an array');
    }
    
    console.log(`Creating ${jobs.length} bizCardDivs and bizResumeDivs`);
    
    const bizResumeDivs = [];
    const sceneContainer = document.getElementById('scene-container');
    
    if (!sceneContainer) {
        throw new Error('createAllBizCardDivs: scene-container not found');
    }
    
    jobs.forEach((job, index) => {
        if (!job) throw new Error('createAllBizCardDivs: given null job');
        if (!Number.isInteger(index)) throw new Error('createAllBizCardDivs: given non-integer index');
        
        // Create bizCardDiv
        const bizCardDiv = createBizCardDiv(job, index);
        
        // Append to scene container
        sceneContainer.appendChild(bizCardDiv);
        
        // Verify it was added to DOM
        const bizCardDivId = bizCardDiv.id;
        const checkBizCardDiv = document.getElementById(bizCardDivId);
        if (!checkBizCardDiv) {
            throw new Error(`bizCardDiv is not found for bizCardDivId: ${bizCardDivId}`);
        }
        
        // Create bizResumeDiv
        const bizResumeDiv = bizResumeDivModule.createBizResumeDiv(bizCardDiv);
        if (!bizResumeDiv) {
            throw new Error('createBizResumeDiv: given null bizResumeDiv');
        }
        
        bizResumeDivs.push(bizResumeDiv);
    });
    
    console.log(`Created ${bizResumeDivs.length} bizResumeDivs`);
    return bizResumeDivs;
}
