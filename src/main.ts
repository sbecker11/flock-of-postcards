'use strict';

// Module imports
import * as utils from './modules/utils.js';
import * as timeline from './modules/timeline.js';
import * as focalPoint from './modules/focal_point.js';
import * as monoColor from './modules/monoColor.js';
import * as bizcardModule from './modules/bizcard.js';
import * as parallax from './modules/parallax.js';
import * as eventHandlers from './modules/event_handlers.js';
import * as animation from './modules/animation.js';
import * as selection from './modules/selection.js';
import * as lineItems from './modules/line_items.js';

// Get DOM element references
const rightContentDiv = document.getElementById("right-content-div") as HTMLElement;
const canvasContainer = document.getElementById("canvas-container") as HTMLElement;
const canvas = document.getElementById("canvas") as HTMLElement;
const bottomGradient = document.getElementById("bottom-gradient") as HTMLElement;
const bullsEye = document.getElementById("bulls-eye") as HTMLElement;
const selectFirstBizcardButton = document.getElementById("select-first-bizcard") as HTMLElement;
const selectNextBizcardButton = document.getElementById("select-next-bizcard") as HTMLElement;
const selectAllBizcardsButton = document.getElementById("select-all-bizcards") as HTMLElement;
const clearAllLineItemsButton = document.getElementById("clear-all-line-items") as HTMLElement;

// Bulls eye position
let bullsEyeX = 0;
let bullsEyeY = 0;

// Focal point tracking
let focalPointX = 0;
let focalPointY = 0;

/**
 * Center bulls eye in canvas container
 */
function centerBullsEye(): void {
  bullsEyeX = utils.half(canvasContainer.offsetWidth);
  bullsEyeY = utils.half(canvasContainer.offsetHeight);
  const newLeft = bullsEyeX - utils.half(bullsEye.offsetWidth);
  const newTop = bullsEyeY - utils.half(bullsEye.offsetHeight);
  bullsEye.style.left = `${newLeft}px`;
  bullsEye.style.top = `${newTop}px`;
}

/**
 * Focal point listener callback
 */
function focalPointListener(x: number, y: number): void {
  focalPointX = x;
  focalPointY = y;
  parallax.setFocalPointPosition(x, y);
  eventHandlers.handleFocalPointMove(canvasContainer, y);
}

/**
 * Ease focal point to bulls eye
 */
function easeFocalPointToBullsEye(): void {
  focalPoint.easeFocalPointTo(bullsEyeX, bullsEyeY);
}

/**
 * Position gradient overlays
 */
function positionGradients(): void {
  const canvasHeight = canvas.scrollHeight;
  const bottomGradientHeight = bottomGradient.offsetHeight;
  bottomGradient.style.top = `${canvasHeight - bottomGradientHeight}px`;
}

/**
 * Select all bizcards
 */
export function selectAllBizcards(): void {
  lineItems.clearAllDivCardLineItems();

  const allBizcardDivs = document.getElementsByClassName("bizcard-div");
  for (let i = 0; i < allBizcardDivs.length; i++) {
    const bizcardDiv = allBizcardDivs[i] as HTMLDivElement;
    selection.selectTheCardDiv(bizcardDiv, true);
  }

  if (allBizcardDivs.length > 0) {
    selection.selectTheCardDiv(allBizcardDivs[0] as HTMLDivElement, true);
  }
}

/**
 * Select first bizcard
 */
export function selectFirstBizcard(): void {
  const firstDivId = bizcardModule.getFirstBizcardDivId();
  if (firstDivId) {
    const firstDiv = document.getElementById(firstDivId);
    if (firstDiv) {
      selection.selectTheCardDiv(firstDiv, true);
    }
  }
}

/**
 * Select next bizcard
 */
function selectNextBizcard(): void {
  const selectedId = selection.getTheSelectedCardDivId();
  const nextBizcardDivId = selectedId 
    ? bizcardModule.getFollowingBizcardDivId(selectedId)
    : bizcardModule.getFirstBizcardDivId();

  if (nextBizcardDivId) {
    const nextBizcardDiv = document.getElementById(nextBizcardDivId);
    if (nextBizcardDiv) {
      selection.selectTheCardDiv(nextBizcardDiv, true);
    }
  }
}

/**
 * Handle window load
 */
function handleWindowLoad(): void {
  // Initialize focal point
  const focalPointElement = document.getElementById("focal-point");
  if (focalPointElement) {
    const isDraggable = true;
    focalPoint.createFocalPoint(focalPointElement as HTMLElement, focalPointListener, isDraggable);
  }

  // Initialize timeline
  const timelineContainer = document.getElementById("timeline-container");
  const [MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR] = bizcardModule.getMinMaxTimelineYears(jobs);
  const DEFAULT_TIMELINE_YEAR = MAX_TIMELINE_YEAR;
  
  timeline.createTimeline(
    timelineContainer,
    canvasContainer,
    MIN_TIMELINE_YEAR,
    MAX_TIMELINE_YEAR,
    DEFAULT_TIMELINE_YEAR
  );

  // Create bizcards
  bizcardModule.createBizcardDivs(canvas);

  // Add event listeners to bizcards
  const allBizcardDivs = document.getElementsByClassName("bizcard-div");
  for (let i = 0; i < allBizcardDivs.length; i++) {
    const bizcardDiv = allBizcardDivs[i] as HTMLDivElement;
    bizcardDiv.addEventListener("mouseenter", eventHandlers.handleCardDivMouseEnter);
    bizcardDiv.addEventListener("mouseleave", eventHandlers.handleCardDivMouseLeave);
    eventHandlers.addCardDivClickListener(bizcardDiv);
  }

  // Initialize layout
  parallax.renderAllTranslateableDivsAtCanvasContainerCenter(canvasContainer);
  positionGradients();
  centerBullsEye();
  parallax.setBullsEyePosition(bullsEyeX, bullsEyeY);
  easeFocalPointToBullsEye();

  // Start animation loop
  function drawFrame() {
    focalPoint.drawFocalPointAnimationFrame();
    window.requestAnimationFrame(drawFrame);
  }
  window.requestAnimationFrame(drawFrame);
}

/**
 * Handle window resize
 */
function handleWindowResize(): void {
  const windowWidth = window.innerWidth;
  const canvasContainerWidth = windowWidth / 2;
  canvasContainer.style.width = canvasContainerWidth + "px";
  canvas.style.width = canvasContainerWidth + "px";
  
  parallax.renderAllTranslateableDivsAtCanvasContainerCenter(canvasContainer);
  positionGradients();
  centerBullsEye();
  parallax.setBullsEyePosition(bullsEyeX, bullsEyeY);
  easeFocalPointToBullsEye();
}

// Attach window event listeners
window.addEventListener("load", handleWindowLoad);
window.addEventListener("resize", handleWindowResize);

// Set up canvas container event listeners
eventHandlers.addCanvasContainerEventListener(
  canvasContainer,
  "mousemove",
  (e) => eventHandlers.handleCanvasContainerMouseMove(e as MouseEvent, canvasContainer)
);

eventHandlers.addCanvasContainerEventListener(
  canvasContainer,
  "wheel",
  (e) => eventHandlers.handleCanvasContainerWheel(e as WheelEvent),
  { passive: true }
);

eventHandlers.addCanvasContainerEventListener(
  canvasContainer,
  "mouseenter",
  (e) => eventHandlers.handleMouseEnterCanvasContainer(e as MouseEvent, bullsEyeX, bullsEyeY)
);

eventHandlers.addCanvasContainerEventListener(
  canvasContainer,
  "mouseleave",
  () => eventHandlers.handleMouseLeaveCanvasContainer(bullsEyeX, bullsEyeY)
);

eventHandlers.addCanvasContainerEventListener(
  canvasContainer,
  "scroll",
  () => eventHandlers.handleCanvasContainerScroll(canvasContainer)
);

eventHandlers.addCanvasContainerEventListener(
  canvasContainer,
  "click",
  () => eventHandlers.handleCanvasContainerMouseClick(canvasContainer)
);

// Button event listeners
selectAllBizcardsButton.addEventListener("click", selectAllBizcards);
selectFirstBizcardButton.addEventListener("click", selectFirstBizcard);
selectNextBizcardButton.addEventListener("click", selectNextBizcard);
clearAllLineItemsButton.addEventListener("click", () => {
  lineItems.clearAllDivCardLineItems();
  selection.deselectTheSelectedCardDiv();
});

// Block clicks during animation
animation.blockClicksDuringAnimation();

