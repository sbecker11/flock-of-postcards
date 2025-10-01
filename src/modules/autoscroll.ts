// Auto-scrolling system based on focal point position

import * as utils from './utils.js';
import {
  AUTOSCROLL_REPEAT_MILLIS,
  MAX_AUTOSCROLL_VELOCITY,
  MIN_AUTOSCROLL_VELOCITY,
  AUTOSCROLL_CHANGE_THRESHOLD
} from './constants.js';

// Autoscroll state
let autoScrollingInterval: number | null = null;
let autoScrollVelocity = 0;
let oldAutoScrollVelocity = 0;
let autoScrollEase = 0;

/**
 * Update auto-scroll velocity based on focal point position
 */
export function updateAutoScrollVelocity(
  canvasContainer: HTMLElement,
  focalPointY: number
): void {
  const topHeight = Math.floor(canvasContainer.offsetHeight / 4);
  const centerTop = topHeight;
  const centerHeight = topHeight * 2;
  const centerBottom = topHeight + centerHeight;
  
  const scrollHeight = canvasContainer.scrollHeight;
  const scrollTop = canvasContainer.scrollTop;
  const windowHeight = canvasContainer.clientHeight;
  const scrollBottom = scrollHeight - scrollTop - windowHeight;

  if (focalPointY < centerTop) {
    autoScrollEase = (scrollTop < 150) ? 1 : 0;
    autoScrollVelocity = (focalPointY - centerTop) / topHeight * MAX_AUTOSCROLL_VELOCITY;
  } else if (focalPointY > centerBottom) {
    autoScrollEase = (scrollBottom < 150) ? 1 : 0;
    autoScrollVelocity = (focalPointY - centerBottom) / topHeight * MAX_AUTOSCROLL_VELOCITY;
  } else {
    autoScrollEase = 0;
    autoScrollVelocity = 0;
  }
}

/**
 * Start or stop auto-scrolling interval
 */
export function manageAutoScrollInterval(canvasContainer: HTMLElement): void {
  // Check if velocity changed significantly
  if (Math.abs(autoScrollVelocity - oldAutoScrollVelocity) >= AUTOSCROLL_CHANGE_THRESHOLD) {
    
    // If velocity is near zero, stop interval
    if (Math.abs(autoScrollVelocity) < MIN_AUTOSCROLL_VELOCITY) {
      if (autoScrollingInterval !== null) {
        clearInterval(autoScrollingInterval);
        autoScrollingInterval = null;
        autoScrollVelocity = 0;
      }
    } else {
      // Start interval if not running
      if (autoScrollingInterval === null) {
        autoScrollingInterval = window.setInterval(() => {
          const currentScrollTop = canvasContainer.scrollTop;
          const newScrollTop = currentScrollTop + autoScrollVelocity;

          const minScrollTop = 0;
          const maxScrollTop = canvasContainer.scrollHeight - canvasContainer.clientHeight;
          const clampedScrollTop = utils.clamp(newScrollTop, minScrollTop, maxScrollTop);

          // If there's room to scroll
          if (Math.abs(canvasContainer.scrollTop - clampedScrollTop) > 0) {
            canvasContainer.scrollTop = clampedScrollTop;
          } else {
            // Reached boundary, stop
            autoScrollVelocity = 0;
            if (autoScrollingInterval !== null) {
              clearInterval(autoScrollingInterval);
              autoScrollingInterval = null;
            }
          }
        }, AUTOSCROLL_REPEAT_MILLIS);
      }
    }
    
    oldAutoScrollVelocity = autoScrollVelocity;
  }
}

/**
 * Get current auto-scroll ease value
 */
export function getAutoScrollEase(): number {
  return autoScrollEase;
}

/**
 * Stop auto-scrolling
 */
export function stopAutoScroll(): void {
  if (autoScrollingInterval !== null) {
    clearInterval(autoScrollingInterval);
    autoScrollingInterval = null;
  }
  autoScrollVelocity = 0;
  oldAutoScrollVelocity = 0;
}
