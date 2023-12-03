const EASING = 0.05;
const EPSILON = EASING / 2.0;

var _focalPointElement;
var _focalPointNowSubpixelPrecision;
var _focalPointAim;
var _focalPointListener;
var _isAnimating;

// -----------------------------------------------------
// save the caller's canvasContainer and focalPointElement.
// save the caller's callback function, focalPointListener,
// which will be called while the focalPoint is moving.
//
export function createFocalPoint(
    focalPointElement,
    focalPointListener
) {
    _focalPointElement = focalPointElement;
    _focalPointNowSubpixelPrecision = getFocalPoint();
    _focalPointListener = focalPointListener;
    _isAnimating = false;
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
    var newLeft = x - Math.floor(_focalPointElement.offsetWidth / 2);
    var newTop = y - Math.floor(_focalPointElement.offsetHeight / 2);
    _focalPointElement.style.left = `${newLeft}px`;
    _focalPointElement.style.top = `${newTop}px`;
    // alternative
    // see https://stackoverflow.com/a/53892597
    // _focalPointElement.style.transform = `translate(${x}px, ${y}px)`;

    // notify the caller's listener
    _focalPointListener(x, y);
}

// ease the _focalPointElement to the given
// canvasContainer-relative location
export function easeFocalPointTo(x, y, callback) {
    _isAnimating = true;
    _focalPointAim = { x, y };
}

export function drawFocalPointAnimationFrame() {
    if (!_isAnimating) return;

    const focalPointNow = getFocalPoint();

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

    moveFocalPointTo(
        Math.round(_focalPointNowSubpixelPrecision.x),
        Math.round(_focalPointNowSubpixelPrecision.y)
    );
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
