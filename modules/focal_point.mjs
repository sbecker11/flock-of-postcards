const EASE_FACTOR = 0.15;
const EPSILON = EASE_FACTOR / 2.0;

import * as utils from './utils.mjs';

var _canvasContainer;
var _focalPointElement;
var _focalPointNowSubpixelPrecision;
var _focalPointAim;
var _focalPointListener;
var _isAnimating;
export var _isAwake;
var _isHeadingToSleep = false;
var _isSleeping;
export var _isDraggable;
var _isDragging = false;

// -----------------------------------------------------
// save the caller's _canvasContainer and _focalPointElement.
// save the caller's callback function, focalPointListener,
// which will be called while the focalPoint is moving.
//
export function createFocalPoint(
    focalPointElement,
    focalPointListener) {
    _focalPointElement = focalPointElement;
    _focalPointNowSubpixelPrecision = getFocalPoint();
    _isSleeping = false;
    _isDraggable = true;
    _isAwake = true;
    _isHeadingToSleep = false;
    _focalPointListener = focalPointListener;
    _canvasContainer = document.getElementById("canvas-container");

    // add a dblClick listenter to the bullseye
    utils.updateEventListener(_canvasContainer, 'dblclick', onCanvasContainerDoubleClick);

    initFocalPoint();
}

// called when the window is resized
export function initFocalPoint(isDraggable=true) {
    _isAnimating = false;
    if ( isDraggable ) {
        _isDraggable = true;
        _isDragging = false;
        _isAwake = true;
        _isSleeping = false;
        _isHeadingToSleep = false;

        utils.swapClasses(_focalPointElement, 'draggable-focal-point','non-draggable-focal-point');
        utils.updateEventListener(_focalPointElement, 'mousedown', onMouseDown);
    } else {
        utils.swapClasses(_focalPointElement, 'non-draggable-focal-point','draggable-focal-point');
        utils.updateEventListener( _focalPointElement, 'mousedown'); 
    }
}

// get the _canvasContainer-relative
// location of the _focalPointElement center
export function getFocalPoint() {
    return {
        x:
            _focalPointElement.offsetLeft
            + Math.floor(_focalPointElement.offsetWidth / 2),
        y:
            _focalPointElement.offsetTop
            + Math.floor(_focalPointElement.offsetHeight / 2)
    };
}

export function getBullseye() {
    return {
        x:
            _canvasContainer.offsetLeft + Math.floor(_canvasContainer.offsetWidth / 2 - 12),
        y: 
            _canvasContainer.offsetTop + Math.floor(_canvasContainer.offsetHeight / 2 - 12)
    };
}


// move the _focalPointElement to the given
// _canvasContainer-relative location
export function moveFocalPointTo(x, y) {
    // alternative
    // see https://stackoverflow.com/a/53892597
    _focalPointElement.style.left = `${x}px`;
    _focalPointElement.style.top = `${y}px`;
    
    // _focalPointElement.style.transform = `translate(${x}px, ${y}px)`;

    // notify the caller's listener
    // console.log("move x:",x,"y:",y);
    _focalPointListener(x, y);
}

// ease_factor the _focalPointElement to the given
// _canvasContainer-relative location if the 
export function easeFocalPointToMouse(x, y, callback) {
    _isAnimating = true;
    _focalPointAim = { x, y };
}

// ease_factor the _focalPointElement to the given
// _canvasContainer-relative location if the 
export function easeFocalPointToBullseyeToSleep() {
    _isAnimating = true;
    const bullseye = getBullseye();
    _focalPointAim = { x: bullseye.x, y: bullseye.y };
    _isHeadingToSleep = true;
    _isAwake = false;
    _isSleeping = false;
}

export function focalPointArrivedAtBullseyeToSleep() {
    console.log('Focal point reached the bullseye and is now asleep.');
    _isAnimating = false;
    _isHeadingToSleep = false;
    _isSleeping = true;
    _isAwake = false;

    // Change the focal point's color to grey
    _focalPointElement.style.color = 'grey';
}

export function wakeUpFocalPoint() {
    _isAwake = true;
    _isHeadingToSleep = false;
    _isSleeping = false;
    _isAnimating = true;
    _isDraggable = true;

    // Change the focal point's color to white
    _focalPointElement.style.color = 'white';

    // Re-enable dragging
    initFocalPoint(true);
}

export function drawFocalPointAnimationFrame() {
    if (!_isAnimating) return;

    const focalPointNow = getFocalPoint();

    // exit early if we're at the destination already
    if (focalPointNow.x === _focalPointAim.x && focalPointNow.y === _focalPointAim.y) {
        _isAnimating = false;

        // focalPoint has arrived at focalPointAim
        if (_isHeadingToSleep) {
            focalPointArrivedAtBullseyeToSleep();
        }

        return;
    }

    _focalPointNowSubpixelPrecision = computeAStepCloserToAimSubpixelPrecision(
        _focalPointNowSubpixelPrecision,
        _focalPointAim,
        EASE_FACTOR,
        EPSILON
    );

    moveFocalPointTo(
        Math.round(_focalPointNowSubpixelPrecision.x),
        Math.round(_focalPointNowSubpixelPrecision.y)
    );
}

function computeAStepCloserToAimSubpixelPrecision(nowPoint, aimPoint, ease_factor, epsilon) {
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

function onMouseDown(event) {
    if ( !_isDraggable ) return;

    _isDragging = true;
    _isAnimating = false;

    document.body.style.pointerEvents = 'none'; // Disable pointer events on other elements
    document.body.style.userSelect = 'none'; // Disable text selection

    // console.log("down x:", event.pageX, "y:", event.pageY);
    moveFocalPointTo(event.pageX, event.pageY);

    utils.updateEventListener(document,'mousemove', onMouseDrag);
    utils.updateEventListener(document,'mouseup', onMouseUp, { once: true });
}

function onMouseDrag(event) {

    if ( !_isDraggable ) {
        console.log("mouse drag")
        return;
    }

    if (_isDragging) {
        console.log("mouse drag x:", event.pageX, "y:", event.pageY);
        moveFocalPointTo(event.pageX, event.pageY);
    }
}

function onMouseUp(event) {
    if ( !_isDraggable ) return;

    _isDragging = false;
    document.body.style.pointerEvents = 'auto'; // Re-enable pointer events on other elements
    document.body.style.userSelect = 'auto'; // Re-enable text selection
   
    // console.log("up x:", event.pageX, "y:", event.pageY);
    moveFocalPointTo(event.pageX, event.pageY);

    utils.updateEventListener(document, 'mousemove' );
}

function onCanvasContainerDoubleClick(event) {
    console.log("got onCanvasContainerDoubleClick !!")
    if ( _isAwake ) {
        easeFocalPointToBullseyeToSleep();
    } else if ( !_isAwake ) {
        wakeUpFocalPoint();
    }
}
