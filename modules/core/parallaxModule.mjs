/**
 * Module: parallax
 * This module handles parallax effects for bizCardDivs based on the focal point position.
 */
import { watchEffect, ref } from 'vue';
import * as viewPort from './viewPortModule.mjs';
import * as zUtils from '../utils/zUtils.mjs';

// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 0.9;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 1.0;

let _isInitialized = false;
let _focalPoint = null;

// Create a reactive reference to the scene container rect
const sceneContainerRect = ref({ left: 0, top: 0, width: 0, height: 0 });

function updateSceneContainerRect() {
  const sceneContainer = document.getElementById('scene-container');
  if (sceneContainer) {
    const rect = sceneContainer.getBoundingClientRect();
    sceneContainerRect.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }
}

/**
 * Initializes the parallax effect.
 * @param {Object} focalPoint - The focalPoint composable instance
 */
export function initialize(focalPoint = null) {
    // console.log('parallax.initialize called');
    
    if (_isInitialized) {
        // console.log('parallax already initialized, returning');
        return;
    }

    if (!viewPort.isInitialized()) {
        // console.log('viewport not initialized, returning');
        return;
    }

    // Store the focal point reference
    _focalPoint = focalPoint;
    // console.log('focalPoint reference stored:', !!_focalPoint);

    // Listen for viewport-changed event to update the rect
    window.addEventListener('viewport-changed', updateSceneContainerRect);
    // Initial update
    updateSceneContainerRect();

    // Watch for focal point position changes and apply parallax
    watchEffect(() => {
        if (!_focalPoint || !_focalPoint.position) {
            // console.log('focalPoint not available, skipping parallax');
            return;
        }

        const rect = sceneContainerRect.value;
        const sceneCenterX = rect.left + rect.width / 2;
        const sceneCenterY = rect.top + rect.height / 2;
        const currentPosition = _focalPoint.position.value;
        const { x: fpX, y: fpY } = currentPosition;
        
        // console.log('parallax: focalPoint position:', currentPosition, 'scene center:', { x: sceneCenterX, y: sceneCenterY });
        
        // Calculate focal point position relative to the scene's center
        const dh = (sceneCenterX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
        const dv = (sceneCenterY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;
        
        const bizCardDivs = document.getElementsByClassName("biz-card-div");
        // console.log('parallax: applying to', bizCardDivs.length, 'biz cards');
        
        for (const bizCardDiv of bizCardDivs) {
            applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
        }
    });

    _isInitialized = true;
    // console.log('parallax initialized successfully');
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
    
    // only original cDivs with zScale > 0 are subject to parallax
    translateX += dh * zScale;
    translateY += dv * zScale;
    
    const transformString = `translateX(${translateX}px) translateY(${translateY}px)`;
    bizCardDiv.style.transform = transformString;
}

