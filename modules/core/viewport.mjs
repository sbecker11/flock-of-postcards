// modules/core/viewport.mjs

import { isHTMLElement } from '../utils/domUtils.mjs';
import * as resizeHandle from './resizeHandle.mjs';    
import * as bullsEye from './bullsEye.mjs';
import * as aimPoint from './aimPoint.mjs';

// Constants
const VIEWPORT_PADDING = 20; // Padding around the viewPortProperties

// ViewPort state
const viewPortProperties = {
    padding: VIEWPORT_PADDING,
    top: null,
    left: null,
    right: null,
    bottom: null,
    centerX: null,
    centerY: null,
    width: null,
    height: null,
    bullsEyeX: null,
    bullsEyeY: null
};

let _sceneContainer = null;
// const _resizeHandle = document.getElementById("resize-handle");
// const _resumeColumn = document.getElementById("resume-column");
let _bullsEyeElement = null;
let _aimPointElement = null;

export function getSceneContainer() {
    return _sceneContainer;
}

export function initializeViewPort() {
    _sceneContainer = document.getElementById("scene-container");
    _bullsEyeElement = bullsEye.getBullsEyeElement();
    _aimPointElement = aimPoint.getAimPointElement();
}

export function initializeResizeHandle() {
    bullsEye.setBullsEyeCenter(0, 0);
    resizeHandle.setResizeHandleLeft(viewPortProperties.bullsEyeX);
}

export function viewPortIsInitialized() {
    return viewPortProperties.bullsEyeX != null && viewPortProperties.bullsEyeY != null;
}

export function getViewPortProperties() {
    return viewPortProperties;
}

/**
 * Updates the viewPortProperties geometry relative to the scene-plane container
 * and the resize handle and the bullsEye
 * @param {HTMLElement} sceneContainer - The scene-plane container element
 */
export function updateViewPort() {
    const sceneContainer = getSceneContainer();
    if ( (sceneContainer == null) || !isHTMLElement(sceneContainer) ) {
        throw new Error("sceneContainer is null ornot an HTMLElement");
    }

    const sceneContainerRect = sceneContainer.getBoundingClientRect();
    const sceneContainerWidth = sceneContainerRect.right - sceneContainerRect.left;
    const sceneContainerHeight = sceneContainerRect.bottom - sceneContainerRect.top;
    
    viewPortProperties.padding = VIEWPORT_PADDING;
    viewPortProperties.top = sceneContainerRect.top - viewPortProperties.padding;
    viewPortProperties.left = sceneContainerRect.left - viewPortProperties.padding;
    viewPortProperties.right = sceneContainerRect.right + viewPortProperties.padding;
    viewPortProperties.bottom = sceneContainerRect.bottom + viewPortProperties.padding;
    viewPortProperties.centerX = sceneContainerRect.left + sceneContainerWidth / 2;
    viewPortProperties.centerY = sceneContainerRect.top + sceneContainerHeight / 2;
    viewPortProperties.width = sceneContainerWidth;
    viewPortProperties.height = sceneContainerHeight;
    
    // Calculate bullsEye position as midpoint between window left edge (0) and resize handle center
    // If handle is at left edge (initial state), use window width / 2 as initial position
    const handleLeft = resizeHandle.getResizeHandleRect.left || window.innerWidth / 2;
    viewPortProperties.bullsEyeX = handleLeft / 2;

    // Update the bullsEye element position
    const bullsEyeElement = bullsEye.getBullsEyeElement();    
    if (bullsEyeElement) {
        bullsEye.setBullsEyeLeft(viewPortProperties.bullsEyeX);
        // Only update vertical position if it hasn't been set yet
        if (!viewPortProperties.bullsEyeY) {
            viewPortProperties.bullsEyeY = window.innerHeight / 2;
            bullsEyeElement.style.top = `${viewPortProperties.bullsEyeY}px`;
        }
    }
}

/**
 * Checks if a card div is within the viewPortProperties
 * @param {HTMLElement} cardDiv - The card div to check
 * @returns {boolean} True if the card div is within the viewPortProperties
 */
export function isCardDivWithinViewPort(cardDiv) {
    const rect = cardDiv.getBoundingClientRect();
    return (
        rect.right >= viewPortProperties.left &&
        rect.left <= viewPortProperties.right &&
        rect.bottom >= viewPortProperties.top &&
        rect.top <= viewPortProperties.bottom
    );
}

/**
 * Gets the current viewPortProperties state
 * @returns {Object} The current viewPortProperties state
 */
export function getViewPort() {
    if (!viewPortProperties.bullsEyeX || !viewPortProperties.bullsEyeY) {
        throw new Error("ViewPort not properly initialized");
    }
    return { ...viewPortProperties };
}

/**
 * Updates the percentage display based on viewPortProperties visibility
 * @param {HTMLElement} sceneContainer - The scene-plane container element
 */
export function updateScrollPercentage(sceneContainer) {
    const percentageDisplay = document.querySelector('.percentage-display');
    if (!percentageDisplay) return;


    const handleRect = resizeHandle.getResizeHandleRect();
    const windowWidth = window.innerWidth;
    
    // Calculate percentage (0% when handle is at far left, 100% when handle is at far right)
    const percentage = Math.round((handleRect.left / windowWidth) * 100);
    percentageDisplay.textContent = `${percentage}%`;
}

/**
 * Initializes the scrollbar controls
 * @param {HTMLElement} sceneContainer - The scene-plane container element
 */
export function initScrollbarControls(sceneContainer) {
    // Add scroll event listener to update percentage
    sceneContainer.addEventListener('scroll', () => {
        updateScrollPercentage(sceneContainer);
    });

    // Initial percentage update
    updateScrollPercentage(sceneContainer);
}

function checkFixtureParents() {
    if ( _bullsEyeElement.parentElement != _sceneContainer ) {
        throw new Error("bullsEyeParent is not the scene-plane container");
    }
    _bullsEyeElement['saved-parent'] = _sceneContainer;

    if ( _aimPointDotElement.parentElement != _sceneContainer ) {
        throw new Error("aimPointParent is not the scene-plane container");
    }
    _aimPointDotElement['saved-parent'] = _sceneContainer;

    if ( _focalPointElement.parentElement != _sceneContainer ) {
        throw new Error("focalPointParent is not the scene-plane container");
    }
    _focalPointElement['saved-parent'] = _sceneContainer;
}
