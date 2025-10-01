// Parallax transformation system for depth effect

import * as utils from './utils.js';
import * as zDepth from './z_depth.js';
import { getAllTranslateableCardDivs } from './dom_helpers.js';
import {
  PARALLAX_X_EXAGGERATION_FACTOR,
  PARALLAX_Y_EXAGGERATION_FACTOR,
  ALL_CARDS_MAX_Z
} from './constants.js';
import type { Parallax } from './types.js';

// Parallax state
let parallaxX = 0;
let parallaxY = 0;
let bullsEyeX = 0;
let bullsEyeY = 0;
let focalPointX = 0;
let focalPointY = 0;

/**
 * Get current parallax offset
 */
export function getParallax(): Parallax {
  parallaxX = bullsEyeX - focalPointX;
  parallaxY = bullsEyeY - focalPointY;
  return { parallaxX, parallaxY };
}

/**
 * Set bulls eye position
 */
export function setBullsEyePosition(x: number, y: number): void {
  bullsEyeX = x;
  bullsEyeY = y;
}

/**
 * Set focal point position
 */
export function setFocalPointPosition(x: number, y: number): void {
  focalPointX = x;
  focalPointY = y;
}

/**
 * Calculate Z-based translate string for parallax
 */
export function getZTranslateStr(
  dh: number,
  dv: number,
  z: number,
  canvasContainer_dx: number,
  canvasContainer_dy: number
): string {
  const zIndex = parseInt(zDepth.get_zIndexStr_from_z(z));
  const zScale = (zIndex <= ALL_CARDS_MAX_Z) ? zIndex : 0.0;

  const dx = dh * zScale + canvasContainer_dx;
  const dy = dv * zScale + 0;
  
  return `${dx}px ${dy}px`;
}

/**
 * Apply parallax to one card div with given style props
 */
export function applyParallaxToOneCardDivStyleProps(
  cardDiv: HTMLElement,
  canvasContainer: HTMLElement,
  zIndexStr: string
): void {
  const { parallaxX, parallaxY } = getParallax();
  const canvasContainerX = utils.half(canvasContainer.offsetWidth);
  const canvasContainerY = utils.half(canvasContainer.offsetHeight);

  const dh = parallaxX * PARALLAX_X_EXAGGERATION_FACTOR;
  const dv = parallaxY * PARALLAX_Y_EXAGGERATION_FACTOR;

  const z = zDepth.get_z_from_zIndexStr(zIndexStr);
  const cardDivX = utils.half(cardDiv.offsetWidth);
  const cardDivY = utils.half(cardDiv.offsetHeight);

  const canvasContainer_dx = canvasContainerX - cardDivX;
  const canvasContainer_dy = canvasContainerY - cardDivY;

  const zTranslateStr = getZTranslateStr(dh, dv, z, canvasContainer_dx, canvasContainer_dy);

  try {
    cardDiv.style.translate = zTranslateStr;
  } catch (error) {
    console.error(`applyParallax cardDiv:${cardDiv.id}`, error);
  }
}

/**
 * Apply parallax to one card div
 */
export function applyParallaxToOneCardDiv(
  cardDiv: HTMLElement,
  canvasContainer: HTMLElement
): void {
  const zIndexStr = cardDiv.style.zIndex;
  applyParallaxToOneCardDivStyleProps(cardDiv, canvasContainer, zIndexStr);
}

/**
 * Apply parallax to all translatable divs
 */
export function applyParallax(canvasContainer: HTMLElement): void {
  const allDivs = getAllTranslateableCardDivs();
  for (const cardDiv of allDivs) {
    applyParallaxToOneCardDiv(cardDiv, canvasContainer);
  }
}

/**
 * Render all translatable divs at canvas container center
 */
export function renderAllTranslateableDivsAtCanvasContainerCenter(canvasContainer: HTMLElement): void {
  const canvasContainerX = utils.half(canvasContainer.offsetWidth);
  const canvasContainerY = utils.half(canvasContainer.offsetHeight);
  const translateableDivs = getAllTranslateableCardDivs();
  
  for (const div of translateableDivs) {
    const divWidth = div.offsetWidth;
    const trans_dx = canvasContainerX - utils.half(divWidth);
    const trans_dy = 0;
    const translateStr = `${trans_dx}px ${trans_dy}px`;
    
    try {
      div.style.translate = translateStr;
    } catch (error) {
      console.error(`Error centering div:${div.id}`, error);
    }
  }
}
