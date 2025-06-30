// modules/focalPoint.mjs

import * as domUtils from '../utils/domUtils.mjs';
import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewPort.mjs';
import * as bullsEye from './bullsEye.mjs';
import * as aimPoint from './aimPoint.mjs';
import * as eventBus from '../core/eventBus.mjs';
import { AppState, saveState } from './stateManager.mjs';

/**
 * class to manage the mouse drag state
 */
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

const FOCAL_POINT_MODES = {
    LOCKED: 'locked',
    FOLLOWING: 'following',
    DRAGGING: 'dragging',
}

const FOCAL_POINT_STATE = {
    ASLEEP: "asleep",
    AWAKE: "awake",
    FOLLOWING: "following",
    EASING_TO_AIM_POINT: "easingToAimPoint",
    EASING_TO_BULLS_EYE: "easingToBullsEye",
    ARRIVED_AT_AIM_POINT: "arrivedAtAimPoint",
    ARRIVED_AT_BULLS_EYE: "arrivedAtBullsEye",
    LOCKED_TO_BULLS_EYE: "lockedToBullsEye",
    BEING_DRAGGED: "beingDragged",
    PAUSED: "paused",
    RUNNING: "running"
};

const EASE_FACTOR = 0.05;
const EPSILON = EASE_FACTOR / 2.0;
const MAX_NEAR_DISTANCE = 0.1;
const FLICKER_GUARD_MS = 100; // a 10th of a second

const FOCALPOINT_EPSILON = 1.0;
const SCENERECT_EPSILON = 1.0;
const SUBPIXEL_THRESHOLD = 50; // pixels
const MOVEMENT_THRESHOLD = 20; // Pixels to prevent cursor flicker

let _isInitialized = false;
var _isSceneRectInitialized = false;
var _sceneContainer = null;
var _focalPointElement = null;
var _focalPointNowSubpixelPrecision = { x: 0, y: 0 };
var _isEasingToAimPoint = false;
var _isEasingToBullsEye = false;
var _isAwake = false;
var _isDraggable = false;
var _isBeingDragged = false;
let _focalPointRadius = 0;
const _mouseDrag = new MouseDrag();
let _resizeObserver = null;
let _frameCounter = 0; // For temporary animation debugging

let _status = "asleep";
let _lastStatus = "asleep";

let _mode = FOCAL_POINT_MODES.LOCKED;

let _isLockedToBullsEye = true;
let _userInitiatedUnlock = false;
let _isIgnoringFlicker = false;

let _lastFocalPoint = null;
let _lastSceneRect = null;
let arrivalPoint = null; // Store position at arrival to prevent flicker

/**
 * sets the focalPoint's status
 * @param {*} new_status 
 * @param {*} prefix 
 */
function setStatus(new_status, prefix="") {
    _lastStatus = _status;
    _status = new_status;
    if ( _status !== _lastStatus ) {
        prefix = `setStatus:${prefix}`;
        //CONSOLE_INFO_IGNORE(prefix, _status);
    }
}

export function getStatus() {
    return _status;
}

/**
 * external function to set _isBeingDragged to true
 * @param {*} eventPosition 
 */
export function set_isBeingDragged_true(eventPosition) {
    // Only allow dragging if draggable
    if (!_isDraggable) {
        // CONSOLE_LOG_IGNORE("Cannot start dragging - focal point is not draggable");
        return;
    }
    
    _isBeingDragged = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    
    // Temporarily disable draggable while being dragged
    // This ensures we can't be both draggable and being dragged
    updateFocalPointClasses();
    
    aimPoint.setAimPoint(eventPosition, "set_isBeingDragged_true");
    _mouseDrag.setStartPosition(eventPosition);
    setStatus(FOCAL_POINT_STATE.BEING_DRAGGED, "set_isBeingDragged_true");
    //CONSOLE_LOG_IGNORE("set _isBeingDragged:", _isBeingDragged, "eventPosition:", eventPosition);
}

/**
 * external function to set _isBeingDragged to false
 * @param {*} eventPosition 
 */
export function set_isBeingDragged_false(eventPosition) {
    _isBeingDragged = false;
    _isEasingToAimPoint = false;  // Prevent animation from starting
    _isEasingToBullsEye = false;  // Prevent animation from starting
    
    // Restore draggable state if it was previously draggable
    updateFocalPointClasses();
    
    aimPoint.setAimPoint(eventPosition, "set_isBeingDragged_false");
    _mouseDrag.setEndPosition(eventPosition);
    moveFocalPointTo(eventPosition, 'not-being-dragged');
    //CONSOLE_LOG_IGNORE("set _isBeingDragged:", _isBeingDragged, "eventPosition:", eventPosition);
}


/**
 * called on window resize
 */
export function handleOnWindowResize() {
    //CONSOLE_LOG_IGNORE("focalPoint handlingOnWindowLoad");
   startEasingToBullsEye("handleOnWindowResize");
}

/**
 * @returns the current viewPort-relative position of the focalPoint center
 */
export function getFocalPoint() {
    if ( !isInitialized() ) {
        return null;
    }
    const rect = _focalPointElement.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

export function getSceneRect() {
    const vpRect = viewPort.getViewPortRect();
    const scrollTop = _sceneContainer.scrollTop;

    return {
        left: vpRect.left,
        top: vpRect.top + scrollTop,
        right: vpRect.right,
        bottom: vpRect.bottom + scrollTop
    };
}

/**
 * used to extract the viewPort-relative position from an event
 * @param {} event 
 * @returns an object with x and y properties
 */
function getEventPosition(event) {
    // Always use viewPort coordinates since FP is position: fixed
    return {
        x: event.clientX,
        y: event.clientY
    };
}

/**
 * External function et the focalPoint viewPort-relative center
 * @param {*} position new viewPort-relative position of focalPoint center
 * @param {*} prefix - used for verbosity
 * @returns 
 */
let _lastPosition = { x:0, y:0 };

/**
 * Move the focal point to a specific position
 * @param {Object} position - The position to move to
 * @param {string} prefix - Source of the move for logging
 */
export function moveFocalPointTo(position, prefix="") {
    // This function now only handles the physical move.
    // All guards and state logic are handled by the callers (animate loop, event handlers).
    
    // calculate distance moved since last call
    const squaredDist = mathUtils.getPositionsSquaredDistance(position, _lastPosition);
    _lastPosition = position;

    // skip move if move is too small
    if (squaredDist < 0.01) { // 0.1 squared - a very small threshold
        const finalDistance = mathUtils.getPositionsEuclideanDistance(getFocalPoint(), aimPoint.getAimPoint());
        // CONSOLE_LOG_IGNORE(`FocalPoint stopped. Final distance to AimPoint: ${finalDistance.toFixed(4)}`);
        
        // If we've stopped, we've "arrived". This is where it becomes grabbable.
        setStatus(FOCAL_POINT_STATE.ARRIVED_AT_AIM_POINT, "moveFocalPointTo-stopped");
        updateFocalPointClasses();

        return; 
    } else {
        if (getStatus() === "PAUSED") {
            setStatus("RUNNING");
        }
    }
    
    // Set the left/top properties to the target *center*.
    // The CSS `transform: translate(-50%, -50%)` will handle the actual centering.
    _focalPointElement.style.left = `${position.x}px`;
    _focalPointElement.style.top = `${position.y}px`;

    notifyPositionListeners("moveFocalPointTo");
}

/**
 * @returns {boolean} Whether the focal point is initialized.
 */
export function isInitialized() {
    return _isInitialized;
}

/**
 * Initializes the focal point element and its listeners.
 */
export function initialize() {
    if (_isInitialized) {
        // CONSOLE_LOG_IGNORE("Focal point already initialized");
        return;
    }

    _focalPointElement = document.getElementById('focal-point');
    if (!_focalPointElement) {
        throw new Error("Focal point element #focal-point not found");
    }
    
    // The old initializeState() is no longer needed here, as state is managed centrally.
    setupMouseListeners();
    initializeSceneRect();
    updateLockIcon();
    
    _isInitialized = true;
    // CONSOLE_LOG_IGNORE("Focal point initialized");

    // Initialize mode from the global AppState
    setMode(AppState.focalPoint.mode, true); // Pass true to prevent saving on init
    
    // This logic ensures the focal point starts visually in the correct state without animation
    if (_mode === FOCAL_POINT_MODES.LOCKED) {
        moveFocalPointTo(bullsEye.getBullsEye(), 'initialize-snap-to-lock');
    }
    startFocalPointAnimation("initialization"); // Start animation loop
}

export function isSceneRectInitialized() {
    return _isSceneRectInitialized;
}

function initializeSceneRect() {
    if ( _isSceneRectInitialized ) {
        // CONSOLE_INFO_IGNORE("focalPoint ignoring duplicate sceneRect initialization request");
        return;
    }
    _isSceneRectInitialized = true;

    _sceneContainer = document.getElementById("scene-container");
    if (!_sceneContainer) {
        throw new Error("sceneContainer not initialized");
    }

    // Add scroll event listener to scene container
    _sceneContainer.addEventListener('scroll', function(event) {
        scrollTopUpdated(_sceneContainer.scrollTop);
    });
    
    // Clean up resize observer
    if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
    }
    
    initializeResizeObserver();

    window.addEventListener('resize', () => handleViewPortChange("window-resize"));

    // Add scene-plane container event listeners
    _sceneContainer.addEventListener("mouseenter", onsceneContainerEnter);
    _sceneContainer.addEventListener("mousemove", onSceneContainerMove);
    _sceneContainer.addEventListener("mouseleave", onSceneContainerLeave)
}

/**
 * internal list of listeners
 */
const _focalPointOnlyListeners = [];
const _focalPointAndSceneRectListeners = [];

/**
 * Detects change of focalPoint
 * @returns true if position has sufficient motion
 */
function focalPointChanged() {
    const focalPoint = getFocalPoint();
    if (!focalPoint) {
        console.warn("focalPointChanged: getFocalPoint returned null");
        return false;
    }
    
    utils.validatePosition(focalPoint);
    let moved = false;
    var dist = 10000;
    
    if (_lastFocalPoint !== null) {
        try {
            dist = mathUtils.getPositionsSquaredDistance(focalPoint, _lastFocalPoint);
        } catch (e) {
            console.error("Error calculating distance:", e);
            _lastFocalPoint = null;
            return true; // Force update
        }
    } else {
        moved = true;
        _lastFocalPoint = focalPoint;
        return moved;
    }
    
    if (dist >= FOCALPOINT_EPSILON) {
        moved = true;
        _lastFocalPoint = focalPoint;
    }
    
    return moved;
}

/**
 * Detects change of sceneRect
 * @returns true if position has sufficient motion
 */
function sceneRectChanged() {
    const sceneRect = getSceneRect();
    utils.validateRect(sceneRect);
    let moved = false;
    var diff = 10000;
    if ( _lastSceneRect !== null ) {
        diff = mathUtils.getRectSquaredDifference(sceneRect,_lastSceneRect);
    }
    if ( diff > SCENERECT_EPSILON ) {
        moved = true;
        _lastSceneRect = sceneRect;
    }
    return moved;
}

/**
 * Notify listeners that only the focalPoint has moved
 * @param {position} focalPoint - viewPort-relative position of focalPoint
 * @param {string} prefix - optional prefix for verbosity
 */
function notifyFocalPointOnlyListeners(focalPoint, prefix="") {
    if (!isInitialized()) {
        console.warn("notifyFocalPointOnlyListeners: System not initialized");
        return;
    }
    utils.validatePosition(focalPoint);
    for (const listener of _focalPointOnlyListeners) {
        try {
            listener(focalPoint, prefix);
        } catch (e) {
            console.error("focalPoint.notifyFocalPointOnlyListeners:", e);
        }
    }
}

/**
 * Notify listeners that the focalPoint or the sceneRect has moved
 * and both have been initialized
 * @param {position} focalPoint - viewPort-relative position of focalPoint
 * @param {string} prefix - optional prefix for verbosity
 * @param {DOMRect} sceneRect - scene-relative viewport rect
 */
function notifyFocalPointAndSceneRectListeners(focalPoint, prefix="", sceneRect) {
    if (!isInitialized() || !viewPort.isInitialized()) {
        console.warn("notifyFocalPointAndSceneRectListeners: System not initialized");
        return;
    }
    if (!focalPointChanged() || !sceneRectChanged()) {
        return;
    }
    utils.validatePosition(focalPoint);
    utils.validateRect(sceneRect);
    for (const listener of _focalPointAndSceneRectListeners) {
        try {
            listener(focalPoint, prefix, sceneRect);
        } catch (e) {
            console.error("focalPoint.notifyFocalPointAndSceneRectListeners:", e);
        }
    }
}

/**
 * Notify all listeners (both types) about position changes
 * @param {string} prefix - optional prefix for verbosity
 */
function notifyPositionListeners(prefix="") {
    const fpChanged = focalPointChanged();
    const srChanged = sceneRectChanged();
    const fpInitialized = isInitialized();
    const srInitialized = isSceneRectInitialized();
    
    if ( fpChanged && !srChanged ) {
        if (!fpInitialized) {
            console.warn("notifyFocalPointOnlyListeners: FocalPoint not initialized");
            return;
        }
        notifyFocalPointOnlyListeners(getFocalPoint(), prefix);
        return;
    } else if (fpChanged || srChanged) {
        if (!fpInitialized || !srInitialized) {
            console.warn("notifyFocalPointAndSceneRectListeners: FocalPoint or sceneRect not initialized");
            return;
        }
        notifyFocalPointAndSceneRectListeners(getFocalPoint(), prefix, getSceneRect());
        return;
    }
}

/**
 * Add a listener function to be called when only the focalPoint position changes
 * @param {Function} listener - Function to be called with (focalPoint, prefix)
 */
export function addFocalPointOnlyListener(listener) {
    if (_focalPointOnlyListeners.includes(listener)) {
        console.warn("Listener already added to focalPoint-only listeners");
        return;
    }
    _focalPointOnlyListeners.push(listener);
}

/**
 * Remove a specific listener from the focalPoint-only listeners
 * @param {Function} listener - The listener function to remove
 */
export function removeFocalPointOnlyListener(listener) {
    const index = _focalPointOnlyListeners.indexOf(listener);
    if (index !== -1) {
        _focalPointOnlyListeners.splice(index, 1);
    }
}

/**
 * Add a listener function to be called when the focalPoint position or sceneRect changes
 * @param {Function} listener - Function to be called with (focalPoint, prefix, sceneRect)
 */
export function addFocalPointAndSceneRectListener(listener) {
    if (_focalPointAndSceneRectListeners.includes(listener)) {
        console.warn("Listener already added to focalPoint and sceneRect listeners");
        return;
    }
    _focalPointAndSceneRectListeners.push(listener);
}

/**
 * Remove a specific listener from the focalPoint and sceneRect listeners
 * @param {Function} listener - The listener function to remove
 */
export function removeFocalPointAndSceneRectListener(listener) {
    const index = _focalPointAndSceneRectListeners.indexOf(listener);
    if (index !== -1) {
        _focalPointAndSceneRectListeners.splice(index, 1);
    }
}

/**
 * Called when the pointer enters the scene-plane
 * @param {Event} event - The mouse enter event
 */
function onsceneContainerEnter(event) {
    if (_mode === FOCAL_POINT_MODES.LOCKED) {
        return;
    }
    const eventPosition = getEventPosition(event);
    aimPoint.setAimPoint(eventPosition, "onsceneContainerEnter");
    if (_mode === FOCAL_POINT_MODES.FOLLOWING) {
        startEasingToAimPoint("onsceneContainerEnter");
    }
}

/**
 * Called when the pointer moves within the scene-plane
 * @param {Event} event - The mouse move event
 */
function onSceneContainerMove(event) {
    if (_mode === FOCAL_POINT_MODES.LOCKED) {
        return;
    }

    const eventPosition = getEventPosition(event);
    aimPoint.setAimPoint(eventPosition, "onSceneContainerMove");

    if (_mode === FOCAL_POINT_MODES.DRAGGING) {
        // In drag mode, move the focal point directly to the cursor
        moveFocalPointTo(eventPosition, 'dragging');
        _focalPointNowSubpixelPrecision = eventPosition;
    } else if (_mode === FOCAL_POINT_MODES.FOLLOWING) {
        // If we were paused, start easing again
        if (!_isEasingToAimPoint) {
            startEasingToAimPoint('onSceneContainerMove-resume');
        }
    }
}
/**
 * Called when the pointer leaves the scene-plane
 * @param {Event} event - The mouse leave event
 */
function onSceneContainerLeave(event) {
    // When leaving the scene, always revert to a non-drag state and ease home.
    if (_mode === FOCAL_POINT_MODES.DRAGGING) {
        setMode(FOCAL_POINT_MODES.FOLLOWING);
    }
    startEasingToBullsEye("onSceneContainerLeave");
    startFocalPointAnimation("onSceneContainerLeave"); // Ensure animation runs
}

/*
 * tells the focalPoint to move to the aimPoint
 * unless being dragged by mouse
*/
export function startEasingToAimPoint(prefix="") {
     if (_mode === FOCAL_POINT_MODES.DRAGGING) {
         return;
     }
     
     if (getStatus() === FOCAL_POINT_STATE.ARRIVED_AT_AIM_POINT) {
         const dist = mathUtils.getPositionsEuclideanDistance(getFocalPoint(), aimPoint.getAimPoint());
         if (dist < MAX_NEAR_DISTANCE) {
             return; 
         }
      }
  
     _focalPointNowSubpixelPrecision = getFocalPoint();
 
     if (getStatus() === FOCAL_POINT_STATE.ARRIVED_AT_AIM_POINT) {
         setStatus(FOCAL_POINT_STATE.EASING_TO_AIM_POINT, "startEasingToAimPoint"); 
         updateFocalPointClasses(); 
     }
 
     setStatus(FOCAL_POINT_STATE.EASING_TO_AIM_POINT, `startEasingToAimPoint:${prefix}`);
 
     _isEasingToAimPoint = true;
     _isEasingToBullsEye = false;
     _isAwake = true;
}


/**
 * tells the focalPoint to start easing toward the bullsEye
 * unless being dragged by mouse
 * @param {*} prefix for verbosity
 */
export function startEasingToBullsEye(prefix="") {
    if (_mode === FOCAL_POINT_MODES.DRAGGING) {
        return;
    }

    // Per user instruction: Set the aim point to the bullseye. The easing will follow.
    aimPoint.setAimPoint(bullsEye.getBullsEye(), `startEasingToBullsEye:${prefix}`);

    _focalPointNowSubpixelPrecision = getFocalPoint();
    _isEasingToAimPoint = true;
    _isAwake = true;

    setStatus(FOCAL_POINT_STATE.EASING_TO_BULLS_EYE, `startEasingToBullsEye:${prefix}`);
}

/**
 * called whent the focalPoint arrives at the bullsEye
 * @param {*} eventPosition 
 */
function handleArrival() {
    // If the destination was the bullseye, snap to its exact center for perfect alignment.
    if (getStatus() === FOCAL_POINT_STATE.EASING_TO_BULLS_EYE) {
        moveFocalPointTo(bullsEye.getBullsEye(), 'arrival-snap');
        setStatus(FOCAL_POINT_STATE.ARRIVED_AT_BULLS_EYE, "handleArrival-bullseye");
    } else {
        setStatus(FOCAL_POINT_STATE.ARRIVED_AT_AIM_POINT, "handleArrival-aimpoint");
    }
    _isEasingToAimPoint = false; // Stop easing once arrived
    updateFocalPointClasses();
}

/**
 * this function is called when the focalPoint arrives at the aimPoint
 * @param {*} position 
 */
export function handleArrivedAtAimPoint(aimPos) {
    setStatus(FOCAL_POINT_STATE.ARRIVED_AT_AIM_POINT, "handleArrivedAtAimPoint");
    updateFocalPointClasses();
    _isEasingToAimPoint = false; // Stop easing once arrived
}

/**
 * tells the focalPoint to stop moving
 * @param {*} position 
 */
export function goToSleep(position) {
    domUtils.removeClass(_focalPointElement, "awake");
    _isAwake = false;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;

    setStatus(FOCAL_POINT_STATE.ASLEEP, "goToSleep");
}

/**
 * tells the focalPoint to start moving
 * but without a specific aimPoint
 * @param {*} position 
 */
export function awaken(position) {
    domUtils.addClass(_focalPointElement, "awake");
    _isAwake = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;

    setStatus(FOCAL_POINT_STATE.AWAKE, "awaken");
}

/**
 * @returns true if the focalPoint is draggable
 */
export function isDraggable() {
    return false;
}

/**
 * @returns true if the focalPoint is being dragged
 */
export function isBeingDragged() {
    return _mode === FOCAL_POINT_MODES.DRAGGING;
}

/*
 * draws the animation frame for the focalPoint
 * unless being dragged by mouse
 */
export function drawFocalPointAnimationFrame() {
    if (!_isEasingToAimPoint) {
        return; // Only run if an easing action is active
    }

    const currentPos = _focalPointNowSubpixelPrecision;
    if (!currentPos) { return; }

    const aimPos = aimPoint.getAimPoint();

    if (isNaN(aimPos.x) || isNaN(aimPos.y)) {
        console.error("drawFocalPointAnimationFrame: aimPoint coordinates are invalid (NaN). Skipping frame.", aimPos);
        return;
    }

    const dist = mathUtils.getPositionsEuclideanDistance(currentPos, aimPos);

    if (dist <= MAX_NEAR_DISTANCE) {
        handleArrival();
        return; 
    } 

    const newSubpixelPos = computeAStepCloserToAimSubpixelPrecision(
        currentPos,
        aimPos,
        EASE_FACTOR,
        EPSILON
    );

    if (newSubpixelPos) {
        _focalPointNowSubpixelPrecision = newSubpixelPos;
        moveFocalPointTo({
            x: Math.round(newSubpixelPos.x),
            y: Math.round(newSubpixelPos.y)
        });
    }
}

/**
 * HYPERSENSITIVE CODE - DO NOT ALTER
 * nowPoint is the current position of the focalPoint
 * aimPointElement is the aim point element
 * ease_factor is the ease factor
 * epsilon is the smallest value to move the focalPoint
 * returns the new position of the focalPoint
 */
function computeAStepCloserToAimSubpixelPrecision(nowPoint, aimPointElement, ease_factor, epsilon) {
    if ( (aimPointElement == null) || (nowPoint == null) )
        return null;
    let vx = (aimPointElement.x - nowPoint.x) * ease_factor;
    let vy = (aimPointElement.y - nowPoint.y) * ease_factor;

    if (Math.abs(vx) < epsilon && Math.abs(vy) < epsilon) {
        return aimPointElement;
    }
    return {
        x: nowPoint.x + vx,
        y: nowPoint.y + vy,
    };
}


/**
 * @returns true if the focalPoint is currently locked to the bullsEye
 */
export function isLockedToBullsEye() {
    return _mode === FOCAL_POINT_MODES.LOCKED;
}

/**
 * Toggle whether the focal point is locked to the bulls eye
 * @returns {boolean} The new state of _isLockedToBullsEye
 */
export function toggleLockedToBullsEye() {
    _isLockedToBullsEye = !_isLockedToBullsEye;
    // CONSOLE_LOG_IGNORE(`toggleLockedToBullsEye called. New state: ${_isLockedToBullsEye}`);

    if (_isLockedToBullsEye) {
        stopFocalPointAnimation();
        document.body.classList.add('focal-point-locked');
        _focalPointElement.classList.add('locked-to-bulls-eye');
        const bullsEyeElement = document.getElementById('bulls-eye');
        if (bullsEyeElement) {
            bullsEyeElement.classList.add('focal-point-locked');
        }
        const bullsEyePos = bullsEye.getBullsEye();
        moveFocalPointTo(bullsEyePos, "locked-to-bullsEye");
        setStatus(FOCAL_POINT_STATE.LOCKED_TO_BULLS_EYE, "lockedToBullsEye");
    } else {
        const currentFocalPoint = getFocalPoint();
        aimPoint.setAimPoint(currentFocalPoint, "toggleLockedToBullsEye-unlock");
        _isDraggable = true;
        _isEasingToAimPoint = true;
        wakeUp(); 
        setStatus(FOCAL_POINT_STATE.AWAKE, "toggle unLockedToBullsEye");
        
        document.body.classList.remove('focal-point-locked');
        _focalPointElement.classList.remove('locked-to-bulls-eye');
        const bullsEyeElement = document.getElementById('bulls-eye');
        if (bullsEyeElement) {
            bullsEyeElement.classList.remove('focal-point-locked');
        }
        startFocalPointAnimation("toggle unlockedToBullsEye");
    }
    updateLockIcon();
    saveState();
    logFocalPointState();
    return _isLockedToBullsEye;
}

/**
 * internal function used to click on the focalPoint
 * to let the mouse start dragging it if it is 
 * draggable and is not already being dragged
 * */ 
function onMouseDown_startDraggingFocalPoint(event) {
    const eventPosition = getEventPosition(event);
    const focalPointPosition = getFocalPoint();
    const radius = _focalPointElement.getBoundingClientRect().width / 2;
    const clickDistance = mathUtils.getPositionsEuclideanDistance(eventPosition, focalPointPosition);

    if (!_isDraggable || clickDistance > radius) {
        return;
    }
    
    if (_isBeingDragged) {
        return;
    }
    
    event.preventDefault(); 
    event.stopPropagation(); 

    _focalPointNowSubpixelPrecision = eventPosition;
    
    set_isBeingDragged_true(eventPosition);
    moveFocalPointTo(eventPosition, "startDragging");

    document.body.classList.add('user-select-none');
    _sceneContainer.style.pointerEvents = 'none';
    const resumeContainer = document.getElementById('resume-container');
    if (resumeContainer) {
        resumeContainer.style.pointerEvents = 'none';
    }
    
    domUtils.updateEventListener(document, 'mousemove', onMouseDrag_keepDraggingFocalPoint);
    domUtils.updateEventListener(document, 'mouseup', onMouseUp_stopDraggingFocalPoint, { once: true });
}

/**
 * internal function called while focalPoint is
 * being dragged by mouse
 * @param {*} event 
 * @returns 
 */
function onMouseDrag_keepDraggingFocalPoint(event) {
    if (!_isBeingDragged) {
        return;
    }
    const eventPosition = getEventPosition(event);
    
    _focalPointNowSubpixelPrecision = eventPosition;
    
    moveFocalPointTo(eventPosition, "keepDragging");
    aimPoint.setAimPoint(eventPosition, "onMouseDrag_keepDraggingFocalPoint");
}

/**
 * internal function called when mouse is released
 * after dragging the focalPoint
 * @param {*} event 
 */
function onMouseUp_stopDraggingFocalPoint(event) {
    if (!_isBeingDragged) {
        return;
    }
    
    const eventPosition = getEventPosition(event);
    
    moveFocalPointTo(eventPosition, "stopDragging");
    aimPoint.setAimPoint(eventPosition, "onMouseUp_stopDraggingFocalPoint");
    _focalPointNowSubpixelPrecision = eventPosition;  
    
    set_isBeingDragged_false(eventPosition);

    document.body.classList.remove('user-select-none');
    _sceneContainer.style.pointerEvents = 'auto';
    const resumeContainer = document.getElementById('resume-container');
    if (resumeContainer) {
        resumeContainer.style.pointerEvents = 'auto';
    }

    domUtils.updateEventListener(document, 'mousemove', onMouseDrag_keepDraggingFocalPoint, { remove: true });
}


/**
 * handles the case when the window is resized
 * and the focalPoint is locked to bullsEye state
 */
let _resizeTimeout = null;
const RESIZE_DEBOUNCE_DELAY = 150; // ms

function handleViewPortChangeImmediate(prefix="") {
    if (!viewPort.isInitialized()) {
        console.warn("handleViewPortChangeImmediate: viewPort not initialized, skipping");
        return;
    }
    notifyPositionListeners(`handleViewPortChangeImmediate:${prefix}`);
}

function handleViewPortChangeComplete(source = "unknown") {
}

function handleViewPortChange(source = "unknown") {
    handleViewPortChangeImmediate(source);
    clearTimeout(_resizeTimeout);
    _resizeTimeout = setTimeout(() => {
        handleViewPortChangeComplete(source);
    }, RESIZE_DEBOUNCE_DELAY);
}

function initializeResizeObserver() {
    if (_resizeObserver) {
        _resizeObserver.disconnect();
    }
    _resizeObserver = new ResizeObserver(() => {
        handleViewPortChangeImmediate('resize-observer');
    });
    _resizeObserver.observe(_sceneContainer);
}

function cleanup() {
    if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
    }
}

export function scrollTopUpdated(scrollTop) {
    const vpRect = viewPort.getViewPortRect();
    const sceneRect = {
        left: vpRect.left,
        top: vpRect.top + scrollTop,
        right: vpRect.right,
        bottom: vpRect.bottom + scrollTop
    };
    _lastSceneRect = { ...sceneRect };
    notifyPositionListeners("scrollTopUpdated");
}

window.addEventListener('unload', cleanup);

let _animationFrameId = null;

export function startFocalPointAnimation(prefix="") {
    if (_animationFrameId) {
        // CONSOLE_LOG_IGNORE("startFocalPointAnimation: canceling animation frame", prefix);
        cancelAnimationFrame(_animationFrameId);
    } else {
        // CONSOLE_LOG_IGNORE("startFocalPointAnimation: starting animation frame", prefix);
    }
    
    function animate() {
        // The animation loop is the source of truth for the focal point's state.
        if (_mode === FOCAL_POINT_MODES.LOCKED) {
            // If we are locked, continuously snap to the bullseye, unless we are in the
            // brief process of easing TO the bullseye to become locked.
            if (getStatus() !== FOCAL_POINT_STATE.EASING_TO_BULLS_EYE) {
                moveFocalPointTo(bullsEye.getBullsEye(), "animate-enforce-lock");
            }
        }

        // Only perform easing calculations if an easing action is active.
        if (_isEasingToAimPoint) {
            drawFocalPointAnimationFrame(prefix);
        }
        
        _animationFrameId = requestAnimationFrame(animate);
    }
    
    _animationFrameId = requestAnimationFrame(animate);
}

export function stopFocalPointAnimation() {
    if (_animationFrameId) {
        cancelAnimationFrame(_animationFrameId);
        _animationFrameId = null;
    }
}

export function logFocalPointState() {
    // CONSOLE_LOG_IGNORE("=== Focal Point State ===");
    // CONSOLE_LOG_IGNORE(`_isLockedToBullsEye: ${_isLockedToBullsEye}`);
    // CONSOLE_LOG_IGNORE(`_isDraggable: ${_isDraggable}`);
    // CONSOLE_LOG_IGNORE(`_isBeingDragged: ${_isBeingDragged}`);
    // CONSOLE_LOG_IGNORE(`_isEasingToAimPoint: ${_isEasingToAimPoint}`);
    // CONSOLE_LOG_IGNORE(`_isEasingToBullsEye: ${_isEasingToBullsEye}`);
    // CONSOLE_LOG_IGNORE(`_isAwake: ${_isAwake}`);
    // CONSOLE_LOG_IGNORE(`Status: ${getStatus()}`);
    
    const position = getFocalPoint();
    // CONSOLE_LOG_IGNORE(`Position: x=${position.x}, y=${position.y}`);
    
    const bullsEyePos = bullsEye.getBullsEye();
    // CONSOLE_LOG_IGNORE(`BullsEye: x=${bullsEyePos.x}, y=${bullsEyePos.y}`);
    
    const aimPos = aimPoint.getAimPoint();
    // CONSOLE_LOG_IGNORE(`AimPoint: x=${aimPos.x}, y=${aimPos.y}`);
    
    // CONSOLE_LOG_IGNORE("========================");
}

function updateLockIcon() {
    // This function is now obsolete as the button is in a Vue component.
    // const focalLockButton = document.getElementById('focal-lock');
    // if (focalLockButton) {
    //     if (isLockedToBullsEye()) {
    //         focalLockButton.classList.add('locked');
    //     } else {
    //         focalLockButton.classList.remove('locked');
    //     }
    // }
}

function setupMouseListeners() {
    _sceneContainer = document.getElementById('scene-container');
    if (!_sceneContainer) {
        console.error("Scene container not found, cannot set up mouse listeners for focal point.");
        return;
    }
}

function wakeUp() {
    awaken(getFocalPoint());
}

function updateFocalPointClasses() {
    _focalPointElement.classList.remove('locked', 'following', 'dragging');
    _focalPointElement.classList.add(_mode);

    if (_mode === FOCAL_POINT_MODES.LOCKED) {
        _focalPointElement.classList.add('locked-to-bulls-eye');
    } else {
        _focalPointElement.classList.remove('locked-to-bulls-eye');
    }

    // The concept of "draggable" and "being dragged" as separate states is removed.
    // The cursor style is now primarily controlled by the mode.
    if (_mode === FOCAL_POINT_MODES.DRAGGING) {
        _focalPointElement.classList.add('focal-point-is-being-dragged');
    } else {
        _focalPointElement.classList.remove('focal-point-is-being-dragged');
    }

    const isGrabbable = false; // This concept is removed

    if (isGrabbable) {
        _focalPointElement.classList.add('focal-point-is-draggable');
    } else {
        _focalPointElement.classList.remove('focal-point-is-draggable');
    }
}

export function setMode(newMode, isInitializing = false) {
    _mode = newMode;

    // Update global state and save, unless during initial page load
    if (!isInitializing) {
        AppState.focalPoint.mode = newMode;
        saveState(AppState);
    }

    switch (_mode) {
        case FOCAL_POINT_MODES.LOCKED:
            document.body.classList.add('focal-point-locked');
            _focalPointElement.classList.add('locked-to-bulls-eye');
            startEasingToBullsEye('setMode-locked');
            startFocalPointAnimation('setMode-locked'); // Start animation to ease into place
            break;
        case FOCAL_POINT_MODES.FOLLOWING:
            document.body.classList.remove('focal-point-locked');
            _focalPointElement.classList.remove('locked-to-bulls-eye');
            // Set the aim point to the current focal point position to avoid NaN errors
            aimPoint.setAimPoint(getFocalPoint(), 'setMode-following');
            _focalPointNowSubpixelPrecision = getFocalPoint();
            startFocalPointAnimation("setMode-following");
            break;
        case FOCAL_POINT_MODES.DRAGGING:
            document.body.classList.remove('focal-point-locked');
            _focalPointElement.classList.remove('locked-to-bulls-eye');
            stopFocalPointAnimation(); // No easing in drag mode
            break;
    }
    updateFocalPointClasses();
}