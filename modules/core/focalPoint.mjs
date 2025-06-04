// modules/focalPoint.mjs

import * as domUtils from '../utils/domUtils.mjs';
import * as utils from '../utils/utils.mjs';
import * as viewPort from './viewPort.mjs';
import * as resizeManager from './resizeHandle.mjs';
import { getBullsEyeCenter, updateBullsEyeCenter } from './bullsEye.mjs';
import * as aimPoint from './aimPoint.mjs';
import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("focal_point", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);

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
        logger.log(prefix, _status);
    }
}

export function getFocalPointStatus() {
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
        lastPosition: null,
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
            lastPosition: getFocalPoint(),
            // scenePercentage: resizeManager.getInstance().scenePercentage();
            selectedPalette: paletteSelector ? paletteSelector.value : null,
            lastUpdated: new Date().toISOString(),
            version: "1.0"
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
        logger.log('Saved focalPoint state:', state);
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
        logger.log('Loaded focalPoint state:', state);
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
    //     // updateBullsEyeCenter();
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
    logger.log("focalPoint handlingOnWindowLoad");
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
    logger.log("set _isBeingDragged:", _isBeingDragged, "eventPosition:", eventPosition);
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
    logger.log("set _isBeingDragged:", _isBeingDragged, "eventPosition:", eventPosition);
}


/**
 * called on window resize
 */
export function handleOnWindowResize() {
    logger.log("focalPoint handlingOnWindowLoad");
   startEasingToBullsEye("handleOnWindowResize");
}

/**
 * @returns the focalPoint viewPort-relative center
 */
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
export function moveFocalPointTo(position, prefix="") {
    if (_isLockedToBullsEye && prefix !== "locked-to-bullsEye") {
        return; // Don't move if locked to bulls-eye
    }
    
    // Use viewPort coordinates directly
    _focalPointElement.style.left = `${position.x}px`;
    _focalPointElement.style.top = `${position.y}px`;

    notifyPositionListeners(position, prefix);
    saveState(); // Save state when position changes
}
/** 
 * initializeFocalPoint's internal settiings
 * as well as _sceneContainer and _focalPointElement.
 */
export function initializeFocalPoint(focalPointElement) {
    if ( _isFocalPointInitialized ) {
        console("focalPoint ignoring duplicate initialization request");
        return;
    }
    _isFocalPointInitialized = true;

    _focalPointElement = document.getElementById("focal-point");
    if ( !_focalPointElement ) throw new Error("initializeFocalPoint focal-point element not found");
    _focalPointRadius = _focalPointElement.getBoundingClientRect().width / 2.0;

    // Initialize state from storage
    const state = initializeState();
    
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
    
    logger.log("Scene-div container initialized:", {
        exists: !!_sceneContainer,
        width: _sceneContainer.offsetWidth,
        left: _sceneContainer.offsetLeft,
        state: state
    });

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

    aimPoint.setAimPoint(getBullsEyeCenter(), "createFocalPoint");
    moveFocalPointTo(getBullsEyeCenter(), "createFocalPoint");

    // Update bulls-eye position again after any CSS transitions complete
    // setTimeout(() => {
    //     updateBullsEyeCenter();
    // }, 310); // Match the transition duration from CSS
}

/**
 * internal list of listeners
 */
const _focalPointPositionListeners = [];

/**
 * Notify listeners that the focalPoint has moved
 * @param {} vewPort-relative position of focalPoint center
 * @param {*} prefix for verbosity
 */
function notifyPositionListeners(position, prefix="") {
    for (const listener of _focalPointPositionListeners) {
        listener(position, prefix);
    }
}

/**
 * 
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
        aimPoint.setAimPoint(getBullsEyeCenter(), "onSceneContainerLeave");
        startEasingToBullsEye("onSceneContainerLeave");
    }
}

/*
 * tells the focalPoint to move to the aimPoint
 * unless being dragged by mouse
*/
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


/**
 * tells the focalPoint to start easing toward the bullsEye
 * unless being dragged by mouse
 * @param {*} prefix for verbosity
 */
export function startEasingToBullsEye(prefix="") {
    if (_isBeingDragged) {
        logger.log("startEasingToBullsEye ignored while _isBeingDragged");
        return;
    }

    aimPoint.setAimPoint(getBullsEyeCenter(), `startEasingToBullsEye:${prefix}`);
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

/**
 * @param {*} pos1 
 * @param {*} pos2 
 * @returns the maximum rectangulare distance between the two positions
 */
function getPositionsDist(pos1, pos2) {
    try {
        return utils.max(utils.abs_diff(pos1.x,pos2.x), utils.abs_diff(pos1.y,pos2.y));
    } catch (e) {
        logger.error("getPositionsDist error:", e);
        return 1000;
    }
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
    const dist = getPositionsDist(currentPos, aimPos);

    // logger.log("Animation frame:", {
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
        //logger.log("Moving to new position:", newPos);
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
    _isDraggable = !_isDraggable;
    if (_isDraggable) {
        _focalPointElement.classList.add('focal-point-is-draggable');
        _focalPointElement.style.pointerEvents = 'all';
    } else {
        _focalPointElement.classList.remove('focal-point-is-draggable');
        _focalPointElement.style.pointerEvents = 'none';
    }
    saveState();
    logger.log(`toggleDraggable: ${_isDraggable}`);
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
 * function that handles keyboard events
 * @param {*} event 
 */
export function handleKeyDown(event) {
    if (event.key === 'b') {
        _isLockedToBullsEye = !_isLockedToBullsEye;
        if (_isLockedToBullsEye) {
                logger.info("Aim point mode: Locked to bulls-eye");
                moveFocalPointTo(getBullsEyeCenter(), "locked-to-bullsEye");
            if (_isDraggable) {
                toggleDraggable();
            }
        } else {
            logger.info("Aim point mode: Free movement");
            if (!_isDraggable) {
                toggleDraggable();
            }
        }
        saveState();
        event.preventDefault();
    }
}

/**
 * external function used to toggle followPointerOutsideContainer state
 * be sure  this function before the handleKeyDown function
 */ 
export function toggleFollowPointerOutsideContainer() {
    _followPointerOutsideContainer = !_followPointerOutsideContainer;
    logger.info(`Aim point mode: ${_followPointerOutsideContainer ? 'Following pointer (window bounds)' : 'Container bounds only'}`);
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
    logger.info("Pointer left window at position:", exitPosition);
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
    logger.info("Pointer re-entered window at position:", entryPosition);
    aimPoint.setAimPoint(entryPosition, "window.mouseenter");
    startEasingToAimPoint("window.mouseenter");
}

/**
 * handles the case when the window is resized
 * and the focalPoint is locked to bullsEye state
 */
window.addEventListener('resize', handleOnWindowResize);

// Function to initialize resize observer
function initializeResizeObserver() {
    if (_resizeObserver) {
        _resizeObserver.disconnect();
    }

    _resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target === _sceneContainer) {
            //     updateBullsEyeCenter();
                // If focalPoint is locked to bulls-eye, update its position too
                if (_isLockedToBullsEye) {
                    moveFocalPointTo(getBullsEyeCenter(), "resize-observer");
                }
            }
        }
    });

    if (_sceneContainer) {
        _resizeObserver.observe(_sceneContainer);
        logger.log("ResizeObserver initialized for scene-plane container");
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
 * Call cleanup function when the page is unloaded
 */
window.addEventListener('unload', cleanup);
