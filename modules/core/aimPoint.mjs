///modules/core/aimPoint.mjs

import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("aimPoint", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);

const _aimPointElement = document.getElementById("aim-point");

export function setAimPoint(position, prefix="") {
    if (position == null) throw new Error("setAimPoint: position is null");
    _aimPointElement.style.left = `${position.x}px`;
    _aimPointElement.style.top = `${position.y}px`;
    if (_aimPointElement.classList.contains('hidden')) {
        _aimPointElement.classList.remove('hidden');
    }
    if (prefix != "") {
        logger.log(`setAimPoint:${prefix}`, position);
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

// Define the aim point modes
const AimPointMode = {
    RETURN_TO_BULLS_EYE: 'returnToBullsEye',
    ALWAYS_FOLLOW_POINTER: 'alwaysFollowPointer'
};

// Add configuration for aim point mode
let _aimPointMode = AimPointMode.RETURN_TO_BULLS_EYE; // Default mode

export function toggleAimPointMode() {
    const newMode = _aimPointMode === AimPointMode.RETURN_TO_BULLS_EYE 
        ? AimPointMode.ALWAYS_FOLLOW_POINTER 
        : AimPointMode.RETURN_TO_BULLS_EYE;
    setAimPointMode(newMode);
}

// Add setter/getter for the mode
export function setAimPointMode(mode) {
    if (!Object.values(AimPointMode).includes(mode)) {
        logger.error(`Invalid aim point mode: ${mode}`);
        return;
    }
    _aimPointMode = mode;
    logger.info(`AimPoint mode: ${mode}`);
    saveState();
}

export function getAimPointMode() {
    return _aimPointMode;
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

// Modify the document mouse move handler to respect the mode
function onDocumentMouseMove(event) {
    const eventPosition = getEventPosition(event);
    if (_aimPointMode === AimPointMode.ALWAYS_FOLLOW_POINTER || isPointerInContainer(_sceneContainer)) {
        setAimPoint(eventPosition, "onDocumentMouseMove");
    }
}

