// Card div creation and management

import type { TagLink } from './types.js';
import * as utils from './utils.js';
import * as timeline from './timeline.js';
import * as zDepth from './z_depth.js';
import * as monoColor from './monoColor.js';
import * as bizcardModule from './bizcard.js';
import * as eventHandlers from './event_handlers.js';
import { copyHexColorAttributes } from './dom_helpers.js';
import {
  ESTIMATED_NUMBER_CARD_DIVS,
  MAX_CARD_POSITION_OFFSET,
  MEAN_CARD_LEFT,
  MEAN_CARD_HEIGHT,
  MEAN_CARD_WIDTH,
  CARD_BORDER_WIDTH,
  CARD_MIN_Z,
  CARD_MAX_Z,
  BIZCARD_WIDTH
} from './constants.js';
import { getNextCardDivId } from './dom_helpers.js';

// Type definitions
interface CardPosition {
  card: HTMLDivElement;
  x: number;
  y: number;
}

let prev_z: number | null = null;

/**
 * Create a card div from a tag link
 */
export function createCardDiv(
  canvas: HTMLElement,
  bizcardDiv: HTMLDivElement,
  tag_link: TagLink
): HTMLDivElement {
  const cardDivId = getNextCardDivId();
  const cardDiv = document.createElement('div');
  cardDiv.classList.add("card-div");
  utils.validateIsCardDivOrBizcardDiv(cardDiv);

  cardDiv.id = cardDivId;
  canvas.appendChild(cardDiv);
  cardDiv.dataset.bizcardDivDays = String(bizcardModule.getBizcardDivDays(bizcardDiv));

  // Position cardDiv near the center of its parent bizcardDiv
  const bizcardTop = parseInt(bizcardDiv.style.top) || 0;
  const bizcardHeight = parseInt(bizcardDiv.style.height) || 0;
  const bizcardLeft = parseInt(bizcardDiv.style.left) || 0;
  const bizcardWidth = parseInt(bizcardDiv.style.width) || 0;
  
  // Calculate center of bizcardDiv
  const bizcardCenterY = bizcardTop + bizcardHeight / 2;
  const bizcardCenterX = bizcardLeft + bizcardWidth / 2;
  
  // Add random offset around the center
  const verticalOffset = utils.getRandomInt(-MAX_CARD_POSITION_OFFSET, MAX_CARD_POSITION_OFFSET);
  const horizontalOffset = utils.getRandomInt(-MAX_CARD_POSITION_OFFSET, MAX_CARD_POSITION_OFFSET);
  
  const top = bizcardCenterY + verticalOffset;
  const left = bizcardCenterX + horizontalOffset;
  
  cardDiv.style.top = `${top}px`;
  cardDiv.style.left = `${left}px`;

  // Random z-depth (avoid consecutive duplicates)
  let z = utils.getRandomInt(CARD_MIN_Z, CARD_MAX_Z);
  while (z === prev_z) {
    z = utils.getRandomInt(CARD_MIN_Z, CARD_MAX_Z);
  }
  prev_z = z;

  const zIndexStr = zDepth.get_zIndexStr_from_z(z);

  // Inherit colors from bizcard
  cardDiv.setAttribute("bizcardDivId", bizcardDiv.id);
  copyHexColorAttributes(cardDiv, bizcardDiv, [
    'saved-background-color',
    'saved-color',
    'saved-selected-background-color',
    'saved-selected-color'
  ]);

  cardDiv.setAttribute("saved-zIndexStr", zIndexStr);
  cardDiv.setAttribute("saved-filterStr", zDepth.get_filterStr_from_z(z));

  cardDiv.style.zIndex = cardDiv.getAttribute("saved-zIndexStr") || "";
  cardDiv.style.filter = cardDiv.getAttribute("saved-filterStr") || "";
  cardDiv.style.backgroundColor = cardDiv.getAttribute("saved-background-color") || "";
  cardDiv.style.color = cardDiv.getAttribute("saved-color") || "";

  // Set dimensions
  const width = MEAN_CARD_WIDTH + 2 * CARD_BORDER_WIDTH;
  const height = MEAN_CARD_HEIGHT + 2 * CARD_BORDER_WIDTH;
  cardDiv.style.borderWidth = `${CARD_BORDER_WIDTH}px`;
  cardDiv.style.borderStyle = "solid";
  cardDiv.style.borderColor = "white";
  cardDiv.style.width = `${width}px`;
  cardDiv.style.height = `${height}px`;

  // Save original position
  const originalCtrX = left + width / 2;
  const originalCtrY = top + height / 2;
  const originalZ = z;
  cardDiv.setAttribute("originalLeft", `${cardDiv.offsetLeft}`);
  cardDiv.setAttribute("originalTop", `${cardDiv.offsetTop}`);
  cardDiv.setAttribute("originalWidth", `${cardDiv.offsetWidth}`);
  cardDiv.setAttribute("originalHeight", `${cardDiv.offsetHeight}`);
  cardDiv.setAttribute("originalCtrX", `${originalCtrX}`);
  cardDiv.setAttribute("originalCtrY", `${originalCtrY}`);
  cardDiv.setAttribute("originalZ", `${originalZ}`);

  // Set content from tag link
  const spanId = `tag_link-${cardDivId}`;
  const savedColor = cardDiv.getAttribute("saved-color");
  cardDiv.innerHTML = `<span id="${spanId}" data-saved-color="${savedColor}" class="tag-link" targetCardDivId="${cardDivId}">${tag_link.html}</span>`;

  const spanElement = document.getElementById(spanId);
  if (spanElement) {
    spanElement.style.color = cardDiv.style.color;

    // Add click listeners to all icons in this card
    const icons = spanElement.querySelectorAll('.icon');
    icons.forEach(icon => {
      eventHandlers.addIconClickListener(icon as HTMLElement);
    });
    
    // Add click listeners to all bizcard links in this card
    const bizcardLinks = spanElement.querySelectorAll('.bizcard-link');
    bizcardLinks.forEach(link => {
      eventHandlers.addBizcardLinkClickListener(link as HTMLElement);
    });
  }

  // Store tag link properties
  cardDiv.setAttribute("tagLinkText", tag_link["text"]);
  cardDiv.setAttribute("tagLinkUrl", tag_link["url"]);
  cardDiv.setAttribute("tagLinkImg", tag_link["img"]);

  // Remove mono-color-sensitive class from children
  const monocolorElements = Array.from(cardDiv.getElementsByClassName("mono-color-sensitive"));
  for (const element of monocolorElements) {
    element.classList.remove("mono-color-sensitive");
  }

  // Add event listeners
  cardDiv.addEventListener("mouseenter", eventHandlers.handleCardDivMouseEnter);
  cardDiv.addEventListener("mouseleave", eventHandlers.handleCardDivMouseLeave);
  cardDiv.addEventListener("mousemove", eventHandlers.handleCardDivMouseMove);
  eventHandlers.addCardDivClickListener(cardDiv);

  return cardDiv;
}

/**
 * Apply repulsion forces between cards to prevent clustering
 */
function applyRepulsionForces(
  cardPositions: Array<{card: HTMLDivElement, x: number, y: number}>,
  minTop: number,
  maxBottom: number,
  minLeft: number,
  maxRight: number
): void {
  const MIN_DISTANCE = 150; // Minimum distance between card centers (increased)
  const REPULSION_STRENGTH = 0.5; // How strongly cards push each other (increased)
  const MAX_ITERATIONS = 20; // Number of repulsion iterations (increased)
  
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let moved = false;
    
    // Calculate repulsion forces between all pairs
    for (let i = 0; i < cardPositions.length; i++) {
      let forceX = 0;
      let forceY = 0;
      
      for (let j = 0; j < cardPositions.length; j++) {
        if (i === j) continue;
        
        const dx = cardPositions[i].x - cardPositions[j].x;
        const dy = cardPositions[i].y - cardPositions[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If too close, apply repulsive force
        if (distance < MIN_DISTANCE && distance > 0) {
          const force = ((MIN_DISTANCE - distance) / MIN_DISTANCE) * REPULSION_STRENGTH;
          forceX += (dx / distance) * force * MIN_DISTANCE;
          forceY += (dy / distance) * force * MIN_DISTANCE;
          moved = true;
        }
      }
      
      // Apply accumulated forces
      cardPositions[i].x += forceX;
      cardPositions[i].y += forceY;
      
      // Keep within bounds - ensure right edge doesn't exceed maxRight
      const cardWidth = cardPositions[i].card.offsetWidth;
      const cardHeight = cardPositions[i].card.offsetHeight;
      
      // Vertical bounds
      if (cardPositions[i].y < minTop) cardPositions[i].y = minTop;
      if (cardPositions[i].y + cardHeight > maxBottom) cardPositions[i].y = maxBottom - cardHeight;
      
      // Horizontal bounds - constrain so right edge stays within maxRight
      if (cardPositions[i].x < minLeft) cardPositions[i].x = minLeft;
      if (cardPositions[i].x + cardWidth > maxRight) cardPositions[i].x = maxRight - cardWidth;
    }
    
    // Stop early if no significant movement
    if (!moved) break;
  }
}

/**
 * Ensure all cards have unique X positions to prevent vertical alignment
 * Cards that are too close horizontally will be adjusted with random jitter
 */
function ensureUniqueXPositions(
  cardPositions: CardPosition[],
  parallaxTranslateOffset: number,
  leftwardShift: number,
  maxRightEdge: number
): void {
  const MIN_X_SEPARATION = 40; // Minimum horizontal pixels between card centers (increased)
  const JITTER_RANGE = 10; // Random adjustment range (reduced for more control)
  
  let totalAdjusted = 0;
  const MAX_ITERATIONS = 5;
  
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let adjustedThisPass = 0;
    
    // Check all pairs (not just adjacent)
    for (let i = 0; i < cardPositions.length; i++) {
      for (let j = i + 1; j < cardPositions.length; j++) {
        const cardA = cardPositions[i];
        const cardB = cardPositions[j];
        
        const cardWidthA = cardA.card.offsetWidth || MEAN_CARD_WIDTH;
        const cardWidthB = cardB.card.offsetWidth || MEAN_CARD_WIDTH;
        
        // Calculate visual center positions
        const centerA = cardA.x + parallaxTranslateOffset + utils.half(cardWidthA);
        const centerB = cardB.x + parallaxTranslateOffset + utils.half(cardWidthB);
        
        const separation = Math.abs(centerB - centerA);
        
        // If too close, push them apart with random jitter
        if (separation < MIN_X_SEPARATION) {
          const jitterA = (Math.random() - 0.5) * JITTER_RANGE;
          const jitterB = (Math.random() - 0.5) * JITTER_RANGE;
          
          const baseAdjustment = (MIN_X_SEPARATION - separation) / 2;
          
          // Apply adjustment with jitter
          if (centerA < centerB) {
            cardA.x -= (baseAdjustment + jitterA);
            cardB.x += (baseAdjustment + jitterB);
          } else {
            cardA.x += (baseAdjustment + jitterA);
            cardB.x -= (baseAdjustment + jitterB);
          }
          
          adjustedThisPass++;
        }
      }
    }
    
    // Clamp all cards within boundaries after adjustments
    for (let i = 0; i < cardPositions.length; i++) {
      const cardWidth = cardPositions[i].card.offsetWidth || MEAN_CARD_WIDTH;
      const visualLeft = cardPositions[i].x + parallaxTranslateOffset + leftwardShift;
      const visualRight = visualLeft + cardWidth;
      
      if (visualLeft < 0) {
        cardPositions[i].x = -parallaxTranslateOffset - leftwardShift;
      }
      
      if (visualRight > maxRightEdge) {
        cardPositions[i].x = maxRightEdge - cardWidth - parallaxTranslateOffset - leftwardShift;
      }
    }
    
    totalAdjusted += adjustedThisPass;
    
    // If no adjustments were made, we're done
    if (adjustedThisPass === 0) break;
  }
  
  if (totalAdjusted > 0) {
    console.log(`  Adjusted ${totalAdjusted} card pairs across iterations to ensure unique X positions`);
  }
}

/**
 * Reposition all skill cards randomly across the entire vertical timeline span
 * with repulsion to prevent clustering, centered around bullsEye
 * This should be called once after all bizcards are created
 */
export function repositionAllCardsToWeightedAverages(): void {
  // Get canvas container width to constrain horizontal bounds
  const canvasContainer = document.getElementById("canvas-container");
  if (!canvasContainer) {
    console.error("canvas-container not found");
    return;
  }
  const canvasWidth = canvasContainer.offsetWidth;
  
  // Get bullsEye position (center of canvas-container)
  const bullsEye = document.getElementById("bulls-eye");
  const bullsEyeCenterX = bullsEye 
    ? bullsEye.offsetLeft + utils.half(bullsEye.offsetWidth)
    : utils.half(canvasWidth);
  
  // Get all bizcards to find the timeline span
  const bizcardDivs = document.getElementsByClassName("bizcard-div");
  if (bizcardDivs.length === 0) return;
  
  // Find min and max Y positions of bizcards (timeline span)
  // Also calculate average left and right edges
  let minTop = Infinity;
  let maxBottom = -Infinity;
  let sumLeftEdge = 0;
  let sumRightEdge = 0;
  
  for (let i = 0; i < bizcardDivs.length; i++) {
    const bizcardDiv = bizcardDivs[i] as HTMLDivElement;
    const top = parseInt(bizcardDiv.style.top) || 0;
    const height = parseInt(bizcardDiv.style.height) || 0;
    const bottom = top + height;
    const left = parseInt(bizcardDiv.style.left) || 0;
    const right = left + BIZCARD_WIDTH;
    
    if (top < minTop) minTop = top;
    if (bottom > maxBottom) maxBottom = bottom;
    sumLeftEdge += left;
    sumRightEdge += right;
  }
  
  const avgLeftEdge = sumLeftEdge / bizcardDivs.length;
  const avgRightEdge = sumRightEdge / bizcardDivs.length;
  
  // Initial random positioning of all skill cards 
  const cardDivs = document.getElementsByClassName("card-div");
  const cardPositions: Array<{card: HTMLDivElement, x: number, y: number}> = [];
  
  // CRITICAL: Account for the translate that parallax.renderAllTranslateableDivsAtCanvasContainerCenter applies
  // That function translates cards by: (canvasContainerX - half(cardWidth))
  // We need to SUBTRACT this offset so final visual position is correct
  const parallaxTranslateOffset = bullsEyeCenterX - utils.half(MEAN_CARD_WIDTH);
  
  // Apply additional leftward shift of halfWidth / 3
  const leftwardShift = (canvasWidth / 2) / 3; // halfWidth / 3
  
  // Count cards left and right of bullsEye for diagnostics
  let initialLeftOfCenter = 0;
  let initialRightOfCenter = 0;
  
  console.log(`Positioning cards: canvasWidth=${canvasWidth}, bullsEye=${bullsEyeCenterX}, parallaxOffset=${parallaxTranslateOffset}, leftwardShift=${leftwardShift}`);
  console.log(`Card CENTERS will cluster around average bizcard left edge (${avgLeftEdge.toFixed(1)}px) and right edge (${avgRightEdge.toFixed(1)}px)`);
  
  const maxRightEdge = canvasWidth; // Allow full canvas width for boundary checking
  
  for (let i = 0; i < cardDivs.length; i++) {
    const cardDiv = cardDivs[i] as HTMLDivElement;
    const cardWidth = cardDiv.offsetWidth || MEAN_CARD_WIDTH;
    const halfCardWidth = utils.half(cardWidth);
    
    // Random Y position across entire timeline span
    const randomTop = utils.getRandomInt(minTop, maxBottom);
    
    // Distribute card centers around average left and right edges of bizcards
    // 50% chance to cluster around left edge, 50% around right edge
    const clusterAroundLeft = Math.random() < 0.5;
    const edgeVariance = 60; // Pixels of variance around each edge
    
    let visualCenterX, visualLeft, visualRight, randomLeft;
    let attempts = 0;
    do {
      if (clusterAroundLeft) {
        // Cluster around average bizcard left edge ± variance
        visualCenterX = avgLeftEdge + (Math.random() - 0.5) * edgeVariance;
      } else {
        // Cluster around average bizcard right edge ± variance
        visualCenterX = avgRightEdge + (Math.random() - 0.5) * edgeVariance;
      }
      
      visualLeft = visualCenterX - halfCardWidth;
      visualRight = visualCenterX + halfCardWidth;
      randomLeft = visualLeft - parallaxTranslateOffset - leftwardShift;
      attempts++;
      
      // Safety check to avoid infinite loop
      if (attempts > 100) {
        // Force position to be valid
        visualCenterX = clusterAroundLeft ? avgLeftEdge : avgRightEdge;
        visualLeft = visualCenterX - halfCardWidth;
        visualRight = visualCenterX + halfCardWidth;
        randomLeft = visualLeft - parallaxTranslateOffset - leftwardShift;
        break;
      }
    } while (visualLeft < 0 || visualRight > maxRightEdge);
    
    if (visualCenterX < bullsEyeCenterX) {
      initialLeftOfCenter++;
    } else {
      initialRightOfCenter++;
    }
    
    // Log first few cards
    if (i < 5) {
      console.log(`  Card ${i}: domLeft=${randomLeft.toFixed(0)}, visualCenter=${visualCenterX.toFixed(0)}, visualRight=${visualRight.toFixed(0)}, ${visualCenterX < bullsEyeCenterX ? 'LEFT' : 'RIGHT'} of center (attempts: ${attempts})`);
    }
    
    cardPositions.push({
      card: cardDiv,
      x: randomLeft,
      y: randomTop
    });
  }
  
  // Apply repulsion forces to spread cards out
  // Set bounds to ensure visual left >= 0 and visual right <= canvasWidth/2
  // Visual left = domLeft + parallaxTranslateOffset + leftwardShift
  // So: domLeft >= -parallaxTranslateOffset - leftwardShift (for visual left >= 0)
  // Visual right = domLeft + cardWidth + parallaxTranslateOffset + leftwardShift
  // So: domLeft + cardWidth <= canvasWidth/2 - parallaxTranslateOffset - leftwardShift (for visual right <= canvasWidth/2)
  // Note: applyRepulsionForces enforces domLeft + cardWidth <= maxRight, so we don't subtract cardWidth here
  const minLeft = -parallaxTranslateOffset - leftwardShift;
  const maxRight = maxRightEdge - parallaxTranslateOffset - leftwardShift;
  applyRepulsionForces(cardPositions, minTop, maxBottom, minLeft, maxRight);
  
  // FINAL PASS: Enforce boundary rules after all positioning logic
  // Ensure visual left >= 0 and visual right <= canvasWidth/2
  let clampedCount = 0;
  for (let i = 0; i < cardPositions.length; i++) {
    const cardWidth = cardPositions[i].card.offsetWidth || MEAN_CARD_WIDTH;
    
    // Calculate visual positions
    const visualLeft = cardPositions[i].x + parallaxTranslateOffset + leftwardShift;
    const visualRight = visualLeft + cardWidth;
    
    let wasClamped = false;
    
    // Check and fix left boundary
    if (visualLeft < 0) {
      // Visual left should be 0, so domLeft = 0 - parallaxTranslateOffset - leftwardShift
      cardPositions[i].x = -parallaxTranslateOffset - leftwardShift;
      wasClamped = true;
    }
    
    // Check and fix right boundary
    const newVisualLeft = cardPositions[i].x + parallaxTranslateOffset + leftwardShift;
    const newVisualRight = newVisualLeft + cardWidth;
    if (newVisualRight > maxRightEdge) {
      // Visual right should be maxRightEdge, so domLeft = maxRightEdge - cardWidth - parallaxTranslateOffset - leftwardShift
      cardPositions[i].x = maxRightEdge - cardWidth - parallaxTranslateOffset - leftwardShift;
      wasClamped = true;
    }
    
    if (wasClamped) clampedCount++;
  }
  
  console.log(`  Clamped ${clampedCount} cards to boundary after repulsion`);
  
  // ENSURE UNIQUE X POSITIONS: Prevent vertical alignment
  ensureUniqueXPositions(cardPositions, parallaxTranslateOffset, leftwardShift, maxRightEdge);
  
  // Calculate FINAL average VISUAL position (accounting for translate)
  let sumVisualCenterX = 0;
  let finalLeftOfCenter = 0;
  let finalRightOfCenter = 0;
  const visualCenterXValues: number[] = [];
  
  for (let i = 0; i < cardPositions.length; i++) {
    const cardWidth = cardPositions[i].card.offsetWidth || MEAN_CARD_WIDTH;
    // Visual position = DOM position + translate offset (leftward shift already applied to DOM position)
    const visualCenterX = cardPositions[i].x + parallaxTranslateOffset + utils.half(cardWidth);
    sumVisualCenterX += visualCenterX;
    visualCenterXValues.push(visualCenterX);
    
    if (visualCenterX < bullsEyeCenterX) {
      finalLeftOfCenter++;
    } else {
      finalRightOfCenter++;
    }
  }
  const finalMeanVisualCenterX = sumVisualCenterX / cardPositions.length;
  const finalAvgOffset = finalMeanVisualCenterX - bullsEyeCenterX;
  
  // Calculate statistics for center X values
  const minCenterX = Math.min(...visualCenterXValues);
  const maxCenterX = Math.max(...visualCenterXValues);
  
  // Calculate standard deviation
  let sumSquaredDiff = 0;
  for (const centerX of visualCenterXValues) {
    const diff = centerX - finalMeanVisualCenterX;
    sumSquaredDiff += diff * diff;
  }
  const stdDevCenterX = Math.sqrt(sumSquaredDiff / visualCenterXValues.length);
  
  // Log the actual VISUAL horizontal spread (after translate, leftward shift already in DOM positions)
  let minVisualX = Infinity;
  let maxVisualX = -Infinity;
  for (let i = 0; i < cardPositions.length; i++) {
    const cardWidth = cardPositions[i].card.offsetWidth || MEAN_CARD_WIDTH;
    const visualLeft = cardPositions[i].x + parallaxTranslateOffset;
    const visualRight = visualLeft + cardWidth;
    if (visualLeft < minVisualX) minVisualX = visualLeft;
    if (visualRight > maxVisualX) maxVisualX = visualRight;
  }
  const actualSpread = maxVisualX - minVisualX;
  
  // Apply final positions to DOM
  for (let i = 0; i < cardPositions.length; i++) {
    const { card, x, y } = cardPositions[i];
    
    card.style.top = `${y}px`;
    card.style.left = `${x}px`;
    
    // Update saved positions
    card.setAttribute("originalLeft", `${x}`);
    card.setAttribute("originalTop", `${y}`);
    
    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;
    const originalCtrX = x + cardWidth / 2;
    const originalCtrY = y + cardHeight / 2;
    
    card.setAttribute("originalCtrX", `${originalCtrX}`);
    card.setAttribute("originalCtrY", `${originalCtrY}`);
  }
  
  const expectedCenterX = canvasWidth/2 - leftwardShift;
  const offsetFromExpected = finalMeanVisualCenterX - expectedCenterX;
  
  console.log(`\nRepositioned ${cardDivs.length} skill cards:`);
  console.log(`  Canvas width: ${canvasWidth}px`);
  console.log(`  BullsEye center: ${bullsEyeCenterX.toFixed(1)}px`);
  console.log(`  Leftward shift applied: ${leftwardShift.toFixed(1)}px`);
  console.log(`  Expected average center X: ${expectedCenterX.toFixed(1)}px (canvas center minus leftward shift)`);
  console.log(`  ==========================================`);
  console.log(`  SKILL CARD CENTER X STATISTICS:`);
  console.log(`    MIN:    ${minCenterX.toFixed(1)}px`);
  console.log(`    MAX:    ${maxCenterX.toFixed(1)}px`);
  console.log(`    MEAN:   ${finalMeanVisualCenterX.toFixed(1)}px`);
  console.log(`    STDDEV: ${stdDevCenterX.toFixed(1)}px`);
  console.log(`  ==========================================`);
  console.log(`  Offset from expected: ${offsetFromExpected.toFixed(1)}px (should be ~0)`);
  console.log(`  Initial distribution: ${initialLeftOfCenter} left, ${initialRightOfCenter} right of center`);
  console.log(`  FINAL distribution: ${finalLeftOfCenter} left, ${finalRightOfCenter} right of center`);
  console.log(`  Timeline: ${minTop}px to ${maxBottom}px`);
  console.log(`  VISUAL horizontal spread: ${actualSpread.toFixed(0)}px (${((actualSpread/canvasWidth)*100).toFixed(0)}% of canvas)`);
  console.log(`  VISUAL left edge: ${minVisualX.toFixed(0)}px, right edge: ${maxVisualX.toFixed(0)}px`);
  
  // Create visual debug line to show the average position
  const canvas = document.getElementById('canvas');
  if (canvas) {
    // Remove old debug line if exists
    const oldLine = document.getElementById('debug-avg-line');
    if (oldLine) {
      oldLine.remove();
      console.log('  Removed old debug line');
    }
    
    // Create vertical line at average center position
    const debugLine = document.createElement('div');
    debugLine.id = 'debug-avg-line';
    debugLine.style.position = 'absolute';
    debugLine.style.left = `${finalMeanVisualCenterX}px`;
    debugLine.style.top = '0';
    debugLine.style.width = '4px';
    debugLine.style.height = '100%';
    debugLine.style.backgroundColor = 'red';
    debugLine.style.zIndex = '9999';
    debugLine.style.pointerEvents = 'none';
    debugLine.style.opacity = '1.0';
    canvas.appendChild(debugLine);
    
    console.log(`  ✓ Red debug line created at X=${finalMeanVisualCenterX.toFixed(1)}px (should align with bullsEye at ${bullsEyeCenterX.toFixed(1)}px)`);
    console.log(`  Debug line element ID: ${debugLine.id}, in canvas: ${canvas.contains(debugLine)}`);
  } else {
    console.error('  ✗ Canvas element not found - cannot draw debug line');
  }
}

/**
 * Find an existing card div that matches a tag link
 */
export function findCardDiv(bizcardDiv: HTMLDivElement, tag_link: TagLink): HTMLDivElement | null {
  const cardDivs = document.getElementsByClassName("card-div");
  
  for (const cardDiv of Array.from(cardDivs)) {
    if (cardDivMatchesTagLink(cardDiv as HTMLDivElement, tag_link)) {
      // Add back icon if needed
      const backIcons = cardDiv.getElementsByClassName("back-icon");
      let numFound = 0;
      
      for (let i = 0; i < backIcons.length; i++) {
        const backIcon = backIcons[i] as HTMLElement;
        if (backIcon.dataset.bizcardId === bizcardDiv.id) {
          numFound++;
        }
      }
      
      // Add back icon if not found (this is a new bizcard using this skill)
      if (numFound === 0) {
        const savedColor = cardDiv.getAttribute('saved-color') || '';
        const newBackAnchorTag = createBackAnchorTag(bizcardDiv.id, savedColor, false);
        const spanTagLink = cardDiv.querySelector('span.tag-link');
        
        if (spanTagLink) {
          spanTagLink.innerHTML += newBackAnchorTag;
          
          // Add click listener to the newly added back icon
          const newBackIcon = spanTagLink.querySelector(`img[data-bizcard-id="${bizcardDiv.id}"]`);
          if (newBackIcon) {
            eventHandlers.addIconClickListener(newBackIcon as HTMLElement);
          }
        } else {
          throw new Error(`cardDiv:${cardDiv.id} must have a span.tag-link element`);
        }
        
        const days = parseInt((cardDiv as HTMLDivElement).dataset.bizcardDivDays || "0");
        (cardDiv as HTMLDivElement).dataset.bizcardDivDays = String(days + bizcardModule.getBizcardDivDays(bizcardDiv));
        
        // Note: Repositioning happens in a final pass after all bizcards are created
        // See repositionAllCardsToWeightedAverages() called from main.ts
      }
      
      return cardDiv as HTMLDivElement;
    }
  }
  
  return null;
}

/**
 * Check if a card div matches a tag link
 */
export function cardDivMatchesTagLink(cardDiv: HTMLDivElement, tag_link: TagLink): boolean {
  // Check text attribute
  if (tag_link.text !== cardDiv.getAttribute("tagLinkText")) {
    return false;
  }

  // Check optional img attribute
  const cardImg = cardDiv.getAttribute("tagLinkImg");
  if (tag_link.img !== cardImg) {
    if (tag_link.img && cardImg) {
      return false;
    }
  }

  // Check optional url attribute
  const cardUrl = cardDiv.getAttribute("tagLinkUrl");
  if (tag_link.url !== cardUrl) {
    if (tag_link.url && cardUrl) {
      return false;
    }
  }

  return true;
}

/**
 * Set the card div ID for a tag link (find or create)
 */
export function setCardDivIdOfTagLink(
  canvas: HTMLElement,
  bizcardDiv: HTMLDivElement,
  tag_link: TagLink
): void {
  let cardDiv = findCardDiv(bizcardDiv, tag_link);
  
  if (!cardDiv) {
    cardDiv = createCardDiv(canvas, bizcardDiv, tag_link);
  }
  
  tag_link.cardDivId = cardDiv.id;
  
  const comma = (bizcardDiv.dataset.cardDivIds && bizcardDiv.dataset.cardDivIds.length > 0) ? ',' : '';
  bizcardDiv.dataset.cardDivIds = (bizcardDiv.dataset.cardDivIds || "") + comma + cardDiv.id;
}

/**
 * Get card div index from ID
 */
function getCardDivIndex(cardDivId: string): number | null {
  if (cardDivId.startsWith("card-div-")) {
    const index = parseInt(cardDivId.replace("card-div-", ""));
    return Number.isNaN(index) ? null : index;
  }
  return null;
}

/**
 * Create back anchor tag helper
 */
function createBackAnchorTag(bizcard_id: string, savedColor: string, isMonocolorSensitive: boolean): string {
  const iconColor = monoColor.getIconColor(savedColor);
  const iconType = "back";
  const monoColorSensitiveClass = isMonocolorSensitive ? "mono-color-sensitive" : '';
  return `<img class="icon back-icon ${monoColorSensitiveClass}" src="/icons/icons8-${iconType}-16-${iconColor}.png" data-bizcard-id="${bizcard_id}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
}

/**
 * Add months/years experience display to card
 */
export function addCardDivMonths(cardDiv: HTMLDivElement, cardDivLineItemContent: HTMLElement): void {
  const days = parseInt(cardDiv.dataset.bizcardDivDays || "0");
  const months = Math.round(days * 12.0 / 365.25);
  cardDiv.dataset.bizcardDivMonths = String(months);
  cardDiv.dataset.bizcardDivYears = "0";
  
  const spanElement = cardDivLineItemContent.querySelector("span.tag-link");
  if (spanElement) {
    if (months <= 12) {
      const units = months === 1 ? "month" : "months";
      spanElement.innerHTML += `<br/>(${months} ${units} experience)`;
    } else {
      const years = Math.round(months / 12.0);
      const units = years === 1 ? "year" : "years";
      spanElement.innerHTML += `<br/>(${years} ${units} experience)`;
      cardDiv.dataset.bizcardDivYears = String(years);
    }
  } else {
    console.error(`no spanElement found for cardDiv:${cardDiv.id}`);
  }
}
