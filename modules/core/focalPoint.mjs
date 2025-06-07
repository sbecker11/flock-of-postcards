// modules/focalPoint.mjs

import * as domUtils from '../utils/domUtils.mjs';
import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewPort.mjs';
import * as resizeManager from './resizeHandle.mjs';
import * as bullsEye from './bullsEye.mjs';
import * as aimPoint from './aimPoint.mjs';

import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("focalPoint", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);

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

var _isFocalPointInitialized = false;
var _sceneContainer = document.getElementById("scene-container")
var _focalPointElement = document.getElementById("focal-point");
var _focalPointNowSubpixelPrecision;
var _isEasingToAimPoint = false;
var _isEasingToBullsEye = false;
var _isAwake = true;
var _isDraggable = true;
var _isBeingDragged = false;
let _focalPointRadius = 0;
const _mouseDrag = new MouseDrag();
let _resizeObserver = null;

let _status = "asleep";
let _lastStatus = "asleep";

let _isLockedToBullsEye = false;
let _followPointerOutsideContainer = false;
let _pointerIsOutsideWindow = false;  // New state to track if pointer is outside window

let _lastFocalPoint = {x:0, y:0};
let _lastSceneRect = { top:0, left:0, right:0, bottom:0 };

/**
 * sets the focalPoint's status
 * @param {*} new_status 
 * @param {*} prefix 
 */
function setStatus(new_status, prefix="") {
    _lastStatus = _status;
    _status = new_status;
    if ( _status != _lastStatus ) {
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
        logger.error('Failed to save draggable state:', e);
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
        logger.error('Failed to load draggable state:', e);
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
        isDraggable: true,
        isLockedToBullsEye: false,
        _lastPosition: null,
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
            _lastPosition: getFocalPoint(),
            // scenePercentage: resizeManager.getInstance().scenePercentage();
            selectedPalette: paletteSelector ? paletteSelector.value : null,
            lastUpdated: new Date().toISOString(),
            version: "1.0"
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
        //console.log('Saved focalPoint state:', state);
    } catch (e) {
        logger.error('Failed to save focalPoint state:', e);
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
        logger.error('Failed to load focalPoint state:', e);
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
    
    // Apply the sceneResizeHandle position
    // resizeManager.getInstance().setScenePercentage(state.resizeScenePercentage);
    const sceneContainer = document.getElementById('scene-container');
    const resumeContainer = document.getElementById('resume-container');
    // if (sceneContainer && resumeContainer) {
    //     const scenePercent = state.resizeScenePercentage;
    //     resizeHandle.setScenePercent(scenePercent);

    //     // Update bulls-eye position after setting the divider
    //     // updateBullsEye();
    // }

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

/**
 * on windwo load
 */
export function handleOnWindowLoad() {
    //console.log("focalPoint handlingOnWindowLoad");
    startEasingToBullsEye("handleOnWindowLoad");
}

/**
 * external function to set _isBeingDragged to true
 * @param {*} eventPosition 
 */
export function set_isBeingDragged_true(eventPosition) {
    _isBeingDragged = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    aimPoint.setAimPoint(eventPosition, "set_isBeingDragged_true");
    _mouseDrag.setStartPosition(eventPosition);
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
    if ( !isFocalPointInitialized() ) {
        return null;
    }
    const rect = _focalPointElement.getBoundingClientRect();
    return {
        x: rect.left + _focalPointRadius,
        y: rect.top + _focalPointRadius
    }
}

export function getSceneRelativeVpRect() {
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

export function moveFocalPointTo(position, prefix="") {
    if (_isLockedToBullsEye && prefix !== "locked-to-bullsEye") {
        //console.log("moveFocalPointTo ignored while locked to bulls-eye");
        return;
    }
    // calculate distance moved since last call
    const squaredDist = mathUtils.getPositionsSquaredDistance(position, _lastPosition);
    _lastPosition = position;

    // skip move if move is too small
    if ( squaredDist < 0.25 ) { // 0.5 squared
        setStatus("PAUSED");
        return; 
    }
    else {
        if ( getStatus() === "PAUSED" ) {
            setStatus("RUNNING");
        };
    }
    
    //console.log("moveFocalPointTo", position);
    // Use viewPort coordinates directly
    _focalPointElement.style.left = `${position.x}px`;
    _focalPointElement.style.top = `${position.y}px`;

    notifyPositionListeners("moveFocalPointTo");
    saveState(); // Save state when position changes
}

export function isFocalPointInitialized() {
    return _isFocalPointInitialized;
}

/** 
 * initializeFocalPoint's internal settiings
 * as well as _sceneContainer and _focalPointElement.
 */
export function initializeFocalPoint(focalPointElement) {
    if ( _isFocalPointInitialized ) {
        console.info("focalPoint ignoring duplicate initialization request");
        return;
    }
    _isFocalPointInitialized = true;

    _focalPointElement = document.getElementById("focal-point");
    if ( !_focalPointElement ) throw new Error("initializeFocalPoint focal-point element not found");
    _focalPointRadius = _focalPointElement.getBoundingClientRect().width / 2.0;
    
    _focalPointNowSubpixelPrecision = getFocalPoint();
    _isAwake = true;
    _isEasingToBullsEye = false;
    
    // Set initial pointer-events based on loaded draggable state
    _focalPointElement.style.pointerEvents = _isDraggable ? 'all' : 'none';
    if (_isDraggable) {
        _focalPointElement.classList.add('focal-point-is-draggable');
    }
    
    if (!_sceneContainer) {
        throw new Error("sceneContainer not initialized");
    }

    // Initialize resize observer before any other operations
    initializeResizeObserver();

    // Add window resize listener
    window.addEventListener('resize', () => handleViewPortChange("window-resize"));

    console.log('✅ ViewPort change listeners added');

    // Add scene-plane container event listeners
    _sceneContainer.addEventListener("mouseenter", onsceneContainerEnter);
    _sceneContainer.addEventListener("mousemove", onSceneContainerMove);
    _sceneContainer.addEventListener("mouseleave", onSceneContainerLeave);

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

    // Add scroll/wheel pass-through handlers
    _focalPointElement.addEventListener('wheel', handleScrollPassThrough, { passive: false });
    _focalPointElement.addEventListener('scroll', handleScrollPassThrough, { passive: false });

    aimPoint.setAimPoint(bullsEye.getBullsEye(), "createFocalPoint");
    moveFocalPointTo(aimPoint.getAimPoint(), "createFocalPoint");

    // Update bulls-eye position again after any CSS transitions complete
    // setTimeout(() => {
    //     updateBullsEye();
    // }, 310); // Match the transition duration from CSS
}

/**
 * internal list of listeners
 */
const _focalPointPositionListeners = [];

/**
 * Detects change of focalPoint or sceneRect
 * @returns true if position has sufficient motion
 */
function positionsChanged() {
    // Get values once
    const focalPoint = getFocalPoint();
    const sceneRect = getSceneRelativeVpRect();

    // validate once
    utils.validatePosition(focalPoint);
    utils.validateRect(sceneRect);

    let moved = false;

    const focalPointDist = mathUtils.getPositionsSquaredDistance(focalPoint, _lastFocalPoint);
    if ( focalPointDist >= FOCALPOINT_EPSILON ) {
        moved = true;
        _lastFocalPoint = focalPoint;
    }

    const sceneRectsDiff = mathUtils.getRectSquaredDifference(sceneRect,_lastSceneRect);
    if ( sceneRectsDiff > SCENERECT_EPSILON ) {
        moved = true;
        _lastSceneRect = sceneRect;
    }

    if ( !moved ) {
        console.log("focalPoint.notifyPositionListeners: no motion detected");
        return false;
    }
    return true;
}

/**
 * Notify listeners that the focalPoint or the sceneRelativeVpRect has moved
 * and both have been initialized
 * @param {position} viewRelativeFP - viewPort-relative position of focalPoint
 * @param {string} optional prefix for verbosity
 * @param {DOMRect} sceneRelativeVpRect scene-relative viewport rect
 */
function notifyPositionListeners(prefix="") {

    // Check global conditions once
    if (!isFocalPointInitialized() || !viewPort.isViewPortInitialized() ) {
        console.warn("notifyPositionListeners: System not initialized");
        return;
    }
    // check for motion detected
    if ( !positionsChanged() ) {
        return;
    }

    // load once
    const focalPoint = getFocalPoint();
    const sceneRect = getSceneRelativeVpRect();

    // notify all listeners
    for ( const listener of _focalPointPositionListeners ) {
        try {
            listener( focalPoint, prefix, sceneRect );
        } catch (e) {
            console.error("focalPoint.notifyPositionListeners:", e);
        }
    }
}

/**
 * internal function
 */
export function clearFocalPointPositionListeners() {
    _focalPointPositionListeners.length = 0;
}

/**
 * external function used to add a listener for focalPoint position changes
 * @param {*} listener 
 */
export function addFocalPointPositionListener(listener) {
    if (typeof listener === "function") {
        //console.info("addFocalPointPositionListener", listener.name);
        _focalPointPositionListeners.push(listener);
    } else {
        throw new Error("Listener must be a function");
    }
}



/**
 * called when the pointer enters the scene-plane
 * @param {} event 
 */
function onsceneContainerEnter(event) {
    const eventPosition = getEventPosition(event);
    setStatus("startEasingToAimPoint", "onsceneContainerEnter", LogLevel.LOG);
    awaken(eventPosition);
    startEasingToAimPoint("onsceneContainerEnter");
}

/**
 * called when the pointer moves within the scene-plane
 * @param {} event 
 */
function onSceneContainerMove(event) {
    const eventPosition = getEventPosition(event);
    aimPoint.setAimPoint(eventPosition, "onSceneContainerMove");
}
/**
 * called when the pointer leaves the scene-plane
 * @param {} event 
 */
function onSceneContainerLeave(event) {
    const eventPosition = getEventPosition(event);
    setStatus("leaveContainer", "onSceneContainerLeave", LogLevel.LOG);        
    if (!_followPointerOutsideContainer && !_isBeingDragged) {
        aimPoint.setAimPoint(bullsEye.getBullsEye(), "onSceneContainerLeave");
        startEasingToBullsEye("onSceneContainerLeave");
    }
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
    setStatus("easingToAimPoint", `startEasingToAimPoint:${prefix}`, LogLevel.LOG);

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

    setStatus("easingToBullsEye", `startEasingToBullsEye:${prefix}`);
}

/**
 * called whent the focalPoint arrives at the bullsEye
 * @param {*} eventPosition 
 */
export function handleArrivedAtBullsEye(eventPosition) {
    setStatus("arrivedAtBullsEye", "handleArrivedAtBullsEye", LogLevel.LOG);
    goToSleep(eventPosition);
}

/**
 * tells the focalPoint to stop moving
 * @param {*} position 
 */
export function goToSleep(position) {
    utils.removeClass(_focalPointElement, "awake");
    _isAwake = false;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;

    setStatus("asleep", "goToSleep", LogLevel.LOG);
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

    setStatus("awake", "awaken", LogLevel.LOG);
}

/**
 * @returns true if the focalPoint is draggable
 */
export function isDraggable() {
    return _isDraggable;
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
    if (_isBeingDragged) {
        return;
    }

    const currentPos = getFocalPoint();
    const aimPos = aimPoint.getAimPoint();
    const dist = mathUtils.getPositionsEuclideanDistance(currentPos, aimPos);

    // //console.log("Animation frame:", {
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
        //console.log("Moving to new position:", newPos);
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
 * external function used to toggle draggable state
 */
export function toggleDraggable() {
    //console.info("********** toggleDraggable called isDraggable:", _isDraggable);
    _isDraggable = !_isDraggable;
    if (_isDraggable) {
        _focalPointElement.classList.add('focal-point-is-draggable');
        _focalPointElement.style.pointerEvents = 'all';
    } else {
        _focalPointElement.classList.remove('focal-point-is-draggable');
        _focalPointElement.style.pointerEvents = 'none';
    }
    saveState();
    //console.info(`toggleDraggable: ${_isDraggable}`);
}

export function toggleLockedToBullsEye() {
    _isLockedToBullsEye = !_isLockedToBullsEye;
    if (_isLockedToBullsEye) {
        moveFocalPointTo(bullsEye.getBullsEye(), "locked-to-bullsEye");
        if (_isDraggable) {
            toggleDraggable();
        }
    } else {
        if (!_isDraggable) {
            toggleDraggable();
        }
    }
    saveState();
    //console.info(`toggleLockedToBullsEye: ${_isLockedToBullsEye}`);
}

/**
 * internal function used to click on the focalPoint
 * to let the mouse start dragging it if it is 
 * draggable and is not already being dragged
 * */ 
function onMouseDown_startDraggingFocalPoint(event) {
    if (!_isDraggable) {
        return;
    }
    const eventPosition = getEventPosition(event);
    event.preventDefault(); // prevent default browser behavior
    event.stopPropagation(); // Stop the event from reaching the scene-plane

    // Update subpixel precision to match current position
    _focalPointNowSubpixelPrecision = eventPosition;
    
    set_isBeingDragged_true(eventPosition);
    moveFocalPointTo(eventPosition);

    // Don't disable pointer events on scene-plane container to allow scrolling
    document.body.style.userSelect = 'none';
    _focalPointElement.classList.add('focal-point-is-being-dragged');
    // Ensure pointer events stay enabled during drag
    _focalPointElement.style.pointerEvents = 'all';

    utils.updateEventListener(document, 'mousemove', onMouseDrag_keepDraggingFocalPoint);
    utils.updateEventListener(document, 'mouseup', onMouseUp_stopDraggingFocalPoint, { once: true });
}

/**
 * internal function called while focalPoint is
 * being dragged by mouse
 * @param {*} event 
 * @returns 
 */
function onMouseDrag_keepDraggingFocalPoint(event) {
    if (!_isDraggable || !_isBeingDragged) {
        return;
    }
    const eventPosition = getEventPosition(event);
    
    // Keep subpixel precision in sync during drag
    _focalPointNowSubpixelPrecision = eventPosition;
    
    moveFocalPointTo(eventPosition);
    aimPoint.setAimPoint(eventPosition, "onMouseDrag_keepDraggingFocalPoint");
}

/**
 * function to handle the case when the mouse is released
 * while dragging the focalPoint
 * @param {*} event 
 * @param {*} prefix 
 * @returns 
 */
function onMouseUp_stopDraggingFocalPoint(event, prefix="") {
    if (!_isDraggable) {
        return;
    }
    
    const eventPosition = getEventPosition(event);
    
    // Move to final position first
    moveFocalPointTo(eventPosition);
    aimPoint.setAimPoint(eventPosition, "onMouseUp_stopDraggingFocalPoint");
    _focalPointNowSubpixelPrecision = eventPosition;  // Update subpixel position
    
    set_isBeingDragged_false(eventPosition);

    // Cleanup
    _focalPointElement.style.pointerEvents = 'all';  // Keep pointer events enabled if still draggable
    document.body.style.userSelect = 'auto';
    _focalPointElement.classList.remove('focal-point-is-being-dragged');

    utils.updateEventListener(document, 'mousemove', onMouseDrag_keepDraggingFocalPoint, { remove: true });
}


/**
 * external function used to toggle followPointerOutsideContainer state
 * be sure  this function before the handleKeyDown function
 */ 
export function toggleFollowPointerOutsideContainer() {
    _followPointerOutsideContainer = !_followPointerOutsideContainer;
    //console.log(`Aim point mode: ${_followPointerOutsideContainer ? 'Following pointer (window bounds)' : 'Container bounds only'}`);
    if (_followPointerOutsideContainer) {
        document.addEventListener('mousemove', onDocumentMouseMove);
        window.addEventListener('mouseleave', onWindowMouseLeave);
        window.addEventListener('mouseenter', onWindowMouseEnter);
    } else {
        document.removeEventListener('mousemove', onDocumentMouseMove);
        window.removeEventListener('mouseleave', onWindowMouseLeave);
        window.removeEventListener('mouseenter', onWindowMouseEnter);
        if (!_isBeingDragged) {
            startEasingToBullsEye("toggleFollowPointerOutsideContainer");
        }
    }
}

/**
 * called when the pointer moves within the document
 * @param {*} event 
 * @returns 
 */
function onDocumentMouseMove(event) {
    if (!_followPointerOutsideContainer || _isBeingDragged) return;
    const eventPosition = getEventPosition(event);
    aimPoint.setAimPoint(eventPosition, "onDocumentMouseMove");
    startEasingToAimPoint("onDocumentMouseMove");
}

/**
 * called when the pointer leaves the window
 * @param {*} event 
 * @returns 
 */
function onWindowMouseLeave(event) {
    if (!_followPointerOutsideContainer || _isBeingDragged) return;
    _pointerIsOutsideWindow = true;
    const exitPosition = getEventPosition(event);
    //console.log("Pointer left window at position:", exitPosition);
    // Keep the last known position
    aimPoint.setAimPoint(exitPosition, "window.mouseleave");
}

/**
 * called when the pointer enters the window
 * @param {*} event 
 * @returns 
 */
function onWindowMouseEnter(event) {
    if (!_followPointerOutsideContainer || _isBeingDragged) return;
    _pointerIsOutsideWindow = false;
    const entryPosition = getEventPosition(event);
    //console.log("Pointer re-entered window at position:", entryPosition);
    aimPoint.setAimPoint(entryPosition, "window.mouseenter");
    startEasingToAimPoint("window.mouseenter");
}

/**
 * handles the case when the window is resized
 * and the focalPoint is locked to bullsEye state
 */
window.addEventListener('resize', handleOnWindowResize);

// Add debounce utility variables
let _resizeTimeout = null;
const RESIZE_DEBOUNCE_DELAY = 150; // ms

// Immediate parallax update (smooth)
function handleViewPortChangeImmediate(source = "unknown") {
    console.log(`🔄 Immediate ViewPort change from: ${source}`);

    if (!isFocalPointInitialized() || !viewPort.isViewPortInitialized()) {
        return;
    }

    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) return;

    // Update focal point position if locked to bulls-eye
    if (_isLockedToBullsEye) {
        moveFocalPointTo(bullsEye.getBullsEye(), `viewport-change-${source}`);
    }

    // Trigger parallax update with current dimensions
    scrollTopUpdated(sceneContainer.scrollTop);
}

// Debounced resize completion (for heavy operations)
function handleViewPortChangeComplete(source = "unknown") {
    console.log(`✅ ViewPort resize completed from: ${source}`);

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

    _resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target === _sceneContainer) {
                handleViewPortChange("container-resize");
            }
        }
    });

    if (_sceneContainer) {
        _resizeObserver.observe(_sceneContainer);
        //console.log("ResizeObserver initialized for scene-plane container");
    }
}

/**
 * Clean up when needed (e.g., before page unload)
 */
function cleanup() {
    if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
    }
    // Clean up the window event listeners
    if (_followPointerOutsideContainer) {
        document.removeEventListener('mousemove', onDocumentMouseMove);
        window.removeEventListener('mouseleave', onWindowMouseLeave);
        window.removeEventListener('mouseenter', onWindowMouseEnter);
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
        logger.error('scene-container not found for scroll pass-through');
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
    const sceneRelativeVpRect = {
        left: vpRect.left,
        top: vpRect.top + scrollTop,
        right: vpRect.right,
        bottom: vpRect.bottom + scrollTop
    };

    // Get current focal point position
    const viewRelativeFP = getFocalPoint();

    // Notify all focalPointPositionListeners with the scene-relative rect
    notifyPositionListeners("scrollTopUpdated");

    //console.log('FocalPoint: scrollTopUpdated', scrollTop, 'scene-relative rect:', sceneRelativeVpRect);
}

/**
 * Call cleanup function when the page is unloaded
 */
window.addEventListener('unload', cleanup);

// ============================================
// Animation Loop Functions
// ============================================

let animationId = null;

/**
 * Start the focal point animation loop
 */
export function startFocalPointAnimation() {
    if (animationId) {
        return; // Already running
    }

    function animationLoop() {
        drawFocalPointAnimationFrame();
        animationId = requestAnimationFrame(animationLoop);
    }
    animationLoop();
    //console.log("Focal point animation started");
}

/**
 * Stop the focal point animation loop
 */
export function stopFocalPointAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        //console.log("Focal point animation stopped");
    }
}
