import { get_z_from_zIndexStr } from './zIndex.mjs';
import * as typeValidators from '../utils/typeValidators.mjs';
import * as colorUtils from '../utils/colorUtils.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import * as arrayUtils from '../utils/arrayUtils.mjs';
import * as typeConversions from '../utils/typeConversions.mjs';
import { findAllTranslatableCardsInViewPort } from '../cards/cardUtils.mjs';

// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 0.05;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 0.1;

/**
 * Gets the current parallax values
 * @returns {{parallaxX: number, parallaxY: number}} The current parallax values
 */
export function getParallax() {
    return {
        parallaxX: window.parallaxX || 0,
        parallaxY: window.parallaxY || 0
    };
}

/**
 * Gets the z-translate string for a given element
 * @param {number} dh - Horizontal parallax factor
 * @param {number} dv - Vertical parallax factor
 * @param {number} zValue - Z value
 * @param {number} sceneContainer_dx - X offset from scene-div container
 * @param {number} sceneContainer_dy - Y offset from scene-div container
 * @returns {string} The z-translate string
 */
export function getZTranslateStr(dh, dv, zValue, sceneContainer_dx, sceneContainer_dy) {
    const dx = dh * zValue;
    const dy = dv * zValue;
    return `${dx}px ${dy}px`;
}

/**
 * Applies parallax effect to a card div
 * @param {HTMLElement} skillCardDiv - The card div to apply parallax to
 * @returns {string|null} The translate string used or null if no parallax was applied
 */
export function applyParallaxToOneCardDiv(skillCardDiv) {
    const zIndexStr = skillCardDiv.style.zIndex;
    const savedZ = skillCardDiv.getAttribute("saved_z");
    
    if ((savedZ === "") || (zIndexStr == SELECTED_CARD_Z_INDEX)) {
        return null;
    }

    if (zIndexStr === null) {
        return null;
    }

    const { parallaxX, parallaxY } = getParallax();
    const sceneContainerX = domUtils.half(sceneContainer.offsetWidth);
    const sceneContainerY = domUtils.half(sceneContainer.offsetHeight);

    const dh = parallaxX * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = parallaxY * PARALLAX_Y_EXAGGERATION_FACTOR;

    const zValue = get_z_from_zIndexStr(zIndexStr);

    const cardDivX = domUtils.half(skillCardDiv.offsetWidth);
    const cardDivY = domUtils.half(skillCardDiv.offsetHeight);

    const sceneContainer_dx = sceneContainerX - cardDivX;
    const sceneContainer_dy = sceneContainerY - cardDivY;

    const zTranslateStr = getZTranslateStr(dh, dv, zValue, sceneContainer_dx, sceneContainer_dy);

    try {
        skillCardDiv.style.translate = zTranslateStr;
    } catch (error) {
        // Silently handle errors
    }
    return zTranslateStr;
}

/**
 * Applies parallax effect to all card divs in the viewPort
 * @param {HTMLElement} sceneContainer - The scene-div container element
 */
export function renderAllTranslateableDivsAtsceneContainerCenter(sceneContainer) {
    const sceneContainerX = domUtils.half(sceneContainer.offsetWidth);
    const sceneContainerY = domUtils.half(sceneContainer.offsetHeight);
    const viewPortGeometry = {
        top: sceneContainer.getBoundingClientRect().top,
        left: sceneContainer.getBoundingClientRect().left,
        width: sceneContainer.offsetWidth,
        height: sceneContainer.offsetHeight
    };
    const translateableDivs = findAllTranslatableCardsInViewPort(viewPortGeometry);
    
    for (const div of translateableDivs) {
        const divWidth = div.offsetWidth;
        const trans_dx = sceneContainerX - domUtils.half(divWidth);
        const trans_dy = 0;
        const translateStr = `${trans_dx}px ${trans_dy}px`;
        try {
            div.style.translate = translateStr;
        } catch (error) {
            // Silently handle errors
        }
    }
} 