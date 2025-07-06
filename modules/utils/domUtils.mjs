// modules/utils/domUtils.mjs

import * as utils from './utils.mjs';
import { get_RGB_from_Hex, getContrastingColor, isHexColor as isHexColorString } from '../utils/colorUtils.mjs';

export function hasClass(element, className) {
    return element && className && element.classList.contains(className);
}

export function addClass(element, className) {
    if (element && className && !hasClass(element, className)) {
       return element.classList.add(className);
    }
    return false;
}

export function removeClass(element, className) {
    if ( hasClass(element, className) ) {
        element.classList.remove(className);
        return true;
    }
    return false; 
}

export function isHTMLElement(obj) {
    return ( obj instanceof HTMLElement );
}

// exclusivePointerEvents.mjs
// Utilities for exclusive pointer event control

// Enable pointer events for a target element
export function targetEnabled(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (target) {
        target.dataset._originalPointerEvents = target.style.pointerEvents;
        target.style.pointerEvents = 'all';
        target.dataset._originalZIndex = target.style.zIndex;
        target.style.zIndex = 9999;
    }
}

// Select all elements to disable except the target and its descendants
export function selectForDisabled(targetSelector) {
    // Returns a NodeList of all elements except the target and its descendants
    return document.querySelectorAll(`body *:not(${targetSelector}):not(${targetSelector} *)`);
}

// Disable pointer events for selected elements
export function disableSelectedForDisabled(nodeList) {
    nodeList.forEach(el => {
        el.dataset._originalPointerEvents = el.style.pointerEvents;
        el.style.pointerEvents = 'none';
    });
}

// Restore pointer events for selected elements
export function restoreSelectedForDisabled(nodeList) {
    nodeList.forEach(el => {
        el.style.pointerEvents = el.dataset._originalPointerEvents || '';
        delete el.dataset._originalPointerEvents;
    });
} 


// counts all styles of prop strings
export class PropStyleCounter {
    constructor() {
      this.prop_styles = {};
    }
  
    prop_style( prop )  {
      if ( isNonEmptyString(prop) ) {
          // remove all numbers from prop
          return prop.replace(/\d/g, '');
      }
      return 'none';
    }
  
    addProp( prop ) {
      const prop_style = this.prop_style(prop);
      if (!this.prop_styles[prop_style]) {
          this.prop_styles[prop_style] = 1;
      } else {
          this.prop_styles[prop_style] += 1;
      }
    }
  
    reportPropStyles() {
      for (const prop_style in this.prop_styles) {
        window.CONSOLE_LOG_IGNORE(`${prop_style}: ${this.prop_styles[prop_style]}`);
      }
    }
  }
  

export function showPosition(position, prefix="") {
    window.CONSOLE_LOG_IGNORE(prefix, JSON.stringify(position, formatNumbersReplacer, 2));
}

export function showElement(element, prefix="", logLevel=LogLevel.LOG) {
    prefix = "showElement" + prefix + ":";

    if (element == null) {
        window.CONSOLE_LOG_IGNORE(`${prefix} given null element`);
        return;
    }
    if (!isHTMLElement(element)) {
        window.CONSOLE_LOG_IGNORE(`${prefix} given non-element object:${element}`);
        return;
    }
    if (element.id == null) {
        window.CONSOLE_LOG_IGNORE(`${prefix} given element with no id:${element}`);
        return;
    }
    // now construct the elementInfo object
    const parentElementId = (element.parentElement != null) ? element.parentElement.id : "";
    let nextSiblingId = null;
    if (isAnyCardDiv(element)) {
        const nextSibling = findNextSiblingWithClass(element, "skill-card-div");
        nextSiblingId = (nextSibling != null) ? nextSibling.id : "";
    } else if (isBizCardDiv(element)) {
        const nextSibling = findNextSiblingWithClass(element, "biz-card-div");
        nextSiblingId = (nextSibling != null) ? nextSibling.id : "";
    }
    const center = {
        x: element.offsetLeft + element.clientWidth / 2,
        y: element.offsetTop + element.clientHeight / 2
    }
    const dims = {
        width: element.clientWidth,
        height: element.clientHeight
    }
    const elementInfo = {
        tagname: element.tagName,
        id: element.id,
        parent_id: parentElementId,
        next_sibling_id: nextSiblingId,
        center: center,
        dims: dims,
        zIndex: element.style.zIndex,
        filter: element.style.filter,
        classList: element.classList
    }
    window.CONSOLE_LOG_IGNORE(JSON.stringify(elementInfo, formatNumbersReplacer, 2));
}


/**
 * Finds the next sibling element of a given element that has a specific CSS class.
 *
 * @param {Element} element The starting element.
 * @param {string} className The CSS class name to search for.
 * @returns {Element|null} The first matching next sibling element, or null if none is found.
 */
export function findNextSiblingWithClass(element, className) {
    if (!element || !className) {
      window.CONSOLE_LOG_IGNORE("findNextSiblingWithClass: Invalid element or className provided.");
      return null;
    }
  
    // Start with the immediately following sibling ELEMENT
    let nextElement = element.nextElementSibling;
  
    // Loop through subsequent sibling elements
    while (nextElement) {
      // Check if the current sibling element has the specified class
      if (nextElement.classList.contains(className)) {
        return nextElement; // Found a match!
      }
      // Move to the next sibling ELEMENT
      nextElement = nextElement.nextElementSibling;
    }
  
    // If the loop finishes without finding a match
    return null;
  }
  
export function matchPositions(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Utility function to add or remove event listeners from an element
 * @param {Element} element - The element to add/remove listeners from
 * @param {string} eventType - The type of event (e.g., 'mousemove', 'mouseup')
 * @param {Function} listener - The event listener function
 * @param {Object|boolean} options - Event listener options or boolean for remove
 */
export function updateEventListener(element, eventType, listener, options = {}) {
    if (!element || !eventType || !listener) {
        window.CONSOLE_LOG_IGNORE('updateEventListener: Missing required parameters');
        return;
    }

    // If options.remove is true, remove the listener
    if (options.remove === true) {
        element.removeEventListener(eventType, listener);
        window.CONSOLE_LOG_IGNORE(`Removed ${eventType} listener from`, element);
        return;
    }

    // Otherwise, add the listener
    element.addEventListener(eventType, listener, options);
    window.CONSOLE_LOG_IGNORE(`Added ${eventType} listener to`, element, 'with options:', options);
}


export function findScrollableAncestor(element) {
    while (element && element.parentNode) {
        element = element.parentNode;
        if (element === document.body) {
            // document.body is the default scrollable ancestor
            return document.body;
        }
        const overflowY = window.getComputedStyle(element).overflowY;
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
        const canScroll = element.scrollHeight > element.clientHeight;

        if (isScrollable && canScroll) {
            return element;
        }
    }
    return null;
}

export function getObjectAsString(obj) {
    let str = "";
    for (let key in obj) {
        let comma = (str === "") ? "" : ", ";
        str += `${comma}${key}:${obj[key]}`;
    }
    return str;
}

export function getAttributesAsObject(element) {
    let attributes = {};
    for (let attribute of element.attributes) {
        attributes[attribute.name] = attribute.value;
    }
    return attributes;
}
export function getAttributesAsString(element) {
    let attributes = getAttributesAsObject(element);
    return getObjectAsString(attributes);
}

export function getDatasetAsString(element) {
    let dataset = element.dataset;
    return getObjectAsString(dataset);
}

export const formatNumbersReplacer = (key, value) => {
    if (typeof value === 'number') {
        return Number(value.toFixed(2));
    }
    return value;
}

// const left = getOffset(element).left; 
// const {top,left} = getOffset(element); 
export function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while (el && !Number.isNaN(el.offsetLeft) && !Number.isNaN(el.offsetTop)) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

export function test_domUtils() {
    
}