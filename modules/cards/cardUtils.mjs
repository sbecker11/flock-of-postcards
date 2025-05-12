import * as typeValidators from '../utils/typeValidators.mjs';
import * as colorUtils from '../utils/colorUtils.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import * as arrayUtils from '../utils/arrayUtils.mjs';
import * as typeConversions from '../utils/typeConversions.mjs';
import * as timeline from '../timeline.mjs';
import * as viewport from '../layout/viewPort.mjs';
import { isHTMLElement } from '../utils/domUtils.mjs';

/**
 * Checks if a div is a business card div
 * @param {HTMLDivElement} div - The div to check
 * @returns {boolean} True if the div is a business card div
 */
export function isBizCardDiv(div) {
    return div && div.classList.contains('biz-card-div');
}

/**
 * Checks if a div is a card div
 * @param {HTMLDivElement} div - The div to check
 * @returns {boolean} True if the div is a card div
 */
export function isAnyCardDiv(div) {
    return div && div.classList.contains('card-div');
}

/**
 * Checks if a div ID is a business card div ID
 * @param {string} divId - The div ID to check
 * @returns {boolean} True if the div ID is a business card div ID
 */
export function isBizCardDivId(divId) {
    return typeValidators.isString(divId) && getBizCardDivIndex(divId) == null ? false : true;
}

/**
 * Checks if a div ID is a card div ID
 * @param {string} divId - The div ID to check
 * @returns {boolean} True if the div ID is a card div ID
 */
export function isCardDivId(divId) {
    return typeValidators.isString(divId) && getCardDivIndex(divId) == null ? false : true;
}

/**
 * Checks if a div is a card div line item
 * @param {HTMLElement} div - The div to check
 * @returns {boolean} True if the div is a card div line item
 */
export function isCardDivLineItem(div) {
    return div != null && div.classList.contains('card-div-line-item') ? true : false;
}

/**
 * Gets the index of a business card div
 * @param {HTMLDivElement} div - The business card div
 * @returns {number} The index of the business card div
 */
export function getBizCardDivIndex(div) {
    return parseInt(div.id.split('-')[1]);
}

/**
 * Gets the index of a card div
 * @param {HTMLDivElement} div - The card div
 * @returns {number} The index of the card div
 */
export function getCardDivIndex(div) {
    return parseInt(div.id.split('-')[1]);
}

/**
 * Gets the ID of a business card div
 * @param {number} index - The index of the business card div
 * @returns {string} The ID of the business card div
 */
export function getBizCardDivId(index) {
    return `bizCard-${index}`;
}

/**
 * Gets the ID of a card div
 * @param {number} index - The index of the card div
 * @returns {string} The ID of the card div
 */
export function getCardDivId(index) {
    return `card-${index}`;
}

/**
 * Gets a business card div by index
 * @param {number} index - The index of the business card div
 * @returns {HTMLDivElement} The business card div
 */
export function getBizCardDiv(index) {
    return document.getElementById(getBizCardDivId(index));
}

/**
 * Gets a card div by index
 * @param {number} index - The index of the card div
 * @returns {HTMLDivElement} The card div
 */
export function getCardDiv(index) {
    return document.getElementById(getCardDivId(index));
}

/**
 * Gets all business card divs
 * @returns {HTMLDivElement[]} Array of business card divs
 */
export function getBizCardDivs() {
    return Array.from(document.getElementsByClassName('bizCard'));
}

/**
 * Gets all card divs
 * @returns {HTMLDivElement[]} Array of card divs
 */
export function getCardDivs() {
    return Array.from(document.getElementsByClassName('card'));
}

/**
 * Gets all card divs within a business card div
 * @param {HTMLDivElement} bizCardDiv - The business card div
 * @returns {HTMLDivElement[]} Array of card divs
 */
export function getCardDivsFromBizCardDiv(bizCardDiv) {
    return Array.from(bizCardDiv.getElementsByClassName('card'));
}

/**
 * Gets all card divs for a specific business card index
 * @param {number} bizCardIndex - The index of the business card
 * @returns {HTMLDivElement[]} Array of card divs
 */
export function getCardDivsForBizCardIndex(bizCardIndex) {
    const bizCardDiv = getBizCardDiv(bizCardIndex);
    return bizCardDiv ? getCardDivsFromBizCardDiv(bizCardDiv) : [];
}

/**
 * Gets the business card div that contains a card div
 * @param {HTMLDivElement} cardDiv - The card div
 * @returns {HTMLDivElement} The business card div
 */
export function getBizCardDivFromCardDiv(cardDiv) {
    return cardDiv.closest('.bizCard');
}

/**
 * Gets the business card index for a card div
 * @param {HTMLDivElement} cardDiv - The card div
 * @returns {number} The index of the business card
 */
export function getBizCardIndexFromCardDiv(cardDiv) {
    const bizCardDiv = getBizCardDivFromCardDiv(cardDiv);
    return bizCardDiv ? getBizCardDivIndex(bizCardDiv) : -1;
}

/**
 * Gets the card index for a card div
 * @param {HTMLDivElement} cardDiv - The card div
 * @returns {number} The index of the card
 */
export function getCardIndexFromCardDiv(cardDiv) {
    return getCardDivIndex(cardDiv);
}

/**
 * Gets the card divs for a specific business card index
 * @param {number} bizCardIndex - The index of the business card
 * @returns {HTMLDivElement[]} Array of card divs
 */
export function getCardDivsForBizCard(bizCardIndex) {
    const bizCardDiv = getBizCardDiv(bizCardIndex);
    return bizCardDiv ? getCardDivsFromBizCardDiv(bizCardDiv) : [];
}

/**
 * Gets the business card div from an index
 * @param {number} index - The index
 * @returns {HTMLElement|null} The business card div or null if not found
 */
export function getBizCardDivFromIndex(index) {
    var bizCardDivId = getBizCardDivId(index);
    return bizCardDivId ? document.getElementById(bizCardDivId) : null;
}

/**
 * Gets the card div from an index
 * @param {number} index - The index
 * @returns {HTMLElement|null} The card div or null if not found
 */
export function getCardDivFromIndex(index) {
    var cardDivId = getCardDivId(index);
    return cardDivId ? document.getElementById(cardDivId) : null;
}

/**
 * Gets the business card div from a div ID
 * @param {string} divId - The div ID
 * @returns {HTMLElement|null} The business card div or null if not found
 */
export function getBizCardDivFromId(divId) {
    return isBizCardDivId(divId) ? document.getElementById(divId) : null;
}

/**
 * Gets the card div from a div ID
 * @param {string} divId - The div ID
 * @returns {HTMLElement|null} The card div or null if not found
 */
export function getCardDivFromId(divId) {
    return isCardDivId(divId) ? document.getElementById(divId) : null;
}

/**
 * Gets the business card div from a div
 * @param {HTMLElement} div - The div
 * @returns {HTMLElement|null} The business card div or null if not found
 */
export function getBizCardDivFromDiv(div) {
    return isBizCardDiv(div) ? div : null;
}

/**
 * Gets the card div from a div
 * @param {HTMLElement} div - The div
 * @returns {HTMLElement|null} The card div or null if not found
 */
export function getCardDivFromDiv(div) {
    return isAnyCardDiv(div) ? div : null;
}

/**
 * Gets the business card div from a business card div
 * @param {HTMLElement} bizCardDiv - The business card div
 * @returns {HTMLElement|null} The business card div or null if not found
 */
export function getBizCardDivFromBizCardDiv(bizCardDiv) {
    if (!isBizCardDiv(bizCardDiv)) {
        return null;
    }
    var bizCardDivId = bizCardDiv.id;
    return Array.from(document.querySelectorAll('.card-div')).find(cardDiv => {
        return cardDiv.getAttribute('data-bizCard-div-id') === bizCardDivId;
    });
}

/**
 * Gets the card divs from a business card div ID
 * @param {string} bizCardDivId - The business card div ID
 * @returns {HTMLElement[]} Array of card divs
 */
export function getCardDivsFromBizCardDivId(bizCardDivId) {
    var bizCardDiv = getBizCardDivFromId(bizCardDivId);
    return bizCardDiv ? getCardDivsFromBizCardDiv(bizCardDiv) : [];
}

/**
 * Gets the card divs from a business card div index
 * @param {number} bizCardDivIndex - The business card div index
 * @returns {HTMLElement[]} Array of card divs
 */
export function getCardDivsFromBizCardDivIndex(bizCardDivIndex) {
    var bizCardDiv = getBizCardDivFromIndex(bizCardDivIndex);
    return bizCardDiv ? getCardDivsFromBizCardDiv(bizCardDiv) : [];
}

/**
 * Finds all translatable card divs within the viewPort
 * @param {Object} viewPortGeometry - The viewPort geometry object containing { top, left, width, height }
 * @returns {Array<HTMLElement>} Array of translatable card divs within the viewPort
 */
export function findAllTranslatableCardsInViewPort(viewPortGeometry) {
    const allDivs = document.getElementsByClassName("bizCard-div");
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
 * @param {HTMLElement} cardDiv - The card div
 */
export function applyViewRelativeStyling(viewPort, cardDiv) {
    if (viewPort == null) {
        throw new Error(`ViewPort is null`);
    }
    if (cardDiv == null || !isAnyCardDiv(cardDiv)) {
        throw new Error(`Card div ${cardDiv} is not any valid card div`);
    }

    const viewPortProperties = viewPort.getViewPortProperties();
    // const viewPortWidth = viewPortProperties.width;
    // console.log(`viewPortWidth: ${viewPortWidth}`);
    // const viewPortCenterX = viewPortWidth / 2;
    // console.log(`viewPortCenterX: ${viewPortCenterX}`);
    const bullsEyeX = viewPortProperties.bullsEyeX;
    console.log(`bullsEyeX: ${bullsEyeX}`);
    // console.log(`bullsEyeCneterX: ${viewPort.getBullsEyeCenterX()}`);

    // transform scene-relative attributes to get view-relative styling
    const sceneLeft = parseInt(cardDiv.getAttribute("sceneLeft"));
    const viewLeft = bullsEyeX + sceneLeft;
    const viewWidth = parseInt(cardDiv.getAttribute("sceneWidth"));
    const viewTop = parseInt(cardDiv.getAttribute("sceneTop"));
    const viewHeight = parseInt(cardDiv.getAttribute("sceneHeight"));

    // apply view-relative styling
    cardDiv.style.height =  `${viewHeight}px`;
    cardDiv.style.top =     `${viewTop}px`;
    cardDiv.style.width =   `${viewWidth}px`;
    cardDiv.style.left =    `${viewLeft}px`;

    console.log(`cardDiv styling for ${cardDiv.id}:`, {
        styleLeft: cardDiv.style.left,
        offsetLeft: cardDiv.offsetLeft,
        boundingLeft: cardDiv.getBoundingClientRect().left,
        viewLeft,
        bullsEyeX,
        sceneLeft,
        parsedSceneLeft: parseFloat(sceneLeft)
    });
}

/**
 * Gets a random offset within a range
 * @param {number} maxOffset - Maximum offset in pixels
 * @returns {number} Random offset between -maxOffset and maxOffset
 */
export function getRandomSignedOffset(maxOffset) {
    return (Math.random() * 2 - 1) * maxOffset; // Random value between -maxOffset and maxOffset
}

/**
 * Gets a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
export function getRandomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
