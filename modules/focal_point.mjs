const EASE_FACTOR = 0.15;
const EPSILON = EASE_FACTOR / 2.0;

import * as utils from './utils.mjs';

// custom double-click logic
let lastClickTime = 0;
const DOUBLE_CLICK_DELAY = 300; // Maximum delay in milliseconds for a double-click

var _currentStatus = null;
var _lastStatus = null;
var _canvasContainer;
var _focalPointElement;
var _focalPointNowSubpixelPrecision;
var _aimPoint = null;
var _focalPointPositionListener;
var _isEasingToAimPoint = false;
export var _isAwake = true;
var _isEasingToBullsEye = false;
var _isEasingToMouse = true;
export var _isDraggable = true;

let _focalPointRadius = 0;
let _bullsEyeRadius = 0;
let _bullsEyeCenter = { x: 0, y: 0 };

// on windwo load
export function handleOnWindowLoad() {
    console.log("focalPoint handlingOnWindowLoad");

    // Compute focalPoint radius
    _focalPointRadius = _focalPointElement.getBoundingClientRect().width / 2;

    // Compute bullsEye radius
    _bullsEyeRadius = (30 - 2 * 2) / 2; // Assuming bullsEye width/height is 30px with 2px border

    // Compute initial bullsEye center
    updateBullsEyeCenter();

    startEasingToBullsEye(getFocalPoint());
}

var _byMouseIsBeingDragged = false;

export function setIsBeingDraggedByMouse_false() {
    _byMouseIsBeingDragged = false;
    console.log("set isBeingDraggedByMouse:", _byMouseIsBeingDragged);
}
export function setIsBeingDraggedByMouse_true() {

    _byMouseIsBeingDragged = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    _isEasingToMouse = false;
    clearAimPoint();

    console.log("set isBeingDraggedByMouse:", _byMouseIsBeingDragged);
}
export function getIsBeingDraggedByMouse() {    
    return _byMouseIsBeingDragged;
}

export function handleOnWindwoResize() {
    updateBullsEyeCenter();
}

// on window resize
function updateBullsEyeCenter() {
    const canvasRect = _canvasContainer.getBoundingClientRect();
    _bullsEyeCenter = {
        x: canvasRect.left + canvasRect.width / 2,
        y: canvasRect.top + canvasRect.height / 2
    };
}

export function getBullsEye() {
    return _bullsEyeCenter; // Use the precomputed bullsEye center
}

// Add a listener for window resize to update bullsEye center
window.addEventListener('resize', updateBullsEyeCenter);

export function getFocalPoint() {
    const focalPointRect = _focalPointElement.getBoundingClientRect();
    return {
        x: focalPointRect.left + _focalPointRadius,
        y: focalPointRect.top + _focalPointRadius
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

    const left = position.x - _focalPointRadius;
    const top = position.y - _focalPointRadius;

    _focalPointElement.style.left = `${left}px`;
    _focalPointElement.style.top = `${top}px`;

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
export function createFocalPoint(
    focalPointElement,
    focalPointPositionListener) {
    _focalPointElement = focalPointElement;
    _focalPointRadius = focalPointElement.getBoundingClientRect().width / 2.0;
    _focalPointNowSubpixelPrecision = getFocalPoint();
    _isAwake = true;
    _isEasingToBullsEye = false;
    _isEasingToMouse = true;
    _canvasContainer = document.getElementById("canvas-container");
    if ( ! _canvasContainer ) {
        throw new Error("canvasContainer not initialized");
    }

    addFocalPointListener(focalPointPositionListener);

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

    moveFocalPointTo(getBullsEye());
}

export function onCanvasContainerEnter(event) {
    const eventPosition = getEventPosition(event);
    _lastStatus = _currentStatus;
    _currentStatus = "enterContainer";
    if ( _currentStatus != _lastStatus )
        console.log("onCanvasContainerEnter status:", _currentStatus);

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
    if ( _currentStatus != _lastStatus )
        console.log("onCanvasContainerLeave immediately startEasingToBullsEye");
    startEasingToBullsEye(eventPosition);
}

// unless being dragged by mouse
export function startEasingToMouse( position) {
    if ( getIsBeingDraggedByMouse() ) {
        console.log("startEasingToMouse ignored while isBeingDraggedByMouse");
        return;
    }
    _lastStatus = _currentStatus;
    _currentStatus = "easingToMouse";
    if ( _currentStatus != _lastStatus )
        console.log("startEasingToMouse:", position);

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
    if ( getIsBeingDraggedByMouse() ) {
        console.log("startEasingToBullsEye ignored while isBeingDraggedByMouse");
        return;
    }
    setAimPoint( getBullsEye() );
    _isEasingToAimPoint = true;
    _isEasingToBullsEye = true;
    _isEasingToMouse = false;
    _isAwake = true;
    const result = getIsBeingDraggedByMouse();

    _lastStatus = _currentStatus;
    _currentStatus = "easingToBullsEye";
    if ( _currentStatus != _lastStatus )
        console.log("startEasingToBullsEye with isBeingDraggedByMous:", result);
}


export function setAimPoint(position) {
    _aimPoint = position;
}

export function clearAimPoint() {
    _aimPoint = null;
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
    if ( _currentStatus != _lastStatus )
        console.log('Focal point reached the BullsEye.');

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
    if ( _currentStatus != _lastStatus )
        console.log('Focal point status is now:', _currentStatus);
}

export function awaken(position) {
    utils.addClass(_focalPointElement, "awake");
    _isAwake = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    _isEasingToMouse = false;

    _lastStatus = _currentStatus;
    _currentStatus = "awake";
    if ( _currentStatus != _lastStatus )
        console.log('Focal point status is now:', _currentStatus);
}

// this happens quite often
export function handleArrivedAtMouse(position) {
    _lastStatus = _currentStatus;
    _currentStatus = "arrivedAtMouse";
    if ( _currentStatus != _lastStatus )
        console.log("arrived at mouse:", _isEasingToMouse)
}

// this should never happen
export function handleArrivedAtAimPoint(position) {
    _lastStatus = _currentStatus;
    _currentStatus = "arrivedAtMouse";
    if ( _currentStatus != _lastStatus )
        console.log("arrived at aimPoint")
}


export function awakeAndStartEasingToMouse( wakeUpPosition ) {
    // Change the focal point's color to white
    utils.addClass(_focalPointElement, "awake");
    _isAwake = true;
    _lastStatus = _currentStatus;
    _currentStatus = "awake";
    if ( _currentStatus != _lastStatus )
        console.log("Waking up at ", wakeUpPosition);
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

    if ( getIsBeingDraggedByMouse() ) {        _lastStatus = _currentStatus;
        _currentStatus = "drawIgnored";
        if ( _currentStatus != _lastStatus )
            console.log("drawFocalPointAnimationFrame ignored when isBeingDraggedByMouse");
        return;
    }
    const dist = getPositionsDist( getFocalPoint(), getAimPoint() );

    if ( _isEasingToBullsEye ) {
        if ( dist <= 2  ) {
            handleArrivedAtBullsEye(getFocalPoint());
            return;
        } 
    }
    else if ( _isEasingToMouse ) {
        if ( dist <= 2 ) {
            handleArrivedAtMouse(getFocalPoint());
            return;
        } 
    } else if ( dist <= 2 ) {
        handleArrivedAtAimPoint(getAimPoint());
        return;
    }

    // if ( _isEasingToBullsEye )
    //     console.log("focalPoint animating to aimPoint as bullsEye with dist:", dist);
    // else if ( _isEasingToMouse )
    //     console.log("focalPoint animating to aimPoint as mouse with dist:", dist);
    // else if ( _isEasingToAimPoint )
    //     console.log("focalPoint animating to some aimPoint with dist:", dist);


    _focalPointNowSubpixelPrecision = computeAStepCloserToAimSubpixelPrecision(
        _focalPointNowSubpixelPrecision,
        getAimPoint(),
        EASE_FACTOR,
        EPSILON
    );
    if ( _focalPointNowSubpixelPrecision != null ) {
        moveFocalPointTo( {
            x: Math.round(_focalPointNowSubpixelPrecision.x),
            y: Math.round(_focalPointNowSubpixelPrecision.y)
        });
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

    _lastStatus = _currentStatus;
    _currentStatus = "startDragging";
    if ( _currentStatus != _lastStatus )
        console.log("onMouseDown_startDraggingFocalPoint");

    const currentTime = Date.now();
    if (currentTime - lastClickTime <= DOUBLE_CLICK_DELAY) {
        console.log("Double-click detected. Ignoring drag.");
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

    moveFocalPointTo( eventPosition );

    // add mousemove and mouseup listeners
    utils.updateEventListener(document,'mousemove', onMouseDrag_keepDraggingFocalPoint);
    utils.updateEventListener(document,'mouseup', onMouseUp_stopDraggingFocalPoint, { once: true });
}

function onMouseDrag_keepDraggingFocalPoint(event) {
    const eventPosition = getEventPosition(event);

    if ( getIsBeingDraggedByMouse() ) {
        moveFocalPointTo(eventPosition);

        // Avoid calling preventDefault() to allow wheel scrolling

        // _lastStatus = _currentStatus;
        // _currentStatus = "keepDragging";
        // if ( _currentStatus != _lastStatus )
        //     console.log("onMouseDrag_keepDraggingFocalPoint:",eventPosition);
    }
}

function onMouseUp_stopDraggingFocalPoint(event) {
    const eventPosition = getEventPosition(event);

    setIsBeingDraggedByMouse_false();

    _lastStatus = _currentStatus;
    _currentStatus = "stopDragging";
    if ( _currentStatus != _lastStatus )
        console.log("onMouseUp_stopDraggingFocalPoint:",eventPosition);

    _canvasContainer.style.pointerEvents = 'auto'; // Reenable pointer events on other elements
    document.body.style.userSelect = 'auto'; // Reenable text selection

    startEasingToMouse( eventPosition );
}

function onCanvasContainerDoubleClick(event) {
    const eventPosition = getEventPosition(event);

    if ( getIsBeingDraggedByMouse() ) {
        _lastStatus = _currentStatus;
        _currentStatus = "drawIgnored";
        if ( _currentStatus != _lastStatus )
            console.log("doubleClick ignored while isBeingDraggedByMouse")
        return;
    }
    _lastStatus = _currentStatus;
    _currentStatus = "doubleClick";
    if ( _currentStatus != _lastStatus )
        console.log("got onCanvasContainerDoubleClick !!")
    if ( _isAwake ) {
        console.log("not sleeping so start easing to bulls eye and take a nap");
        startEasingToBullsEye(eventPosition);
    } else {
        console.log("is not awake so awake and start easing to mouse");
        awakeAndStartEasingToMouse(eventPosition);
    }
}
