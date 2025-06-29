///modules/core/aimPoint.mjs

import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewPort.mjs';

let _aimPointElement = null;
let _isInitialized = false;

export function initialize() {
    if (_isInitialized) {
        return;
    }

    _aimPointElement = document.getElementById("aim-point");
    if (!_aimPointElement) {
        throw new Error("aimPoint.initialize: #aim-point element not found in DOM");
    }

    const initialPosition = viewPort.getViewPortOrigin();
    if (initialPosition) {
        setAimPoint(initialPosition, "aimPoint.initialize");
        _isInitialized = true;
    } else {
        console.error("aimPoint.initialize: Could not get initial position from viewPort.");
    }

    // Add scroll/wheel pass-through handlers to aim-point
    _aimPointElement.addEventListener('wheel', handleScrollPassThrough, { passive: false });
    _aimPointElement.addEventListener('scroll', handleScrollPassThrough, { passive: false });
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
    // console.log(`setAimPointStatus: ${_aimPointStatus}`);
}
function getAimPointStatus() {
    return _aimPointStatus;
}

/**
 * set the aimPoint position which is viewPort-relative
 * @param {*} position 
 * @param {*} prefix 
 */
export function setAimPoint(position, prefix="") {
    if (position == null) throw new Error("setAimPoint: position is null");

    // skip move if move is too small
    const squaredDist = mathUtils.getPositionsSquaredDistance(position, _lastAimPointPosition);
    _lastAimPointPosition = position;
    if ( squaredDist < 0.25 ) { // 0.50 squared
        setAimPointStatus("PAUSED");
        return;
    } else {
        if ( getAimPointStatus() === "PAUSED" ) {
            setAimPointStatus("RUNNING");
        }
    }

    _aimPointElement.style.left = `${position.x}px`;
    _aimPointElement.style.top = `${position.y}px`;
    if (_aimPointElement.classList.contains('hidden')) {
        _aimPointElement.classList.remove('hidden');
    }
    if (prefix != "") {
        //console.log(`setAimPoint:${prefix}`, position);
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
        console.error('scene-container not found for scroll pass-through');
        return;
    }

    // For wheel events, manually apply the scroll
    if (event.type === 'wheel') {
        const delta = event.deltaY;
        sceneContainer.scrollTop += delta;
        // console.log('AimPoint passed wheel event to scene-container, delta:', delta);
    }

    // For scroll events, create and dispatch a new event
    if (event.type === 'scroll') {
        const newEvent = new Event('scroll', {
            bubbles: true,
            cancelable: true
        });
        sceneContainer.dispatchEvent(newEvent);
        // console.log('AimPoint passed scroll event to scene-container');
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



