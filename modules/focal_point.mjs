const EASE_FACTOR = 0.15;
const EPSILON = EASE_FACTOR / 2.0;

var _focalPointElement;
var _focalPointNowSubpixelPrecision;
var _focalPointAim;
var _focalPointListener;
var _isAnimating;
var _isDraggable = false;
var _isDragging = false;

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
    _focalPointNowSubpixelPrecision = getFocalPoint();
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
export function getFocalPoint() {
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
    _focalPointElement.style.left = `${x}px`;
    _focalPointElement.style.top = `${y}px`;
    
    // _focalPointElement.style.transform = `translate(${x}px, ${y}px)`;

    // notify the caller's listener
    // console.log("move x:",x,"y:",y);
    _focalPointListener(x, y);
}

// ease_factor the _focalPointElement to the given
// canvasContainer-relative location
export function easeFocalPointTo(x, y, callback) {
    _isAnimating = true;
    _focalPointAim = { x, y };
}

export function drawFocalPointAnimationFrame() {
    if (!_isAnimating) return;

    if (_isDraggable && _isDragging ) return;

    const focalPointNow = getFocalPoint();

    // exit early if we're at the destination already
    if (focalPointNow.x === _focalPointAim.x && focalPointNow.y === _focalPointAim.y) {
        _isAnimating = false;
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

    document.addEventListener('mousemove', onMouseDrag);
    document.addEventListener('mouseup', onMouseUp, { once: true });
}

function onMouseDrag(event) {
    if ( !_isDraggable ) return;

    if (_isDragging) {
        // console.log("drag x:", event.pageX, "y:", event.pageY);
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

    document.removeEventListener('mousemove', onMouseDrag);
}