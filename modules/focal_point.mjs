import * as utils from './utils.mjs';
import { Logger, LogLevel } from "./logger.mjs";
const logger = new Logger("focal_point", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);

const EASE_FACTOR = 0.15;
const EPSILON = EASE_FACTOR / 2.0;
const MAX_NEAR_DISTANCE = 0.5;
const BULLSEYE_WONKYOFFSET = 25; // 12.5

// custom double-click logic
let lastClickTime = 0;
const DOUBLE_CLICK_DELAY = 300; // Maximum delay in milliseconds for a double-click

var _currentStatus = null;
var _lastStatus = null;
var _canvasContainer;
var _focalPointElement;
var _aimPointDotElement = document.getElementById("aim-point-dot");
const _aimPointDotRadius = 5;
var _bullsEyeElement = document.getElementById("bulls-eye");
if ( !_bullsEyeElement ) {
    throw new Error("bulls-eye element not found");
}
var _focalPointNowSubpixelPrecision;
var _aimPoint = null;
var _focalPointPositionListener;
var _isEasingToAimPoint = false;
export var _isAwake = true;
var _isEasingToBullsEye = false;
var _isEasingToMouse = true;
export var _isDraggable = true;

let _focalPointRadius = 0;
let _bullsEyeCenter = { x: 0, y: 0 };

// on windwo load
export function handleOnWindowLoad() {
    logger.log("focalPoint handlingOnWindowLoad");

    // Compute initial bullsEye center
    updateBullsEyeCenter();
    // drawViewportDiagonals();

    startEasingToBullsEye(getFocalPoint());
}

var _byMouseIsBeingDragged = false;

export function setIsBeingDraggedByMouse_false(eventPosition) {
    setAimPoint(eventPosition);
    _byMouseIsBeingDragged = false;
    logger.log("set isBeingDraggedByMouse:", _byMouseIsBeingDragged);
}
export function setIsBeingDraggedByMouse_true() {

    _byMouseIsBeingDragged = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    _isEasingToMouse = false;
    clearAimPoint();

    logger.log("set isBeingDraggedByMouse:", _byMouseIsBeingDragged);
}
export function getIsBeingDraggedByMouse() {    
    return _byMouseIsBeingDragged;
}

export function handleOnWindowResize() {
    updateBullsEyeCenter();
    startEasingToBullsEye(getFocalPoint());
    // drawViewportDiagonals();
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
    return _bullsEyeCenter;
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
    return {
        x: event.pageX,
        y: event.pageY
    };
}

export function moveFocalPointTo(position) {
    _lastStatus = _currentStatus;
    _currentStatus = "moveFocalPoint";

    // Since we're using transform: translate(-50%, -50%), we need to set the position directly
    _focalPointElement.style.left = `${position.x}px`;
    _focalPointElement.style.top = `${position.y}px`;

    notifyPositionListeners(position);
}

function addFocalPointListener(listener) {
    if (typeof listener === "function") {
        _focalPointPositionListener = listener;
    } else {
        throw new Error("Listener must be a function");
    }
}

function notifyPositionListeners(position) {
    if (_focalPointPositionListener) {
        _focalPointPositionListener(position);
    }
}

// -----------------------------------------------------
// save the caller's _canvasContainer and _focalPointElement.
// save the caller's callback function, focalPointListener,
// which will be called while the focalPoint is moving.
//
export function createFocalPointWithPositionListener(
    focalPointElement,
    focalPointPositionListener) {
    if ( !focalPointElement ) {
        console.error("focalPointElement not initialized");
        return;
    }
    _focalPointElement = focalPointElement;
    _focalPointRadius = focalPointElement.getBoundingClientRect().width / 2.0;

    _focalPointNowSubpixelPrecision = getFocalPoint();
    _isAwake = true;
    _isEasingToBullsEye = false;
    _isEasingToMouse = true;
    _canvasContainer = document.getElementById("canvas-container");
    if (!_canvasContainer) {
        throw new Error("canvasContainer not initialized");
    }
    logger.log("Canvas container initialized:", {
        exists: !!_canvasContainer,
        width: _canvasContainer.offsetWidth,
        left: _canvasContainer.offsetLeft
    });

    updateBullsEyeCenter();
    
    if ( focalPointPositionListener ) {
        addFocalPointListener(focalPointPositionListener);
    }

    // Add canvas container event listeners
    utils.updateEventListener( _canvasContainer, "mouseenter", onCanvasContainerEnter);
    utils.updateEventListener( _canvasContainer, "mousemove", onCanvasContainerMove);
    utils.updateEventListener( _canvasContainer, "mouseleave", onCanvasContainerLeave);

    // Add hover listeners to the focal-point element
    utils.updateEventListener(_focalPointElement, 'mouseenter', () => {
        utils.addClass(_focalPointElement, 'draggable-focal-point');
    });

    utils.updateEventListener(_focalPointElement, 'mouseleave', () => {
        utils.removeClass(_focalPointElement, 'draggable-focal-point');
    });

    // Add drag event listeners to the focal-point element
    utils.updateEventListener(_focalPointElement, 'mousedown', onMouseDown_startDraggingFocalPoint);

    moveFocalPointTo(getBullsEye());
}

export function onCanvasContainerEnter(event) {
    const eventPosition = getEventPosition(event);
    _lastStatus = _currentStatus;
    _currentStatus = "enterContainer";
    if ( _currentStatus != _lastStatus )
        logger.log("onCanvasContainerEnter status:", _currentStatus);

    awaken(eventPosition);

    startEasingToMouse(eventPosition);
}

export function onCanvasContainerMove(event) {
    const eventPosition = getEventPosition(event);
    setAimPoint(eventPosition);
}

export function onCanvasContainerLeave(event) {
    const eventPosition = getEventPosition(event);
    _lastStatus = _currentStatus;
    _currentStatus = "leaveContainer";
    logger.log("onCanvasContainerLeave called with position:", eventPosition);
    logger.log("Current status:", _currentStatus);
    logger.log("Is being dragged:", getIsBeingDraggedByMouse());
        
    startEasingToBullsEye(eventPosition);
}

// unless being dragged by mouse
export function startEasingToMouse( position) {
    if ( getIsBeingDraggedByMouse() ) {
        // logger.log("startEasingToMouse ignored while isBeingDraggedByMouse");
        return;
    }
    _lastStatus = _currentStatus;
    _currentStatus = "easingToMouse";
    if ( _currentStatus != _lastStatus ) {
        // logger.log("startEasingToMouse:", position);
    }

    setAimPoint( position );
    _isEasingToAimPoint = true;
    _isEasingToMouse = true;
    _isEasingToBullsEye = false;
    _isAwake = true;
    
    // add mousedown listener to start dragging
    utils.updateEventListener(_focalPointElement, 'mousedown', onMouseDown_startDraggingFocalPoint);
}


// unless being dragged by mouse
export function startEasingToBullsEye(position) {
    if (getIsBeingDraggedByMouse()) {
        // logger.log("startEasingToBullsEye ignored while isBeingDraggedByMouse");
        return;
    }
    // logger.log("Starting to ease to bulls eye at position:", position);
    // logger.log("Current bulls eye position:", getBullsEye());
    
    setAimPoint(getBullsEye());
    _isEasingToAimPoint = true;
    _isEasingToBullsEye = true;
    _isEasingToMouse = false;
    _isAwake = true;

    _lastStatus = _currentStatus;
    _currentStatus = "easingToBullsEye";
    logger.log("Status changed to:", _currentStatus);
}

export function setAimPoint(position) {
    _aimPoint = position;
    _aimPointDotElement.style.left = `${position.x}px`;
    _aimPointDotElement.style.top = `${position.y}px`;
    if( _aimPointDotElement.classList.contains('hidden') ) {
        _aimPointDotElement.classList.remove('hidden');
    }
    // logger.log("setAimPoint:", position);
}

export function clearAimPoint() {
    _aimPoint = null;
    _aimPointDotElement.classList.add('hidden');
    logger.log("clearAimPoint");
}

export function isAimPointNull() {
    return _aimPoint == null;
}

export function getAimPoint() {
    return _aimPoint;
}

export function handleArrivedAtBullsEye(eventPosition) {
    _lastStatus = _currentStatus;
    _currentStatus = "arrivedAtBullsEye";
    if ( _currentStatus != _lastStatus ) {}
        logger.log('Focal point reached the BullsEye.');

    goToSleep(eventPosition);
}

export function goToSleep(position) {
    utils.removeClass(_focalPointElement, "awake");
    _isAwake = false;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    _isEasingToMouse = false;

    _lastStatus = _currentStatus;
    _currentStatus = "not awake";
    if ( _currentStatus != _lastStatus ) {
        logger.log('Focal point status is now:', _currentStatus);
    }
}

export function awaken(position) {
    utils.addClass(_focalPointElement, "awake");
    _isAwake = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    _isEasingToMouse = false;

    _lastStatus = _currentStatus;
    _currentStatus = "awake";
    if ( _currentStatus != _lastStatus ) {
        logger.log('Focal point status is now:', _currentStatus);
    }
}

// this happens quite often
export function handleArrivedAtMouse(position) {
    _lastStatus = _currentStatus;
    _currentStatus = "arrivedAtMouse";
    if ( _currentStatus != _lastStatus ) {
        logger.log("arrived at mouse:", _isEasingToMouse)
    }
}

// this should never happen
export function handleArrivedAtAimPoint(position) {
    _lastStatus = _currentStatus;
    _currentStatus = "arrivedAtMouse";
    if ( _currentStatus != _lastStatus ) {
        logger.log("arrived at aimPoint")
    }
}


export function awakeAndStartEasingToMouse( wakeUpPosition ) {
    // Change the focal point's color to white
    utils.addClass(_focalPointElement, "awake");
    _isAwake = true;
    _lastStatus = _currentStatus;
    _currentStatus = "awake";
    if ( _currentStatus != _lastStatus )
        logger.log("Waking up at ", wakeUpPosition);
    startEasingToMouse( wakeUpPosition );
}
function max(a,b) {
    if ( a > b )
        return a;
    return b;
}
function abs(a) {
    if ( a < 0 )
        return -a;
    return a;
}
export function getPositionsDist( pos1, pos2 ) {
    if ( pos1 == null || pos2 == null )
        return 1000;
    return max(abs(pos1.x - pos2.x),  abs(pos1.y - pos2.y));
}

// unless being dragged by mouse
export function drawFocalPointAnimationFrame() {
    if (getIsBeingDraggedByMouse()) {
        _lastStatus = _currentStatus;
        _currentStatus = "drawIgnored";
        if (_currentStatus != _lastStatus) {
            // logger.log("drawFocalPointAnimationFrame ignored when isBeingDraggedByMouse");
        }
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
    //     isEasingToMouse: _isEasingToMouse,
    //     isEasingToAimPoint: _isEasingToAimPoint
    // });

    if (_isEasingToBullsEye) {
        if (dist <= MAX_NEAR_DISTANCE) {
            handleArrivedAtBullsEye(currentPos);
            return;
        }
    }
    else if (_isEasingToMouse) {
        if (dist <= MAX_NEAR_DISTANCE) {
            handleArrivedAtMouse(currentPos);
            return;
        }
    } else if (dist <= MAX_NEAR_DISTANCE) {
        handleArrivedAtAimPoint(aimPos);
        return;
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
        // logger.log("Moving to new position:", newPos);
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

// if isDraggable and click doen on focalPoint then start dragging it
function onMouseDown_startDraggingFocalPoint(event) {
    const eventPosition = getEventPosition(event);

    // _lastStatus = _currentStatus;
    // _currentStatus = "startDragging";
    // if ( _currentStatus != _lastStatus ) {
    //     logger.log("onMouseDown_startDraggingFocalPoint");

    const currentTime = Date.now();
    if (currentTime - lastClickTime <= DOUBLE_CLICK_DELAY) {
        logger.log("Double-click detected. Ignoring drag."); 
        onCanvasContainerDoubleClick(event);
        return;
    }
    lastClickTime = currentTime;

    // { passive: true } allows wheel scrolling while dragging
    utils.updateEventListener(document, 'mousemove', onMouseDrag_keepDraggingFocalPoint, { passive: true });

    event.stopPropagation(); // prevent the mouse event from propagating to other listeners
    event.preventDefault(); // prevent default browser behavior

    setIsBeingDraggedByMouse_true();

    _canvasContainer.style.pointerEvents = 'none'; // Disable pointer events on other elements
    document.body.style.userSelect = 'none'; // Disable text selection

    moveFocalPointTo(eventPosition);

    // add mousemove and mouseup listeners
    utils.updateEventListener(document,'mousemove', onMouseDrag_keepDraggingFocalPoint);
    utils.updateEventListener(document,'mouseup', onMouseUp_stopDraggingFocalPoint, { once: true });
}

function onMouseDrag_keepDraggingFocalPoint(event) {
    const eventPosition = getEventPosition(event);

    if ( getIsBeingDraggedByMouse() ) {
        moveFocalPointTo(eventPosition);
        setAimPoint(eventPosition);

        // Avoid calling preventDefault() to allow wheel scrolling

        // _lastStatus = _currentStatus;
        // _currentStatus = "keepDragging";
        // if ( _currentStatus != _lastStatus )
        //     logger.log("onMouseDrag_keepDraggingFocalPoint:",eventPosition);
    }
}

function onMouseUp_stopDraggingFocalPoint(event) {
    const eventPosition = getEventPosition(event);

    setIsBeingDraggedByMouse_false(eventPosition);

    _lastStatus = _currentStatus;
    _currentStatus = "stopDragging";
    if ( _currentStatus != _lastStatus ) {
        logger.log("onMouseUp_stopDraggingFocalPoint:",eventPosition);
    }

    _canvasContainer.style.pointerEvents = 'auto'; // Reenable pointer events on other elements
    document.body.style.userSelect = 'auto'; // Reenable text selection

    logger.log("setting aimPoint to ", eventPosition);
    setAimPoint(eventPosition);
    startEasingToMouse( eventPosition );
}

function onCanvasContainerDoubleClick(event) {
    const eventPosition = getEventPosition(event);

    if ( getIsBeingDraggedByMouse() ) {
        _lastStatus = _currentStatus;
        _currentStatus = "drawIgnored";
        if ( _currentStatus != _lastStatus )
            logger.log("doubleClick ignored while isBeingDraggedByMouse")
        return;
    }
    _lastStatus = _currentStatus;
    _currentStatus = "doubleClick";
    if ( _currentStatus != _lastStatus )  
        logger.log("got onCanvasContainerDoubleClick !!")
    if ( _isAwake ) {
       // logger.log("not sleeping so start easing to bulls eye and take a nap");
        startEasingToBullsEye(eventPosition);
    } else {
        // logger.log("is not awake so awake and start easing to mouse");
        awakeAndStartEasingToMouse(eventPosition);
    }
}

// function drawViewportDiagonals() {
//     logger.log("drawViewportDiagonals starting");
    
//     // Get the container div
//     const canvasDiv = document.getElementById('canvas');
    
//     // Create or get the diagonal canvas
//     let diagonalCanvas = document.getElementById('diagonal-canvas');
//     if (!diagonalCanvas) {
//         diagonalCanvas = document.createElement('canvas');
//         diagonalCanvas.id = 'diagonal-canvas';
//         diagonalCanvas.style.position = 'absolute';
//         diagonalCanvas.style.top = '0';
//         diagonalCanvas.style.left = '0';
//         diagonalCanvas.style.width = '100%';
//         diagonalCanvas.style.height = '100%';
//         diagonalCanvas.style.pointerEvents = 'none';
//         diagonalCanvas.style.zIndex = '15'; // Above other elements
//         canvasDiv.appendChild(diagonalCanvas);
//     }
    
//     // Set actual canvas dimensions
//     diagonalCanvas.width = canvasDiv.offsetWidth;
//     diagonalCanvas.height = canvasDiv.offsetHeight;
    
//     const ctx = diagonalCanvas.getContext('2d');
    
//     // Clear and draw
//     ctx.clearRect(0, 0, diagonalCanvas.width, diagonalCanvas.height);
//     ctx.strokeStyle = 'white';
//     ctx.lineWidth = 1;
    
//     // Draw diagonals
//     ctx.beginPath();
//     ctx.moveTo(0, 0);
//     ctx.lineTo(diagonalCanvas.width, diagonalCanvas.height);
//     ctx.stroke();
    
//     ctx.beginPath();
//     ctx.moveTo(diagonalCanvas.width, 0);
//     ctx.lineTo(0, diagonalCanvas.height);
//     ctx.stroke();
// }

// Draw on window load
window.addEventListener('load', handleOnWindowLoad);

// Draw on window resize
window.addEventListener('resize', handleOnWindowResize);
