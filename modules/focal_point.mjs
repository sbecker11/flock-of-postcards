import * as utils from './utils.mjs';
import { Logger, LogLevel } from "./logger.mjs";
const logger = new Logger("focal_point", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);

class MouseDrag {
    _mouseDragStartPosition = null;
    _mouseDragEndPosition = null;

    constructor() {
    }

    setStartPosition(position) {
        this._mouseDragStartPosition = position;
    }

    setEndPosition(position) {
        this._mouseDragEndPosition = position;
    }

    getStartPosition() {
        return this._mouseDragStartPosition;
    }

    getEndPosition() {
        return this._mouseDragEndPosition;
    }

    reset() {
        this._mouseDragStartPosition = null;
        this._mouseDragEndPosition = null;
    }
}

const EASE_FACTOR = 0.15;
const EPSILON = EASE_FACTOR / 2.0;
const MAX_NEAR_DISTANCE = 0.5;

var _canvasContainer = document.getElementById("canvas-container")
var _focalPointElement = document.getElementById("focal-point");
var _aimPointDotElement = document.getElementById("aim-point-dot");
var _bullsEyeElement = document.getElementById("bulls-eye");
var _focalPointNowSubpixelPrecision;
var _aimPoint = null;
var _isEasingToAimPoint = false;
var _isEasingToBullsEye = false;
var _isAwake = true;
var _isDraggable = true;
var _isBeingDragged = false;
let _focalPointRadius = 0;
let _bullsEyeCenter = { x: 0, y: 0 };
const _mouseDrag = new MouseDrag();

let _status = "asleep";
let _lastStatus = "asleep";

let _isLockedToBullsEye = false;

function setStatus(new_status, prefix="") {
    _lastStatus = _status;
    _status = new_status;
    if ( _status != _lastStatus ) {
        prefix = `setStatus:${prefix}`;
        logger.log(prefix, _status);
    }
}

function getStatus() {
    return _status;
}



// on windwo load
export function handleOnWindowLoad() {
    logger.log("focalPoint handlingOnWindowLoad");

    // Compute initial bullsEye center
    updateBullsEyeCenter();

    startEasingToBullsEye("handleOnWindowLoad");
}


export function set_isBeingDragged_true(eventPosition) {
    _isBeingDragged = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    setAimPoint(eventPosition, "set_isBeingDragged_true");
    _mouseDrag.setStartPosition(eventPosition);
    logger.log("set _isBeingDragged:", _isBeingDragged, "eventPosition:", eventPosition);
}
export function set_isBeingDragged_false(eventPosition) {
    _isBeingDragged = false;
    _isEasingToAimPoint = false;  // Prevent animation from starting
    _isEasingToBullsEye = false;  // Prevent animation from starting
    setAimPoint(eventPosition, "set_isBeingDragged_false");
    _mouseDrag.setEndPosition(eventPosition);
    moveFocalPointTo(eventPosition);
    logger.log("set _isBeingDragged:", _isBeingDragged, "eventPosition:", eventPosition);
}

export function handleOnWindowResize() {
    updateBullsEyeCenter();
    startEasingToBullsEye("handleOnWindowResize");
}

// on window resize
function updateBullsEyeCenter() {
    const canvasContainerDiv = document.getElementById('canvas-container');
    if (!canvasContainerDiv) return;

    const canvasContainerWidth = canvasContainerDiv.offsetWidth;
    const canvasContainerHeight = canvasContainerDiv.offsetHeight;

    _bullsEyeCenter = {
        x: canvasContainerWidth / 2,
        y: canvasContainerHeight / 2
    };

    if ( !_bullsEyeElement ) {
        throw new Error("bulls-eye element not found");
    }
}

export function getBullsEye() {
    // Convert bulls-eye center to viewport coordinates
    const containerRect = _canvasContainer.getBoundingClientRect();
    return {
        x: containerRect.left + (_canvasContainer.offsetWidth / 2),
        y: containerRect.top + (_canvasContainer.offsetHeight / 2)
    };
}

export function getBullsEyeElement() {
    if ( _bullsEyeElement == null )
        return null;
    return _bullsEyeElement;
}


// Add a listener for window resize to update bullsEye center
window.addEventListener('resize', updateBullsEyeCenter);

export function getFocalPoint() {
    if ( !_focalPointElement ) {
        return null;
    }
    const rect = _focalPointElement.getBoundingClientRect();
    return {
        x: rect.left + (rect.width / 2),
        y: rect.top + (rect.height / 2)
    };
}

function getEventPosition(event) {
    // Always use viewport coordinates since FP is position: fixed
    return {
        x: event.clientX,
        y: event.clientY
    };
}

export function moveFocalPointTo(position, prefix="") {
    if (_isLockedToBullsEye && prefix !== "locked-to-bullseye") {
        return; // Don't move if locked to bulls-eye
    }
    
    // Use viewport coordinates directly
    _focalPointElement.style.left = `${position.x}px`;
    _focalPointElement.style.top = `${position.y}px`;

    notifyPositionListeners(position, prefix);
}

// -----------------------------------------------------
// save the caller's _canvasContainer and _focalPointElement.
//
export function createFocalPoint(focalPointElement) {
    if (!focalPointElement) {
        throw new Error("focalPointElement is null");
    }

    _focalPointElement = focalPointElement;
    _focalPointRadius = focalPointElement.getBoundingClientRect().width / 2.0;

    _focalPointNowSubpixelPrecision = getFocalPoint();
    _isAwake = true;
    _isEasingToBullsEye = false;
    
    // Always keep pointer-events none by default
    _focalPointElement.style.pointerEvents = 'none';
    if (_isDraggable) {
        _focalPointElement.classList.add('focal-point-is-draggable');
    }
    
    if (!_canvasContainer) {
        throw new Error("canvasContainer not initialized");
    }
    
    logger.log("Canvas container initialized:", {
        exists: !!_canvasContainer,
        width: _canvasContainer.offsetWidth,
        left: _canvasContainer.offsetLeft
    });

    updateBullsEyeCenter();
    checkFixtureParents();

    // Add canvas container event listeners
    _canvasContainer.addEventListener("mouseenter", onCanvasContainerEnter);
    _canvasContainer.addEventListener("mousemove", onCanvasContainerMove);
    _canvasContainer.addEventListener("mouseleave", onCanvasContainerLeave);

    // Add hover listeners to the focal-point element
    _focalPointElement.addEventListener('mouseenter', () => {
        if (_isDraggable) {
            _focalPointElement.classList.add('focal-point-is-draggable');
        }
    });
    
    _focalPointElement.addEventListener('mouseleave', () => {
        if (_isDraggable) {
            _focalPointElement.classList.remove('focal-point-is-draggable');
        }
    });

    // Add drag event listeners to the focal-point element
    _focalPointElement.addEventListener('mousedown', onMouseDown_startDraggingFocalPoint);

    setAimPoint(getBullsEye(), "createFocalPoint");
    moveFocalPointTo(getBullsEye(), "createFocalPoint");
}

const _focalPointPositionListeners = [];

function notifyPositionListeners(position, prefix="") {
    for (const listener of _focalPointPositionListeners) {
        listener(position, prefix);
    }
}

export function clearFocalPointPositionListeners() {
    _focalPointPositionListeners.length = 0;
}

export function addFocalPointPositionListener(listener) {
    if (typeof listener === "function") {
        _focalPointPositionListeners.push(listener);
    } else {
        throw new Error("Listener must be a function");
    }
}


function checkFixtureParents() {
    if ( _bullsEyeElement.parentElement != _canvasContainer ) {
        throw new Error("bullsEyeParent is not the canvas container");
    }
    _bullsEyeElement['saved-parent'] = _canvasContainer;

    if ( _aimPointDotElement.parentElement != _canvasContainer ) {
        throw new Error("aimPointParent is not the canvas container");
    }
    _aimPointDotElement['saved-parent'] = _canvasContainer;

    if ( _focalPointElement.parentElement != _canvasContainer ) {
        throw new Error("focalPointParent is not the canvas container");
    }
    _focalPointElement['saved-parent'] = _canvasContainer;
}


function onCanvasContainerEnter(event) {
    const eventPosition = getEventPosition(event);
    setStatus("startEasingToAimPoint", "onCanvasContainerEnter", LogLevel.LOG);
    awaken(eventPosition);
    startEasingToAimPoint("onCanvasContainerEnter");
}

function onCanvasContainerMove(event) {
    const eventPosition = getEventPosition(event);
    setAimPoint(eventPosition, "onCanvasContainerMove");
}

function onCanvasContainerLeave(event) {
    const eventPosition = getEventPosition(event);
    setStatus("leaveContainer", "onCanvasContainerLeave", LogLevel.LOG);        
    startEasingToBullsEye("onCanvasContainerLeave");
}

// unless being dragged by mouse
export function startEasingToAimPoint(prefix="") {
    if ( _isBeingDragged ) {
        logger.log(prefix, "startEasingToAimPoint ignored while _isBeingDragged");
        return;
    }
    setStatus("easingToAimPoint", `startEasingToAimPoint:${prefix}`, LogLevel.LOG);

    // setAimPoint( position, `startEasingToAimPoint:${prefix}`);
    _isEasingToAimPoint = true;
    _isEasingToBullsEye = false;
    _isAwake = true;
}


// unless being dragged by mouse
export function startEasingToBullsEye(prefix="") {
    if (_isBeingDragged) {
        logger.log("startEasingToBullsEye ignored while _isBeingDragged");
        return;
    }

    setAimPoint(getBullsEye(), `startEasingToBullsEye:${prefix}`);
    _isEasingToAimPoint = true;
    _isEasingToBullsEye = true;
    _isAwake = true;

    setStatus("easingToBullsEye", `startEasingToBullsEye:${prefix}`);
}

export function setAimPoint(position, prefix="") {
    _aimPoint = position;
    // Use viewport coordinates for aim point dot too
    _aimPointDotElement.style.left = `${position.x}px`;
    _aimPointDotElement.style.top = `${position.y}px`;
    if (_aimPointDotElement.classList.contains('hidden')) {
        _aimPointDotElement.classList.remove('hidden');
    }
    if (prefix != "") {
        logger.info(`setAimPoint:${prefix}`, position);
    }
}

export function clearAimPoint(prefix="") {
    _aimPoint = null;
    _aimPointDotElement.classList.add('hidden');
    logger.log(`clearAimPoint:${prefix}`);
}

export function isAimPointNull() {
    return _aimPoint == null;
}

export function getAimPoint() {
    return _aimPoint;
}

export function handleArrivedAtBullsEye(eventPosition) {
    setStatus("arrivedAtBullsEye", "handleArrivedAtBullsEye", LogLevel.LOG);
    goToSleep(eventPosition);
}

export function goToSleep(position) {
    utils.removeClass(_focalPointElement, "awake");
    _isAwake = false;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;

    setStatus("asleep", "goToSleep", LogLevel.LOG);
}

export function awaken(position) {
    utils.addClass(_focalPointElement, "awake");
    _isAwake = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;

    setStatus("awake", "awaken", LogLevel.LOG);
}

export function isDraggable() {
    return _isDraggable;
}

function handleArrivedAtAimPoint(position) {
    setStatus("arrivedAtAimPoint", "handleArrivedAtAimPoint");
}

function getPositionsDist(pos1, pos2) {
    try {
        return utils.max(utils.abs_diff(pos1.x,pos2.x), utils.abs_diff(pos1.y,pos2.y));
    } catch (e) {
        logger.error("getPositionsDist error:", e);
        return 1000;
    }
}

// unless being dragged by mouse
export function drawFocalPointAnimationFrame() {
    if (_isBeingDragged) {
        return;
    }

    const currentPos = getFocalPoint();
    const aimPos = getAimPoint();
    const dist = getPositionsDist(currentPos, aimPos);

    // logger.info("Animation frame:", {
    //     currentPos,
    //     aimPos,
    //     dist,
    //     isEasingToBullsEye: _isEasingToBullsEye,
    //     isEasingToAimPoint: _isEasingToAimPoint
    // });

    if (dist <= MAX_NEAR_DISTANCE) {
        if (_isEasingToBullsEye) {
            handleArrivedAtBullsEye(currentPos);
            return;
        } else {
            handleArrivedAtAimPoint(aimPos);
            return
        }
    } 
  
    _focalPointNowSubpixelPrecision = computeAStepCloserToAimSubpixelPrecision(
        _focalPointNowSubpixelPrecision,
        aimPos,
        EASE_FACTOR,
        EPSILON
    );

    if (_focalPointNowSubpixelPrecision != null) {
        const newPos = {
            x: Math.round(_focalPointNowSubpixelPrecision.x),
            y: Math.round(_focalPointNowSubpixelPrecision.y)
        };
        //logger.info("Moving to new position:", newPos);
        moveFocalPointTo(newPos);
    }
}

function computeAStepCloserToAimSubpixelPrecision(nowPoint, aimPoint, ease_factor, epsilon) {
    if ( (aimPoint == null) || (nowPoint == null) )
        return null;
    // compute velocities
    let vx = (aimPoint.x - nowPoint.x) * ease_factor;
    let vy = (aimPoint.y - nowPoint.y) * ease_factor;

    // for very small values of vx and vy, move there directly
    if (Math.abs(vx) < epsilon && Math.abs(vy) < epsilon) {
        return aimPoint;
    }

    return {
        x: nowPoint.x + vx,
        y: nowPoint.y + vy,
    };
}

export function toggleDraggable() {
    _isDraggable = !_isDraggable;
    if (_isDraggable) {
        _focalPointElement.classList.add('focal-point-is-draggable');
        // Enable pointer events when draggable
        _focalPointElement.style.pointerEvents = 'all';
    } else {
        _focalPointElement.classList.remove('focal-point-is-draggable');
        // Disable pointer events when not draggable
        _focalPointElement.style.pointerEvents = 'none';
    }
    logger.info(`toggleDraggable: ${_isDraggable}`);
}

// if focalPoint isDraggable and click on focalPoint then start dragging it
function onMouseDown_startDraggingFocalPoint(event) {
    if (!_isDraggable) {
        return;
    }
    const eventPosition = getEventPosition(event);
    event.preventDefault(); // prevent default browser behavior
    event.stopPropagation(); // Stop the event from reaching the canvas

    // Update subpixel precision to match current position
    _focalPointNowSubpixelPrecision = eventPosition;
    
    set_isBeingDragged_true(eventPosition);
    moveFocalPointTo(eventPosition);

    // Don't disable pointer events on canvas container to allow scrolling
    document.body.style.userSelect = 'none';
    _focalPointElement.classList.add('focal-point-is-being-dragged');
    // Ensure pointer events stay enabled during drag
    _focalPointElement.style.pointerEvents = 'all';

    utils.updateEventListener(document, 'mousemove', onMouseDrag_keepDraggingFocalPoint);
    utils.updateEventListener(document, 'mouseup', onMouseUp_stopDraggingFocalPoint, { once: true });
}

function onMouseDrag_keepDraggingFocalPoint(event) {
    if (!_isDraggable || !_isBeingDragged) {
        return;
    }
    const eventPosition = getEventPosition(event);
    
    // Keep subpixel precision in sync during drag
    _focalPointNowSubpixelPrecision = eventPosition;
    
    moveFocalPointTo(eventPosition);
    setAimPoint(eventPosition, "onMouseDrag_keepDraggingFocalPoint");
}

function onMouseUp_stopDraggingFocalPoint(event, prefix="") {
    if (!_isDraggable) {
        return;
    }
    
    const eventPosition = getEventPosition(event);
    
    // Move to final position first
    moveFocalPointTo(eventPosition);
    setAimPoint(eventPosition, "onMouseUp_stopDraggingFocalPoint");
    _focalPointNowSubpixelPrecision = eventPosition;  // Update subpixel position
    
    set_isBeingDragged_false(eventPosition);

    // Cleanup
    _focalPointElement.style.pointerEvents = 'all';  // Keep pointer events enabled if still draggable
    document.body.style.userSelect = 'auto';
    _focalPointElement.classList.remove('focal-point-is-being-dragged');

    utils.updateEventListener(document, 'mousemove', onMouseDrag_keepDraggingFocalPoint, { remove: true });
}

export function handleKeyDown(event) {
    if (event.key === 'b') {
        _isLockedToBullsEye = !_isLockedToBullsEye;
        if (_isLockedToBullsEye) {
            // Move to bulls-eye and stay there
            moveFocalPointTo(getBullsEye(), "locked-to-bullseye");
            // Disable dragging while locked
            if (_isDraggable) {
                toggleDraggable();
            }
        } else {
            // Re-enable dragging when unlocked
            if (!_isDraggable) {
                toggleDraggable();
            }
        }
        event.preventDefault();
    }
}

// Draw on window load
window.addEventListener('load', handleOnWindowLoad);

// Draw on window resize
window.addEventListener('resize', handleOnWindowResize);
