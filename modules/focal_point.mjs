const EASE_FACTOR = 0.15;
const EPSILON = EASE_FACTOR / 2.0;

import * as utils from './utils.mjs';

const nullPosition = { x:null, y:null };

function positionIsNull(position) {
    if (!position || typeof position !== 'object') {
        return true; // Null, undefined, or not an object
    }
    if (!('x' in position) || !('y' in position)) {
        return true; // Missing x or y keys
    }
    if (position.x == null || position.y == null) {
        return true; // x or y is null
    }
    return false; // Valid position
}

var _canvasContainer;
var _focalPointElement;
var _focalPointNowSubpixelPrecision;
var _aimPoint;
var _focalPointPositionListener;
var _isEasingToAimPoint = false;
export var _isAwake = true;
var _isEasingToBullsEye = false;
var _isEasingToMouse = true;
export var _isDraggable = true;
var _isBeingDraggedByMouse = false;


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
}

// on window resize
function updateBullsEyeCenter() {
    const canvasRect = _canvasContainer.getBoundingClientRect();
    _bullsEyeCenter = {
        x: canvasRect.left + canvasRect.width / 2,
        y: canvasRect.top + canvasRect.height / 2,
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
        y: focalPointRect.top + _focalPointRadius,
    };
}

function getEventPosition(event) {
    return {
        x: event.pageX,
        y: event.pageY,
    };
}

export function moveFocalPointTo(x, y) {
    const left = x - _focalPointRadius;
    const top = y - _focalPointRadius;

    _focalPointElement.style.left = `${left}px`;
    _focalPointElement.style.top = `${top}px`;

    // Notify the caller's listener
    _focalPointPositionListener(x, y);
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
    _focalPointPositionListener = focalPointPositionListener; // used by main to rerender on moving focalPoint
    _canvasContainer = document.getElementById("canvas-container");

    startEasingToMouse()

    // add a dblClick listenter to the BullsEye
    utils.updateEventListener(_canvasContainer, 'dblclick', onCanvasContainerDoubleClick);
}


export function handleMouseEnterCanvasContainer(event) {
    const eventPosition = getEventPosition(event);
    if ( _isAwake ) {
        startEasingToMouse( eventPosition )
    } else {
        awakeAndStartEasingToMouse( eventPosition );
    }
}

export function handleCanvasContainerMouseMove(event) {
    setAimPoint(getEventPosition(event));
}

export function handleMouseLeaveCanvasContainer(event) {
    _isBeingDraggedByMouse = false;
    startEasingToBullsEye();
}


// unless being dragged by mouse
export function startEasingToMouse( position) {
    if ( _isBeingDraggedByMouse )
        return;
    setAimPoint( position );
    _isEasingToAimPoint = true;
    _isEasingToMouse = true;
    utils.addClass(_focalPointElement, "awake");
    _isEasingToBullsEye = false;
    _isAwake = true;
    
    // add mousedown listener to start dragging
    utils.updateEventListener(_focalPointElement, 'mousedown', onMouseDown_startDraggingFocalPoint);
}


// unless being dragged by mouse
export function startEasingToBullsEye() {
    if ( _isBeingDraggedByMouse ) 
        return;
    setAimPoint( getBullsEye() );
    _isEasingToAimPoint = true;
    _isEasingToBullsEye = true;
    _isEasingToMouse = false;
    _isAwake = true;
}


export function setAimPoint(position) {
    _aimPoint = position;
}

export function clearAimPoint() {
    _aimPoint = nullPosition;
}

export function aimPointIsNull() {
    return positionIsNull(_aimPoint);
}

export function getAimPoint() {
    return _aimPoint;
}

export function handleArrivedAtBullsEye() {
    console.log('Focal point reached the BullsEye and is going asleep.');
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    _isEasingToMouse = false;
    _isAwake = false;

    // Remove the awake class to chang focal point's back to grey
    utils.removeClass(_focalPointElement, "awake");
}

export function awakeAndStartEasingToMouse( wakeUpPosition ) {
    console.log("Waking up at ", wakeUpPosition);

    // Change the focal point's color to white
    utils.addClass(_focalPointElement, "awake");
    _isAwake = true;
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
        return INFINITY;
    if ( positionIsNull(pos1) || positionIsNull(pos2) )
        return INFINITY;
    return max(abs(pos1.x - pos2.x),  abs(pos1.y - pos2.y));
}

export function positionsMatch( pos1, pos2, maxDist=2 ) {
    return getPositionsDist(pos1,pos2) <= maxDist;
}

// unless being dragged by mouse
export function drawFocalPointAnimationFrame() {

    if ( _isBeingDraggedByMouse ) {
        return;
    }
    if ( aimPointIsNull() ) {
        return;
    }
    // console.log("focalPoint:", getFocalPoint() )
    // console.log("aimdPoint:", getAimPoint() )
    // console.log("bullsEye:", getBullsEye() )
    const dist = getPositionsDist( getFocalPoint(), getAimPoint() );
    if ( dist <= 2  ) {
        if ( _isEasingToBullsEye ) {
            _isEasingToBullsEye = false;
            _isEasingToAimPoint = false;
            handleArrivedAtBullsEye();
        }
        return;
    }
    if ( _isEasingToBullsEye )
        console.log("focalPoint animating to aimPoint as bullsEye with dist:", dist);
    else if ( _isEasingToMouse )
        console.log("focalPoint animating to aimPoint as mouse with dist:", dist);
    else if ( _isEasingToAimPoint )
        console.log("focalPoint animating to some aimPoint with dist:", dist);


    _focalPointNowSubpixelPrecision = computeAStepCloserToAimSubpixelPrecision(
        _focalPointNowSubpixelPrecision,
        getAimPoint(),
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

// if isDraggable and click doen on focalPoint then start dragging it
function onMouseDown_startDraggingFocalPoint(event) {

    _isBeingDraggedByMouse = true;
    _isEasingToAimPoint = false;
    _isEasingToBullsEye = false;
    _isEasingToMouse = false;

    document.body.style.pointerEvents = 'none'; // Disable pointer events on other elements
    document.body.style.userSelect = 'none'; // Disable text selection

    const eventPosition = getEventPosition(event);
    moveFocalPointTo( eventPosition );
    clearAimPoint();

    // add mousemove and mouseup listeners
    utils.updateEventListener(document,'mousemove', onMouseDrag_keepDraggingFocalPoint);
    utils.updateEventListener(document,'mouseup', onMouseUp_stopDraggingFocalPoint, { once: true });
}

function onMouseDrag_keepDraggingFocalPoint(event) {

    if (_isBeingDraggedByMouse) {
        const eventPosition = getEventPosition(event);
        moveFocalPointTo(eventPosition);
        clearAimPoint();
        console.log("focalPoint drag:", eventPosition);
        console.log("focalPoint  Aim:", eventPosition);
    }
}

function onMouseUp_stopDraggingFocalPoint(event) {
    
    document.body.style.pointerEvents = 'auto'; // Re-enable pointer events on other elements
    document.body.style.userSelect = 'auto'; // Re-enable text selection
   
    startEasingToMouse( getEventPosition(event) );
}

function onCanvasContainerDoubleClick(event) {
    console.log("got onCanvasContainerDoubleClick !!")
    if ( _isAwake ) {
        console.log("not sleeping so start easing to bulls eye and take a nap");
        startEasingToBullsEye();
    } else {
        console.log("is not awake so awake and start easing to mouse");
        awakeAndStartEasingToMouse( getEventPosition(event) );
    }
}
