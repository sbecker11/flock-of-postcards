import * as viewPort from '../layout/viewPort.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as cardUtils from './cardUtils.mjs';
import * as BizResumeDivModule from './bizResumeDivModule.mjs';
import * as bizCardSortingModule from './bizCardSortingModule.mjs';
import { assignColorIndex } from '../color_palettes.mjs';
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
        try {
            handleBizCardDivClick(event, bizCardDiv);
        } catch (error) {
            console.error("Error handling biz card click:", error);
        }
    });
    
    // Position the scene-relative geometry of the bizCard
    setBizCardDivSceneGeometry(bizCardDiv);

    // create the biz details div with text
    const bizDetailsDiv = BizDetailsDivModule.createBizDetailsDiv(bizCardDiv);
    bizCardDiv.appendChild(bizDetailsDiv);

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

/**
 * Handles click events on business cards
 * @param {HTMLElement} bizCardDiv - The clicked business card div
 * @param {Event} event - The click event
 * @param {Object} job - The job object associated with the card
 */
export function handleBizCardDivClick(event, bizCardDiv) {
    if ( !bizCardDiv ) {
        throw new Error(`bizCardDiv not found`);
    }
    if ( !bizCardDiv.classList.contains('biz-card-div') ) {
        throw new Error(`bizCardDiv is not a biz-card-div`);
    }

    // Find or add the bizResumeDiv in the right content div
    const rightContentDiv = document.getElementById('resume-content-div');
    var bizResumeDiv = BizResumeDivModule.findBizResumeDiv(rightContentDiv, bizCardDiv);
    if ( ! bizResumeDiv ) {
        console.log(`bizResumeDiv for ${bizCardDiv.id} not found`);
        bizResumeDiv = BizResumeDivModule.addBizResumeDiv(rightContentDiv, bizCardDiv);
        console.log(`bizResumeDiv for ${bizCardDiv.id} added`);
    }
    if ( !bizResumeDiv ) {
        throw new Error(`bizResumeDiv for ${bizCardDiv.id} not found`);
    }
    // select the biz resume card of the clicked biz card
    bizResumeDiv.classList.add('selected');

    // and scroll it into view
    bizResumeDiv.scrollIntoView({ behavior: 'smooth' });
}

export function addBizCardDivManagementButtonEventListeners(
    selectFirstBizCardButton,
    selectNextBizCardButton,
    selectPrevBizCardButton,
    selectAllBizCardsButton) {

    // Add bizCardDiv managementbutton event listeners
    if (selectFirstBizCardButton) {
        selectFirstBizCardButton.addEventListener('click', () => {
            console.log('First button clicked');
            const sortedBizCardDivs = getSortedBizCardDivs();
            if ( !sortedBizCardDivs ) {
                console.log('No bizCardDivs available');
                return;
            }
            const firstBizCardDiv = sortedBizCardDivs[0];
            firstBizCardDiv.click();
        });
    }

    if (selectNextBizCardButton) {
        selectNextBizCardButton.addEventListener('click', () => {
            console.log('Next button clicked');
            const sortedBizCardDivs = getSortedBizCardDivs();
            const selectedBizCardDiv = document.querySelector('.biz-card-div.selected');
            var nextIndex = 0;
            if ( selectedBizCardDiv ) {
                const selectedIndex = sortedBizCardDivs.indeOf(selectedBizCardDiv);
                if ( selectedIndex >= 0 ) {
                    nextIndex = (selectedIndex + 1) % sortedBizCardDivs.length;
                }
            } 
            const nextBizCardDiv = sortedBizCardDivs[nextIndex];
            nextBizCardDiv.click();
        });
    }

    if (selectPrevBizCardButton) {
        selectPrevBizCardButton.addEventListener('click', () => {
            console.log('Prev button clicked');
            const sortedBizCardDivs = getSortedBizCardDivs();
            const selectedBizCardDiv = document.querySelector('.biz-card-div.selected');
            var prevIndex = 0;
            if ( selectedBizCardDiv ) {
                const selectedIndex = sortedBizCardDivs.indeOf(selectedBizCardDiv);
                if ( selectedIndex >= 0 ) {
                    prevIndex = (selectedIndex - 1 + sortedBizCardDivs.length) % sortedBizCardDivs.length;
                }
            } 
            const prevBizCardDiv = sortedBizCardDivs[prevIndex];
            prevBizCardDiv.click();
        });
    }


    if (selectAllBizCardsButton) {
        // select all bizCardDivs and their bizResumeDivs in the sorted list
        selectAllBizCardsButton.addEventListener('click', () => {
            document.querySelectorAll('.bizCard-div').forEach(bizCardDiv => {
                bizCardDiv.click();
            });
        });
    }
}

function getSortedBizCardDivs() {
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    const sortingRule = bizCardSortingModule.getCurrentBizCardDivSortingRule();
    if ( !sortingRule ) {
        console.log('No sorting rule found');
        return null;
    }
    const sortKey = sortingRule.sort_key;
    const sortOrder = sortingRule.sort_order;
    if ( !sortKey ) {
        console.log('No sort key found');
        return null;
    }
    if ( !sortOrder ) {
        sortOrder = bizCardSortingModule.DEFAULT_SORT_ORDER;
        console.log(`No sort order found for so using default sort order: ${sortOrder}`);
    }
    const sortKeyAttribute = `sort-key-${sortKey}`;
    const sortedBizCardDivs = Array.from(bizCardDivs).sort((a, b) => {
        const aValue = a.getAttribute(sortKeyAttribute);
        if ( !aValue ) {
            console.log(`No value found for sort key: ${sortKey} for bizCardDiv: ${a.id}`);
            return 0;
        }
        const bValue = b.getAttribute(sortKeyAttribute);
        if ( !bValue ) {
            console.log(`No value found for sort key: ${sortKey} for bizCardDiv: ${b.id}`);
            return 0;
        }
        if (sortOrder == 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    return sortedBizCardDivs;
}