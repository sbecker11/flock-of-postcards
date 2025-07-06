// modules/core/bullsEye.mjs
// Centralized bullsEye functionality for use by composables

let _bullsEyeElement = null;
let _isInitialized = false;

/**
 * Initialize the bullsEye system
 */
export function initialize() {
    if (_isInitialized) {
        window.CONSOLE_LOG_IGNORE("bullsEye.initialize: already initialized, ignoring duplicate initialization request");
        return;
    }

    _bullsEyeElement = document.getElementById('bulls-eye');
    if (!_bullsEyeElement) {
        throw new Error("bullsEye.initialize: #bulls-eye element not found in DOM");
    }

    window.CONSOLE_LOG_IGNORE('BullsEye: Element found, setting up centering...');

    // Clear any conflicting inline styles first
    _bullsEyeElement.style.removeProperty('top');
    _bullsEyeElement.style.removeProperty('left');
    _bullsEyeElement.style.removeProperty('transform');

    // Position relative to scene container
    const sceneContainerForInit = document.getElementById('scene-container');
    if (sceneContainerForInit) {
        const sceneRect = sceneContainerForInit.getBoundingClientRect();
        _bullsEyeElement.style.position = 'fixed';
        _bullsEyeElement.style.left = `${sceneRect.left + sceneRect.width / 2}px`;
        _bullsEyeElement.style.top = `${sceneRect.top + sceneRect.height / 2}px`;
        _bullsEyeElement.style.transform = 'translate(-50%, -50%)';
        _bullsEyeElement.style.zIndex = '1000';
    } else {
        // Fallback to window centering
        _bullsEyeElement.style.position = 'fixed';
        _bullsEyeElement.style.top = '50%';
        _bullsEyeElement.style.left = '50%';
        _bullsEyeElement.style.transform = 'translate(-50%, -50%)';
        _bullsEyeElement.style.zIndex = '1000';
    }

    // Force a layout recalculation
    void _bullsEyeElement.offsetHeight;

    // Verify the positioning worked
    const rect = _bullsEyeElement.getBoundingClientRect();
    const sceneContainer = document.getElementById('scene-container');
    let referenceCenter;
    
    if (sceneContainer) {
        const sceneRect = sceneContainer.getBoundingClientRect();
        referenceCenter = {
            x: sceneRect.left + sceneRect.width / 2,
            y: sceneRect.top + sceneRect.height / 2
        };
    } else {
        referenceCenter = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    }
    
    const bullsEyeCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    
    window.CONSOLE_LOG_IGNORE('BullsEye: Scene center:', referenceCenter);
    window.CONSOLE_LOG_IGNORE('BullsEye: BullsEye center:', bullsEyeCenter);
    const distance = Math.sqrt(
        Math.pow(bullsEyeCenter.x - referenceCenter.x, 2) + 
        Math.pow(bullsEyeCenter.y - referenceCenter.y, 2)
    );
    window.CONSOLE_LOG_IGNORE('BullsEye: Distance from scene center:', distance.toFixed(2) + 'px');

    // Add resize listener for recentering
    window.addEventListener('resize', recenterBullsEye);

    _isInitialized = true;
    window.CONSOLE_LOG_IGNORE('BullsEye initialized successfully');
}

/**
 * Get the current bullsEye position
 * @returns {object} The bullsEye position {x, y}
 */
export function getBullsEye() {
    if (!_isInitialized || !_bullsEyeElement) {
        window.CONSOLE_LOG_IGNORE('BullsEye not initialized, returning scene center');
        // Get scene container for scene-relative positioning
        const sceneContainer = document.getElementById('scene-container');
        if (sceneContainer) {
            const sceneRect = sceneContainer.getBoundingClientRect();
            return {
                x: sceneRect.left + sceneRect.width / 2,
                y: sceneRect.top + sceneRect.height / 2
            };
        }
        // Fallback to window center
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    }

    const rect = _bullsEyeElement.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

/**
 * Recenter the bullsEye element
 */
export function recenterBullsEye() {
    if (!_isInitialized || !_bullsEyeElement) {
        window.CONSOLE_LOG_IGNORE('BullsEye: Cannot recenter - not initialized or element not found');
        return;
    }

    window.CONSOLE_LOG_IGNORE('BullsEye: Recentering...');

    // Clear any inline styles that might interfere with CSS centering
    _bullsEyeElement.style.removeProperty('top');
    _bullsEyeElement.style.removeProperty('left');
    _bullsEyeElement.style.removeProperty('transform');

    // Re-position relative to scene container
    const sceneContainerForRecenter = document.getElementById('scene-container');
    if (sceneContainerForRecenter) {
        const sceneRect = sceneContainerForRecenter.getBoundingClientRect();
        _bullsEyeElement.style.position = 'fixed';
        _bullsEyeElement.style.left = `${sceneRect.left + sceneRect.width / 2}px`;
        _bullsEyeElement.style.top = `${sceneRect.top + sceneRect.height / 2}px`;
        _bullsEyeElement.style.transform = 'translate(-50%, -50%)';
    } else {
        // Fallback to window centering
        _bullsEyeElement.style.position = 'fixed';
        _bullsEyeElement.style.top = '50%';
        _bullsEyeElement.style.left = '50%';
        _bullsEyeElement.style.transform = 'translate(-50%, -50%)';
    }

    // Force a layout recalculation
    void _bullsEyeElement.offsetHeight;

    // Verify the recentering worked
    const rect = _bullsEyeElement.getBoundingClientRect();
    const sceneContainer = document.getElementById('scene-container');
    let referenceCenter;
    
    if (sceneContainer) {
        const sceneRect = sceneContainer.getBoundingClientRect();
        referenceCenter = {
            x: sceneRect.left + sceneRect.width / 2,
            y: sceneRect.top + sceneRect.height / 2
        };
    } else {
        referenceCenter = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    }
    
    const bullsEyeCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    
    const distance = Math.sqrt(
        Math.pow(bullsEyeCenter.x - referenceCenter.x, 2) + 
        Math.pow(bullsEyeCenter.y - referenceCenter.y, 2)
    );
    
    window.CONSOLE_LOG_IGNORE('BullsEye: Recentered - distance from scene center:', distance.toFixed(2) + 'px');
}

/**
 * Check if bullsEye is initialized
 * @returns {boolean} Whether bullsEye is initialized
 */
export function isInitialized() {
    return _isInitialized;
}

/**
 * Get the bullsEye DOM element
 * @returns {HTMLElement|null} The bullsEye element
 */
export function getBullsEyeElement() {
    return _bullsEyeElement;
}

/**
 * Clean up bullsEye system
 */
export function cleanup() {
    if (_isInitialized) {
        window.removeEventListener('resize', recenterBullsEye);
        _bullsEyeElement = null;
        _isInitialized = false;
    }
} 