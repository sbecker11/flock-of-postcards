// Type definitions
interface Point {
  x: number;
  y: number;
}

type FocalPointListener = (x: number, y: number) => void;

// Constants
const EASING = 0.05;
const EPSILON = EASING / 2.0;

// Module state
let _focalPointElement: HTMLElement;
let _focalPointNowSubpixelPrecision: Point;
let _focalPointAim: Point;
let _focalPointListener: FocalPointListener;
let _isAnimating: boolean;
let _isDraggable = false;
let _isDragging = false;

/**
 * Initialize the focal point system
 * @param focalPointElement - The DOM element to use as the focal point
 * @param focalPointListener - Callback function called when focal point moves
 * @param isDraggable - Whether the focal point can be dragged by the user
 */
export function createFocalPoint(
  focalPointElement: HTMLElement,
  focalPointListener: FocalPointListener,
  isDraggable: boolean = false
): void {
  _focalPointElement = focalPointElement;
  _focalPointNowSubpixelPrecision = getFocalPoint();
  _focalPointListener = focalPointListener;
  _isAnimating = false;
  
  if (isDraggable) {
    _isDraggable = true;
    _isDragging = false;

    _focalPointElement.classList.add('draggable-focal-point');
    // Don't add mousedown listener - let events pass through
  } else {
    _focalPointElement.classList.add('non-draggable-focal-point');
  }
}

/**
 * Get the base center of the focal point (without transform)
 */
function getFocalPointBaseCenter(): Point {
  return {
    x: _focalPointElement.offsetLeft + _focalPointElement.offsetWidth / 2,
    y: _focalPointElement.offsetTop + _focalPointElement.offsetHeight / 2,
  };
}

/**
 * Parse current translate from transform style
 */
function getCurrentTranslate(): Point {
  const transform = _focalPointElement.style.transform;
  if (!transform) return { x: 0, y: 0 };
  const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
  if (!match) return { x: 0, y: 0 };
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

/**
 * Get the current focal point center position (accounting for transform)
 * @returns Point with x and y coordinates
 */
export function getFocalPoint(): Point {
  const base = getFocalPointBaseCenter();
  const translate = getCurrentTranslate();
  return {
    x: base.x + translate.x,
    y: base.y + translate.y,
  };
}

/**
 * Move the focal point so its center is at the given position
 * @param x - Desired center X coordinate
 * @param y - Desired center Y coordinate
 */
export function moveFocalPointTo(x: number, y: number): void {
  const base = getFocalPointBaseCenter();
  const translateX = x - base.x;
  const translateY = y - base.y;
  _focalPointElement.style.transform = `translate(${translateX}px, ${translateY}px)`;

  // Notify the listener with the actual center position
  _focalPointListener(x, y);
}

/**
 * Ease the focal point to a target position with animation
 * @param x - Target X coordinate
 * @param y - Target Y coordinate
 * @param callback - Optional callback when animation completes (unused currently)
 */
export function easeFocalPointTo(x: number, y: number, callback?: () => void): void {
  _isAnimating = true;
  _focalPointAim = { x, y };
}

/**
 * Draw one frame of the focal point animation
 * Should be called from a requestAnimationFrame loop
 */
export function drawFocalPointAnimationFrame(): void {
  if (!_isAnimating) return;

  if (_isDraggable && _isDragging) return;

  const focalPointNow = getFocalPoint();

  // Exit early if we're at the destination already
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

/**
 * Compute the next position using easing towards the aim point
 * @param nowPoint - Current position with subpixel precision
 * @param aimPoint - Target position
 * @param easing - Easing factor (0-1)
 * @param epsilon - Threshold for snapping to target
 * @returns New position closer to aim
 */
function computeAStepCloserToAimSubpixelPrecision(
  nowPoint: Point,
  aimPoint: Point,
  easing: number,
  epsilon: number
): Point {
  // Compute velocities
  const vx = (aimPoint.x - nowPoint.x) * easing;
  const vy = (aimPoint.y - nowPoint.y) * easing;

  // For very small values of vx and vy, move there directly
  if (Math.abs(vx) < epsilon && Math.abs(vy) < epsilon) {
    return aimPoint;
  }

  return {
    x: nowPoint.x + vx,
    y: nowPoint.y + vy,
  };
}

// Mouse event handlers removed - focalPoint now allows events to pass through
