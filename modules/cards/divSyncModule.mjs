// modules/cards/divSyncModule.mjs

import * as jsonUtils from '../utils/jsonUtils.mjs';
 
//=======================
// PAIRED ELEMENTS
//=======================
export function makeSyncedPair(element1, element2) {
    if ( !element1 || !element1 instanceof HTMLElement )
        throw new Error("DivSyncModule:makeSyncedPair: given non-HTMLElement element:", element1.id);
    if ( !element2 || !element2 instanceof HTMLElement )
        throw new Error("DivSyncModule:makeSyncedPair: given non-HTMLElement element:", element2.id);
    element1.setAttribute('data-paired-id', element2.id);
    element2.setAttribute('data-paired-id', element1.id);
    if (!isPairedElement(element1) ) throw new Error(`divSyncModule:getBizCardDiv: element1:${element1.id} is not paired`);
    if (!isPairedElement(element2) ) throw new Error(`divSyncModule:getBizCardDiv: element2:${element2.id} is not paired`);
    console.log("DivSyncModule:makeSyncedPair: element1:", element1.id, " and element2:", element2.id, " are paired");
    const validated = verifySyncedPair(element1, element2,1);
    if (validated > 0) console.log("DivSyncModule:makeSyncedPair: validated:", validated, " times");
    return element1;
}

export function getPairedElement(element) {
    if ( !element || !(element instanceof HTMLElement) ) throw new Error("DivSyncModule:getPairedElement: given null or non-HTMLElement element");
    const pairedElement = document.getElementById(element.getAttribute('data-paired-id'))
    ;
    if ( !pairedElement || !(pairedElement instanceof HTMLElement) ) throw new Error("DivSyncModule:getPairedElement: given null or non-HTMLElement pairedElement");
    return pairedElement;
}

export function isPairedElement(element) {
    if (!element) return false;
    const element2 = getPairedElement(element);
    const element3 = getPairedElement(element2);
    return (element == element3);
}

export function getBizCardDiv(element) {
    if (!isPairedElement(element) ) throw new Error(`divSyncModule:getBizCardDiv: element is null or element:${element.id} is not paired`);
    if (hasClass(element, 'biz-card-div') ) return element;
    const pairElement = getPairedElement(element);
    if ( hasClass(pairElement, 'biz-card-div') ) return pairElement;
    else throw new Error(`divSyncModule:getBizCardDiv: element:${element.id} is not a biz-card-div and its pairedElement:${pairElement.id} is not a biz-card-div`);
}
export function getBizResumeDiv(element) {
    if (!isPairedElement(element) ) throw new Error(`divSyncModule:getBizResumeDiv: element is null or element:${element.id} is not paired`);
    if (hasClass(element, 'biz-resume-div') ) return element;
    const pairElement = getPairedElement(element);
    if ( hasClass(pairElement, 'biz-resume-div') ) return pairElement;
    else throw new Error(`divSyncModule:getBizResumeDiv: element:${element.id} is not a biz-resume-div and its pairedElement:${pairElement.id} is not a biz-resume-div`);
}

//=======================
// PAIRED ELEMENT CLASSES
//=======================

export function addClass(element, className) {
    if ( !isPairedElement ) return false;
    const pairedElement = getPairedElement(element);
    verifyMatchindClassLists(element, pairedElement);
    if (hasClass(element, className) ) return false;
    element.classList.add(className);
    setClassPath(elememnt, pairedElement);
    return true;
}

export function arePairedElements(element1, element2) {
    const pairedElement1 = getPairedElement(element1);
    const pairedElement2 = getPairedElement(element2);
    return (pairedElement1 == element2 && pairedElement2 == element1);
}

export function setClassPath(fromElement, toElement) {
    if ( !arePairedElement(fromElement) ) return false;
    const fromElementClassList = new classList(fromElement.classList); 
    toElement.classLIst = fromElementClassList;
}

export function verifyMatchindClassLists(element1, element2) {
    if ( classListsMatch(element1.classList, element2.classList) ) return true;
    else throw new Error(`verifyMatchindClassLists: element1:${element1.id} and element2:${element2.id} classLists do not match`);
}

export function classListsMatch(classList1, classList2) {
    if ( classList1.length !== classList2.length ) return false;
    for ( let i = 0; i < classList1.length; i++ ) {
        if ( ! classList2.contain.sclassList1[i] ) return false;
        if ( ! classList1.contains.classlist2[i] ) return false;
    }
    return true;
}

export function removeClass(element, className) {
    if ( !isPairedElement(element) ) return;
    const pairedElement = getPairedElement(element);
    verifyMatchindClassLists(element, pairedElement);
    if ( !hasClass(element, className)) return false;
    element.classList = new classList(element.classList).filter(c => c !== className);
    pairedElement.classList = new classList(pairedElement.classList).filter(c => c !== className);
    if ( verifyMatchindClassLists(pairElement, element) ) return true;
}    

export function hasClass(element, className) {
    if ( !element ) return false;
    const pairedElement = getPairedElement(element);
    if ( !pairedElement ) throw new Error(`divSyncModule: hasClass: element:${element.id} has null pairedElement`);
    if ( element.classList.contains(className) ) {
        if ( pairedElement.classList.contains(className) ) return true;
        else throw new Error(`divSyncModule: hasClass: element:${element.id} has class:${className} but pairedElement:${pairedElement.id} does not`);
    } else {
        if ( !pairedElement.classList.contains(className) ) return false;
        else throw new Error(`divSyncModule: hasClass: element:${element.id} does not have class:${className} but pairedElement:${pairedElement.id} does`);
    }
}

//=======================
// PAIRED ELEMENT STATES
//=======================

const STATES = {
    HOVERED: 'hovered',  // Just class names
    SELECTED: 'selected' 
};


// clear all states before adding state
function applyState(element, state) {
    if (!isSyncedPair(element) ) throw new Error('DivSyncModule: applyState given null orunpaired element');

    // clear all states
    removeClass(element,STATES.HOVERED);
    removeClass(element,STATES.SELECTED);

    // add state
    if (state) addClass(element, state);
}

// apply state to both elements without clearing other states
export function syncPairStates(element, state) {
    if (!isSyncedPair(element) ) throw new Error('DivSyncModule: syncPairStates given null or unpaired element');

    // apply state to both elements
    applyState(element, state);
}

//=======================
// PAIRED ELEMENT VERIFICATION
//=======================


// return true if the element is a synced pair
// otherwise outputs a warning and return false
export function isSyncedPair(element) {
    if (!element) console.warn("isSyncedPair: given ull element"); return false;
    const pairedElement = getPairedElement(element)
    if (!pairedElement) console.warn("isSyncedPair: null pairedElement"); return false;
    const pairedElementOfPairedElement = getPairedElement(pairedElement);
    if (!pairedElementOfPairedElement) { console.warn("isSyncedPair: null pairedElementOfPairedElement"); return false; }
    if (pairedElementOfPairedElement.id !== element.id) { console.warn("isSyncedPair: pairedElementOfPairedElement.id !== element.id"); return false; }
    if (pairedElementOfPairedElement.pairedElement !== element) { console.warn("isSyncedPair: pairedElementOfPairedElement.pairedElement !== element"); return false; }
    return true;
}

// does a deep verification of the pairing
// each paired element references the other
// do not call this until after all bizCardDivs and bizResumeDivs
// have been created and appended to the DOM
// throws an Error if the pairing is not valid
// otherwise returns true
export function verifySyncedPair(pairedElement,) {
    const errors = []
    try {
        if (!element) errors.push("verifySyncedPair: null element");
        if (!element.id) errors.push(`verifySyncedPair: element:${element.id} has null id`);
        if (element.id.indexOf('undefined') >= 0) errors.push(`verifySyncedPair: element:${element.id} includes "undefined"`);
        if (!isSyncedPair(element)) errors.push(`verifySyncedPair: element:${element.id} is not a synced pair`);
        const pairedElement = getPairedElement(element);
        if (pairedElement == null ) errors.push(`verifySyncedPair: element:${element.id} has null pairedElement`);
        if (!isSyncedPair(pairedElement) ) errors.push(`verifySyncedPair: element:${element.id} has null pairedElement`);
        const pairOfPairedElement = getPairedElement(pairedElement);
        if (pairOfPairedElement != element) errors.push(`verifySyncedPair: element:${element.id} != pairOfPairedElement:${pairOfPairedElement.id}`);
        const bizCardDiv = getBizCardDiv(element);
        const bizResumeDiv = getBizResumeDiv(element);
        if (!bizCardDiv) errors.push(`verifySyncedPair: element:${element.id} bizCardDiv is null`);
        return timesValidated+1
    }
    finally {
        if (errors.length > 0) {
            throw new Error(`divSyncModule: verifySyncedPair: ${element.id} errors: ${errors.join('\n')}`);
        }
        return 0;
    }
}

//========================
// PAIRED ELEMENT SELECTION
//========================

// Track the currently selected element (single source of truth)
let currentSelected = null;

// return true if the element or its pairedElement is the currentSelected
export function matchesCurrentSelected(element) {
    if (!isSyncedPair(element) ) throw new Error('DivSyncModule: applyState given null orunpaired element');
    return element === currentSelected || getPairedElement(element) === currentSelected;
}

export function clearSelected() {
    if (!currentSelected) return;
    if (!isSyncedPair(currentSelected) ) throw new Error('DivSyncModule: clearSelected currentSelected it not a synced pair');
    syncPairStates(currentSelected, null);

    // unselect / clear all selected elements
    document.querySelectorAll(`.${STATES.SELECTED}`).forEach(element => {
        syncPairStates(element, null);
    });
    
    notifyDivSyncPairEventListeners(currentSelected, DivSyncPairEventTypes.UNSELECTED);
    currentSelected = null;
}
// set the currentSelected to the element`
export function setSelected(element) {
    if (!isSyncedPair(element) ) throw new Error('DivSyncModule: setSelected given null orunpaired element');

    // unselect / clear all selected elements
    document.querySelectorAll(`.${STATES.SELECTED}`).forEach(element => {
        syncPairStates(element, null);
    });

    // Set element as STATUS_SELECTED
    syncPairStates(element, STATES.SELECTED);

    // update global currentSelected tracker
    console.log("DivSyncModule:setSelected: currentSelected = ", element.id);
    currentSelected = element; // Update global tracker

    // notify divSyncPairEvent listeners
    notifyDivSyncPairEventListeners(element, DivSyncPairEventTypes.SELECTED);
}

// log the id of the selected element or null if no element is selected
export function getSelected() {
    console.log('DivSyncModule:getSelected', currentSelected ? currentSelected.id : 'null');
    return currentSelected;
}

export function setSelectedBizResumeDiv(element) {
    if (!isSyncedPair(element) ) throw new Error('DivSyncModule: setSelectedBizResumeDiv given null or unpaired element');
    const bizResumeDiv = getBizResumeDiv(element);
    if (!bizResumeDiv) throw new Error('DivSyncModule: setSelectedBizResumeDiv given element that is not a biz-resume-div');
    setSelected(bizResumeDiv);;
}

export function getSelectedBizResumeDiv() {
    if ( !currentSelected ) {
        return null;
    }
    return getBizResumeDiv(currentSelected);
}


// handles clicking to select an element or its pairedElement
// if the element is the currentSelected then unselect it
// and clear the currectSelected
// otherwise select the element (and its pairedElement)
// which notifies the divSyncPairEventListeners
export function handleClickEvent(element) {
    if ( !element ) throw new Error("DivSyncModule: handleClickEvent given a null element");
    if ( !element.pairedElement ) throw new Error(`divSyncModule: handleClickEvent: element:${element.id} has null pairedElement`);

    // if the element is alredy selected and it is 
    // the currentSelected then unselect 
    // it and clear teh currentSelected and return
    if (hasClass(element, STATES.SELECTED)) {
        if ( element === currentSelected || element.pairedElement === currentSelected ) {
            console.log("DivSyncModule:handleClickEvent: unselecting currentSelected");
            removeClass(STATES.SELECTED);
            clearSlected();
            return;
        }
    }

    // otherwise select the element and pairedElement
    setSelected(element);
}

// ========================
// DivSyncPairEvents
// ========================

export class DivSyncPairEvent {
    constructor(element, eventType) {
        if ( ! isPairedElement(element)) throw new Error(`DivSyncModule: DivSyncPairEvent: given undefined or unpaired element`);
        if ( ! isValidDivSyncPairEventType(eventType) ) throw new Error("DivSyncModule: DivSyncPairEvent: given invalid eventType: ${eventType}");
        this.eventType = eventType;
        this.element = element;
        this.pairedElement = element.pairedElement;
        this.bizCardDiv = getBizCardDiv(element);
        this.bizResumeDiv = getBizResumeDiv(element);
    }
}

export class DivSyncPairEventError extends Error {
    constructor(element, eventType, message) {
        super(message);
        this.name = 'DivSyncPairEventError';
        this.element = element;
        this.pairedElement = element.pairedElement;
        if ( !isValidEventType(eventType) ) throw new Error(`DivSyncPairEventError: given invalid eventType: ${eventType}`);
        this.eventType = eventType;
    }
}

export const DivSyncPairEventTypes = {
    SELECTED: "selected",
    UNSELECTED: "unselected",
    SERVER_ERROR: "serverError"
};

function divSyncPairEventTypes(value) {
    const values = Object.values(DivSyncPairEventTypes);
    const keys = Object.keys(DivSyncPairEventTypes);
    const valuesIncludeLower = values.includes(value.toLowerCase());
    const keysIncludeLower = keys.includes(value.toLowerCase());
    const valuesIncludeUpper = values.includes(value.toUpperCase());
    const keysIncludeUpper = keys.includes(value.toUpperCase());
    const included = valuesIncludeLower || keysIncludeLower || valuesIncludeUpper || keysIncludeUpper;
    return included;

}

function isValidDivSyncPairEventType(value) {
    const included = divSyncPairEventTypes(value);
    console.log("DivSyncModule:isValidDivSyncPairEventType included:", included);
    return included;
}

// =========================================
// DivSyncPairEventListener registration
// =========================================

let divSyncPairEventListeners = [];

// Add a listener for the divSyncModule to call for 
// when a divSyncPair events
// eventTarget is the divSyncPair that triggered the event
// eventTypes include: "selected"
//
// The subscriber's listener function can be used to scroll the elements
// of the selected divSyncPair into view or to perform other actions.
// returns true if the listener was added, false if it was already registered
export function addDivSyncPairEventListener(divSyncPairEventListener) {
    if (!divSyncPairEventListener) throw new Error('DivSyncModule: addDivSyncPairEventListener: given null callback');
    if (typeof divSyncPairEventListener !== 'function') throw new Error('DivSyncModule: addDivSyncPairListener is not a function');
    if (divSyncPairEventListeners.includes(divSyncPairEventListener)) return false; // already registered
    divSyncPairEventListeners.push(divSyncPairEventListener);
    return true;
}

// ===========================================
// DivSyncPairEventListener internal functions
// ===========================================

function notifyDivSyncPairEventListeners(element, eventType=DivSyncPairEventTypes.SELECTED) {
    try {
        if (!element) throw new Error('DivSyncModule: notifyDivSyncPairEventListeners: given null element');
        if (!eventType) throw new Error('DivSyncModule: notifyDivSyncPairEventListeners: given null eventType');
        if ( !isPairedElement(element) ) throw new Error('DivSyncModule: notifyDivSyncPairEventListeners: given elemen.id:',element.id,'is not paired');    
        if (!isValidDivSyncPairEventType(eventType)) throw new Error(`DivSyncModule: notifyDivSyncPairEventListeners: given invalid eventType: ${eventType}`);
    } catch (error) {
        const errorEvent = new DivSyncPairEvent(element, error.message, DivSyncPairEventTypes.SERVER_ERROR);
        console.error('HaHa DivSyncModule: notifyDivSyncPairEventListeners: error', errorEvent);
        divSyncPairEventListeners.forEach(eventListener => eventListener(errorEvent));
        return;
    }
    const normalEvent = new DivSyncPairEvent(element, eventType);
    divSyncPairEventListeners.forEach(eventListener => eventListener(normalEvent));
}

// stringify a DivSyncPair object
// by using a key-value replacer for known self-referencing keys
export function stringify(element) {
    if (!isPairedElement(divSyncPair) ) throw new Error(`divSyncModule:stringify: element is null or element:${element.id} is not paired`);
    return jsonUtils.stringifyCicular(element);
}

export function removeDivSyncPairEventListener(divSyncPairEventListener) {
    if (!divSyncPairEventListener) throw new Error('DivSyncModule: removeDivSyncPairEventListener: null divSyncPairEventListener');
    divSyncPairEventListeners = divSyncPairEventListeners.filter(listener => listener !== divSyncPairEventListener);
}

// ========================
// INITIALIZATION
// ========================

// this should be called in main.mjs
// after all bixDivCards and bizResumeDivs 
// have been created and appended to the DOM
export function initializeDivSync() {
    // Validate pairings
    let unpaired = [];

    // verify that all biz-card-divs are paired
    document.querySelectorAll('.biz-card-div').forEach(element => {
        if (!isPairedElement(element) ) unpaired.push(element);
    });
    if (unpaired.length > 0) {
        throw new Error(`divSyncModule: ${unpaired.length} unpaired elements`);
    } 

    document.querySelectorAll('.biz-card-div').forEach(element => {
    
        const pairedElement = getPairedElement(element);

        // Bind mouseenter events to both elements
        element.addEventListener('mouseenter', () => {
            if (!hasClass(element, STATES.SELECTED)) {
                syncPairStates(element, STATES.HOVERED);
            }
        });
        pairedElement.addEventListener('mouseenter', () => {
            if (!hasClass(pairedElement, STATES.SELECTED)) {
                syncPairStates(pairedElement, STATES.HOVERED);
            }
        });

        // Bind mouseleave events to both elements
        element.addEventListener('mouseleave', () => {
            if (!element.classList.contains(STATES.SELECTED)) {
                syncPairStates(element, null);
            }
        });
        pairedElement.addEventListener('mouseleave', () => {
            if (!element.pairedElement.classList.contains(STATES.SELECTED)) {
                syncPairStates(element.pairedElement, null);
            }
        });

        // Bind click events to both elements
        element.addEventListener('click', () => handleClickEvent(element));
        pairedElement.addEventListener('click', () => handleClickEvent(pairedElement));
    });

    unpaired = [];

    // verify that all biz-resume-divs are paired
    document.querySelectorAll('.biz-resume-div').forEach(element => {
        if (!isPairedElement(element) ) unpaired.push(element);
    });
    if (unpaired.length > 0) {
        throw new Error(`divSyncModule: ${unpaired.length} unpaired abiz-resume-divs`);
    } 

    const numBizCardDivs = document.querySelectorAll('.biz-card-div').length;
    const numBizResumeDivs = document.querySelectorAll('.biz-resume-div').length;

    if (numBizCardDivs !== numBizResumeDivs) {
        throw new Error(`divSyncModule: ${numBizCardDivs} biz-card-divs !== ${numBizResumeDivs} biz-resume-divs`);
    } 

    console.log('DivSyncModule:Initialized with ', numBizCardDivs, 'divSyncPairs');
}

