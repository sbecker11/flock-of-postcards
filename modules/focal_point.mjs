import * as typeValidators from './utils/typeValidators.mjs';
import * as colorUtils from './utils/colorUtils.mjs';
import * as domUtils from './utils/domUtils.mjs';
import * as arrayUtils from './utils/arrayUtils.mjs';
import * as typeConversions from './utils/typeConversions.mjs';
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

var _sceneContainer = document.getElementById("scene-container")
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
let _resizeObserver = null;

let _status = "asleep";
let _lastStatus = "asleep";

let _isLockedToBullsEye = false;
let _followPointerOutsideContainer = false;
let _pointerIsOutsideWindow = false;  // New state to track if pointer is outside window

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

// Add these functions near the top of the file, after the imports
function saveDraggableState(state) {
    try {
        localStorage.setItem('focalPoint_isDraggable', JSON.stringify(state));
    } catch (e) {
        logger.error('Failed to save draggable state:', e);
    }
}

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

function getDefaultState() {
    return {
        isDraggable: true,
        isLockedToBullsEye: false,
        lastPosition: null,
        dividerPosition: 50, // Default 50% split
        selectedPalette: null, // Will be set to first available palette
        lastUpdated: new Date().toISOString(),
        version: "1.0"
    };
}

export function saveState() {
    try {
        const paletteSelector = document.getElementById('color-palette-selector');
        const sceneContainer = document.getElementById('scene-container');
        
        const state = {
            isDraggable: _isDraggable,
            isLockedToBullsEye: _isLockedToBullsEye,
            lastPosition: getFocalPoint(),
            dividerPosition: parseFloat(sceneContainer.style.width) || 50,
            selectedPalette: paletteSelector ? paletteSelector.value : null,
            lastUpdated: new Date().toISOString(),
            version: "1.0"
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
        logger.log('Saved focal point state:', state);
    } catch (e) {
        logger.error('Failed to save focal point state:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return getDefaultState();
        }
        const state = JSON.parse(saved);
        logger.log('Loaded focal point state:', state);
        return state;
    } catch (e) {
        logger.error('Failed to load focal point state:', e);
        return getDefaultState();
    }
}

// Initialize state from storage
function initializeState() {
    const state = loadState();
    _isDraggable = state.isDraggable;
    _isLockedToBullsEye = state.isLockedToBullsEye;
    
    // Apply divider position
    const sceneContainer = document.getElementById('scene-container');
    const rightColumn = document.getElementById('right-column');
    if (sceneContainer && rightColumn) {
        const leftPercent = state.dividerPosition;
        const rightPercent = 100 - leftPercent;
        sceneContainer.style.width = `${leftPercent}%`;
        rightColumn.style.width = `${rightPercent}%`;
        const resizeHandle = document.getElementById('resize-handle');
        if (resizeHandle) {
            resizeHandle.style.left = `${leftPercent}%`;
        }
        // Update bulls-eye position after setting the divider
        updateBullsEyeCenter();
    }

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

// Export function to get current state (useful for debugging)
export function getCurrentState() {
    return loadState();
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
    if (!_sceneContainer || !_bullsEyeElement) {
        logger.error("Cannot update bulls-eye: missing elements");
        return;
    }

    const containerRect = _sceneContainer.getBoundingClientRect();
    const centerX = containerRect.left + (containerRect.width / 2);
    const centerY = containerRect.top + (containerRect.height / 2);

    // Update stored center position
    _bullsEyeCenter = { x: centerX, y: centerY };

    // Update bulls-eye element position
    _bullsEyeElement.style.left = `${centerX}px`;
    _bullsEyeElement.style.top = `${centerY}px`;

    logger.log("BullsEye position updated:", _bullsEyeCenter);
}

export function getBullsEye() {
    // Convert bulls-eye center to viewPort coordinates
    const containerRect = _sceneContainer.getBoundingClientRect();
    return {
        x: containerRect.left + (_sceneContainer.offsetWidth / 2),
        y: containerRect.top + (_sceneContainer.offsetHeight / 2)
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
    // Always use viewPort coordinates since FP is position: fixed
    return {
        x: event.clientX,
        y: event.clientY
    };
}

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

// -----------------------------------------------------
// save the caller's _sceneContainer and _focalPointElement.
//
export function createFocalPoint(focalPointElement) {
    if (!focalPointElement) {
        throw new Error("focalPointElement is null");
    }

    _focalPointElement = focalPointElement;
    _focalPointRadius = focalPointElement.getBoundingClientRect().width / 2.0;

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

    // Initial bulls-eye position update
    updateBullsEyeCenter();
    checkFixtureParents();

    // Add scene-div container event listeners
    _sceneContainer.addEventListener("mouseenter", onsceneContainerEnter);
    _sceneContainer.addEventListener("mousemove", onsceneContainerMove);
    _sceneContainer.addEventListener("mouseleave", onsceneContainerLeave);

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

    // Update bulls-eye position again after any CSS transitions complete
    setTimeout(() => {
        updateBullsEyeCenter();
    }, 310); // Match the transition duration from CSS
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
    if ( _bullsEyeElement.parentElement != _sceneContainer ) {
        throw new Error("bullsEyeParent is not the scene-div container");
    }
    _bullsEyeElement['saved-parent'] = _sceneContainer;

    if ( _aimPointDotElement.parentElement != _sceneContainer ) {
        throw new Error("aimPointParent is not the scene-div container");
    }
    _aimPointDotElement['saved-parent'] = _sceneContainer;

    if ( _focalPointElement.parentElement != _sceneContainer ) {
        throw new Error("focalPointParent is not the scene-div container");
    }
    _focalPointElement['saved-parent'] = _sceneContainer;
}


function onsceneContainerEnter(event) {
    const eventPosition = getEventPosition(event);
    setStatus("startEasingToAimPoint", "onsceneContainerEnter", LogLevel.LOG);
    awaken(eventPosition);
    startEasingToAimPoint("onsceneContainerEnter");
}

function onsceneContainerMove(event) {
    const eventPosition = getEventPosition(event);
    setAimPoint(eventPosition, "onsceneContainerMove");
}

function onsceneContainerLeave(event) {
    const eventPosition = getEventPosition(event);
    setStatus("leaveContainer", "onsceneContainerLeave", LogLevel.LOG);        
    if (!_followPointerOutsideContainer && !_isBeingDragged) {
        setAimPoint(getBullsEye(), "onsceneContainerLeave");
        startEasingToBullsEye("onsceneContainerLeave");
    }
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
    // Use viewPort coordinates for aim point dot too
    _aimPointDotElement.style.left = `${position.x}px`;
    _aimPointDotElement.style.top = `${position.y}px`;
    if (_aimPointDotElement.classList.contains('hidden')) {
        _aimPointDotElement.classList.remove('hidden');
    }
    if (prefix != "") {
        logger.log(`setAimPoint:${prefix}`, position);
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
        _focalPointElement.style.pointerEvents = 'all';
    } else {
        _focalPointElement.classList.remove('focal-point-is-draggable');
        _focalPointElement.style.pointerEvents = 'none';
    }
    saveState();
    logger.log(`toggleDraggable: ${_isDraggable}`);
}

// if focalPoint isDraggable and click on focalPoint then start dragging it
function onMouseDown_startDraggingFocalPoint(event) {
    if (!_isDraggable) {
        return;
    }
    const eventPosition = getEventPosition(event);
    event.preventDefault(); // prevent default browser behavior
    event.stopPropagation(); // Stop the event from reaching the scene-div

    // Update subpixel precision to match current position
    _focalPointNowSubpixelPrecision = eventPosition;
    
    set_isBeingDragged_true(eventPosition);
    moveFocalPointTo(eventPosition);

    // Don't disable pointer events on scene-div container to allow scrolling
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
            logger.info("Aim point mode: Locked to bulls-eye");
            moveFocalPointTo(getBullsEye(), "locked-to-bullsEye");
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

// Add this function before the handleKeyDown function
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

function onDocumentMouseMove(event) {
    if (!_followPointerOutsideContainer || _isBeingDragged) return;
    const eventPosition = getEventPosition(event);
    setAimPoint(eventPosition, "onDocumentMouseMove");
    startEasingToAimPoint("onDocumentMouseMove");
}

function onWindowMouseLeave(event) {
    if (!_followPointerOutsideContainer || _isBeingDragged) return;
    _pointerIsOutsideWindow = true;
    const exitPosition = getEventPosition(event);
    logger.info("Pointer left window at position:", exitPosition);
    // Keep the last known position
    setAimPoint(exitPosition, "window.mouseleave");
}

function onWindowMouseEnter(event) {
    if (!_followPointerOutsideContainer || _isBeingDragged) return;
    _pointerIsOutsideWindow = false;
    const entryPosition = getEventPosition(event);
    logger.info("Pointer re-entered window at position:", entryPosition);
    setAimPoint(entryPosition, "window.mouseenter");
    startEasingToAimPoint("window.mouseenter");
}

// Draw on window load
window.addEventListener('load', handleOnWindowLoad);

// Draw on window resize
window.addEventListener('resize', handleOnWindowResize);

// Function to initialize resize observer
function initializeResizeObserver() {
    if (_resizeObserver) {
        _resizeObserver.disconnect();
    }

    _resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target === _sceneContainer) {
                updateBullsEyeCenter();
                // If focal point is locked to bulls-eye, update its position too
                if (_isLockedToBullsEye) {
                    moveFocalPointTo(getBullsEye(), "resize-observer");
                }
            }
        }
    });

    if (_sceneContainer) {
        _resizeObserver.observe(_sceneContainer);
        logger.log("ResizeObserver initialized for scene-div container");
    }
}

// Clean up when needed (e.g., before page unload)
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

// Add cleanup listener
window.addEventListener('unload', cleanup);
