// modules/focalPoint.mjs

import * as domUtils from '../utils/domUtils.mjs';
import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewPort.mjs';
import * as bullsEye from './bullsEye.mjs';
import * as aimPoint from './aimPoint.mjs';
import * as eventBus from '../core/eventBus.mjs';

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

const EASE_FACTOR = 0.15;
const EPSILON = EASE_FACTOR / 2.0;
const MAX_NEAR_DISTANCE = 0.5;

const FOCALPOINT_EPSILON = 1.0;
const SCENERECT_EPSILON = 1.0;

let _isInitialized = false;
var _isSceneRectInitialized = false;
var _sceneContainer = null;
var _focalPointElement = null;
var _focalPointNowSubpixelPrecision;
var _isEasingToAimPoint = false;
var _isEasingToBullsEye = false;
var _isAwake = false;
var _isDraggable = false;
var _isBeingDragged = false;
let _focalPointRadius = 0;
const _mouseDrag = new MouseDrag();
let _resizeObserver = null;

let _status = "asleep";
let _lastStatus = "asleep";

let _isLockedToBullsEye = true;
let _userInitiatedUnlock = false;

let _lastFocalPoint = null;
let _lastSceneRect = null;
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
        //console.info(prefix, _status);
    }
}

export function getStatus() {
    return _status;
}

/*
 * Add these functions near the top of the file, after the imports
 */
function saveDraggableState(state) {
    try {
        localStorage.setItem('focalPoint_isDraggable', JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save draggable state:', e);
    }
}

/**
 * @returns the last saved draggable state
 */
function loadDraggableState() {
    try {
        const saved = localStorage.getItem('focalPoint_isDraggable');
        return saved !== null ? JSON.parse(saved) : true;  // Default to true if not set
    } catch (e) {
        console.error('Failed to load draggable state:', e);
        return true;  // Default to true on error
    }
}

// Add state management functions after the imports
const STORAGE_KEY = 'focalPoint_state';

/**
 * @returns the default state
 */
function getDefaultState() {
    return {
        isDraggable: false,
        isLockedToBullsEye: true,
        _lastFocalPoint: null,
        _lastSceneRect: null,
        scenePercentage: 50, // Default 50% split
        selectedPalette: null, // Will be set to first available palette
        lastUpdated: new Date().toISOString(),
        version: "1.0"
    };
}

/**
 * save state to local storage
 */
export function saveState() {
    try {
        const paletteSelector = document.getElementById('color-palette-selector');
        const sceneContainer = document.getElementById('scene-container');
        
        const state = {
            isDraggable: _isDraggable,
            isLockedToBullsEye: _isLockedToBullsEye,
            _lastFocalPoint: getFocalPoint(),
            _lastSceneRect: getSceneRect(),
            selectedPalette: paletteSelector ? paletteSelector.value : null,
            lastUpdated: new Date().toISOString(),
            version: "1.0"
        };
        console.log('Saving focalPoint state:', state);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
        //console.log('Saved focalPoint state:', state);
    } catch (e) {
        console.error('Failed to save focalPoint state:', e);
    }
}

/**
 * load state from local storage
 * @returns the loaded state
 */
function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return getDefaultState();
        }
        const state = JSON.parse(saved);
        //console.log('Loaded focalPoint state:', state);
        return state;
    } catch (e) {
        console.error('Failed to load focalPoint state:', e);
        return getDefaultState();
    }
}

/*
 * Initialize state from storage
 */
function initializeState() {
    const state = loadState();
    _isDraggable = state.isDraggable;
    _isLockedToBullsEye = state.isLockedToBullsEye;
    
    const sceneContainer = document.getElementById('scene-container');
    const resumeContainer = document.getElementById('resume-container');

    // Apply palette selection if available
    const paletteSelector = document.getElementById('color-palette-selector');
    if (paletteSelector && state.selectedPalette) {
        paletteSelector.value = state.selectedPalette;
        // Trigger change event to apply the palette
        const event = new Event('change');
        paletteSelector.dispatchEvent(event);
    }

    return state;
}

/*
 * Externally callable function to get current 
 * state (useful for debugging and for 
 * inter-session state management
 */
export function getCurrentState() {
    return loadState();
}

// /**
//  * on windwo load
//  */
// export function handleOnWindowLoad() {
//     //console.log("focalPoint handlingOnWindowLoad");
//     startEasingToBullsEye("handleOnWindowLoad");
// }

/**
 * external function to set _isBeingDragged to true
 * @param {*} eventPosition 
 */
export function set_isBeingDragged_true(eventPosition) {
    // Only allow dragging if draggable
    if (!_isDraggable) {
        console.log("Cannot start dragging - focal point is not draggable");
        return;
    }
    
    _isBeingDragged = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    
    // Temporarily disable draggable while being dragged
    // This ensures we can't be both draggable and being dragged
    _focalPointElement.classList.remove('focal-point-is-draggable');
    _focalPointElement.classList.add('focal-point-is-being-dragged');
    
    aimPoint.setAimPoint(eventPosition, "set_isBeingDragged_true");
    _mouseDrag.setStartPosition(eventPosition);
    setStatus(FOCAL_POINT_STATE.BEING_DRAGGED, "set_isBeingDragged_true");
    //console.log("set _isBeingDragged:", _isBeingDragged, "eventPosition:", eventPosition);
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
    if (_isDraggable) {
        _focalPointElement.classList.add('focal-point-is-draggable');
    }
    _focalPointElement.classList.remove('focal-point-is-being-dragged');
    
    aimPoint.setAimPoint(eventPosition, "set_isBeingDragged_false");
    _mouseDrag.setEndPosition(eventPosition);
    moveFocalPointTo(eventPosition);
    //console.log("set _isBeingDragged:", _isBeingDragged, "eventPosition:", eventPosition);
}


/**
 * called on window resize
 */
export function handleOnWindowResize() {
    //console.log("focalPoint handlingOnWindowLoad");
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
        x: rect.left + _focalPointRadius,
        y: rect.top + _focalPointRadius
    }
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
    // CRITICAL: If locked to bulls-eye, only allow moves with the "locked-to-bullsEye" prefix
    if (_isLockedToBullsEye && prefix !== "locked-to-bullsEye") {
        console.log(`moveFocalPointTo ignored while locked to bulls-eye (prefix: ${prefix})`);
        return;
    }
    
    // calculate distance moved since last call
    const squaredDist = mathUtils.getPositionsSquaredDistance(position, _lastPosition);
    _lastPosition = position;

    // skip move if move is too small
    if (squaredDist < 0.25) { // 0.5 squared
        setStatus("PAUSED");
        return; 
    } else {
        if (getStatus() === "PAUSED") {
            setStatus("RUNNING");
        }
    }
    
    // Use viewPort coordinates directly
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
        console.log("Focal point already initialized");
        return;
    }

    _focalPointElement = document.getElementById('focal-point');
    if (!_focalPointElement) {
        throw new Error("Focal point element #focal-point not found");
    }

    // Set up listeners and initial state
    _focalPointElement.addEventListener("transitionend", onFocalPointTransitionEnd);
    _focalPointElement.addEventListener("transitionstart", onFocalPointTransitionStart);
    
    initializeState();
    setupMouseListeners();
    initializeSceneRect();
    updateLockIcon();
    
    _isInitialized = true;
    console.log("Focal point initialized");
}

export function isSceneRectInitialized() {
    return _isSceneRectInitialized;
}

function initializeSceneRect() {
    if ( _isSceneRectInitialized ) {
        console.info("focalPoint ignoring duplicate sceneRect initialization request");
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
    // console.log("Added scroll event listener to scene container");
    
    // Clean up resize observer
    if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
    }
    
    // Initialize resize observer before any other operations
    initializeResizeObserver();

    // Add window resize listener
    window.addEventListener('resize', () => handleViewPortChange("window-resize"));

    _sceneContainer = document.getElementById("scene-container");
    if (!_sceneContainer) {
        throw new Error("sceneContainer not initialized");
    }

    // Add scroll event listener to scene container
    _sceneContainer.addEventListener('scroll', function(event) {
        scrollTopUpdated(_sceneContainer.scrollTop);
    });
    // console.log("Added scroll event listener to scene container");

    // Initialize resize observer before any other operations
    initializeResizeObserver();

    // Add window resize listener
    window.addEventListener('resize', () => handleViewPortChange("window-resize"));

    // console.log('✅ ViewPort change listeners added');

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
            // console.log("focalPointChanged: distance calculation:", {
            //     focalPoint,
            //     _lastFocalPoint,
            //     dist,
            //     FOCALPOINT_EPSILON
            // });
        } catch (e) {
            console.error("Error calculating distance:", e);
            // Reset _lastFocalPoint if it's invalid
            _lastFocalPoint = null;
            return true; // Force update
        }
    } else {
        // console.log("focalPointChanged: _lastFocalPoint is null, considering as moved");
        moved = true;
        _lastFocalPoint = focalPoint;
        return moved;
    }
    
    if (dist >= FOCALPOINT_EPSILON) {
        moved = true;
        _lastFocalPoint = focalPoint;
    }
    
    // console.log("focalPointChanged result:", moved);
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

    // // Always return true for scroll events to ensure updates happen
    // if (sceneRect.top !== _lastSceneRect.top || sceneRect.bottom !== _lastSceneRect.bottom) {
    //     moved = true;
    //     _lastSceneRect = sceneRect;
    // }

    return moved;
}

/**
 * Notify listeners that only the focalPoint has moved
 * @param {position} focalPoint - viewPort-relative position of focalPoint
 * @param {string} prefix - optional prefix for verbosity
 */
function notifyFocalPointOnlyListeners(focalPoint, prefix="") {
    // console.log("notifyFocalPointOnlyListenersTotal focalPoint-only listeners:", _focalPointOnlyListeners.length);

    // Check global conditions once
    if (!isInitialized()) {
        console.warn("notifyFocalPointOnlyListeners: System not initialized");
        return;
    }
    
    // Validate the focal point
    utils.validatePosition(focalPoint);
    
    // Notify all listeners
    for (const listener of _focalPointOnlyListeners) {
        try {
            // console.log("notifyFocalPointOnlyListeners: listener:", listener);
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
    // Check global conditions once
    if (!isInitialized() || !viewPort.isInitialized()) {
        console.warn("notifyFocalPointAndSceneRectListeners: System not initialized");
        return;
    }
    
    // For all events, check for motion detected
    if (!focalPointChanged() || !sceneRectChanged()) {
        return;
    }

    // load once
    utils.validatePosition(focalPoint);
    utils.validateRect(sceneRect);

    // notify all listeners
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
    // console.log("notifyPositionListeners: ",prefix,"focalPointChanged:", fpChanged);
    const srChanged = sceneRectChanged();
    // console.log("notifyPositionListeners: ",prefix,"sceneRectChanged:", srChanged);
    const fpInitialized = isInitialized();
    const srInitialized = isSceneRectInitialized();
    
    // console.log("notifyPositionListeners conditions:", {
    //     fpChanged,
    //     srChanged,
    //     fpInitialized,
    //     srInitialized,
    //     focalPointOnlyListenersCount: _focalPointOnlyListeners.length,
    //     focalPointAndSceneRectListenersCount: _focalPointAndSceneRectListeners.length
    // });
    
    if ( fpChanged && !srChanged ) {
        if (!fpInitialized) {
            console.warn("notifyFocalPointOnlyListeners: FocalPoint not initialized");
            return;
        }
        // console.log("notifyPositionListeners: calling notifyFocalPointOnlyListeners");
        notifyFocalPointOnlyListeners(getFocalPoint(), prefix);
        return;
    } else if (fpChanged || srChanged) {
        if (!fpInitialized || !srInitialized) {
            console.warn("notifyFocalPointAndSceneRectListeners: FocalPoint or sceneRect not initialized");
            return;
        }
        // console.log("notifyPositionListeners: calling notifyFocalPointAndSceneRectListeners");
        notifyFocalPointAndSceneRectListeners(getFocalPoint(), prefix, getSceneRect());
        return;
    } else {
        // console.warn("notifyPositionListeners: No changes detected, not notifying listeners");
    }
}

/**
 * Add a listener function to be called when only the focalPoint position changes
 * @param {Function} listener - Function to be called with (focalPoint, prefix)
 */
export function addFocalPointOnlyListener(listener) {
    // Check if the listener is already added to prevent duplicates
    if (_focalPointOnlyListeners.includes(listener)) {
        console.warn("Listener already added to focalPoint-only listeners");
        return;
    }
    _focalPointOnlyListeners.push(listener);
    // console.log("Added focalPoint-only listener:", listener.name || "anonymous function");
    // console.log("Total focalPoint-only listeners:", _focalPointOnlyListeners.length);
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
    // Check if the listener is already added to prevent duplicates
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
 * Clear all listeners (both types)
 */
function clearFocalPointOnlyListeners() {
    _focalPointOnlyListeners.length = 0;
}
function clearFocalPointAndSceneRectListeners() {
    _focalPointAndSceneRectListeners.length = 0;
}

/**
 * Called when the pointer enters the scene-plane
 * @param {Event} event - The mouse enter event
 */
function onsceneContainerEnter(event) {
    // CRITICAL: If locked to bulls eye, don't respond to mouse enter
    if (_isLockedToBullsEye) {
        console.log("onsceneContainerEnter ignored while locked to bulls-eye");
        return;
    }
    
    const eventPosition = getEventPosition(event);
    console.log("onsceneContainerEnter", FOCAL_POINT_STATE.FOLLOWING);
    awaken(eventPosition);
    
    // If being dragged, ease to the current mouse position
    if (_isBeingDragged) {
        aimPoint.setAimPoint(eventPosition, "onsceneContainerEnter-dragged");
        startEasingToAimPoint("onsceneContainerEnter-dragged");
        return;
    }
    
    // Normal behavior for non-dragged state
    startEasingToAimPoint("onsceneContainerEnter");
}

/**
 * Called when the pointer moves within the scene-plane
 * @param {Event} event - The mouse move event
 */
function onSceneContainerMove(event) {
    // If locked to bulls eye, don't respond to mouse movement
    if (_isLockedToBullsEye) {
        return;
    }
    
    const eventPosition = getEventPosition(event);
    aimPoint.setAimPoint(eventPosition, "onSceneContainerMove");
    startEasingToAimPoint("onSceneContainerMove");
}
/**
 * Called when the pointer leaves the scene-plane
 * @param {Event} event - The mouse leave event
 */
function onSceneContainerLeave(event) {
    // CRITICAL: If locked to bulls eye, don't respond to mouse leave
    if (_isLockedToBullsEye) {
        console.log("onSceneContainerLeave ignored while locked to bulls-eye");
        return;
    }
    
    const eventPosition = getEventPosition(event);
    console.log("onSceneContainerLeave", "leaveContainer");
    
    // If being dragged, keep it in dragged state but move to bullsEye
    if (_isBeingDragged) {
        // Move to bullsEye but maintain dragged state
        aimPoint.setAimPoint(bullsEye.getBullsEye(), "onSceneContainerLeave-dragged");
        moveFocalPointTo(bullsEye.getBullsEye(), "onSceneContainerLeave-dragged");
        // Don't change _isBeingDragged state
        return;
    }
    
    // Normal behavior for non-dragged state
    goToSleep(eventPosition);
}

/*
 * tells the focalPoint to move to the aimPoint
 * unless being dragged by mouse
*/
export function startEasingToAimPoint(prefix="") {
    if ( _isBeingDragged ) {
        //console.log(prefix, "startEasingToAimPoint ignored while _isBeingDragged");
        return;
    }
    setStatus(FOCAL_POINT_STATE.EASING_TO_AIM_POINT, `startEasingToAimPoint:${prefix}`);

    // setAimPoint( position, `startEasingToAimPoint:${prefix}`);
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
    if (_isBeingDragged) {
        //console.log("startEasingToBullsEye ignored while _isBeingDragged");
        return;
    }

    aimPoint.setAimPoint(bullsEye.getBullsEye(), `startEasingToBullsEye:${prefix}`);
    _isEasingToAimPoint = true;
    _isEasingToBullsEye = true;
    _isAwake = true;

    setStatus(FOCAL_POINT_STATE.EASING_TO_BULLS_EYE, `startEasingToBullsEye:${prefix}`);
}

/**
 * called whent the focalPoint arrives at the bullsEye
 * @param {*} eventPosition 
 */
export function handleArrivedAtBullsEye(eventPosition) {
    setStatus(FOCAL_POINT_STATE.ARRIVED_AT_BULLS_EYE, "handleArrivedAtBullsEye");
    goToSleep(eventPosition);
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
    return _isDraggable;
}

/**
 * @returns true if the focalPoint is being dragged
 */
export function isBeingDragged() {
    return _isBeingDragged;
}

/**
 * this function is called when the focalPoint arrives at the aimPoint
 * @param {*} position 
 */
function handleArrivedAtAimPoint(position) {
    setStatus("arrivedAtAimPoint", "handleArrivedAtAimPoint");
}

/*
 * draws the animation frame for the focalPoint
 * unless being dragged by mouse
 */
export function drawFocalPointAnimationFrame() {
    // If being dragged, don't animate
    if (_isBeingDragged) {
        return;
    }

    // Normal animation logic for non-locked state
    const currentPos = getFocalPoint();
    const aimPos = aimPoint.getAimPoint();
    const dist = mathUtils.getPositionsEuclideanDistance(currentPos, aimPos);

    if (dist <= MAX_NEAR_DISTANCE) {
        if (_isEasingToBullsEye) {
            handleArrivedAtBullsEye(currentPos);
            return;
        } else {
            handleArrivedAtAimPoint(aimPos);
            return;
        }
    } 
  
    _focalPointNowSubpixelPrecision = computeAStepCloserToAimSubpixelPrecision(
        _focalPointNowSubpixelPrecision,
        aimPos,
        EASE_FACTOR,
        EPSILON
    );

    if (_focalPointNowSubpixelPrecision !== null) {
        const newPos = {
            x: Math.round(_focalPointNowSubpixelPrecision.x),
            y: Math.round(_focalPointNowSubpixelPrecision.y)
        };
        moveFocalPointTo(newPos);
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
    // compute velocities
    let vx = (aimPointElement.x - nowPoint.x) * ease_factor;
    let vy = (aimPointElement.y - nowPoint.y) * ease_factor;

    // for very small values of vx and vy, move there directly
    if (Math.abs(vx) < epsilon && Math.abs(vy) < epsilon) {
        return aimPointElement;
    }
    // otherwise, move the focalPoint towards the aim point element
    return {
        x: nowPoint.x + vx,
        y: nowPoint.y + vy,
    };
}


/**
 * @returns true if the focalPoint is currently locked to the bullsEye
 */
export function isLockedToBullsEye() {
    return _isLockedToBullsEye;
}

/**
 * Toggle whether the focal point is locked to the bulls eye
 * @returns {boolean} The new state of _isLockedToBullsEye
 */
export function toggleLockedToBullsEye() {
    // 1. Toggle the internal state
    _isLockedToBullsEye = !_isLockedToBullsEye;
    console.log(`toggleLockedToBullsEye called. New state: ${_isLockedToBullsEye}`);

    // 2. Update UI based on the new state
    if (_isLockedToBullsEye) {
        document.body.classList.add('focal-point-locked');
        _focalPointElement.classList.add('locked-to-bulls-eye');
        const bullsEyeElement = document.getElementById('bulls-eye');
        if (bullsEyeElement) {
            bullsEyeElement.classList.add('focal-point-locked');
        }
        // When locking, immediately move to the bullsEye
        const bullsEyePos = bullsEye.getBullsEye();
        moveFocalPointTo(bullsEyePos, "locked-to-bullsEye");
        setStatus(FOCAL_POINT_STATE.LOCKED_TO_BULLS_EYE, "toggleLockedToBullsEye");
    } else {
        // When unlocking, force a draggable and easing state as requested
        _isDraggable = true;
        _isEasingToAimPoint = true;
        wakeUp(); // This sets _isAwake and starts the animation loop
        setStatus(FOCAL_POINT_STATE.AWAKE, "toggleLockedToBullsEye-manual");
        
        // Also update classes on other elements
        document.body.classList.remove('focal-point-locked');
        _focalPointElement.classList.remove('locked-to-bulls-eye');
        const bullsEyeElement = document.getElementById('bulls-eye');
        if (bullsEyeElement) {
            bullsEyeElement.classList.remove('focal-point-locked');
        }
    }

    // 3. Update the icon
    updateLockIcon();

    // 4. Save the state
    saveState();

    logFocalPointState();
    return _isLockedToBullsEye;
}

// /**
//  * Force enable pointer events on all bizCardDivs
//  * This is a more aggressive approach to ensure they receive mouse events
//  */
// function forceEnablePointerEvents() {
//     console.log("Forcing pointer events on all bizCardDivs");
    
//     // Get all bizCardDivs
//     const bizCardDivs = document.querySelectorAll('.biz-card-div');
    
//     // Enable pointer events on each one
//     bizCardDivs.forEach(div => {
//         div.style.pointerEvents = 'auto';
        
//         // Also ensure all child elements have pointer events
//         const children = div.querySelectorAll('*');
//         children.forEach(child => {
//             child.style.pointerEvents = 'auto';
//         });
//     });
    
//     // Also ensure the scene container has pointer events
//     const sceneContainer = document.getElementById('scene-container');
//     if (sceneContainer) {
//         sceneContainer.style.pointerEvents = 'auto';
//     }
// }

/**
 * Add direct mouse event listeners to a bizCardDiv
 * This ensures it receives mouse events even if pointer-events is not working
 */
function addDirectMouseListeners(element) {
    // Remove any existing listeners to avoid duplicates
    if (element._directMouseListeners) {
        element.removeEventListener('mouseenter', element._directMouseListeners.enter);
        element.removeEventListener('mouseleave', element._directMouseListeners.leave);
        element.removeEventListener('click', element._directMouseListeners.click);
    }
    
    // Create new listeners
    const listeners = {
        enter: (e) => {
            // console.log(`Direct mouseenter on ${element.id}`);
            // This handler is currently empty as the function it used to call was removed.
        },
        leave: (e) => {
            // console.log(`Direct mouseleave on ${element.id}`);
            // This handler is currently empty as the function it used to call was removed.
            element.classList.remove("hovered");
        },
        click: (e) => {
            // console.log(`Direct click on ${element.id}`);
            // This handler is currently empty as the function it used to call was removed.
        }
    };
    
    // Add the listeners
    element.addEventListener('mouseenter', listeners.enter);
    element.addEventListener('mouseleave', listeners.leave);
    element.addEventListener('click', listeners.click);
    
    // Store the listeners for later removal
    element._directMouseListeners = listeners;
    
    // console.log(`Added direct mouse listeners to ${element.id}`);
}

/**
 * internal function used to click on the focalPoint
 * to let the mouse start dragging it if it is 
 * draggable and is not already being dragged
 * */ 
function onMouseDown_startDraggingFocalPoint(event) {
    // Only handle the event if the focal point is draggable
    if (!_isDraggable) {
        // Pass the event through to elements underneath
        const elementUnder = document.elementFromPoint(
            event.clientX, 
            event.clientY
        );
        
        // Temporarily hide the focal point to find what's underneath
        const originalVisibility = _focalPointElement.style.visibility;
        _focalPointElement.style.visibility = 'hidden';
        
        // Get the element under the focal point
        const elementUnderFocalPoint = document.elementFromPoint(
            event.clientX, 
            event.clientY
        );
        
        // Restore visibility
        _focalPointElement.style.visibility = originalVisibility;
        
        // If there's an element underneath, simulate a click on it
        if (elementUnderFocalPoint && elementUnderFocalPoint !== _focalPointElement) {
            elementUnderFocalPoint.click();
        }
        
        return;
    }
    
    // If already being dragged, just update the position
    if (_isBeingDragged) {
        const eventPosition = getEventPosition(event);
        moveFocalPointTo(eventPosition);
        return;
    }
    
    // If draggable but not being dragged, start dragging
    const eventPosition = getEventPosition(event);
    event.preventDefault(); // prevent default browser behavior
    event.stopPropagation(); // Stop the event from reaching the scene-plane

    // Update subpixel precision to match current position
    _focalPointNowSubpixelPrecision = eventPosition;
    
    set_isBeingDragged_true(eventPosition);
    moveFocalPointTo(eventPosition);

    // Don't disable pointer events on scene-plane container to allow scrolling
    document.body.style.userSelect = 'none';
    
    // Use domUtils.updateEventListener instead of utils.updateEventListener
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
    
    // Keep subpixel precision in sync during drag
    _focalPointNowSubpixelPrecision = eventPosition;
    
    moveFocalPointTo(eventPosition);
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
    
    // Move to final position first
    moveFocalPointTo(eventPosition);
    aimPoint.setAimPoint(eventPosition, "onMouseUp_stopDraggingFocalPoint");
    _focalPointNowSubpixelPrecision = eventPosition;  // Update subpixel position
    
    set_isBeingDragged_false(eventPosition);

    // Cleanup
    document.body.style.userSelect = 'auto';

    // Use domUtils.updateEventListener instead of utils.updateEventListener
    domUtils.updateEventListener(document, 'mousemove', onMouseDrag_keepDraggingFocalPoint, { remove: true });
}


/**
 * handles the case when the window is resized
 * and the focalPoint is locked to bullsEye state
 */
window.addEventListener('resize', handleOnWindowResize);

// Add debounce utility variables
let _resizeTimeout = null;
const RESIZE_DEBOUNCE_DELAY = 150; // ms

/**
 * Debounced wrapper for immediate parallax update.
 * used to update viewport state and notify listeners.
 */
function handleViewPortChangeImmediate(prefix="") {
    // console.log("handleViewPortChangeImmediate called from:", prefix);
    
    // Ensure viewport is initialized before proceeding
    if (!viewPort.isInitialized()) {
        console.warn("handleViewPortChangeImmediate: viewPort not initialized, skipping");
        return;
    }
    
    // Notify listeners about the change
    notifyPositionListeners(`handleViewPortChangeImmediate:${prefix}`);
}

// Debounced version of the viewport change handler.
// This is used for events that fire rapidly, like resize.
function handleViewPortChangeComplete(source = "unknown") {
    // console.log(`✅ ViewPort resize completed from: ${source}`);

    // Trigger bizResumeDiv resizing here
    // You can call your bizResumeDiv resize function here
    // Example: bizResumeDivSortingModule.resizeAllBizResumeDivs();
}

// Main function that handles both immediate and debounced updates
function handleViewPortChange(source = "unknown") {
    // Immediate parallax update for smooth movement
    handleViewPortChangeImmediate(source);

    // Debounced completion handler for heavy operations
    clearTimeout(_resizeTimeout);
    _resizeTimeout = setTimeout(() => {
        handleViewPortChangeComplete(source);
    }, RESIZE_DEBOUNCE_DELAY);
}

// Function to initialize resize observer
function initializeResizeObserver() {
    if (_resizeObserver) {
        _resizeObserver.disconnect();
    }
    _resizeObserver = new ResizeObserver(() => {
        handleViewPortChangeImmediate('resize-observer');
    });
    _resizeObserver.observe(_sceneContainer);
    // console.log("FocalPoint's resize observer initialized for scene-container");
}

/**
 * Clean up when needed (e.g., before page unload)
 */
function cleanup() {
    if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
    }
}

/**
 * Handle scroll/wheel events and pass them through to scene-container
 * @param {Event} event - The scroll or wheel event
 */
function handleScrollPassThrough(event) {
    // Don't interfere if we're actively dragging
    if (_isBeingDragged) {
        return;
    }

    // Prevent the event from being handled by the focal point
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
        //console.log('Passed wheel event to scene-container, delta:', delta);
    }

    // For scroll events, create and dispatch a new event
    if (event.type === 'scroll') {
        const newEvent = new Event('scroll', {
            bubbles: true,
            cancelable: true
        });
        sceneContainer.dispatchEvent(newEvent);
        //console.log('Passed scroll event to scene-container');
    }
}

/**
 * Handle scroll top updates from scene container
 * @param {number} scrollTop - The current scroll top value
 */
export function scrollTopUpdated(scrollTop) {
    // Get current viewport rect
    const vpRect = viewPort.getViewPortRect();

    // Convert to scene-relative coordinates (vertical only)
    const sceneRect = {
        left: vpRect.left,
        top: vpRect.top + scrollTop,
        right: vpRect.right,
        bottom: vpRect.bottom + scrollTop
    };

    // Update the last scene rect to trigger a notification
    _lastSceneRect = { ...sceneRect };
    
    // Force notification to all listeners with the updated scene-relative rect
    notifyPositionListeners("scrollTopUpdated");
    // console.log(`Scroll updated: top=${sceneRect.top.toFixed(0)}, bottom=${sceneRect.bottom.toFixed(0)}`);
}

/**
 * Call cleanup function when the page is unloaded
 */
window.addEventListener('unload', cleanup);

// ============================================
// Animation Loop Functions
// ============================================

let _animationFrameId = null;

/**
 * Start the focal point animation
 */
export function startFocalPointAnimation() {
    if (_animationFrameId) {
        cancelAnimationFrame(_animationFrameId);
    }
    
    function animate() {
        // CRITICAL: If locked to bulls-eye, ensure position is at bulls-eye
        if (_isLockedToBullsEye && !_userInitiatedUnlock) {
            const bullsEyePos = bullsEye.getBullsEye();
            moveFocalPointTo(bullsEyePos, "locked-to-bullsEye");
        } else {
            // Normal animation for non-locked state
            drawFocalPointAnimationFrame();
        }
        
        if (_userInitiatedUnlock) {
            _userInitiatedUnlock = false;
        }
        
        _animationFrameId = requestAnimationFrame(animate);
    }
    
    _animationFrameId = requestAnimationFrame(animate);
    console.log("Focal point animation started");
}

/**
 * Stop the focal point animation
 */
export function stopFocalPointAnimation() {
    if (_animationFrameId) {
        cancelAnimationFrame(_animationFrameId);
        _animationFrameId = null;
        console.log("Focal point animation stopped");
    }
}

/**
 * Enforce the lock state
 */
function enforceLockState() {
    if (_isLockedToBullsEye) {
        // console.log("Enforcing lock state - focal point should be at bulls-eye");
        const bullsEyePos = bullsEye.getBullsEye();
        moveFocalPointTo(bullsEyePos, "locked-to-bullsEye");
        
        // Ensure visual indicators are correct
        _focalPointElement.classList.add('locked-to-bulls-eye');
        document.body.classList.add('focal-point-locked');
        const bullsEyeElement = document.getElementById('bulls-eye');
        if (bullsEyeElement) {
            bullsEyeElement.classList.add('focal-point-locked');
        }
        
        // Ensure state is correct
        _isEasingToAimPoint = false;
        _isEasingToBullsEye = false;
        _isDraggable = false;
        _isBeingDragged = false;
        
        setStatus(FOCAL_POINT_STATE.LOCKED_TO_BULLS_EYE, "enforceLockState");
    }
}


/**
 * Ensure scene elements are interactive when focal point is locked
 */
function ensureSceneElementsInteractive() {
    if (!_isLockedToBullsEye) return;
    
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) return;
    
    // Ensure scene container has pointer events
    if (sceneContainer.style.pointerEvents !== 'auto') {
        sceneContainer.style.pointerEvents = 'auto';
    }
    
    // Ensure all biz-card-divs have pointer events
    const bizCardDivs = sceneContainer.querySelectorAll('.biz-card-div');
    bizCardDivs.forEach(div => {
        if (div.style.pointerEvents !== 'auto') {
            div.style.pointerEvents = 'auto';
        }
    });
}

// Call this function periodically in the animation loop
function animateFocalPoint() {
    // Existing animation code...
    
    // Ensure scene elements are interactive when focal point is locked
    ensureSceneElementsInteractive();
    
    // Rest of animation code...

    if (_isLockedToBullsEye) {
        bullsEye.recenterBullsEye("animateFocalPoint");

        const bullsEyeNow = bullsEye.getBullsEye("animateFocalPoint");
        setFocalPoint(bullsEyeNow, "animateFocalPoint: isLocked");
        setStatus(FOCAL_POINT_STATE.LOCKED_TO_BULLS_EYE, "animateFocalPoint");
    }
}

// Listen for events from dependencies
eventBus.on('viewPort:initialized', () => {
    console.log('ViewPort initialized, focalPoint can now use it');
});

/**
 * Log the current state of the focal point
 * Useful for debugging
 */
export function logFocalPointState() {
    console.log("=== Focal Point State ===");
    console.log(`_isLockedToBullsEye: ${_isLockedToBullsEye}`);
    console.log(`_isDraggable: ${_isDraggable}`);
    console.log(`_isBeingDragged: ${_isBeingDragged}`);
    console.log(`_isEasingToAimPoint: ${_isEasingToAimPoint}`);
    console.log(`_isEasingToBullsEye: ${_isEasingToBullsEye}`);
    console.log(`_isAwake: ${_isAwake}`);
    console.log(`Status: ${getStatus()}`);
    
    const position = getFocalPoint();
    console.log(`Position: x=${position.x}, y=${position.y}`);
    
    const bullsEyePos = bullsEye.getBullsEye();
    console.log(`BullsEye: x=${bullsEyePos.x}, y=${bullsEyePos.y}`);
    
    const aimPos = aimPoint.getAimPoint();
    console.log(`AimPoint: x=${aimPos.x}, y=${aimPos.y}`);
    
    console.log("========================");
}

function onFocalPointTransitionStart() {
    console.log("focal_point transition started");
    setStatus(FOCAL_POINT_STATE.EASING_TO_AIM_POINT, "onFocalPointTransitionStart");
}

function onFocalPointTransitionEnd() {
    console.log("focal_point transition ended");
    setStatus(FOCAL_POINT_STATE.ARRIVED_AT_AIM_POINT, "onFocalPointTransitionEnd");
}

function updateLockIcon() {
    const focalLockButton = document.getElementById('focal-lock');
    if (focalLockButton) {
        if (isLockedToBullsEye()) {
            focalLockButton.classList.add('locked');
        } else {
            focalLockButton.classList.remove('locked');
        }
    }
}

function setupMouseListeners() {
    _sceneContainer = document.getElementById('scene-container');
    if (!_sceneContainer) {
        console.error("Scene container not found, cannot set up mouse listeners for focal point.");
        return;
    }

    _sceneContainer.addEventListener('mousemove', (event) => {
        const rect = _sceneContainer.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Update aim point for focal point easing
        aimPoint.setAimPoint({ x: mouseX, y: mouseY });
    });
}

/**
 * @returns {boolean} Whether the focal point is initialized.
 * to give the illusion of 3D
 */
function focalPointAnimationLoop() {
    if (_isBeingDragged) {
        // do nothing
    }
    else if (_isLockedToBullsEye) {
        if ( _status != FOCAL_POINT_STATE.LOCKED_TO_BULLS_EYE &&
             _status != FOCAL_POINT_STATE.EASING_TO_BULLS_EYE ) {
            startEasingToBullsEye("focalPointAnimationLoop");
        }
    }
    else { // not locked, so should follow aimPoint
        if (mathUtils.distance(getFocalPoint(), aimPoint.getAimPoint()) > MAX_NEAR_DISTANCE) {
            startEasingToAimPoint("focalPointAnimationLoop");
        }
    }

    if (_isEasingToAimPoint) {
        easeTo(aimPoint.getAimPoint(), "focalPointAnimationLoop");
    } else if (_isEasingToBullsEye) {
        easeTo(bullsEye.getBullsEye(), "focalPointAnimationLoop");
    }

    notifyPositionListeners("focalPointAnimationLoop");

    requestAnimationFrame(focalPointAnimationLoop);
}

function wakeUp() {
    awaken(getFocalPoint());
}

function addDirectHoverHandlers(elements) {
    if (!elements || elements.length === 0) {
        console.warn("addDirectHoverHandlers: No elements found to add handlers to.");
        return;
    }

    try {
        elements.forEach(element => {
            addDirectMouseListeners(element);
        });
    } catch (error) {
        console.error("Error in addDirectHoverHandlers:", error);
    }
}

// This call is commented out because 'hoverizr' is not defined anywhere in the project.
// It appears to be leftover code from a refactoring.
/*
hoverizr.addHoverListenerFor(
    ".biz-card-div",
    (e) => {
        // Enter
        const element = e.target;
        // console.log(`Hoverizr mouseenter on ${element.id}`);
    },
    (e) => {
        // Leave
        const element = e.target;
        // console.log(`Hoverizr mouseleave on ${element.id}`);
    }
);
*/


