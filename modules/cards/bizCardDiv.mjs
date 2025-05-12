import * as viewPort from '../layout/viewPort.mjs';
import BizDetailsDiv from './bizDetailsDiv.mjs';
import * as cardUtils from './cardUtils.mjs';
import BizResumeDiv from './bizResumeDiv.mjs';

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
export function isBizCardDivId(id) {
    return id.startsWith("biz-card-div-");
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
    bizCardDiv['job'] = job;

    bizCardDiv.setAttribute("job-index", jobIndex.toString());

    // Set color index (can be different from jobIndex in the future)
    bizCardDiv.setAttribute("data-color-index", jobIndex.toString());
    
    // Position the scene-relative geometry of the bizCard
    setBizCardDivSceneGeometry(bizCardDiv);

    // create the biz details with text
    const bizDetailsDiv = new BizDetailsDiv(bizCardDiv);
    bizCardDiv.appendChild(bizDetailsDiv.element);
    
    // Add click handler
    bizCardDiv.addEventListener("click", () => handleBizCardClick(bizCardDiv, job));
    
    // Initialize view-relative styling based on 
    // the scene-relative geometry and focalPoint 
    // at viewPort center which is marked by the bullsEye
    if (!viewPort.viewPortIsInitialized()) {
        throw new Error("ViewPort not initialized");
    }
    cardUtils.applyViewRelativeStyling(viewPort, bizCardDiv);
        
    return bizCardDiv;
}

/**
 * Sets the scene-relative geometry of a business card div
 * @param {HTMLElement} bizCardDiv - The business card div
 */
function setBizCardDivSceneGeometry(bizCardDiv) {

    const job = bizCardDiv['job'];

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


/**
 * Handles click events on business cards
 * @param {HTMLElement} bizCardDiv - The clicked business card div
 * @param {Object} job - The job object associated with the card
 */
function handleBizCardClick(clickEvent, bizCardDiv) {
    // do not consume the click event if its
    // not a valid biz card div
    if (! cardUtils.isBizCardDiv(bizCardDiv)) {
        console.info("Biz card div letting click through");
        return;
    }

    // Remove selected class from all card divs
    // this includes bizCardDivs, skillCardDivs and 
    // and resumeDivs
    document.querySelectorAll('.card-div').forEach(div => {
        div.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    bizCardDiv.classList.add('selected');

    // Find or add the bizResumeDiv in the right content div
    const rightContentDiv = document.getElementById('right-content-div');
    var bizResumeDiv = findBizResumeDiv(rightContentDiv, bizCardDiv);
    if (!bizResumeDiv) {
        bizResumeDiv = new BizResumeDiv(bizCardDiv);
        rightContentDiv.appendChild(bizResumeDiv.element);
    }

    // select the biz resume card of the clicked biz card
    bizResumeDiv.classList.add('selected');

    // and scroll it into view
    bizResumeDiv.scrollIntoView({ behavior: 'smooth' });

}
