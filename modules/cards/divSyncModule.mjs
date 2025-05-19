// modules/cards/divSyncModule.mjs

import { scrollBizResumeDivIntoView } from './bizResumeDivScrollingModule.mjs';
import { scrollBizCardDivIntoView } from './bizCardDivModule.mjs';
 
/**
 * PURE STATE SYNC MODULE (No Styling)
 * Only manages class names - CSS handles all visuals
 */

// ========================
// STATE CONSTANTS
// ========================
const STATES = {
    HOVERED: 'hovered',  // Just class names
    SELECTED: 'selected' 
};

// ========================
// CORE ENGINE
// ========================

// clear all states before adding state
function applyState(element, state) {
    if (!element) throw new Error('DivSync: Null element in applyState');
    if (!element.pairedElement) throw new Error('DivSync: Null pairedElement in applyState');

    // clear all states
    removeClass(element,STATES.HOVERED);
    removeClass(element,STATES.SELECTED);

    // add state
    if (state) addClass(element, state);
}


export function syncPairStates(element, state) {
    if (!element) throw new Error("syncPairStates: null element");
    if (!element.pairedElement) throw new Error("syncPairStates: null pairedElement");

    // apply state to both elements
    applyState(element, state);
}

// Track the currently selected element (single source of truth)
let currentSelected = null;


// ========================
// PUBLIC API
// ========================
export function setSelected(element) {
    console.log('DivSync: setSelected', element.id);
    if (!element) {
        // clear all selected elements
        console.log("DivSync: setSelected: null");
        document.querySelectorAll(`.${STATES.SELECTED}`).forEach(el => {
            syncPairStates(el, null);
        });
        console.log("DivSync: setSelected: currentSelected = null");
        currentSelected = null;
        return;
    } 

    // clear previousSelected
    if (currentSelected) {
        console.log("DivSync: setSelected set currentSelected = null");
        syncPairStates(currentSelected, null);
    }

    // Set elemment as STATUS_SELECTED
    syncPairStates(element, STATES.SELECTED);

    // update global currentSelected tracker
    console.log("DivSync: setSelected: currentSelected = ", element.id);
    currentSelected = element; // Update global tracker
}

export function getSelected() {
    console.log('DivSync: getSelected', currentSelected ? currentSelected.id : 'null');
    return currentSelected;
}

export function setSelectedBizResumeDiv(element) {
    if (!element || !element.classList.contains('biz-resume-div')) {
        setSelected(null); // Clear selection if invalid.
        return;
    }
    setSelected(element);
}

export function getSelectedBizResumeDiv() {
    if ( !currentSelected ) {
        return null;
    }
    if ( currentSelected.classList.contains('biz-resume-div') ) {
        return currentSelected;
    } else {
        return currentSelected.pairedElement;
    }
}

export function addClass(element, className) {
    if ( !element )  return;
    if ( !element.pairedElement ) throw new Error("addClass: null pairedElement");
    
    element.classList.add(className);
    element.pairedElement.classList.add(className);
}

export function removeClass(element, className) {
    if ( !element ) return;
    if ( !element.pairedElement ) throw new Error("removeClass: null pairedElement");
    
    element.classList.remove(className);
    element.pairedElement.classList.remove(className);
}

export function hasClass(element, className) {
    if ( !element ) return false;
    if ( !element.pairedElement ) throw new Error(`divSyncModule: hasClass: ${element.id} pairedElement id nulll`);
    return element.classList.contains(className) || element.pairedElement.classList.contains(className);
}

// handles clicking on an element or its pairedElement
// if the element is the currentSelected then unselect it
// and clear the currectSelected
export function handleClickEvent(element) {
    if (!element) throw new Error(`DivSyncModule: handleClickEvent: element not found`);
    if ( !element.pairedElement ) throw new Error(`divSyncModule: handleClickEvent: ${element.id} pairedElement id nulll`);

    // if the element is alredy selected and it is 
    // the currentSelected then unselect 
    // it and clear teh currentSelected and return
    if (hasClass(element, STATES.SELECTED)) {
        if ( element === currentSelected || element.pairedElement === currentSelected ) {
            console.log("DivSync: handleClickEvent: unselecting currentSelected");
            removeClass(STATES.SELECTED);
            setSelected(null);
            return;
        }
    }

    // remove STATES.SELECTED class from element and pairedElement
    if (hasClass(element, STATES.SELECTED) ) {
        removeClass(element, STATES.SELECTED);
    }

    // Remove scrolled-into-view from all bizResumeDivs and pairedElements
    document.querySelectorAll('.biz-resume-div.scrolled-into-view').forEach(div => {
        removeClass(div, 'scrolled-into-view');
    });

    // scroll both elements into view
    if (hasClass(element,'biz-resume-div')) {
        // element is a bizResumeDiv
        scrollBizResumeDivIntoView(element, 'next');
        scrollBizCardDivIntoView(element.pairedElement, 'next');
    } else {
        // element is a bizCardDiv
        scrollBizCardDivIntoView(element, 'next');
        scrollBizResumeDivIntoView(element.pairedElement, 'next');
    }
    setSelected(element);
}

// this should be called in main.mjs
// after all bixDivCards and bizResumeDivs 
// have been created and appended to the DOM
export function initializeDivSync() {
    // Validate pairings
    const unpaired = [];
    document.querySelectorAll('.biz-card-div').forEach(el => {
        if (!el.pairedElement) unpaired.push(el);
    });

    if (unpaired.length > 0) {
        throw new Error(`divSyncModule: ${unpaired.length} unpaired elements`);
    }

    // Event bindings
    const applyTwoWayEventBindings = (el) => {
        if (!el.pairedElement) throw new Error(`divSyncModule: applyTwoWayEventBindings: ${el.id} pairedElement is null`);

        // Bind mouseenter events to both elements
        el.addEventListener('mouseenter', () => {
            if (!hasClass(el, STATES.SELECTED)) {
                syncPairStates(el, STATES.HOVERED);
            }
        });
        el.pairedElement.addEventListener('mouseenter', () => {
            if (!hasClass(el.pairedElement, STATES.SELECTED)) {
                syncPairStates(el.pairedElement, STATES.HOVERED);
            }
        });

        // Bind mouseleave events to both elements
        el.addEventListener('mouseleave', () => {
            if (!el.classList.contains(STATES.SELECTED)) {
                syncPairStates(el, null);
            }
        });
        el.pairedElement.addEventListener('mouseleave', () => {
            if (!el.pairedElement.classList.contains(STATES.SELECTED)) {
                syncPairStates(el.pairedElement, null);
            }
        });

        // Bind click events to both elements
        el.addEventListener('click', () => handleClickEvent(el));
        el.pairedElement.addEventListener('click', () => handleClickEvent(el.pairedElement));
    };

    // Apply bindings to all biz-card-divs
    document.querySelectorAll('.biz-card-div').forEach(el => {
        applyTwoWayEventBindings(el);
    });

    console.log('DivSync: Initialized');
}

