// modules/utils/cardUtils.mjs

import * as domUtils from './domUtils.mjs';
import * as mathUtils from './mathUtils.mjs';
import * as timeline from '../timeline/timeline.mjs';


// export var currentlySelectedBizResumeDiv = null;
// export var currentlySelectedBizCardDiv = null;

// export function getCurrentlySelectedBizResumeDiv() {
//     return currentlySelectedBizResumeDiv;
// }

// export function setCurrentlySelectedBizResumeDiv(bizResumeDiv) {
//     currentlySelectedBizResumeDiv = bizResumeDiv;
// }

// export function getCurrentlySelectedBizCardDiv() {
//     return currentlySelectedBizCardDiv;
// }

// export function setCurrentlySelectedBizResumeDiv(bizResumeDiv) {
//     if (!isBizResumeDiv(bizResumeDiv)) {
//         throw new Error(`bizResumeDiv ${bizResumeDiv} is null`);
//     }
//     if (!isBizCardDiv(bizResumeDiv)) {
//         throw new Error(`bizResumeDiv ${bbizResumeDivizCardDiv} is not a valid bizCardDiv`);
//     }
//     const bizResumeDiv = bizCardDiv.bizResumeDiv;
//     if (!isBizResumeDiv(bizResumeDiv)) {
//         throw new Error(`bizResumeDiv ${bizResumeDiv} is not a valid bizResumeDiv`);
//     }
//     setCurrentDivs(bizResumeDiv, bizCardDiv);
// }

// export function setCurrentlySelectedBizCardDiv(bizCardDiv) {
//     if ( !bizCardDiv ) {
//         throw new Error(`bizCardDiv ${bizCardDiv} is null`);
//     }
//     if (!isBizCardDiv(bizCardDiv)) {
//         throw new Error(`bizCardDiv ${bizCardDiv} is not a valid bizCardDiv`);
//     }
//     const bizResumeDiv = bizCardDiv.bizResumeDiv;
//     if (!isBizResumeDiv(bizResumeDiv)) {
//         throw new Error(`bizResumeDiv ${bizResumeDiv} is not a valid bizResumeDiv`);
//     }
//     setCurrentDivs(bizResumeDiv, bizCardDiv);
// }

// export function setCurrentDivs(bizResumeDiv, bizCardDiv) {
//     if (!isBizResumeDiv(bizResumeDiv)) {
//         throw new Error(`bizResumeDiv ${bizResumeDiv} is not a valid bizResumeDiv`);
//     }
//     if (!isBizCardDiv(bizCardDiv)) {
//         throw new Error(`bizCardDiv ${bizCardDiv} is not a valid bizCardDiv`);
//     }
//     bizResumeDivModule.setCurrentBizResumeDiv(bizResumeDiv);
//     bizCardDivModule.setCurrentBizCardDiv(bizCardDiv);
// }

// /**
//  * Checks if a div ID is a business card div ID
//  * @param {string} divId - The div ID to check
//  * @returns {boolean} True if the div ID is a business card div ID
//  */
// export function isBizCardDivId(divId) {
//     return typeValidators.isString(divId) && getBizCardDivIndex(divId) == null ? false : true;
// }

// /**
//  * Checks if a div ID is a card div ID
//  * @param {string} divId - The div ID to check
//  * @returns {boolean} True if the div ID is a card div ID
//  */
// export function isCardDivId(divId) {
//     return typeValidators.isString(divId) && getCardDivIndex(divId) == null ? false : true;
// }

// /**
//  * Checks if a div is a card div line item
//  * @param {HTMLElement} div - The div to check
//  * @returns {boolean} True if the div is a card div line item
//  */
// export function isCardDivLineItem(div) {
//     return div != null && div.classList.contains('card-div-line-item') ? true : false;
// }

/**
 * Gets the index of a business card div
 * @param {HTMLDivElement} div - The business card div
 * @returns {number} The index of the business card div
 */
export function getBizCardDivIndex(div) {
    return parseInt(div.id.split('-')[1]);
}

/**
 * Gets the ID of a business card div
 * @param {number} index - The index of the business card div
 * @returns {string} The ID of the business card div
 */
export function getBizCardDivId(index) {
    return `biz-card-div-${index}`;
}

/**
 * Finds all translatable card divs within the viewPort
 * @param {Object} viewPortGeometry - The viewPort geometry object containing { top, left, width, height }
 * @returns {Array<HTMLElement>} Array of translatable card divs within the viewPort
 */
export function findAllTranslatableCardsInViewPort(viewPortGeometry) {
    const allDivs = document.getElementsByClassName("biz-card-div");
    return Array.from(allDivs).filter(div => {
        const rect = div.getBoundingClientRect();
        return (
            rect.top < viewPortGeometry.top + viewPortGeometry.height &&
            rect.left < viewPortGeometry.left + viewPortGeometry.width &&
            rect.bottom > viewPortGeometry.top &&
            rect.right > viewPortGeometry.left
        );
    });
} 

/**
 * Formats a date range for display
 * @param {string} start - Start date in YYYY-MM-DD format
 * @param {string} end - End date in YYYY-MM-DD format or "CURRENT_DATE"
 * @returns {string} Formatted date range
 */
export function formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = end === "CURRENT_DATE" ? new Date() : new Date(end);
    
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'short'
        });
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * NOTE: in JavaScript, getFullYear() is a method of the 
 * Date object that returns the full year (a four-digit number) 
 * for the specified date according to local time. It 
 * should be used instead of the deprecated getYear() 
 * method. For example, if you call getFullYear() on a 
 * date object representing 2024-12-25, it will return 
 * 2024. 
 */

/**
 * Gets the vertical position for a given date
 * @param {Date} date - Date in YYYY-MM-DD format
 * @returns {number} Vertical position
 */
export function getSceneVerticalPositionForDate(date) {
    const yearString = date.getFullYear().toString();
    const monthString = (date.getMonth() + 1).toString();
    return timeline.getTimelineYearMonthBottom(yearString, monthString);
}

/**
 * Formats returns top and bottom scene values 
 * for a given start and end date and a minimum height
 * @param {string} startDateString - Start date in YYYY-MM-DD format
 * @param {string} endDateString - End date in YYYY-MM-DD format or "CURRENT_DATE"
 * @param {number} minHeight - Minimum height if > 0
 * @returns {Object} Object containing scendTop and sceneBottom  values
 */
export function getSceneVerticalPositions(startDateString, endDateString,  minHeight=0) {
    const startDate = new Date(startDateString);
    const endDate = endDateString === "CURRENT_DATE" ? 
        new Date(): 
        new Date(endDateString); 
    const sceneTop = getSceneVerticalPositionForDate(endDate);
    const sceneBottom = getSceneVerticalPositionForDate(startDate);
    const sceneHeight = sceneBottom - sceneTop;
    // Apply minHeight rule if needed
    if (minHeight > 0) {
        if (sceneHeight < minHeight) {
            const diff = minHeight - sceneHeight;
            const adjustedSceneTop = sceneTop - diff / 2;
            const adjustedSceneHeight = sceneHeight + diff;
            const adjustedSceneBottom = adjustedSceneTop + adjustedSceneHeight;
            return { sceneTop: adjustedSceneTop, sceneBottom: adjustedSceneBottom };
        }
    }
    return { sceneTop: sceneTop, sceneBottom: sceneBottom };
}

export function applyViewRelativeStylingToAllBizCardDivs(viewPort) {
    const bizCardDivs = document.getElementsByClassName("biz-card-div");
    for (const bizCardDiv of bizCardDivs) {
        applyViewRelativeStyling(viewPort, bizCardDiv);
    }
}

/**
 * Initializes view-relative styling for a card div
 * @param {Object} viewPort - The viewPort object
 * @param {HTMLElement} bizCardDiv - The card div
 */
export function applyViewRelativeStyling(viewPort, bizCardDiv) {
    if (viewPort == null) {
        throw new Error(`ViewPort is null`);
    }
    if (bizCardDiv == null || !isBizCardDiv(bizCardDiv)) {
        console.log("bizCardDiv.id typeof:", typeof bizCardDiv?.id);
        console.log("bizCardDiv:", bizCardDiv);
        throw new Error("Invalid bizCardDiv: null or not a bizCardDiv");
    }

    const viewPortProperties = viewPort.getViewPortProperties();
    // const viewPortWidth = viewPortProperties.width;
    // console.log(`viewPortWidth: ${viewPortWidth}`);
    // const viewPortCenterX = viewPortWidth / 2;
    // console.log(`viewPortCenterX: ${viewPortCenterX}`);
    const bullsEyeX = viewPortProperties.bullsEyeX;
    // console.log(`bullsEyeX: ${bullsEyeX} on applyViewRelativeStyling`);
    // console.log(`bullsEyeCneterX: ${viewPort.getBullsEyeCenterX()}`);

    // transform scene-relative attributes to get view-relative styling
    const sceneLeft = parseInt(bizCardDiv.getAttribute("sceneLeft"));
    const viewLeft = bullsEyeX + sceneLeft;
    const viewWidth = parseInt(bizCardDiv.getAttribute("sceneWidth"));
    const viewTop = parseInt(bizCardDiv.getAttribute("sceneTop"));
    const viewHeight = parseInt(bizCardDiv.getAttribute("sceneHeight"));

    // apply view-relative styling
    bizCardDiv.style.height =  `${viewHeight}px`;
    bizCardDiv.style.top =     `${viewTop}px`;
    bizCardDiv.style.width =   `${viewWidth}px`;
    bizCardDiv.style.left =    `${viewLeft}px`;

    // console.log(`bizCardDiv view-relativestyling for ${bizCardDiv.id}:`, {
    //     styleLeft: bizCardDiv.style.left,
    //     offsetLeft: bizCardDiv.offsetLeft,
    //     boundingLeft: bizCardDiv.getBoundingClientRect().left,
    //     viewLeft,
    //     bullsEyeX,
    //     sceneLeft,
    //     parsedSceneLeft: parseFloat(sceneLeft)
    // });
}


// every biz-card-div
export function isBizCardDiv(obj) {
    return obj &&domUtils.isDivElement(obj) && obj.classList.contains('biz-card-div');
}
export function validateIsbizCardDiv(obj) {
    if (!isBizCardDiv(obj)) {
        throw new Error(`Argument does not have "biz-card-div" class but does have ${obj.classList}.`);
    }
}
