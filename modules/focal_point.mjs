const EASING = 0.05;
const EPSILON = EASING / 2.0;

var _focalPointElement;
var _focalPointNowSubpixelPrecision;
var _focalPointAim;
var _focalPointListener;
var _isAnimating;
var _isDraggable = false;
var _isDragging = false;
<<<<<<< HEAD
=======

>>>>>>> 5e16eb7567c822e72a0995478f126031603d296b

// -----------------------------------------------------
// save the caller's canvasContainer and focalPointElement.
// save the caller's callback function, focalPointListener,
// which will be called while the focalPoint is moving.
//
export function createFocalPoint(
    focalPointElement,
    focalPointListener,
    isDraggable=false
) {
    _focalPointElement = focalPointElement;
    _focalPointNowSubpixelPrecision = getFocalPointCenter();
    _focalPointListener = focalPointListener;
    _isAnimating = false;
    if ( isDraggable ) {
        _isDraggable = true;
        _isDragging = false;

        _focalPointElement.classList.add('draggable-focal-point');
        _focalPointElement.addEventListener('mousedown', onMouseDown);
    } else {
        _focalPointElement.classList.add('non-draggable-focal-point');
    }
}

// get the canvasContainer-relative
// location of the _focalPointElement center
export function getFocalPointCenter() {
    return {
        x:
            _focalPointElement.offsetLeft
            + Math.floor(_focalPointElement.offsetWidth / 2),
        y:
            _focalPointElement.offsetTop
            + Math.floor(_focalPointElement.offsetHeight / 2),
    };
}

// move the _focalPointElement to the given
// canvasContainer-relative location
export function moveFocalPointTo(x, y) {
    // var newLeft = x - Math.floor(_focalPointElement.offsetWidth / 2);
    // var newTop = y - Math.floor(_focalPointElement.offsetHeight / 2);
    // _focalPointElement.style.left = `${newLeft}px`;
    // _focalPointElement.style.top = `${newTop}px`;
    
    // alternative
    // see https://stackoverflow.com/a/53892597
    _focalPointElement.style.transform = `translate(${x}px, ${y}px)`;

    // notify the caller's listener
    console.log("move x:",x,"y:",y);
    _focalPointListener(x, y);
}

// ease the _focalPointElement to the given
// canvasContainer-relative location
export function easeFocalPointTo(x, y, callback) {
    _isAnimating = true;
    _focalPointAim = { x, y };
}

export function drawFocalPointAnimationFrame() {

<<<<<<< HEAD
    if (_isDraggable && _isDragging ) return;

    const focalPointNow = getFocalPoint();
=======
    if (!_isAnimating ) return;
    if ( _isDraggable && _isDragging ) return;
    
    const startTime = performance.now();
    const focalPointNow = getFocalPointCenter();
>>>>>>> 5e16eb7567c822e72a0995478f126031603d296b

    // exit early if we're at the destination already
    if (focalPointNow.x === _focalPointAim.x && focalPointNow.y === _focalPointAim.y) {
        _isAnimating = false;
        return;
    }

    _focalPointNowSubpixelPrecision = computeAStepCloserToAimSubpixelPrecision(
        _focalPointNowSubpixelPrecision,
        _focalPointAim,
        EASING,
        EPSILON
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 16) { // 16ms for 60fps
        console.warn(`[Violation] 'drawFocalPointAnimationFrame' handler took ${duration.toFixed(2)}ms`);
    }
}

function computeAStepCloserToAimSubpixelPrecision(nowPoint, aimPoint, easing, epsilon) {
    // compute velocities
    let vx = (aimPoint.x - nowPoint.x) * easing;
    let vy = (aimPoint.y - nowPoint.y) * easing;

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

<<<<<<< HEAD
    console.log("down x:", event.pageX, "y:", event.pageY);

=======
>>>>>>> 5e16eb7567c822e72a0995478f126031603d296b
    _isDragging = true;
    _isAnimating = false;

    document.body.style.pointerEvents = 'none'; // Disable pointer events on other elements
    document.body.style.userSelect = 'none'; // Disable text selection

    document.addEventListener('mousemove', onMouseDrag);
    document.addEventListener('mouseup', onMouseUp, { once: true });
}

function onMouseDrag(event) {
    if ( !_isDraggable ) return;

    if (_isDragging) {
<<<<<<< HEAD
        console.log("drag x:", event.pageX, "y:", event.pageY);
=======
>>>>>>> 5e16eb7567c822e72a0995478f126031603d296b
        moveFocalPointTo(event.pageX, event.pageY);
    }
}

function onMouseUp(event) {
    if ( !_isDraggable ) return;

<<<<<<< HEAD
    console.log("up x:", event.pageX, "y:", event.pageY);

=======
>>>>>>> 5e16eb7567c822e72a0995478f126031603d296b
    _isDragging = false;
    document.body.style.pointerEvents = 'auto'; // Re-enable pointer events on other elements
    document.body.style.userSelect = 'auto'; // Re-enable text selection
   
    moveFocalPointTo(event.pageX, event.pageY);

    document.removeEventListener('mousemove', onMouseDrag);

<<<<<<< HEAD
    console.log("ease x:", event.pageX, "y:", event.pageY);
    easeFocalPointTo(event.pageX, event.pageY);
}
=======
    easeFocalPointTo(event.pageX, event.pageY);
}
>>>>>>> 5e16eb7567c822e72a0995478f126031603d296b
