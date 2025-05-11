import * as typeValidators from '../utils/typeValidators.mjs';
import * as colorUtils from '../utils/colorUtils.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import * as arrayUtils from '../utils/arrayUtils.mjs';
import * as typeConversions from '../utils/typeConversions.mjs';

/**
 * Checks if a div is a business card div
 * @param {HTMLDivElement} div - The div to check
 * @returns {boolean} True if the div is a business card div
 */
export function isBizcardDiv(div) {
    return div && div.classList.contains('bizcard');
}

/**
 * Checks if a div is a card div
 * @param {HTMLDivElement} div - The div to check
 * @returns {boolean} True if the div is a card div
 */
export function isCardDiv(div) {
    return div && div.classList.contains('card');
}

/**
 * Checks if a div ID is a business card div ID
 * @param {string} divId - The div ID to check
 * @returns {boolean} True if the div ID is a business card div ID
 */
export function isBizcardDivId(divId) {
    return typeValidators.isString(divId) && getBizcardDivIndex(divId) == null ? false : true;
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
export function getBizcardDivIndex(div) {
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
export function getBizcardDivId(index) {
    return `bizcard-${index}`;
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
export function getBizcardDiv(index) {
    return document.getElementById(getBizcardDivId(index));
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
export function getBizcardDivs() {
    return Array.from(document.getElementsByClassName('bizcard'));
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
 * @param {HTMLDivElement} bizcardDiv - The business card div
 * @returns {HTMLDivElement[]} Array of card divs
 */
export function getCardDivsFromBizcardDiv(bizcardDiv) {
    return Array.from(bizcardDiv.getElementsByClassName('card'));
}

/**
 * Gets all card divs for a specific business card index
 * @param {number} bizcardIndex - The index of the business card
 * @returns {HTMLDivElement[]} Array of card divs
 */
export function getCardDivsForBizcardIndex(bizcardIndex) {
    const bizcardDiv = getBizcardDiv(bizcardIndex);
    return bizcardDiv ? getCardDivsFromBizcardDiv(bizcardDiv) : [];
}

/**
 * Gets the business card div that contains a card div
 * @param {HTMLDivElement} cardDiv - The card div
 * @returns {HTMLDivElement} The business card div
 */
export function getBizcardDivFromCardDiv(cardDiv) {
    return cardDiv.closest('.bizcard');
}

/**
 * Gets the business card index for a card div
 * @param {HTMLDivElement} cardDiv - The card div
 * @returns {number} The index of the business card
 */
export function getBizcardIndexFromCardDiv(cardDiv) {
    const bizcardDiv = getBizcardDivFromCardDiv(cardDiv);
    return bizcardDiv ? getBizcardDivIndex(bizcardDiv) : -1;
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
 * @param {number} bizcardIndex - The index of the business card
 * @returns {HTMLDivElement[]} Array of card divs
 */
export function getCardDivsForBizcard(bizcardIndex) {
    const bizcardDiv = getBizcardDiv(bizcardIndex);
    return bizcardDiv ? getCardDivsFromBizcardDiv(bizcardDiv) : [];
}

/**
 * Gets the business card div from an index
 * @param {number} index - The index
 * @returns {HTMLElement|null} The business card div or null if not found
 */
export function getBizcardDivFromIndex(index) {
    var bizcardDivId = getBizcardDivId(index);
    return bizcardDivId ? document.getElementById(bizcardDivId) : null;
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
export function getBizcardDivFromId(divId) {
    return isBizcardDivId(divId) ? document.getElementById(divId) : null;
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
export function getBizcardDivFromDiv(div) {
    return isBizcardDiv(div) ? div : null;
}

/**
 * Gets the card div from a div
 * @param {HTMLElement} div - The div
 * @returns {HTMLElement|null} The card div or null if not found
 */
export function getCardDivFromDiv(div) {
    return isCardDiv(div) ? div : null;
}

/**
 * Gets the business card div from a business card div
 * @param {HTMLElement} bizcardDiv - The business card div
 * @returns {HTMLElement|null} The business card div or null if not found
 */
export function getBizcardDivFromBizcardDiv(bizcardDiv) {
    if (!isBizcardDiv(bizcardDiv)) {
        return null;
    }
    var bizcardDivId = bizcardDiv.id;
    return Array.from(document.querySelectorAll('.card-div')).find(cardDiv => {
        return cardDiv.getAttribute('data-bizcard-div-id') === bizcardDivId;
    });
}

/**
 * Gets the card divs from a business card div ID
 * @param {string} bizcardDivId - The business card div ID
 * @returns {HTMLElement[]} Array of card divs
 */
export function getCardDivsFromBizcardDivId(bizcardDivId) {
    var bizcardDiv = getBizcardDivFromId(bizcardDivId);
    return bizcardDiv ? getCardDivsFromBizcardDiv(bizcardDiv) : [];
}

/**
 * Gets the card divs from a business card div index
 * @param {number} bizcardDivIndex - The business card div index
 * @returns {HTMLElement[]} Array of card divs
 */
export function getCardDivsFromBizcardDivIndex(bizcardDivIndex) {
    var bizcardDiv = getBizcardDivFromIndex(bizcardDivIndex);
    return bizcardDiv ? getCardDivsFromBizcardDiv(bizcardDiv) : [];
}

/**
 * Finds all translatable card divs within the viewport
 * @param {Object} viewportGeometry - The viewport geometry object containing { top, left, width, height }
 * @returns {Array<HTMLElement>} Array of translatable card divs within the viewport
 */
export function findAllTranslatableCardsInViewport(viewportGeometry) {
    const allDivs = document.getElementsByClassName("bizcard-div");
    return Array.from(allDivs).filter(div => {
        const rect = div.getBoundingClientRect();
        return (
            rect.top < viewportGeometry.top + viewportGeometry.height &&
            rect.left < viewportGeometry.left + viewportGeometry.width &&
            rect.bottom > viewportGeometry.top &&
            rect.right > viewportGeometry.left
        );
    });
} 