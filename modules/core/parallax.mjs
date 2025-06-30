/**
 * Module: parallax
 * This module handles parallax effects for bizCardDivs based on the focal point position.
 */
import { watchEffect } from 'vue';
import { useFocalPoint } from '../composables/useFocalPoint.mjs';
import * as viewPort from './viewPort.mjs';
import * as zUtils from '../utils/zUtils.mjs';

// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 5.0;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 4.0;

let _isInitialized = false;

/**
 * Initializes the parallax effect.
 */
export function initialize() {
    if (_isInitialized) {
        console.warn("Parallax already initialized.");
        return;
    }

    if (!viewPort.isInitialized()) {
        throw new Error("Cannot initialize parallax: viewPort not initialized");
    }

    const { position: focalPointPosition } = useFocalPoint();
    const sceneContainer = document.getElementById('scene-container');

    if (!sceneContainer) {
        console.error("Parallax initialization failed: #scene-container not found.");
        return;
    }

    watchEffect(() => {
        const rect = sceneContainer.getBoundingClientRect();
        const sceneCenterX = rect.left + rect.width / 2;
        const sceneCenterY = rect.top + rect.height / 2;

        const { x: fpX, y: fpY } = focalPointPosition.value;

        // Calculate focal point position relative to the scene's center
        const dh = (sceneCenterX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
        const dv = (sceneCenterY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;

        const bizCardDivs = document.getElementsByClassName("biz-card-div");
        for (const bizCardDiv of bizCardDivs) {
            applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
        }
    });

    _isInitialized = true;
    console.log("Parallax initialized successfully");
}

export function isInitialized() {
    return _isInitialized;
}

/**
 * Applies the calculated parallax transform to a single business card div.
 * @param {HTMLElement} bizCardDiv The element to apply the transform to.
 * @param {number} dh The horizontal displacement.
 * @param {number} dv The vertical displacement.
 */
export function applyParallaxToBizCardDiv(bizCardDiv, dh, dv) {
    if (bizCardDiv.classList.contains('hasClone')) {
        return; // Do not apply parallax to the original card if it's selected (has a clone).
    }

    const sceneZ = parseFloat(bizCardDiv.getAttribute('data-sceneZ'));
    if (isNaN(sceneZ)) {
        return; // Element doesn't have a valid Z position.
    }
    
    // The parallax effect is scaled by the card's Z position.
    // A higher z-value means the card is further away, so it should move less.
    const zScale = 1 - ((sceneZ - zUtils.ALL_CARDS_Z_MIN) / (zUtils.ALL_CARDS_Z_MAX - zUtils.ALL_CARDS_Z_MIN));
    const translateX = dh * zScale;
    const translateY = dv * zScale;
    
    // For selected items (clones), we might want a different or no parallax effect.
    // The clone will have a very high z-index but we can also check its ID.
    if (bizCardDiv.id.endsWith('-clone')) {
         // Clones are centered, so we only apply a fraction of the parallax
         const cloneTranslateX = translateX * 0.1;
         const cloneTranslateY = translateY * 0.1;
         bizCardDiv.style.transform = `translateX(${cloneTranslateX}px) translateY(${cloneTranslateY}px) translateZ(${sceneZ}px)`;
    } else {
        bizCardDiv.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${sceneZ}px)`;
    }
}

