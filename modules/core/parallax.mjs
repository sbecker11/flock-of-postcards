/**
 * Module: parallax
 * This module handles parallax effects for bizCardDivs based on the focal point position.
 */
import { watchEffect } from 'vue';
import { useFocalPoint } from '../composables/useFocalPoint.mjs';
import * as viewPort from './viewport.mjs';
import * as zUtils from '../utils/zUtils.mjs';

// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 0.9;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 1.0;

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
        console.error("Parallax initialization failed: viewPort not initialized.");
        return;
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

    // Listen for viewport changes to ensure parallax updates
    window.addEventListener('viewport-changed', () => {
        console.log('Parallax: viewport-changed event received, triggering update');
        // Force a re-evaluation of the watchEffect by accessing its dependencies
        const rect = sceneContainer.getBoundingClientRect();
        const { x: fpX, y: fpY } = focalPointPosition.value;
        
        const sceneCenterX = rect.left + rect.width / 2;
        const sceneCenterY = rect.top + rect.height / 2;
        const dh = (sceneCenterX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
        const dv = (sceneCenterY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;
    
        const bizCardDivs = document.getElementsByClassName("biz-card-div");
        
        // Bundle values for debugging
        const debugInfo = {
            // Scene container rect
            rectLeft: rect.left,
            rectTop: rect.top,
            rectWidth: rect.width,
            rectHeight: rect.height,
            
            // Scene center
            sceneCenterX: sceneCenterX,
            sceneCenterY: sceneCenterY,
            
            // Focal point
            focalPointX: fpX,
            focalPointY: fpY,
            
            // Parallax displacement
            dh: dh,
            dv: dv,
            
            // Exaggeration factors
            parallaxXFactor: PARALLAX_X_EXAGGERATION_FACTOR,
            parallaxYFactor: PARALLAX_Y_EXAGGERATION_FACTOR,
            
            // Card count
            cardCount: bizCardDivs.length
        };
        
        console.log('Manual parallax debug info:', debugInfo);
        
        for (const bizCardDiv of bizCardDivs) {
            applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
        }
    });

    _isInitialized = true;
    window.CONSOLE_LOG_IGNORE("Parallax initialized successfully");
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
    // A higher z- means the card is further away, so it should move less.
    let zScale = 0;
    if (sceneZ > 0) 
        zScale = (0.9 - ((sceneZ - zUtils.ALL_CARDS_Z_MIN - 1) / (zUtils.ALL_CARDS_Z_MAX - zUtils.ALL_CARDS_Z_MIN)));

    // default before parallax
    let translateX = viewPort.getViewPortOrigin().x;
    let translateY = 0;
    
    // only original cDivs with zScale > 0are subject to parallax
    translateX += dh * zScale;
    translateY += dv * zScale;
    
    const transformString = `translateX(${translateX}px) translateY(${translateY}px)`;
    bizCardDiv.style.transform = transformString;
}

