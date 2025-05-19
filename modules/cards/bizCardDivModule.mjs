// cards/bizCardDivModule.mjs

import * as viewPort from '../layout/viewPort.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as cardUtils from './cardUtils.mjs';
import * as BizResumeDivModule from './bizResumeDivModule.mjs';
import { assignColorIndex } from '../color_palettes.mjs';
import * as divSyncModule from './divSyncModule.mjs';


// Business card constants
export const BIZCARD_MEAN_WIDTH = 200;
export const BIZCARD_INDENT = 29;
export const MIN_BIZCARD_HEIGHT = 200;
export const MIN_BRIGHTNESS_PERCENT = 70;
export const BLUR_Z_SCALE_FACTOR = 0.1;
export const MAX_WIDTH_OFFSET = 40; // Maximum random width offset in pixels
export const MAX_X_OFFSET = 100; // Maximum random horizontal offset in pixels
export const BIZCARD_MIN_Z = 0;
export const BIZCARD_MAX_Z = 10;

/**
 * Initializes view-relative styling for a any card div
 * assuming that the focal point is locatedd at viewPort
 * center origin which is marked by the bullsEye, so 
 * motion parallax-derived offsets are not applied.
 * 
 * @param {Object} viewPort - The viewPort object
 * @param {HTMLElement} cardDiv - The skill or biz card div
 */


export function getBizCardDivId(bizCardDiv, jobIndex) {
    bizCardDiv.id = `biz-card-div-${jobIndex}`;
}

export function scrollBizCardDivIntoView(element, direction = 'next') {
    if (!element) {
        throw new Error(`element not found`);
    }
    if (!element.classList.contains('biz-card-div')) {
        element = element.pairedElement;
    }
    const bizDetailsEmployer = element.bizDetailsDiv.querySelector('.biz-details-employer');
    if (!bizDetailsEmployer) {
        throw new Error(`bizDetailsEmployer not found for ${element.bizDetailsDiv.id}`);
    }
    bizDetailsEmployer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Creates a business card div for a job. Does NOT appends itself
 * to the sceneDiv. This is done in main.mjs
 * 
 * @param {Object} job - The job object
 * @param {number} jobIndex - The index of the job in the sorted array
 * @returns {HTMLElement} The created business card div
 */
export function createBizCardDiv(job, jobIndex) {
    const bizCardDiv = document.createElement("div");
    bizCardDiv.classList.add("biz-card-div");
    bizCardDiv.classList.add("card-div");
    bizCardDiv.id = cardUtils.getBizCardDivId(jobIndex);
    bizCardDiv.job = job;
    bizCardDiv.jobIndex = jobIndex;
    bizCardDiv.setAttribute('sort-key-start', job.start);
    bizCardDiv.setAttribute('sort-key-end', job.end);
    bizCardDiv.setAttribute('sort-key-employer', job.employer);
    bizCardDiv.setAttribute('sort-key-title', job.title);
    bizCardDiv.setAttribute('sort-key-job-index', jobIndex);
    
    // Assign color index and apply palette
    assignColorIndex(bizCardDiv, jobIndex);
    
    // Add click handler for selection
    bizCardDiv.addEventListener("click", (event) => {
        divSyncModule.handleClickEvent(event, bizCardDiv);
    });
    
    // Position the scene-relative geometry of the bizCardDiv
    setBizCardDivSceneGeometry(bizCardDiv);

    // create the biz details div with text
    const bizDetailsDiv = BizDetailsDivModule.createBizDetailsDiv(bizCardDiv);
    bizDetailsDiv.id = `biz-details-div-card-${jobIndex}`;
    bizDetailsDiv.classList.add('biz-details-div');
    bizCardDiv['biz-details-div-id'] = bizDetailsDiv.id;
    bizCardDiv.appendChild(bizDetailsDiv);
    bizCardDiv.bizDetailsDiv = bizDetailsDiv;

    // Initialize view-relative styling based on 
    // the scene-relative geometry and focalPoint 
    // at viewPort center which is marked by the bullsEye
    if (!viewPort.viewPortIsInitialized()) {
        throw new Error("ViewPort not initialized");
    }
    cardUtils.applyViewRelativeStyling(viewPort, bizCardDiv);

    // Create and append the resume div immediately to the DOM
    const bizResumeDiv = BizResumeDivModule.createBizResumeDiv(bizCardDiv);

    const resumeContentDiv = document.getElementById('resume-content-div');
    resumeContentDiv.appendChild(bizResumeDiv);

    // set up pairing
    bizResumeDiv.pairedElement = bizCardDiv;
    bizCardDiv.pairedElement = bizResumeDiv;

    if (!bizResumeDiv.pairedElement) {
        throw new Error(`bizResumeDiv.pairedElement not found for ${bizResumeDiv.id}`);
    }
    if (!bizCardDiv.pairedElement) {
        throw new Error(`bizCardDiv.pairedElement not found for ${bizCardDiv.id}`);
    }

    // Note that bizCardDivs are not sorted
    // only bizResumeDivs are sorted

    // will be appended to the sceneDiv in main.mjs
    return bizCardDiv;
}

/**
 * Sets the scene-relative geometry of a business card div
 * @param {HTMLElement} bizCardDiv - The business card div
 */
function setBizCardDivSceneGeometry(bizCardDiv) {

    const job = bizCardDiv.job;
    if ( !job ) {
        throw new Error(`job not found for bizCardDiv ${bizCardDiv.id}`);
    }

    // Get vertical positions - based on job start and end dates
    const { sceneTop, sceneBottom } = cardUtils.getSceneVerticalPositions(job.start, job.end, MIN_BIZCARD_HEIGHT);
    bizCardDiv.setAttribute("sceneTop", `${sceneTop}`);
    const sceneHeight = sceneBottom - sceneTop;
    bizCardDiv.setAttribute("sceneHeight", `${sceneHeight}`);

    const sceneCenterX = cardUtils.getRandomSignedOffset(MAX_X_OFFSET); // Random offset from scene origin
    const sceneWidth = BIZCARD_MEAN_WIDTH + cardUtils.getRandomSignedOffset(MAX_WIDTH_OFFSET);
    const sceneLeft = sceneCenterX - sceneWidth / 2;
    bizCardDiv.setAttribute("sceneLeft", `${sceneLeft}`);
    bizCardDiv.setAttribute("sceneWidth", `${sceneWidth}`);

    const sceneZ = cardUtils.getRandomBetween(BIZCARD_MIN_Z, BIZCARD_MAX_Z);
    bizCardDiv.setAttribute("sceneZ", sceneZ);
}

export function initializeDivSync() {
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    if (bizCardDivs.length === 0) {
        console.warn('DivSync: No .biz-card-div elements found');
        return; // Exit early if no elements exist.
    }
    // Proceed with event binding...
}

export function handleClickEvent(element) {
    if (!element || !element.pairedElement) {
        console.error('DivSyncModule: handleClickEvent: Invalid element or pairedElement', element);
        return; // Exit early if invalid.
    }
    // Rest of the logic...
}
