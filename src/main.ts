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
import * as colorPalette from './modules/color_palette.js';
import * as cardModule from './modules/card.js';

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
const paletteSelector = document.getElementById("palette-selector") as HTMLSelectElement;
const paletteIcon = document.getElementById("paletteIcon") as HTMLElement;
const paletteSelectorPopup = document.getElementById("palette-selector-popup") as HTMLElement;

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
 * Toggle palette selector popup
 */
function togglePaletteSelectorPopup(): void {
  const isVisible = paletteSelectorPopup.style.display !== 'none';
  
  if (isVisible) {
    paletteSelectorPopup.style.display = 'none';
    paletteIcon.style.border = '2px solid transparent';
  } else {
    paletteSelectorPopup.style.display = 'block';
    paletteIcon.style.border = '2px solid white';
  }
}

/**
 * Handle palette selection change
 */
async function handlePaletteChange(paletteName: string): Promise<void> {
  if (!paletteName) return;
  
  try {
    await colorPalette.loadPaletteByName(paletteName);
    colorPalette.recolorAllBizCardDivs();
    console.log(`Applied palette: ${paletteName}`);
    
    // Close the popup after selection
    paletteSelectorPopup.style.display = 'none';
    paletteIcon.style.border = '2px solid transparent';
  } catch (error) {
    console.error(`Failed to apply palette ${paletteName}:`, error);
    alert(`Failed to load palette: ${paletteName}`);
  }
}

/**
 * Initialize palette selector dropdown
 */
async function initializePaletteSelector(): Promise<string | null> {
  try {
    const availablePalettes = await colorPalette.fetchAvailablePalettes();
    
    // Clear existing options
    paletteSelector.innerHTML = '';
    
    // Add options for each palette
    availablePalettes.forEach(paletteName => {
      const option = document.createElement('option');
      option.value = paletteName;
      option.textContent = paletteName.charAt(0).toUpperCase() + paletteName.slice(1);
      paletteSelector.appendChild(option);
    });
    
    // Return the first palette as default
    return availablePalettes.length > 0 ? availablePalettes[0] : null;
  } catch (error) {
    console.error('Failed to load palette list:', error);
    paletteSelector.innerHTML = '<option value="">Error loading palettes</option>';
    return null;
  }
}

/**
 * Handle window load
 */
async function handleWindowLoad(): Promise<void> {
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

  // Initialize palette selector and load default palette
  const defaultPalette = await initializePaletteSelector();
  
  if (defaultPalette) {
    try {
      await colorPalette.loadPaletteByName(defaultPalette);
      bizcardModule.setUsePaletteColors(true);
      console.log(`Loaded palette: ${defaultPalette} with ${colorPalette.getNumColors()} colors`);
    } catch (error) {
      console.warn('Failed to load color palette, using job colors instead:', error);
      bizcardModule.setUsePaletteColors(false);
    }
  } else {
    console.warn('No palettes available, using job colors');
    bizcardModule.setUsePaletteColors(false);
  }

  // Create bizcards
  bizcardModule.createBizcardDivs(canvas);

  // Add event listeners to bizcards
  const allBizcardDivs = document.getElementsByClassName("bizcard-div");
  for (let i = 0; i < allBizcardDivs.length; i++) {
    const bizcardDiv = allBizcardDivs[i] as HTMLDivElement;
    bizcardDiv.addEventListener("mouseenter", eventHandlers.handleCardDivMouseEnter);
    bizcardDiv.addEventListener("mouseleave", eventHandlers.handleCardDivMouseLeave);
    bizcardDiv.addEventListener("mousemove", eventHandlers.handleCardDivMouseMove);
    eventHandlers.addCardDivClickListener(bizcardDiv);
  }

  // Reposition all skill cards to weighted averages after all bizcards are created
  // This ensures cards used by multiple jobs are positioned at the timeline center of their usage
  cardModule.repositionAllCardsToWeightedAverages();

  // Add skill card lists to bizcards
  bizcardModule.addSkillCardListsToAllBizcards();
  
  // Add click listeners to back icons in skill lists
  bizcardModule.addBackIconClickListeners();

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

// Palette icon click event listener
paletteIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  togglePaletteSelectorPopup();
});

// Palette selector event listener
paletteSelector.addEventListener("change", (e) => {
  const selectedPalette = (e.target as HTMLSelectElement).value;
  handlePaletteChange(selectedPalette);
});

// Close palette popup when clicking outside
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (!paletteSelectorPopup.contains(target) && target !== paletteIcon) {
    paletteSelectorPopup.style.display = 'none';
    paletteIcon.style.border = '2px solid transparent';
  }
});

// Block clicks during animation
animation.blockClicksDuringAnimation();

