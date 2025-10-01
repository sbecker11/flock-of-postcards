// DOM helper functions and type guards

import * as utils from './utils.js';

/**
 * Type guard to check if element is a bizcard div
 */
export function isBizcardDiv(div: Element | null): div is HTMLDivElement {
  return div != null && div.classList.contains('bizcard-div');
}

/**
 * Type guard to check if element is a card div
 */
export function isCardDiv(div: Element | null): div is HTMLDivElement {
  return div != null && div.classList.contains('card-div');
}

/**
 * Type guard to check if element is a card div line item
 */
export function isCardDivLineItem(div: Element | null): div is HTMLLIElement {
  return div != null && div.classList.contains('card-div-line-item');
}

/**
 * Check if string is a bizcard div ID
 */
export function isBizcardDivId(divId: string): boolean {
  return divId != null && divId.startsWith("bizcard-div-") && getBizcardDivIndex(divId) != null;
}

/**
 * Check if string is a card div ID
 */
export function isCardDivId(divId: string): boolean {
  return divId != null && divId.startsWith("card-div-") && getCardDivIndex(divId) != null;
}

/**
 * Extract index from bizcard div ID
 * @returns Index number or null if invalid
 */
export function getBizcardDivIndex(cardDivId: string): number | null {
  if (cardDivId.startsWith("bizcard-div-")) {
    const index = parseInt(cardDivId.replace("bizcard-div-", ""));
    return Number.isNaN(index) ? null : index;
  }
  return null;
}

/**
 * Extract index from card div ID
 * @returns Index number or null if invalid
 */
export function getCardDivIndex(cardDivId: string): number | null {
  if (cardDivId.startsWith("card-div-")) {
    const index = parseInt(cardDivId.replace("card-div-", ""));
    return Number.isNaN(index) ? null : index;
  }
  return null;
}

/**
 * Get bizcard div ID from index
 * @returns Bizcard div ID or null if not found
 */
export function getBizcardDivIdFromIndex(index: number): string | null {
  const bizcardDivId = `bizcard-div-${index}`;
  const bizcardDiv = document.getElementById(bizcardDivId);
  return (bizcardDiv && bizcardDiv.id === bizcardDivId) ? bizcardDivId : null;
}

/**
 * Get the next available bizcard div ID
 */
export function getNextBizcardDivId(): string {
  const bizcardDivs = document.getElementsByClassName("bizcard-div");
  return `bizcard-div-${bizcardDivs.length}`;
}

/**
 * Get the next available card div ID
 */
export function getNextCardDivId(): string {
  const cardDivs = document.getElementsByClassName("card-div");
  return `card-div-${cardDivs.length}`;
}

/**
 * Find nearest ancestor with a specific class name
 */
export function findNearestAncestorWithClassName(
  element: HTMLElement,
  className: string
): HTMLElement | null {
  let current: HTMLElement | null = element;
  while ((current = current.parentElement) && !current.classList.contains(className));
  return current;
}

/**
 * Scroll element to top of its scrollable container
 */
export function scrollElementToTop(element: HTMLElement): void {
  const container = findNearestAncestorWithClassName(element, "scrollable-container");
  if (!container) return;
  
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop + elementRect.top - containerRect.top;
  container.scrollTo({ top: scrollTop, behavior: 'smooth' });
}

/**
 * Scroll element to center of its scrollable container
 */
export function scrollElementToCenter(element: HTMLElement): void {
  const container = findNearestAncestorWithClassName(element, "scrollable-container");
  if (!container) return;
  
  const containerHeight = container.clientHeight;
  const elementTop = element.offsetTop;
  const elementHeight = element.clientHeight;
  const scrollTop = elementTop + (elementHeight / 2) - (containerHeight / 2);
  container.scrollTo({ top: scrollTop, behavior: 'smooth' });
}

/**
 * Scroll element into view based on its type
 */
export function scrollElementIntoView(element: HTMLElement): void {
  if (!element || !element.id) {
    throw new Error("Invalid element");
  }
  
  if (isBizcardDiv(element) || isCardDivLineItem(element)) {
    scrollElementToTop(element);
  } else if (isCardDiv(element)) {
    scrollElementToCenter(element);
  } else {
    throw new Error("Unhandled element type with id:" + element.id);
  }
}

/**
 * Copy hex color attributes from source div to destination div
 */
export function copyHexColorAttributes(
  dstDiv: HTMLElement,
  srcDiv: HTMLElement,
  attrs: string[]
): void {
  for (const attr of attrs) {
    const srcVal = srcDiv.getAttribute(attr);
    if (!srcVal) {
      throw new Error(`srcDiv:${srcDiv.id} must have a ${attr} attribute`);
    }
    utils.validateHexColorString(srcVal);
    dstDiv.setAttribute(attr, srcVal);
  }
}

/**
 * Remove img tags from HTML string
 */
export function removeImgTagsFromHtml(html: string): string {
  return html.replace(/<img[^>"']*((("[^"]*")|('[^']*'))[^"'>]*)*>/g, "");
}

/**
 * Get all translatable card divs (bizcards and cards)
 */
export function getAllTranslateableCardDivs(): HTMLElement[] {
  const canvas = document.getElementById("canvas");
  if (!canvas) return [];
  
  let allDivs: HTMLElement[] = [];
  allDivs = Array.prototype.concat.apply(
    allDivs,
    Array.from(canvas.getElementsByClassName("bizcard-div"))
  );
  allDivs = Array.prototype.concat.apply(
    allDivs,
    Array.from(canvas.getElementsByClassName("card-div"))
  );
  return allDivs;
}
