// scene/bizCardDivModule.mjs

import * as viewPort from '../core/viewPort.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as BizResumeDivModule from './bizResumeDivModule.mjs';
// import * as divSyncModule from './divSyncModule.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import * as colorPalettes from '../color/colorPalettes.mjs';
import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as sceneContainer from './sceneContainer.mjs';
import * as zIndex from '../core/zIndex.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const log = new Logger("bizCardDivModule", LogLevel.DEBUG);

// Business card constants
export const BIZCARD_MEAN_WIDTH = 200;
export const BIZCARD_INDENT = 29;
export const MIN_BIZCARD_HEIGHT = 200;
export const MIN_BRIGHTNESS_PERCENT = 70;
export const BLUR_Z_SCALE_FACTOR = 0.1;
export const MAX_WIDTH_OFFSET = 40; // Maximum random width offset in pixels
export const MAX_X_OFFSET = 100; // Maximum random horizontal offset in pixels

// global selected element
let globalSelectedElement = null;

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
    // if (!divSyncModule.isPairedElement(element)) {
    //     throw new Error(`element is undefined or not a pairedElement`);
    // }
    // const bizCardDiv = divSyncModule.getBizCardDiv(element);
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
 * @param {number} jobIndex - The index of the job in the original un-sorted array
 * @returns {HTMLElement} The created business card div
 */
export function createBizCardDiv(job, jobIndex) {
    if ( !job ) throw new Error('createBizCardDiv: given null job');
    if ( !Number.isInteger(jobIndex )) throw new Error('createBizCardDiv: given non-integer jobIndex');
    const bizCardDiv = document.createElement("div");
    if ( ! (bizCardDiv instanceof HTMLElement) ) throw new Error (`bizCardDiv is not an instance of HTMLElement`);
    bizCardDiv.classList.add("biz-card-div");
    bizCardDiv.id = createBizCardDivId(jobIndex);
    if ( bizCardDiv.id.indexOf('undefined') >= 0 ) throw new Error(`bizCardDiv.id:${bizCardDiv.id} includes 'undefined' for jobIndex:${jobIndex}`);
    bizCardDiv.setAttribute("data-job-index", jobIndex );

    // Position the scene-relative geometry of the bizCardDiv
    setBizCardDivSceneGeometry(bizCardDiv, job);

    // Assign color index
    colorPalettes.assignColorIndex(bizCardDiv, jobIndex);
    if ( bizCardDiv.getAttribute('data-color-index') !== String(jobIndex) ) throw new Error('bizCardDiv data-color-ubdex attribute not saved?');
    
    // create and append bizCardDetails after setting data-color-index
    const bizCardDetailsDiv = BizDetailsDivModule.createBizCardDetailsDiv(bizCardDiv, job);
    bizCardDiv.appendChild(bizCardDetailsDiv);
    
    // and apply the color set to bizCardDiv after appending bizCardDetails
    colorPalettes.applyCurrentColorPaletteToElement(bizCardDiv);

    // appending the bizCarDiv to the scenePlane
    const scenePlane = document.getElementById("scene-plane");
    log.info("bizCardDivModule:createBizCardDiv: appending bizCardDiv.id:", bizCardDiv.id, " to scenePlane");
    scenePlane.appendChild(bizCardDiv);

    // Initialize view-relative styling based on the scene-relative geometry
    if ( !viewPort.viewPortIsInitialized() ) throw new Error('viewPort is not initialized');
        viewPort.applyViewRelativeStyling(bizCardDiv);

    return bizCardDiv;
}

/**
 * Sets the scene-relative geometry of a business card div
 * @param {HTMLElement} bizCardDiv - The business card div
 */
function setBizCardDivSceneGeometry(bizCardDiv, job) {
    if ( !job ) {
        throw new Error(`job not found for bizCardDiv ${bizCardDiv.id}`);
    }

    // Get vertical positions - based on job start and end dates
    const { sceneTop, sceneBottom } = sceneContainer.getSceneVerticalPositions(job.start, job.end, MIN_BIZCARD_HEIGHT);
    bizCardDiv.setAttribute("data-sceneTop", `${sceneTop}`);
    const sceneHeight = sceneBottom - sceneTop;
    bizCardDiv.setAttribute("data-sceneHeight", `${sceneHeight}`);

    const sceneCenterX = mathUtils.getRandomSignedOffset(MAX_X_OFFSET); // Random offset from scene origin
    const sceneWidth = BIZCARD_MEAN_WIDTH + mathUtils.getRandomSignedOffset(MAX_WIDTH_OFFSET);
    const sceneLeft = sceneCenterX - sceneWidth / 2;
    bizCardDiv.setAttribute("data-sceneCenterX", `${sceneCenterX}`);
    bizCardDiv.setAttribute("data-sceneLeft", `${sceneLeft}`);
    bizCardDiv.setAttribute("data-sceneWidth", `${sceneWidth}`);

    const sceneZ = mathUtils.getRandomInt(zIndex.BIZCARD_Z_MIN, zIndex.BIZCARD_Z_MAX);
    bizCardDiv.setAttribute("data-sceneZ", sceneZ);
}

export function handleClickEvent(element) {
    if ( !element ) throw new Error('bizCardDivModule:handleClickEvent: given null element');
    log.info('bizCardDivModule:handleClickEvent: element.id', element.id);
    const jobIndex = element.getAttribute('data-job-index');
    if ( !utils.isNumeric(jobIndex)) throw new Error('bizCardDivModule:handleClickEvent: element non-numeric data-job-index attribute string');
    if ( domUtils.hasClass(element, "selected")) {
        const selectedElements = querySelectorAll('.selected');
        for (const selectedElement of selectedElements) {
            domUtils.removeClass(selectedElement, "selected");
            const selectedJobIndex = selectedElement.getAttribute('data-job-index');
            resumeManager.removeClassItems(selectedJobIndex, 'selected');
        }
        globalSelectedElement = null;
        console.log("element:",element.id,"unselected");
    } else {
        domUtils.addClass(element, "selected");
        globalSelectedElement = element;
        resumeManager.addClassItem(jobIndex, 'selected');
        console.log("element:",element.id,"selected");
    }
}

export function handleMouseEnterEvent(element) {
    if ( !element ) throw new Error('bizCardDivModule:handleMouseEnterEvent: given null element');
    log.info('bizCardDivModule:handleMouseEnterEvent: element.id', element.id);
    const jobIndex = element.getAttribute('data-job-index');
    if ( !utils.isNumeric(jobIndex)) throw new Error('bizCardDivModule:handleMouseEnterEvent: element has non-numeric data-job-index attribute string');
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
    log.info('bizCardDivModule:handleMouseLeaveEvent: element.id', element.id);
    const jobIndex = element.getAttribute('data-job-index');
    if ( !utils.isNumeric(jobIndex) ) throw new Error('bizCardDivModule:handleMouseLeaveEvent: element has non-numeric data-job-index attribute string');
    if ( !domUtils.hasClass(element, "selected")) {
        domUtils.removeClass(element, "hovered");
        resumeManager.removeClassItem(jobIndex, "hovered");
        console.log("element:",element.id,"unhovered");
    } else {
        console.log("element:",element.id,"not unhovered");
    }
}
