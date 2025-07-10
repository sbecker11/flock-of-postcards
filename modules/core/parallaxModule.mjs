/**
 * Module: parallax
 * This module handles parallax effects for bizCardDivs based on the focal point position.
 */
import { watchEffect, ref } from 'vue';
import * as viewPort from './viewPortModule.mjs';
import * as zUtils from '../utils/zUtils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';

export const TEST_PARALLAX = true;
export const EPSILON = 0.00001;

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
    window.CONSOLE_LOG_IGNORE('parallax.initialize called');
    
    if (_isInitialized) {
        window.CONSOLE_LOG_IGNORE('parallax already initialized, returning');
        return;
    }

    if (!viewPort.isInitialized()) {
        window.CONSOLE_LOG_IGNORE('viewport not initialized, returning');
        return;
    }

    // Store the focal point reference
    _focalPoint = focalPoint;
    window.CONSOLE_LOG_IGNORE('focalPoint reference stored:', !!_focalPoint);

    // Listen for viewport-changed event to update the rect
    window.addEventListener('viewport-changed', updateSceneContainerRect);
    // Initial update
    updateSceneContainerRect();

    // Watch for focal point position changes and apply parallax
    watchEffect(() => {
        if (!_focalPoint || !_focalPoint.position) {
            window.CONSOLE_LOG_IGNORE('focalPoint not available, skipping parallax');
            return;
        }

        const rect = sceneContainerRect.value;
        const sceneCenterX = rect.left + rect.width / 2;
        const sceneCenterY = rect.top + rect.height / 2;
        const currentPosition = _focalPoint.position.value;
        const { x: fpX, y: fpY } = currentPosition;
        
        window.CONSOLE_LOG_IGNORE('parallax: focalPoint position:', currentPosition, 'scene center:', { x: sceneCenterX, y: sceneCenterY });
        
        // Calculate focal point position relative to the scene's center
        const dh = (sceneCenterX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
        const dv = (sceneCenterY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;
        
        const bizCardDivs = document.getElementsByClassName("biz-card-div");
        window.CONSOLE_LOG_IGNORE('parallax: applying to', bizCardDivs.length, 'biz cards');
        
        for (const bizCardDiv of bizCardDivs) {
            applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
        }
    });

    _isInitialized = true;
    window.CONSOLE_LOG_IGNORE('parallax initialized successfully');
}

export function isInitialized() {
    return _isInitialized;
}

/**
 * Applies the parallax transform to a point in scene-relative coordinates.
 * @param {number} sceneX - The original scene X coordinate
 * @param {number} sceneY - The original scene Y coordinate  
 * @param {number} sceneZ - The original scene Z coordinate
 * @returns {Object} The transformed position in viewPort-relative coordinates{x, y}
 */
export function applyParallaxToScenePoint(sceneX, sceneY, sceneZ = 0) {
    if ( !isInitialized() ) {
        console.log('parallax not initialized, skipping applyParallaxToScenePoint');
        return null;
    }
    if (sceneZ < 0) {
        throw new Error('sceneZ must be greater than 0');
    }

    const bullsEye = viewPort.getViewPortOrigin();
    const dh = (bullsEye.x - _focalPoint.x) * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = (bullsEye.y - _focalPoint.y) * PARALLAX_Y_EXAGGERATION_FACTOR;

    let zScale = 0;
    if (sceneZ > 0) 
        zScale = (0.9 - ((sceneZ - zUtils.ALL_CARDS_Z_MIN - 1) / (zUtils.ALL_CARDS_Z_MAX - zUtils.ALL_CARDS_Z_MIN)));

    const translateX = dh * zScale;
    const translateY = dv * zScale;

    const viewPortPos = { 
        x:  sceneX + translateX,
        y:  sceneY + translateY
    }
    return viewPortPos;
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
    let translateX = 0;
    let translateY = 0;
    
    // Only get viewport origin if viewport is initialized
    if (viewPort.isInitialized()) {
        translateX = viewPort.getViewPortOrigin().x;
    }
    
    // only original cDivs with zScale > 0 are subject to parallax
    translateX += dh * zScale;
    translateY += dv * zScale;
    
    const transformString = `translateX(${translateX}px) translateY(${translateY}px)`;
    bizCardDiv.style.transform = transformString;

    // verify that test_applyParallaxToScenePoint to the 
    // scene-relative (top-left corner) of the 
    // bizCardDiv at sceneZ == 0 matches the actual 
    // transformed bizCardDiv in viewPort-relative 
    // coordinates (top-left corner)
    if ( TEST_PARALLAX && isInitialized() ) {
        // the actual transformed top-left corner
        // of the bizCardDiv in viewPort-relative coordinates
        // from the above transform
        const viewPos = {
            x: bizCardDiv.getBoundingClientRect().left,
            y: bizCardDiv.getBoundingClientRect().top
        }

        // the cooresponding top-left corner
        // in scene-relative coordinates
        const scenePoint = {
            x: parseFloat(bizCardDiv.getAttribute('scene-left')),
            y: parseFloat(bizCardDiv.getAttribute('scene-top')),
            z: parseFloat(bizCardDiv.getAttribute('sceneZ'))
        };

        // the test-computed viewPort-relative coordinates of the transformed scenePos
        const testViewPos = applyParallaxToScenePoint(
            scenePoint.x, scenePoint.y, scenePoint.z);

        // verify that the transformed scenePoint matches the expected viewPos
        const diffX = Math.abs(viewPos.x - testViewPos.x);
        const diffY = Math.abs(viewPos.y - testViewPos.y);
        if ( diffX > EPSILON || diffY > EPSILON ) {
            throw new Error(`TEST_PARALLAX failed: viewPos does not match the transformed bizCardDiv: ${diffX}, ${diffY}`);
        }
    }
}

/**
 * Calculates the position of a point after applying the current parallax transform.
 * @param {number} sceneX - The original scene X coordinate
 * @param {number} sceneY - The original scene Y coordinate  
 * @param {number} sceneZ - The Z depth of the point
 * @returns {Object} The transformed position {x, y}
 */
export function calculateTransformedPosition(sceneX, sceneY, sceneZ = 0) {
    if (!isInitialized()) {
        throw new Error('parallax not initialized');
    }
    
    if (!_focalPoint || !_focalPoint.position) {
        return { x: sceneX, y: sceneY }; // No transform if no focal point
    }
    
    const rect = sceneContainerRect.value;
    const sceneCenterX = rect.left + rect.width / 2;
    const sceneCenterY = rect.top + rect.height / 2;
    const currentPosition = _focalPoint.position.value;
    const { x: fpX, y: fpY } = currentPosition;
    
    // Calculate focal point position relative to the scene's center
    const dh = (sceneCenterX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = (sceneCenterY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;
    
    // Calculate Z scale
    let zScale = 0;
    if (sceneZ > 0) {
        zScale = (0.9 - ((sceneZ - zUtils.ALL_CARDS_Z_MIN - 1) / (zUtils.ALL_CARDS_Z_MAX - zUtils.ALL_CARDS_Z_MIN)));
    }
    
    // Apply parallax transform
    const translateX = dh * zScale;
    const translateY = dv * zScale;
    
    return {
        x: sceneX + translateX,
        y: sceneY + translateY
    };
}

// Expose functions globally for components to use
if (typeof window !== 'undefined') {
    window.applyParallaxToScenePoint = applyParallaxToScenePoint;
    window.calculateTransformedPosition = calculateTransformedPosition;
}