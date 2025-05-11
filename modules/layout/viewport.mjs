/**
 * Module for handling viewport calculations and updates
 */

// Constants
const VIEWPORT_PADDING = 20; // Padding around the viewport

// Viewport state
const viewport = {
    padding: VIEWPORT_PADDING,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    centerX: 0,
    centerY: 0,
    width: 0,
    height: 0,
    bullseyeX: 0,
    bullseyeY: 0
};

/**
 * Updates the viewport geometry relative to the canvas container
 * @param {HTMLElement} canvasContainer - The canvas container element
 */
export function updateViewport(canvasContainer) {
    const canvasContainerRect = canvasContainer.getBoundingClientRect();
    const canvasContainerWidth = canvasContainerRect.right - canvasContainerRect.left;
    const canvasContainerHeight = canvasContainerRect.bottom - canvasContainerRect.top;
    
    // Get the resize handle position
    const resizeHandle = document.getElementById('resize-handle');
    const handleRect = resizeHandle.getBoundingClientRect();
    
    viewport.padding = VIEWPORT_PADDING;
    viewport.top = canvasContainerRect.top - viewport.padding;
    viewport.left = canvasContainerRect.left - viewport.padding;
    viewport.right = canvasContainerRect.right + viewport.padding;
    viewport.bottom = canvasContainerRect.bottom + viewport.padding;
    viewport.centerX = canvasContainerRect.left + canvasContainerWidth / 2;
    viewport.centerY = canvasContainerRect.top + canvasContainerHeight / 2;
    viewport.width = canvasContainerWidth;
    viewport.height = canvasContainerHeight;
    
    // Calculate bullseye position as midpoint between window left edge (0) and resize handle center
    viewport.bullseyeX = handleRect.left / 2;

    // Update the bullseye element position
    const bullseye = document.getElementById('bulls-eye');
    if (bullseye) {
        bullseye.style.left = `${viewport.bullseyeX}px`;
        // Only update vertical position if it hasn't been set yet
        if (!viewport.bullseyeY) {
            viewport.bullseyeY = window.innerHeight / 2;
            bullseye.style.top = `${viewport.bullseyeY}px`;
        }
    }
}

/**
 * Updates the bullseye vertical position when window is resized
 */
export function updateBullseyeVerticalPosition() {
    const bullseye = document.getElementById('bulls-eye');
    if (bullseye) {
        viewport.bullseyeY = window.innerHeight / 2;
        bullseye.style.top = `${viewport.bullseyeY}px`;
    }
}

/**
 * Checks if a card div is within the viewport
 * @param {HTMLElement} cardDiv - The card div to check
 * @returns {boolean} True if the card div is within the viewport
 */
export function isCardDivWithinViewport(cardDiv) {
    const rect = cardDiv.getBoundingClientRect();
    return (
        rect.right >= viewport.left &&
        rect.left <= viewport.right &&
        rect.bottom >= viewport.top &&
        rect.top <= viewport.bottom
    );
}

/**
 * Gets all card divs that can be translated
 * @returns {HTMLElement[]} Array of card divs that can be translated
 */
export function getAllTranslateableCardDivs() {
    return [
        ...document.getElementsByClassName("skill-card-div"),
        ...document.getElementsByClassName("biz-card-div")
    ];
}

/**
 * Gets the current viewport state
 * @returns {Object} The current viewport state
 */
export function getViewport() {
    return { ...viewport };
}

/**
 * Updates the percentage display based on viewport visibility
 * @param {HTMLElement} canvasContainer - The canvas container element
 */
export function updateScrollPercentage(canvasContainer) {
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
 * @param {HTMLElement} canvasContainer - The canvas container element
 */
export function initScrollbarControls(canvasContainer) {
    // Add scroll event listener to update percentage
    canvasContainer.addEventListener('scroll', () => {
        updateScrollPercentage(canvasContainer);
    });

    // Initial percentage update
    updateScrollPercentage(canvasContainer);
}