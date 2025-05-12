/**
 * Module for handling viewPortProperties calculations and updates
 */

import { isHTMLElement } from '../utils/domUtils.mjs';

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

export function createViewPort(sceneContainer) {
    updateViewPort(sceneContainer);
}

export function viewPortIsInitialized() {
    return viewPortProperties.bullsEyeX != null && viewPortProperties.bullsEyeY != null;
}

export function getViewPortProperties() {
    return viewPortProperties;
}

/**
 * Updates the viewPortProperties geometry relative to the scene-div container
 * and the resize handle and the bullsEye
 * @param {HTMLElement} sceneContainer - The scene-div container element
 */
export function updateViewPort(sceneContainer) {
    if ( (sceneContainer == null) || !isHTMLElement(sceneContainer) ) {
        throw new Error("sceneContainer is null ornot an HTMLElement");
    }

    const sceneContainerRect = sceneContainer.getBoundingClientRect();
    const sceneContainerWidth = sceneContainerRect.right - sceneContainerRect.left;
    const sceneContainerHeight = sceneContainerRect.bottom - sceneContainerRect.top;
    
    // Get the resize handle position
    const resizeHandle = document.getElementById('resize-handle');
    const handleRect = resizeHandle.getBoundingClientRect();
    
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
    const handleLeft = handleRect.left || window.innerWidth / 2;
    viewPortProperties.bullsEyeX = handleLeft / 2;

    // Update the bullsEye element position
    const bullsEye = document.getElementById('bulls-eye');
    if (bullsEye) {
        bullsEye.style.left = `${viewPortProperties.bullsEyeX}px`;
        // Only update vertical position if it hasn't been set yet
        if (!viewPortProperties.bullsEyeY) {
            viewPortProperties.bullsEyeY = window.innerHeight / 2;
            bullsEye.style.top = `${viewPortProperties.bullsEyeY}px`;
        }
    }
}

/**
 * Updates the bullsEye vertical position when window is resized
 */
export function updateBullsEyeVerticalPosition() {
    const bullsEye = document.getElementById('bulls-eye');
    if (bullsEye) {
        viewPortProperties.bullsEyeY = window.innerHeight / 2;
        bullsEye.style.top = `${viewPortProperties.bullsEyeY}px`;
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

export function getBullsEyeCenterX() {
    if ( !viewPortIsInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    return viewPortProperties.centerX;
}

/**
 * Updates the percentage display based on viewPortProperties visibility
 * @param {HTMLElement} sceneContainer - The scene-div container element
 */
export function updateScrollPercentage(sceneContainer) {
    const percentageDisplay = document.querySelector('.percentage-display');
    if (!percentageDisplay) return;

    const resizeHandle = document.getElementById('resize-handle');
    if (!resizeHandle) return;

    const handleRect = resizeHandle.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    
    // Calculate percentage (0% when handle is at far left, 100% when handle is at far right)
    const percentage = Math.round((handleRect.left / windowWidth) * 100);
    percentageDisplay.textContent = `${percentage}%`;
}

/**
 * Initializes the scrollbar controls
 * @param {HTMLElement} sceneContainer - The scene-div container element
 */
export function initScrollbarControls(sceneContainer) {
    // Add scroll event listener to update percentage
    sceneContainer.addEventListener('scroll', () => {
        updateScrollPercentage(sceneContainer);
    });

    // Initial percentage update
    updateScrollPercentage(sceneContainer);
}