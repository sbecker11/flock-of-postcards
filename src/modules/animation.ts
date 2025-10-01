// Animation system for card transformations

import * as utils from './utils.js';
import * as parallax from './parallax.js';
import { applyStyleArray } from './selection.js';
import type { StyleArray } from './types.js';
import {
  NUM_ANIMATION_FRAMES,
  ANIMATION_DURATION_MILLIS
} from './constants.js';

// Animation state
let ANIMATION_IN_PROGRESS = false;

/**
 * Check if animation is currently in progress
 */
export function isAnimationInProgress(): boolean {
  return ANIMATION_IN_PROGRESS;
}

/**
 * Block clicks during animation
 */
export function blockClicksDuringAnimation(): void {
  document.addEventListener('click', function(event) {
    if (ANIMATION_IN_PROGRESS) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true });
}

/**
 * Start animation with parallax effect
 */
export function startAnimationWithParallax(
  div: HTMLElement,
  canvasContainer: HTMLElement,
  styleFrameArray: StyleArray[]
): void {
  if (NUM_ANIMATION_FRAMES === 0) {
    // No animation, just apply final state
    const lastFrame = styleFrameArray[styleFrameArray.length - 1];
    endAnimation(div, lastFrame);
    return;
  }

  const frameInterval = ANIMATION_DURATION_MILLIS / NUM_ANIMATION_FRAMES;
  let frameCount = 0;
  const lastFrame = NUM_ANIMATION_FRAMES - 1;
  let startTime: number | null = null;
  
  ANIMATION_IN_PROGRESS = true;

  function step(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const elapsedTime = timestamp - startTime;

    if (elapsedTime > frameInterval * frameCount) {
      parallax.applyParallaxToOneCardDiv(div, canvasContainer);
      frameCount++;
    }

    if (frameCount < lastFrame) {
      requestAnimationFrame(step);
    }
  }

  // Convert StyleArray[] to Keyframe[] for Web Animations API
  const keyframes: Keyframe[] = styleFrameArray.map(frame => ({
    left: `${frame[6]}px`,
    top: `${frame[7]}px`,
    color: utils.get_RgbStr_from_RGB([frame[0], frame[1], frame[2]]),
    backgroundColor: utils.get_RgbStr_from_RGB([frame[3], frame[4], frame[5]])
  }));

  const animation = div.animate(keyframes, {
    duration: ANIMATION_DURATION_MILLIS,
    iterations: 1
  });

  animation.finished
    .then(() => {
      endAnimation(div, styleFrameArray[lastFrame]);
    })
    .catch((error) => {
      console.error("Animation error:", error);
      endAnimation(div, styleFrameArray[lastFrame]);
    });

  requestAnimationFrame(step);
}

/**
 * End animation and apply final state
 */
export function endAnimation(div: HTMLElement, targetStyleFrame: StyleArray | null): void {
  if (targetStyleFrame !== null) {
    applyStyleArray(div, targetStyleFrame);
  }
  
  ANIMATION_IN_PROGRESS = false;
}

/**
 * Create style frame array for interpolation
 */
export function createStyleFrameArray(
  currentStyleArray: StyleArray,
  targetStyleArray: StyleArray
): StyleArray[] {
  if (NUM_ANIMATION_FRAMES === 0) {
    return [targetStyleArray];
  }

  const styleFrameArray: StyleArray[] = [];
  
  for (let frame = 0; frame < NUM_ANIMATION_FRAMES; frame++) {
    const t = frame / (NUM_ANIMATION_FRAMES - 1);
    const interpStyleArray = utils.linearInterpArray(
      t,
      currentStyleArray,
      targetStyleArray
    ) as StyleArray;
    styleFrameArray.push(interpStyleArray);
  }
  
  return styleFrameArray;
}
