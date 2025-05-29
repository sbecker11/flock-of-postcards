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