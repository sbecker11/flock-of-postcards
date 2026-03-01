// Selection state management for cards and line items

import * as lineItems from './line_items.js';
import * as utils from './utils.js';
import * as zDepth from './z_depth.js';
import { isCardDivLineItem } from './dom_helpers.js';
import { scrollElementIntoView } from './dom_helpers.js';
import type { StyleArray } from './types.js';

// Selection state
let theSelectedCardDiv: HTMLElement | null = null;
let theSelectedCardDivLineItem: HTMLLIElement | null = null;

/**
 * Get currently selected card div ID
 */
export function getTheSelectedCardDivId(): string | null {
  return theSelectedCardDiv ? theSelectedCardDiv.id : null;
}

/**
 * Select a card div
 */
export function selectTheCardDiv(
  cardDiv: HTMLElement,
  selectTheCardDivLineItemFlag: boolean = false
): void {
  if (!cardDiv) return;
  
  if (!utils.isCardDivOrBizcardDiv(cardDiv)) {
    console.warn(`selectTheCardDiv ignoring invalid argument: ${cardDiv}`);
    return;
  }

  // Click on selected to deselect
  if (theSelectedCardDiv && cardDiv.id === theSelectedCardDiv.id) {
    deselectTheSelectedCardDiv(selectTheCardDivLineItemFlag);
    return;
  }

  // Deselect previous
  deselectTheSelectedCardDiv(selectTheCardDivLineItemFlag);

  // Save as selected
  theSelectedCardDiv = cardDiv;

  // Style as selected
  setSelectedStyle(theSelectedCardDiv);

  // Optionally add line item
  if (selectTheCardDivLineItemFlag) {
    // This would call addCardDivLineItem from line_items module
    const cardDivLineItem = lineItems.addCardDivLineItem(
      document.getElementById("right-content-div") as HTMLElement,
      cardDiv.id
    );
    if (cardDivLineItem) {
      selectTheCardDivLineItem(cardDivLineItem);
    }
  }

  scrollElementIntoView(theSelectedCardDiv);
}

/**
 * Deselect the currently selected card div
 */
export function deselectTheSelectedCardDiv(deselectTheSelectedCardDivLineItemFlag: boolean = false): void {
  if (theSelectedCardDiv) {
    restoreSavedStyle(theSelectedCardDiv);

    if (deselectTheSelectedCardDivLineItemFlag) {
      deselectTheSelectedCardDivLineItem();
    }

    theSelectedCardDiv = null;
  }
}

/**
 * Select a card div line item
 */
export function selectTheCardDivLineItem(
  cardDivLineItem: HTMLLIElement,
  selectTheCardDivFlag: boolean = false
): void {
  if (!cardDivLineItem) return;

  // Click on selected to deselect
  if (theSelectedCardDivLineItem && cardDivLineItem.id === theSelectedCardDivLineItem.id) {
    deselectTheSelectedCardDivLineItem(selectTheCardDivFlag);
    return;
  }

  // Deselect previous
  deselectTheSelectedCardDivLineItem(selectTheCardDivFlag);

  // Save as selected
  theSelectedCardDivLineItem = cardDivLineItem;

  // Style as selected
  setSelectedStyle(theSelectedCardDivLineItem);

  // Optionally select its card div
  if (selectTheCardDivFlag) {
    const cardDivId = cardDivLineItem.getAttribute("targetCardDivId");
    if (cardDivId) {
      const cardDiv = document.getElementById(cardDivId);
      if (cardDiv) {
        selectTheCardDiv(cardDiv as HTMLElement);
      }
    }
  }
}

/**
 * Deselect the currently selected card div line item
 */
export function deselectTheSelectedCardDivLineItem(deselectTheSelectedCardDivFlag: boolean = false): void {
  if (theSelectedCardDivLineItem) {
    restoreSavedStyle(theSelectedCardDivLineItem);

    if (deselectTheSelectedCardDivFlag) {
      deselectTheSelectedCardDiv();
    }

    theSelectedCardDivLineItem = null;
  }
}

/**
 * Set selected style on an element
 */
export function setSelectedStyle(obj: HTMLElement): void {
  // Avoid re-applying if already selected (prevents flickering)
  if (obj.classList.contains('selected')) {
    return;
  }
  
  const notLineItem = !isCardDivLineItem(obj);

  if (notLineItem) {
    // Save current position
    obj.setAttribute("saved-left", `${obj.offsetLeft}`);
    obj.setAttribute("saved-top", `${obj.offsetTop}`);
    obj.setAttribute("saved-zIndex", obj.style.zIndex);

    // Set selected position
    obj.setAttribute("saved-selected-left", obj.getAttribute("originalLeft") || "0");
    obj.setAttribute("saved-selected-top", obj.getAttribute("originalTop") || "0");
    obj.setAttribute("saved-selected-zIndex", zDepth.getSelectedCardDivZIndexStr());

    utils.ensureHexColorStringAttribute(obj, "saved-selected-color");
    utils.ensureHexColorStringAttribute(obj, "saved-selected-background-color");
  }

  const currentStyleArray = createStyleArray(obj, "saved");
  const targetStyleArray = createStyleArray(obj, "saved-selected");

  applyStyleArray(obj, targetStyleArray);
  obj.classList.add('selected');
}

/**
 * Restore saved style on an element
 */
export function restoreSavedStyle(obj: HTMLElement): void {
  // Only restore if currently selected (prevents unnecessary updates)
  if (!obj.classList.contains('selected')) {
    return;
  }
  
  const notLineItem = !isCardDivLineItem(obj);
  const targetStyleArray = createStyleArray(obj, "saved");

  obj.style.color = obj.getAttribute("saved-color") || "";
  obj.style.backgroundColor = obj.getAttribute("saved-background-color") || "";

  applyStyleArray(obj, targetStyleArray);
  obj.classList.remove('selected');
}

/**
 * Create style array from element attributes
 */
export function createStyleArray(obj: HTMLElement, prefix: string | null): StyleArray {
  const array: number[] = [];

  if (prefix) {
    // Use attributes
    const color = obj.getAttribute(`${prefix}-color`) || "";
    const bgColor = obj.getAttribute(`${prefix}-background-color`) || "";
    
    // Only process non-empty color strings
    const colorRGB = color.trim() ? utils.get_RGB_from_AnyStr(color) : null;
    const bgColorRGB = bgColor.trim() ? utils.get_RGB_from_AnyStr(bgColor) : null;
    
    if (colorRGB) array.push(...colorRGB);
    if (bgColorRGB) array.push(...bgColorRGB);

    if (!isCardDivLineItem(obj)) {
      const left = parseInt(obj.getAttribute(`${prefix}-left`) || "0");
      const top = parseInt(obj.getAttribute(`${prefix}-top`) || "0");
      const zIndexStr = obj.getAttribute(`${prefix}-zIndex`) || "0";
      const z = zDepth.get_z_from_zIndexStr(zIndexStr);
      
      array.push(left, top, z);
    } else {
      array.push(0, 0, 0);
    }
  } else {
    // Use current styles
    const colorRGB = obj.style.color.trim() ? utils.get_RGB_from_AnyStr(obj.style.color) : null;
    const bgColorRGB = obj.style.backgroundColor.trim() ? utils.get_RGB_from_AnyStr(obj.style.backgroundColor) : null;
    
    if (colorRGB) array.push(...colorRGB);
    if (bgColorRGB) array.push(...bgColorRGB);

    if (!isCardDivLineItem(obj)) {
      array.push(obj.offsetLeft, obj.offsetTop);
      const z = zDepth.get_z_from_zIndexStr(obj.style.zIndex);
      array.push(z);
    } else {
      array.push(0, 0, 0);
    }
  }

  return array as StyleArray;
}

/**
 * Apply style array to element
 */
export function applyStyleArray(obj: HTMLElement, styleArray: StyleArray): void {
  const rgbColor = utils.get_RgbStr_from_RGB(styleArray.slice(0, 3) as [number, number, number]);
  obj.style.color = rgbColor;

  const rgbBgColor = utils.get_RgbStr_from_RGB(styleArray.slice(3, 6) as [number, number, number]);
  obj.style.backgroundColor = rgbBgColor;

  if (!isCardDivLineItem(obj)) {
    obj.style.left = styleArray[6] + 'px';
    obj.style.top = styleArray[7] + 'px';
    const z = styleArray[8];
    obj.style.zIndex = zDepth.get_zIndexStr_from_z(z);
    obj.style.filter = zDepth.get_filterStr_from_z(z);
  }
}
