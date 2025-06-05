// modules/utils/domUtils.mjs

import * as utils from './utils.mjs';
import * as colorUtils from '../color/colorUtils.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("domUtils", LogLevel.INFO);

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
