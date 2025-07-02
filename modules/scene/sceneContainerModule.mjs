import * as viewPort from '../core/viewPortModule.mjs';

let _sceneContainer = null;
let _isInitialized = false;

/**
 * Initializes the scene container, gets the DOM element, and sets up event listeners.
 */
export function initialize() {
    if (_isInitialized) {
        console.warn("sceneContainer.initialize: already initialized");
        return;
    }
    _sceneContainer = document.getElementById('scene-container');
    if (!_sceneContainer) {
        throw new Error('Scene container element #scene-container not found');
    }

    _isInitialized = true;
    window.CONSOLE_LOG_IGNORE('Scene container initialized');
}

export function isInitialized() {
    return _isInitialized;
}

// called from updateResumeContainer
export function updateSceneContainer() {
    // viewPort updates interal properties and its chlldren
    // using the current sceneContainer.offsetWidth and resumeContainerw.offset
    viewPort.updateViewPort();
}

/**
 * Ensure the scene container and its children have proper pointer events
 * This is especially important when the focal point is locked
 */
export function ensurePointerEvents() {
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error("Scene container not found");
        return;
    }
    
    // Ensure scene container has pointer events
    if (sceneContainer.style.pointerEvents !== 'auto') {
        window.CONSOLE_LOG_IGNORE("Fixing scene container pointer-events");
        sceneContainer.style.pointerEvents = 'auto';
    }
    
    // Ensure all bizCardDivs have pointer events
    const bizCardDivs = sceneContainer.querySelectorAll('.biz-card-div');
    bizCardDivs.forEach(div => {
        if (div.style.pointerEvents !== 'auto') {
            window.CONSOLE_LOG_IGNORE(`Fixing pointer-events for ${div.id}`);
            div.style.pointerEvents = 'auto';
        }
    });
    
    window.CONSOLE_LOG_IGNORE("Scene container and bizCardDivs pointer events fixed");
}

/**
 * Ensures the gradient overlays are properly positioned within the scene container
 */
export function setupGradientOverlays() {
    const scenePlaneEl = document.getElementById('scene-plane');
    if (!scenePlaneEl) {
        console.error("setupGradientOverlays: scene-plane element not found");
        return;
    }

    let topGradient = document.getElementById('scene-plane-top-gradient');
    if (!topGradient) {
        topGradient = document.createElement('div');
        topGradient.id = 'scene-plane-top-gradient';
        scenePlaneEl.prepend(topGradient);
    }

    let btmGradient = document.getElementById('scene-plane-btm-gradient');
    if (!btmGradient) {
        btmGradient = document.createElement('div');
        btmGradient.id = 'scene-plane-btm-gradient';
        scenePlaneEl.prepend(btmGradient);
    }
}
