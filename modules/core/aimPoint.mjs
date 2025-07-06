///modules/core/aimPoint.mjs

import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewPortModule.mjs';

let _aimPointElement = null;
let _aimPointPosition = null;
let _isInitialized = false;

/**
 * @returns {boolean} Whether the aim point is initialized.
 */
export function isInitialized() {
    return _isInitialized;
}

export function initialize() {
    if (_isInitialized) {
        return;
    }

    _aimPointElement = document.getElementById("aim-point");
    if (!_aimPointElement) {
        throw new Error("aimPoint.initialize: #aim-point element not found in DOM");
    }

    const initialPosition = getBullsEyePosition();
    if (initialPosition) {
        setAimPoint(initialPosition, "aimPoint.initialize");
        _isInitialized = true;
        window.CONSOLE_LOG_IGNORE("aimPoint initialized successfully");
    } else {
        window.CONSOLE_LOG_IGNORE("aimPoint.initialize: Could not get initial position from scene container.");
    }

    // Add scroll/wheel pass-through handlers to aim-point
    _aimPointElement.addEventListener('wheel', handleScrollPassThrough, { passive: false });
    _aimPointElement.addEventListener('scroll', handleScrollPassThrough, { passive: false });
    
    // Listen for layout changes to update aimPoint position
    window.addEventListener('layout-changed', () => {
        if (_isInitialized) {
            const newPosition = getBullsEyePosition();
            setAimPoint(newPosition, "aimPoint.layout-changed");
        }
    });
}

// Add scroll/wheel pass-through handlers to aim-point
// if (_aimPointElement) {
//     _aimPointElement.addEventListener('wheel', handleScrollPassThrough, { passive: false });
//     _aimPointElement.addEventListener('scroll', handleScrollPassThrough, { passive: false });
// }

let _lastAimPointPosition = { x:0, y:0 };
let _aimPointStatus = "";

function setAimPointStatus(new_status) {
    _aimPointStatus = new_status;
    window.CONSOLE_LOG_IGNORE(`setAimPointStatus: ${_aimPointStatus}`);
}
function getAimPointStatus() {
    return _aimPointStatus;
}

/**
 * Get the bullsEye position (which is the target for the aim-point)
 * @returns {object} The bullsEye position {x, y}
 */
function getBullsEyePosition() {
    // Import bullsEye dynamically to avoid circular dependencies
    const bullsEye = document.getElementById('bulls-eye');
    if (bullsEye) {
        const rect = bullsEye.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    // Fallback to viewport center
    return viewPort.getViewPortOrigin();
}

/**
 * set the aimPoint position which is scene container center
 * @param {*} position 
 * @param {*} prefix 
 */
export function setAimPoint(position, prefix="") {
    if (position == null) throw new Error("setAimPoint: position is null");

    // Use bullsEye position if position is the viewport center
    let targetPosition = position;
    if (position === viewPort.getViewPortOrigin()) {
        targetPosition = getBullsEyePosition();
    }

    // skip move if move is too small
    const squaredDist = mathUtils.getPositionsSquaredDistance(targetPosition, _lastAimPointPosition);
    _lastAimPointPosition = targetPosition;
    if ( squaredDist < 0.25 ) { // 0.50 squared
        setAimPointStatus("PAUSED");
        return;
    } else {
        if ( getAimPointStatus() === "PAUSED" ) {
            setAimPointStatus("RUNNING");
        }
    }

    _aimPointElement.style.left = `${targetPosition.x}px`;
    _aimPointElement.style.top = `${targetPosition.y}px`;
    if (_aimPointElement.classList.contains('hidden')) {
        _aimPointElement.classList.remove('hidden');
    }
    if (prefix != "") {
        //window.CONSOLE_LOG_IGNORE(`setAimPoint:${prefix}`, targetPosition);
    }
}

export function getAimPoint() {
    return {
        x: parseFloat(_aimPointElement.style.left), 
        y: parseFloat(_aimPointElement.style.top) 
    };
}


export function getAimPointElement() {
    if ( _aimPointElement == null ) {
        _aimPointElement = document.getElementById("aim-point");
    }
    return _aimPointElement;
}

/**
 * Handle scroll/wheel events and pass them through to scene-container
 * @param {Event} event - The scroll or wheel event
 */
function handleScrollPassThrough(event) {
    // Prevent the event from being handled by the aim point
    event.preventDefault();
    event.stopPropagation();

    // Get the scene-container element (the scrollable container)
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        window.CONSOLE_LOG_IGNORE('scene-container not found for scroll pass-through');
        return;
    }

    // For wheel events, manually apply the scroll
    if (event.type === 'wheel') {
        const delta = event.deltaY;
        sceneContainer.scrollTop += delta;
        window.CONSOLE_LOG_IGNORE('AimPoint passed wheel event to scene-container, delta:', delta);
    }

    // For scroll events, create and dispatch a new event
    if (event.type === 'scroll') {
        const newEvent = new Event('scroll', {
            bubbles: true,
            cancelable: true
        });
        sceneContainer.dispatchEvent(newEvent);
        window.CONSOLE_LOG_IGNORE('AimPoint passed scroll event to scene-container');
    }
}

// Generic helper function to check if pointer is in any container
function isPointerInContainer(container) {
    if (!container) return false;
    const rect = container.getBoundingClientRect();
    const lastPointerPosition = getAimPoint();
    if (!lastPointerPosition) return false;
    
    return (
        lastPointerPosition.x >= rect.left &&
        lastPointerPosition.x <= rect.right &&
        lastPointerPosition.y >= rect.top &&
        lastPointerPosition.y <= rect.bottom
    );
}



