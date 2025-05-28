// scene/bizCardDivModule.mjs

import * as viewPort from '../core/viewPort.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as BizResumeDivModule from './bizResumeDivModule.mjs';
import * as divSyncModule from './divSyncModule.mjs';
import * as colorPalettes from '../color/colorPalettes.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as sceneContainer from './sceneContainer.mjs';

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


export function isBizCardDiv(obj) {
    return obj && domUtils.isDivElement(obj) && obj.classList.contains('biz-card-div');
}

// returns the id of the bizCardDiv using the jobIndex
export function createBizCardDivId(jobIndex) {
    const jobInt = utils.getNumericValue(jobIndex);
    const bizCardDivId = `biz-card-div-${jobInt}`;
    return bizCardDivId;
}

// scrolls the bizDetailsEmployer of the bizCardDiv into view
export function scrollBizCardDivIntoView(element) {
    if (!divSyncModule.isPairedElement(element)) {
        throw new Error(`element is undefined or not a pairedElement`);
    }
    const bizCardDiv = divSyncModule.getBizCardDiv(element);
    const bizDetailsDiv = bizCardDiv.querySelector('.biz-details-div');
    if (!bizDetailsDiv) throw new Error(`bizDetailsDiv not found for ${bizCardDiv.id}`);
    const bizDetailsClass = '.biz-details-employer';
    const bizDetailsElement = bizDetailsDiv.querySelector(bizDetailsClass);
    if (!bizDetailsElement) throw new Error(`${bizDetailsClass} not found for ${bizCardDiv.id} / biz-details-div`);
    bizDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Creates a business card div for a job. Does NOT appends itself
 * to the scenePlane. This is done in main.mjs
 * 
 * @param {Object} job - The job object
 * @param {number} jobIndex - The index of the job in the sorted array
 * @returns {HTMLElement} The created business card div
 */
export function createBizCardDiv(job, jobIndex) {
    const bizCardDiv = document.createElement("div");
    if ( ! (bizCardDiv instanceof HTMLElement) ) throw new Error (`bizCardDiv is not an instance of HTMLElement`);
    bizCardDiv.classList.add("biz-card-div");
    bizCardDiv.id = createBizCardDivId(jobIndex);
    if ( bizCardDiv.id.indexOf('undefined') >= 0 ) throw new Error(`bizCardDiv.id:${bizCardDiv.id} includes 'undefined' for jobIndex:${jobIndex}`);
    bizCardDiv.job = job;
    bizCardDiv.jobIndex = jobIndex;
    bizCardDiv.setAttribute('sort-key-start', job.start);
    if ( bizCardDiv.getAttribute('sort-key-start') !== job.start ) throw new Error('bizCardDiv sort-key-start attribute not saved?'); 

    bizCardDiv.setAttribute('sort-key-end', job.end);
    bizCardDiv.setAttribute('sort-key-employer', job.employer);
    bizCardDiv.setAttribute('sort-key-title', job.title);
    bizCardDiv.setAttribute('sort-key-job-index', jobIndex);
    // Assign color index and apply palette
    colorPalettes.assignColorIndex(bizCardDiv, jobIndex);
    if ( bizCardDiv.getAttribute('data-color-index') !== String(jobIndex) ) throw new Error('bizCardDiv data-color-ubdex attribute not saved?');
  
    // Position the scene-relative geometry of the bizCardDiv
    setBizCardDivSceneGeometry(bizCardDiv);

    // create the biz details div with text
    const bizDetailsDiv = BizDetailsDivModule.createBizDetailsDiv(bizCardDiv);
    bizDetailsDiv.id = `biz-details-div-card-${jobIndex}`;
    bizDetailsDiv.classList.add('biz-details-div');
    bizCardDiv['biz-details-div-id'] = bizDetailsDiv.id;
    bizCardDiv.appendChild(bizDetailsDiv);
    bizCardDiv.bizDetailsDiv = bizDetailsDiv;

    // // Initialize view-relative styling based on b
    // // the scene-relative geometry and focalPoint 
    // // at viewPort center which is marked by the bullsEye
    // viewport.applyViewRelativeStyling(bizCardDiv);

    // Create the bizResumeDiv which appends itself to the the resume-content-div
    const bizResumeDiv = BizResumeDivModule.createBizResumeDiv(bizCardDiv);
    if ( ! (bizResumeDiv instanceof HTMLElement) ) throw new Error (`bizResumeDiv is not an instance of HTMLElement`);

    // Note that bizCardDivs are not sorted
    // only bizResumeDivs are sorted

    // appending the bizCarDiv to the scenePlane
    const scenePlane = document.getElementById("scene-plane");
    console.log("bizCardDivModule:createBizCardDiv: appending bizCardDiv.id:", bizCardDiv.id, " to scenePlane");
    scenePlane.appendChild(bizCardDiv);

    // make the bizCardDiv and bizResumeDiv a paired element
    divSyncModule.makeSyncedPair(bizCardDiv, bizResumeDiv);

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
    const { sceneTop, sceneBottom } = sceneContainer.getSceneVerticalPositions(job.start, job.end, MIN_BIZCARD_HEIGHT);
    bizCardDiv.setAttribute("sceneTop", `${sceneTop}`);
    const sceneHeight = sceneBottom - sceneTop;
    bizCardDiv.setAttribute("sceneHeight", `${sceneHeight}`);

    const sceneCenterX = mathUtils.getRandomSignedOffset(MAX_X_OFFSET); // Random offset from scene origin
    const sceneWidth = BIZCARD_MEAN_WIDTH + mathUtils.getRandomSignedOffset(MAX_WIDTH_OFFSET);
    const sceneLeft = sceneCenterX - sceneWidth / 2;
    bizCardDiv.setAttribute("sceneCenterX", `${sceneCenterX}`);
    bizCardDiv.setAttribute("sceneLeft", `${sceneLeft}`);
    bizCardDiv.setAttribute("sceneWidth", `${sceneWidth}`);

    const sceneZ = mathUtils.getRandomBetween(BIZCARD_MIN_Z, BIZCARD_MAX_Z);
    bizCardDiv.setAttribute("sceneZ", sceneZ);

    viewPort.applyViewRelativeStyling(bizCardDiv);
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
