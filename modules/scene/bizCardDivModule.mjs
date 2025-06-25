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
    if (typeof resumeManager.isInitialized === 'function' && !resumeManager.isInitialized()) {
        console.warn("getResumeManager: resumeManager exists but is not initialized");
        return null;
    }
    
    // Check if required methods exist
    const requiredMethods = ['syncWithSceneSelection', 'scrollBizResumeDivIntoView'];
    const missingMethods = requiredMethods.filter(method => typeof resumeManager[method] !== 'function');
    
    if (missingMethods.length > 0) {
        console.warn(`getResumeManager: resumeManager is missing required methods: ${missingMethods.join(', ')}`);
        // Return it anyway, the calling code will handle missing methods
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
    
    console.info(`bizCardDivModule: Attempting to scroll ${bizCardDiv.id} into view`);
    
    // Get the scene container
    const sceneContainerEl = document.getElementById('scene-container');
    if (!sceneContainerEl) {
        console.error("scrollBizCardDivIntoView: scene-container not found");
        return;
    }
    
    // Force the scene container to be scrollable
    sceneContainerEl.style.overflow = 'auto';
    
    // Get the scene position data from the bizCardDiv's data attributes
    const sceneTop = parseFloat(bizCardDiv.getAttribute('data-sceneTop'));
    const sceneBottom = parseFloat(bizCardDiv.getAttribute('data-sceneBottom'));
    
    if (isNaN(sceneTop) || isNaN(sceneBottom)) {
        console.error(`scrollBizCardDivIntoView: Invalid scene position data for ${bizCardDiv.id}`);
        console.info(`sceneTop: ${bizCardDiv.getAttribute('data-sceneTop')}`);
        console.info(`sceneBottom: ${bizCardDiv.getAttribute('data-sceneBottom')}`);
        return;
    }
    
    // Calculate the height of the bizCardDiv in the scene
    const sceneHeight = sceneBottom - sceneTop;
    
    console.info(`bizCardDiv ${bizCardDiv.id} scene position: top=${sceneTop}, bottom=${sceneBottom}, height=${sceneHeight}`);
    
    // Check if the bizCardDiv is taller than the viewport
    const isTallerThanViewport = sceneHeight > sceneContainerEl.clientHeight;
    console.info(`bizCardDiv is ${isTallerThanViewport ? 'taller' : 'shorter'} than viewport`);
    
    let scrollPosition;
    
    if (isTallerThanViewport) {
        // For tall bizCardDivs, scroll to show the top portion with a small margin
        const topMargin = 30; // Pixels from the top of the viewport
        scrollPosition = sceneTop - topMargin;
        console.info(`Using top-aligned scrolling for tall bizCardDiv with margin: ${topMargin}px`);
    } else {
        // For normal-sized bizCardDivs, center them in the viewport
        const sceneCenterY = (sceneTop + sceneBottom) / 2;
        scrollPosition = sceneCenterY - (sceneContainerEl.clientHeight / 2);
        console.info(`Using center-aligned scrolling for normal-sized bizCardDiv`);
    }
    
    console.info(`Calculated scroll position: ${scrollPosition}`);
    console.info(`Current scroll position: ${sceneContainerEl.scrollTop}`);
    
    // Ensure the scroll position is within bounds
    const maxScroll = sceneContainerEl.scrollHeight - sceneContainerEl.clientHeight;
    const boundedScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));
    
    if (boundedScrollPosition !== scrollPosition) {
        console.info(`Adjusted scroll position to stay within bounds: ${boundedScrollPosition}`);
    }
    
    // Scroll to the calculated position
    console.info(`Scrolling scene container to ${boundedScrollPosition}`);
    
    // First try with smooth behavior
    sceneContainerEl.scrollTo({
        top: boundedScrollPosition,
        behavior: 'smooth'
    });
    
    // Check if scrolling worked after a delay
    setTimeout(() => {
        console.info(`After scrolling, scene container scrollTop: ${sceneContainerEl.scrollTop}`);
        
        // If we're not close to the target position, try with auto behavior
        if (Math.abs(sceneContainerEl.scrollTop - boundedScrollPosition) > 50) {
            console.info("Smooth scrolling didn't work, trying with auto behavior");
            
            sceneContainerEl.scrollTo({
                top: boundedScrollPosition,
                behavior: 'auto'
            });
            
            // Check again after a short delay
            setTimeout(() => {
                console.info(`After auto scrolling, scene container scrollTop: ${sceneContainerEl.scrollTop}`);
                
                // If we're still not close, try direct assignment
                if (Math.abs(sceneContainerEl.scrollTop - boundedScrollPosition) > 50) {
                    console.info("Auto scrolling didn't work, trying direct assignment");
                    sceneContainerEl.scrollTop = boundedScrollPosition;
                    
                    console.info(`After direct assignment, scene container scrollTop: ${sceneContainerEl.scrollTop}`);

                    console.info(`bizCardDivModule: scrolled ${bizCardDiv.id} into view`);

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
    // console.info(`   ${attributeName}:`, checkValue);
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
    // console.info(`Setting geometry for ${bizCardDiv.id} with job:`, job);
    
    if (!job) {
        console.error(`Job not found for bizCardDiv ${bizCardDiv.id}`);
        return;
    }
        
    try {
        // Validate job dates
        if (!job.start || !job.end) {
            throw new Error(`Job ${bizCardDiv.id} is missing start or end date`);
        }
        
        // console.info(`Job dates: start=${job.start}, end=${job.end}`);
        
        
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
        
        // console.info(`Set geometry for ${bizCardDiv.id}:`);
        // console.info(` sceneTop: ${sceneTop}`);
        // console.info(` sceneBottom: ${sceneBottom}`);
        // console.info(` sceneHeight: ${sceneHeight}`);
        // console.info(` sceneCenterY: ${sceneCenterY}`);

        // console.info(` sceneLeft: ${sceneLeft}`);
        // console.info(` sceneRight: ${sceneRight}`);
        // console.info(` sceneWidth: ${sceneWidth}`);
        // console.info(` sceneCenterX: ${sceneCenterX}`);

        // console.info(` sceneZ: ${sceneZ}`);
        // console.info(` zIndex: ${zUtils.get_zIndexStr_from_z(sceneZ)}`);
        
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

/**
 * Handles the click event for a business card div.
 * @param {HTMLElement} bizCardDiv - The business card div that was clicked.
 * @param {object} options - An optional object with options.
 * @param {boolean} options.syncResume - If false, will not sync the resume panel.
 */
export function handleBizCardDivClickEvent(bizCardDiv, options = {}) {
  // Use a default for syncResume if not provided
  const { syncResume = true } = options;

  if (!bizCardDiv) throw new Error("bizCardDiv is required");

  // Get the job index from the data attribute
  const jobIndex = parseInt(bizCardDiv.getAttribute('data-job-index'), 10);
  if (isNaN(jobIndex)) {
    console.error("handleBizCardDivClickEvent: Invalid or missing job index on bizCardDiv", bizCardDiv);
    return;
  }

  const isSelected = bizCardDiv.classList.contains("selected");

  // Clear any existing selections first
  clearAllSelected();

  if (isSelected) {
    // If it was already selected, clicking again unselects it.
    currentSelected = null;
    return;
  }

  // Mark the new card as selected
  bizCardDiv.classList.add('selected');
  bizCardDiv.classList.remove('hovered');

  // Scroll the selected bizCardDiv into view in the scene
  scrollBizCardDivIntoView(bizCardDiv);

  // Always style the paired resume div
  const pairedId = bizCardDiv.getAttribute('data-paired-id');
  const bizResumeDiv = document.getElementById(pairedId);
  styleBizResumeDivAsSelected(bizResumeDiv);

  // Sync with resume view (scrolling), if enabled
  if (syncResume) {
    const resumeManager = getResumeManager();
    if (resumeManager) {
      console.info("bizCardDivModule: Syncing with resume view...");
      resumeManager.syncWithSceneSelection(jobIndex);
    } else {
      console.warn("bizCardDivModule: resumeManager not found, cannot sync with resume view");
    }
  }

  // Update the currently selected element
  currentSelected = bizCardDiv;
}

/**
 * Styles the paired bizResumeDiv as selected
 * @param {HTMLElement} bizResumeDiv - The biz resume div to style
 */
function styleBizResumeDivAsSelected(bizResumeDiv) {
  if (!bizResumeDiv) {
      console.warn("styleBizResumeDivAsSelected: bizResumeDiv is null");
      return;
  }
  
  // Style the resume div as selected
  bizResumeDiv.classList.remove('hovered');
  bizResumeDiv.classList.add('selected');
}

/**
 * Clear all selections called by both 
 * bizCardDivModule and bizResumeDivModule
 * before any new selection is made
 * or when the scene plane is clicked
 * if the current element is selected then
 * return.
 */
export function clearAllSelected() {
    const selectedElements = document.querySelectorAll('.selected');
    console.info(`bizCardDivModule: Found ${selectedElements.length} selected elements to clear`);
    selectedElements.forEach(element => {
        element.classList.remove("selected");    
    });
}

// Set up the scene plane click handler for unselection
export function setupScenePlaneClickHandler() {
    const scenePlane = document.getElementById('scene-plane');
    if (!scenePlane) {
        throw new Error('bizCardDivModule: setupScenePlaneClickHandler: scene-plane not found');
    }
    
    // Remove any existing click handler to avoid duplicates
    scenePlane.removeEventListener('click', handleScenePlaneClick);
    
    // Add the click handler
    scenePlane.addEventListener('click', handleScenePlaneClick);
    console.info('bizCardDivModule: Added scene plane click handler for unselection');
    
    // Add stopPropagation to all child elements' click handlers
    const childElements = scenePlane.querySelectorAll('.biz-card-div, .biz-resume-div');
    childElements.forEach(element => {
        // Remove any existing click handler to avoid duplicates
        const oldClickHandler = element._clickHandler;
        if (oldClickHandler) {
            element.removeEventListener('click', oldClickHandler);
        }
        
        // Create a new click handler that stops propagation
        const newClickHandler = (e) => {
            e.stopPropagation(); // Stop the event from bubbling up to scene-plane
            if (typeof oldClickHandler === 'function') {
                oldClickHandler(e); // Call the original handler
            }
        };
        
        // Store and add the new handler
        element._clickHandler = newClickHandler;
        element.addEventListener('click', newClickHandler);
    });
}

// Handle clicks on the scene plane - now we can simplify this
function handleScenePlaneClick(event) {
    // Since child elements stop propagation, this handler will only run
    // for direct clicks on the scene plane itself
    console.info('scene-plane click detected');
    console.info('bizCardDivModule: Clearing all selected');
    
    // Clear all selected elements
    clearAllSelected();
    
    // Ensure all bizCardDivs have proper mouseenter/mouseleave handlers
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    bizCardDivs.forEach(div => {
        // Check if handlers exist but aren't attached
        const enterHandler = div._enterHandler;
        const leaveHandler = div._leaveHandler;
        
        if (enterHandler) {
            // Remove first to avoid duplicates
            div.removeEventListener('mouseenter', enterHandler);
            div.addEventListener('mouseenter', enterHandler);
        }
        
        if (leaveHandler) {
            // Remove first to avoid duplicates
            div.removeEventListener('mouseleave', leaveHandler);
            div.addEventListener('mouseleave', leaveHandler);
        }
    });
    
    // Ensure all bizResumeDivs have proper mouseenter/mouseleave handlers
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    bizResumeDivs.forEach(div => {
        // Check if handlers exist but aren't attached
        const enterHandler = div._enterHandler;
        const leaveHandler = div._leaveHandler;
        
        if (enterHandler) {
            // Remove first to avoid duplicates
            div.removeEventListener('mouseenter', enterHandler);
            div.addEventListener('mouseenter', enterHandler);
        }
        
        if (leaveHandler) {
            // Remove first to avoid duplicates
            div.removeEventListener('mouseleave', leaveHandler);
            div.addEventListener('mouseleave', leaveHandler);
        }
    });
    
    console.info('bizCardDivModule: Restored mouseenter/mouseleave handlers after clearing selections');
}

export function handleMouseEnterEvent(element) {
    if (!element) return;
    
    try {
        console.info(`bizCardDivModule: Mouse enter on ${element.id}`);
        
        // Check if the element is selected - if so, do nothing
        if (element.classList.contains("selected")) {
            console.info(`%cbizCardDivModule: Element ${element.id} is selected, ignoring mouseenter`, 'color: red; font-weight: bold');
            return; // Exit early - no hover effect for selected elements
        }
        
        // Apply hover state since element is not selected
        element.classList.add("hovered");
        element.setAttribute("data-hovered", "true");
        
        // Find and hover the paired resume div
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const pairedElement = document.getElementById(pairedId);
            if (pairedElement && !pairedElement.classList.contains("selected")) {
                pairedElement.classList.add("hovered");
                pairedElement.setAttribute("data-hovered", "true");
                console.info(`bizCardDivModule: Added hover to paired element ${pairedId}`);
            }
        }
        
        console.info(`bizCardDivModule: Element ${element.id} hovered`);
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
        console.info(`bizCardDivModule: Mouse leave on ${element.id}`);
        
        // More visible debugging for selected state
        const isSelected = element.classList.contains("selected");
        console.info(`bizCardDivModule: Element ${element.id} selected state: ${isSelected}`);
        
        // Check if the element is selected - if so, do nothing
        if (isSelected) {
            console.info(`%cbizCardDivModule: Element ${element.id} is selected, ignoring mouseleave`, 'color: red; font-weight: bold');
            return; // Exit early - no hover effect changes for selected elements
        }
        
        // Remove hover state since element is not selected
        element.classList.remove("hovered");
        element.removeAttribute("data-hovered");
        
        // Find and unhover the paired element
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const pairedElement = document.getElementById(pairedId);
            if (pairedElement && !pairedElement.classList.contains("selected")) {
                pairedElement.classList.remove("hovered");
                pairedElement.removeAttribute("data-hovered");
                console.info(`bizCardDivModule: Removed hover from paired element ${pairedId}`);
            }
        }
        
        console.info(`bizCardDivModule: Element ${element.id} unhovered`);
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
 * Works for both bizCardDivs and bizResumeDivs
 */
export function simpleMouseEnterHandler(element) {
    if (!element) return;
    
    // Just add the hovered class to the element
    if (!element.classList.contains("selected")) {
        element.classList.add("hovered");
        element.setAttribute("data-hovered", "true");
        console.info(`Simple hover applied to ${element.id}`);
        
        // Try to find and hover the paired element
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const pairedElement = document.getElementById(pairedId);
            if (pairedElement && !pairedElement.classList.contains("selected")) {
                pairedElement.classList.add("hovered");
                pairedElement.setAttribute("data-hovered", "true");
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
        element.removeAttribute("data-hovered");
        
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
    // console.info(`Setting geometry for ${bizCardDivs.length} existing bizCardDivs with ${jobsArray.length} jobs`);
    
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
        // console.info(`Verified ${bizCardDiv.id} has sceneCenterX:`, 
        //     bizCardDiv.getAttribute("data-sceneCenterX"));
    }
}

// Function to check if the scene container is properly set up for scrolling
export function checkSceneContainerScrolling() {
    const sceneContainerEl = document.getElementById('scene-container');
    if (!sceneContainerEl) {
        console.error("Scene container not found");
        return false;
    }
    
    console.info("Scene container properties:");
    console.info("- offsetHeight:", sceneContainerEl.offsetHeight);
    console.info("- scrollHeight:", sceneContainerEl.scrollHeight);
    console.info("- clientHeight:", sceneContainerEl.clientHeight);
    console.info("- scrollTop:", sceneContainerEl.scrollTop);
    console.info("- style.overflow:", getComputedStyle(sceneContainerEl).overflow);
    console.info("- style.position:", getComputedStyle(sceneContainerEl).position);
    
    // Check if it's scrollable
    const isScrollable = sceneContainerEl.scrollHeight > sceneContainerEl.clientHeight;
    console.info("- Is scrollable:", isScrollable);
    
    if (!isScrollable) {
        console.warn("Scene container is not scrollable. This may prevent scrolling bizCardDivs into view.");
    }
    
    // Check if overflow is set correctly
    const overflow = getComputedStyle(sceneContainerEl).overflow;
    if (overflow !== 'auto' && overflow !== 'scroll') {
        console.warn(`Scene container overflow is set to '${overflow}'. Should be 'auto' or 'scroll'.`);
        console.info("Setting overflow to 'auto'");
        sceneContainerEl.style.overflow = 'auto';
    }
    
    return isScrollable;
}

// Function to check if all bizCardDivs have the required scene position data
export function checkBizCardDivsSceneData() {
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    console.info(`Found ${bizCardDivs.length} bizCardDivs`);
    
    let missingDataCount = 0;
    
    bizCardDivs.forEach((bizCardDiv, index) => {
        const sceneTop = bizCardDiv.getAttribute('data-sceneTop');
        const sceneBottom = bizCardDiv.getAttribute('data-sceneBottom');
        
        if (!sceneTop || !sceneBottom || isNaN(parseFloat(sceneTop)) || isNaN(parseFloat(sceneBottom))) {
            console.error(`bizCardDiv ${bizCardDiv.id} is missing valid scene position data`);
            console.info(`sceneTop: ${sceneTop}`);
            console.info(`sceneBottom: ${sceneBottom}`);
            missingDataCount++;
        } else if (index < 5) {  // Only log the first 5 to avoid console spam
            console.info(`bizCardDiv ${bizCardDiv.id} scene position: top=${sceneTop}, bottom=${sceneBottom}`);
        }
    });
    
    if (missingDataCount > 0) {
        console.error(`${missingDataCount} bizCardDivs are missing valid scene position data`);
    } else {
        console.info("All bizCardDivs have valid scene position data");
    }
    
    return missingDataCount === 0;
}

// Function to check if a bizCardDiv is properly visible in the viewport
export function isBizCardDivProperlyVisible(bizCardDiv) {
    if (!bizCardDiv) {
        console.error("isBizCardDivProperlyVisible: bizCardDiv is null");
        return false;
    }
    
    const sceneContainerEl = document.getElementById('scene-container');
    if (!sceneContainerEl) {
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
    const isTallerThanViewport = sceneHeight > sceneContainerEl.clientHeight;
    
    // Get the current scroll position
    const scrollTop = sceneContainerEl.scrollTop;
    const viewportBottom = scrollTop + sceneContainerEl.clientHeight;
    
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
    
    console.info(`bizCardDiv ${bizCardDiv.id} visibility check:`);
    console.info(`- sceneTop: ${sceneTop}, sceneBottom: ${sceneBottom}, sceneHeight: ${sceneHeight}`);
    console.info(`- scrollTop: ${scrollTop}, viewportBottom: ${viewportBottom}`);
    console.info(`- isTallerThanViewport: ${isTallerThanViewport}`);
    console.info(`- isProperlyVisible: ${isProperlyVisible}`);
    
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
    // Add a debounce to prevent excessive calls
    if (window._pointerEventsDebounce) {
        clearTimeout(window._pointerEventsDebounce);
    }
    
    window._pointerEventsDebounce = setTimeout(() => {
        // Check if we've run this too recently
        const now = Date.now();
        const lastRun = window._lastPointerEventsFixTime || 0;
        
        // Only run if it's been at least 1000ms since the last run
        if (now - lastRun < 1000) {
            return;
        }
        
        // Track when we last ran this function
        window._lastPointerEventsFixTime = now;
        
        // Count how many elements we actually fixed
        let fixedCount = 0;
        
        const bizCardDivs = document.querySelectorAll('.biz-card-div');
        bizCardDivs.forEach(div => {
            if (div.style.pointerEvents === 'none') {
                console.info(`Fixing pointer-events for ${div.id}`);
                div.style.pointerEvents = 'auto';
                fixedCount++;
                
                // Also set a data attribute to track that we fixed this
                div.setAttribute('data-pointer-events-fixed', 'true');
            }
        });
        
        if (fixedCount > 0) {
            console.info(`Fixed pointer-events for ${fixedCount} bizCardDivs`);
        }
    }, 200); // 200ms debounce
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
                
                // Only consider this a trigger if pointer-events was set to 'none'
                const style = window.getComputedStyle(mutation.target);
                if (style.pointerEvents === 'none') {
                    needsCheck = true;
                }
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
    
    console.info('Set up pointer-events observer for bizCardDivs');
    
    // Initial check
    ensurePointerEventsEnabled();
}

/**
 * Check if bizCardDivs are receiving mouse events
 * This is a diagnostic function to help debug pointer events issues
 */
export function checkMouseEvents() {
    console.info("Checking if bizCardDivs are receiving mouse events...");
    
    // Get all bizCardDivs
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    console.info(`Found ${bizCardDivs.length} bizCardDivs`);
    
    if (bizCardDivs.length === 0) {
        console.warn("No bizCardDivs found!");
        return;
    }
    
    // Check the first bizCardDiv
    const firstDiv = bizCardDivs[0];
    console.info(`Checking first bizCardDiv: ${firstDiv.id}`);
    
    // Check computed styles
    const style = getComputedStyle(firstDiv);
    console.info(`- pointer-events: ${style.pointerEvents}`);
    console.info(`- position: ${style.position}`);
    console.info(`- z-index: ${style.zIndex}`);
    console.info(`- display: ${style.display}`);
    console.info(`- visibility: ${style.visibility}`);
    console.info(`- opacity: ${style.opacity}`);
    
    // Add a temporary mouse event listener for testing
    const oldEnterHandler = firstDiv._tempEnterHandler;
    if (oldEnterHandler) {
        firstDiv.removeEventListener('mouseenter', oldEnterHandler);
    }
    
    const tempEnterHandler = (e) => {
        console.info(`TEST MOUSEENTER on ${firstDiv.id}`);
        console.info(`- Target: ${e.target.tagName} ${e.target.className}`);
        console.info(`- Current target: ${e.currentTarget.tagName} ${e.currentTarget.className}`);
    };
    
    firstDiv._tempEnterHandler = tempEnterHandler;
    firstDiv.addEventListener('mouseenter', tempEnterHandler);
    
    // Add a temporary click handler for testing
    const oldClickHandler = firstDiv._tempClickHandler;
    if (oldClickHandler) {
        firstDiv.removeEventListener('click', oldClickHandler);
    }
    
    const tempClickHandler = (e) => {
        console.info(`TEST CLICK on ${firstDiv.id}`);
        console.info(`- Target: ${e.target.tagName} ${e.target.className}`);
        console.info(`- Current target: ${e.currentTarget.tagName} ${e.currentTarget.className}`);
    };
    
    firstDiv._tempClickHandler = tempClickHandler;
    firstDiv.addEventListener('click', tempClickHandler);
    
    console.info("Added temporary test mouse event listeners to first bizCardDiv");
    console.info("Try hovering over and clicking the first bizCardDiv now.");
    
    // Make this function available globally for debugging
    window.checkBizCardDivMouseEvents = checkMouseEvents;
    console.info("This function is now available globally as window.checkBizCardDivMouseEvents()");
}

// Set up event listeners for all biz card divs
export function setupEventListeners() {
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    
    console.info(`bizCardDivModule: Setting up event listeners for ${bizCardDivs.length} biz card divs`);
    
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
            console.info(`bizCardDivModule: Click detected on ${div.id}`);
            handleBizCardDivClickEvent(div);
        };
        
        const enterHandler = (e) => {
            console.info(`bizCardDivModule: Mouse enter detected on ${div.id}`);
            handleMouseEnterEvent(div);
        };
        
        const leaveHandler = (e) => {
            console.info(`bizCardDivModule: Mouse leave detected on ${div.id}`);
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
        
        console.info(`bizCardDivModule: Added event handlers to ${div.id}`);
    });
    
    // Set up the scene plane click handler for unselection
    setupScenePlaneClickHandler();
    
    console.info(`bizCardDivModule: Set up event handlers for ${bizCardDivs.length} biz card divs`);
}

// Event handler functions
function bizCardClickHandler(event) {
    console.info(`bizCardDivModule: Click detected on ${event.currentTarget.id}`);
    handleClickEvent(event.currentTarget);
}

function bizCardMouseEnterHandler(event) {
    console.info(`bizCardDivModule: Mouse enter detected on ${event.currentTarget.id}`);
    handleMouseEnterEvent(event.currentTarget);
}

function bizCardMouseLeaveHandler(event) {
    console.info(`bizCardDivModule: Mouse leave detected on ${event.currentTarget.id}`);
    handleMouseLeaveEvent(event.currentTarget);
}

// Debug function to check hover state
export function checkHoverState() {
    console.info("Checking hover state of all bizCardDivs...");
    
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    bizCardDivs.forEach(div => {
        const isHovered = div.classList.contains('hovered') || div.hasAttribute('data-hovered');
        const isSelected = div.classList.contains('selected');
        
        console.info(`${div.id}: hovered=${isHovered}, selected=${isSelected}`);
        
        // Check computed styles
        const style = getComputedStyle(div);
        console.info(`- border: ${style.border}`);
        console.info(`- filter: ${style.filter}`);
        console.info(`- z-index: ${style.zIndex}`);
        
        // Check event listeners
        console.info(`- has click handler: ${!!div._clickHandler}`);
        console.info(`- has enter handler: ${!!div._enterHandler}`);
        console.info(`- has leave handler: ${!!div._leaveHandler}`);
    });
    
    // Make this function available globally for debugging
    window.checkBizCardDivHoverState = checkHoverState;
    console.info("This function is now available globally as window.checkBizCardDivHoverState()");
}

// Debug function to manually set hover state
export function setHoverState(divId, isHovered) {
    const div = document.getElementById(divId);
    if (!div) {
        console.error(`setHoverState: Could not find div with ID ${divId}`);
        return;
    }
    
    console.info(`Setting hover state of ${divId} to ${isHovered}`);
    
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
    
    console.info(`Hover state set for ${divId}`);
    
    // Make this function available globally for debugging
    window.setBizCardDivHoverState = (id, state) => setHoverState(id, state);
    console.info("This function is now available globally as window.setBizCardDivHoverState(id, state)");
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
    console.info("bizCardDivModule initialized successfully");
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
    
    console.info(`Creating ${jobs.length} bizCardDivs and bizResumeDivs`);
    
    const bizResumeDivs = [];
    const scenePlane = document.getElementById('scene-plane');
    
    if (!scenePlane) {
        throw new Error('createAllBizCardDivs: scene-plane not found');
    }
    
    jobs.forEach((job, index) => {
        if (!job) throw new Error('createAllBizCardDivs: given null job');
        if (!Number.isInteger(index)) throw new Error('createAllBizCardDivs: given non-integer index');
        
        // Create bizCardDiv
        const bizCardDiv = createBizCardDiv(job, index);
        
        // Append to scene plane
        scenePlane.appendChild(bizCardDiv);
        
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
    
    return bizResumeDivs;
}

/**
 * Debug function to identify what's setting pointer-events to none
 */
export function debugPointerEventsIssue() {
    console.info("Setting up pointer-events debug");
    
    // Override the style.setProperty method to log when pointer-events is set to none
    const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(propertyName, value, priority) {
        if (propertyName === 'pointer-events' && value === 'none') {
            // Get the element this style belongs to
            let element = null;
            try {
                // This is a bit hacky but should work in most browsers
                for (let el of document.querySelectorAll('*')) {
                    if (el.style === this) {
                        element = el;
                        break;
                    }
                }
            } catch (e) {
                console.error("Error finding element:", e);
            }
            
            console.warn("pointer-events being set to none", {
                element: element ? element.id || element.className : 'unknown',
                stack: new Error().stack
            });
        }
        
        return originalSetProperty.call(this, propertyName, value, priority);
    };
    
    console.info("Pointer-events debug set up");
    
    // Make this function available globally
    window.debugPointerEventsIssue = debugPointerEventsIssue;
}

// Call this function on module load
debugPointerEventsIssue();

/**
 * Debug function to check the selected state of all elements
 * Call this from the console to see which elements are selected
 */
export function debugCheckSelectedState() {
    console.info("%c=== CHECKING SELECTED STATE OF ALL ELEMENTS ===", "color: blue; font-weight: bold");
    
    // Check bizCardDivs
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    console.info(`Found ${bizCardDivs.length} bizCardDivs`);
    
    bizCardDivs.forEach(div => {
        const isSelected = div.classList.contains("selected");
        const isHovered = div.classList.contains("hovered");
        console.info(`${div.id}: selected=${isSelected}, hovered=${isHovered}`);
    });
    
    // Check bizResumeDivs
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    console.info(`Found ${bizResumeDivs.length} bizResumeDivs`);
    
    bizResumeDivs.forEach(div => {
        const isSelected = div.classList.contains("selected");
        const isHovered = div.classList.contains("hovered");
        console.info(`${div.id}: selected=${isSelected}, hovered=${isHovered}`);
    });
    
    console.info("%c=== END CHECKING SELECTED STATE ===", "color: blue; font-weight: bold");
    
    // Make this function available globally for debugging
    window.checkSelectedState = debugCheckSelectedState;
}

// Initialize the global debug function
export function initializeDebugFunctions() {
    window.checkSelectedState = debugCheckSelectedState;
    console.info("Debug function window.checkSelectedState() is now available");
}
