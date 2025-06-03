// modules/scene/divSyncModule.mjs

import * as jsonUtils from '../utils/jsonUtils.mjs';
import { ResumeManager } from '../resume/resumeManager.mjs';
 
//=======================
// PAIRED ELEMENTS only works if both elements are in the DOM
//=======================
export function makeSyncedPair(element1, element2) {
    if ( !element1 || !element1 instanceof HTMLElement )
        throw new Error("DivSyncModule:makeSyncedPair: given non-HTMLElement element:", element1.id);
    if ( !element2 || !element2 instanceof HTMLElement )
        throw new Error("DivSyncModule:makeSyncedPair: given non-HTMLElement element:", element2.id);
    element1.setAttribute('data-paired-id', element2.id);
    element2.setAttribute('data-paired-id', element1.id);
    const element1PairedId = element1.getAttribute('data-paired-id');
    const element2PairedId = element2.getAttribute('data-paired-id');
    console.log("DivSyncModule:makeSyncedPair: element1:", element1.id, " and element2:", element2.id, " are paired");
    console.log("DivSyncModule:makeSyncedPair: element1PairedId:", element1PairedId);
    console.log("DivSyncModule:makeSyncedPair: element2PairedId:", element2PairedId);
    if ( !document.getElementById(element1.id) ) throw Error (`divSyncModule:makeSyncedPair: element1:${element1.id} not found in DOM`);
    if ( !document.getElementById(element2.id) ) throw Error (`divSyncModule:makeSyncedPair: element2:${element2.id} not found in DOM`);
    if (!isPairedElement(element1) ) throw new Error(`divSyncModule:getBizCardDiv: element1:${element1.id} is not paired`);
    if (!isPairedElement(element2) ) throw new Error(`divSyncModule:getBizCardDiv: element2:${element2.id} is not paired`);
    console.log("DivSyncModule:makeSyncedPair: element1:", element1.id, " and element2:", element2.id, " are paired");
    const validated = verifySyncedPair(element1, element2,1);
    if (validated > 0) console.log("DivSyncModule:makeSyncedPair: validated:", validated, " times");
    return element1;
}

// only works if both elements are in the DOM
export function getPairedElement(element) {
    if ( !element ) throw new Error("DivSyncModule:getPairedElement: given null element");
    if ( !(element instanceof HTMLElement) ) throw new Error("DivSyncModule:getPairedElement: given non-HTMLElement element");
    const foundElement = document.getElementById(element.id);
    if ( !foundElement ) throw new Error("DivSyncModule:getPairedElement: can't find element with id:", element.id, " in DOM");

    const elementPairedId = element.getAttribute('data-paired-id');
    const pairedElement = document.getElementById(elementPairedId);
    if ( !pairedElement ) throw new Error("DivSyncModule:getPairedElement: can't find pairedElement with id:", elementPairedId, " in DOM");
    
    return pairedElement;
}

export function isPairedElement(element) {
    if (!element) return false;
    const element2 = getPairedElement(element);
    const element3 = getPairedElement(element2);
    return (element == element3);
}

export function getBizCardDiv(element) {
    if (!element) return null;
    if (elementHasClass(element, 'biz-card-div') ) return element;
    const pairElement = getPairedElement(element);
    if ( !pairElement ) throw new Error(`divSyncModule:getBizCardDiv: element:${element.id} has null pairedElement`);
    if ( elementHasClass(pairElement, 'biz-card-div') ) return pairElement;
    else throw new Error(`divSyncModule:getBizCardDiv: neither element:${element.id} or its pairedElement:${pairElement.id} have class biz-card-div`);
}
export function getBizResumeDiv(element) {
    if (!element) return null;
    if (elementHasClass(element, 'biz-resume-div') ) return element;
    const pairElement = getPairedElement(element);
    if ( !pairElement ) throw new Error(`divSyncModule:getBizCardDiv: element:${element.id} has null pairedElement`);
    if ( elementHasClass(pairElement, 'biz-resume-div') ) return pairElement;
    else throw new Error(`divSyncModule:getBizResumeDiv: neither element:${element.id} or its pairedElement:${pairElement.id} have class biz-resume-div`);
}

//=======================
// PAIRED ELEMENT CLASSES
//=======================

export function addClass(element, className) {
    if (!element || !className) return false;
    if ( !isPairedElement(element) ) return false;
    const pairedElement = getPairedElement(element);
    verifyMatchingClassLists(element, pairedElement);
    if (elementHasClass(element, className) ) return false;
    element.classList.add(className);
    pairedElement.classList.add(className);
    return true;
}

export function arePairedElements(element1, element2) {
    if (!element1 || !element2) return false;
    const pairedElement1 = getPairedElement(element1);
    const pairedElement2 = getPairedElement(element2);
    return (pairedElement1 == element2 && pairedElement2 == element1);
}

// export function setClassPath(fromElement, toElement) {
//     if (!fromElement || !toElement) return false;
//     if ( !arePairedElements(fromElement, toElement) ) return false;
//     // Copy classList from fromElement to toElement
//     toElement.className = fromElement.className;
// }

export function verifyMatchingClassLists(element1, element2) {
    if (!element1 || !element2) return false;
    if ( classListsMatch(element1.classList, element2.classList) ) return true;
    else throw new Error(`verifyMatchingClassLists: element1:${element1.id} and element2:${element2.id} classLists do not match`);
}

export function classListsMatch(classList1, classList2) {
    const set1 = new Set(classList1);
    const set2 = new Set(classList2);
    const ignoreSet = new Set(['biz-card-div','biz-resume-div']);
    
    // Remove ignored classes from both sets
    for (let ignoreClass of ignoreSet) {
        set1.delete(ignoreClass);
        set2.delete(ignoreClass);
    }
    
    // Compare sets properly
    if (set1.size !== set2.size) return false;
    for (let item of set1) {
        if (!set2.has(item)) return false;
    }
    return true;
}

export function removeClass(element, className) {
    if (!element) return false;
    if ( !isPairedElement(element) ) return;
    const pairedElement = getPairedElement(element);
    verifyMatchingClassLists(element, pairedElement);
    if ( !elementHasClass(element, className)) return false;
    element.classList.remove(className);
    pairedElement.classList.remove(className);
    if ( verifyMatchingClassLists(pairedElement, element) ) return true;
}    

export function bothPairHaveClass(element, className) {
    if ( !element ) return false;
    if ( className in ['biz-card-div','biz-resume-div'] ) throw new Error(`divSyncModule: hasClass: given className:${className}, which is reserved for divSync paired elements`);
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

export function elementHasClass(element, className) {
    if ( !element || !className) return false;
    return element.classList.contains(className);
}

//=======================
// PAIRED ELEMENT PAIRED_ELEMENT_STATE
//=======================

export const PAIRED_ELEMENT_STATE = {
    HOVERED: 'hovered',  // Just class names
    SELECTED: 'selected' 
};


// clear all states before adding state
function applyState(element, state) {
    if (!element) return;
    const pairedElement = getPairedElement(element);
    if (!pairedElement) throw new Error('DivSyncModule: applyState',state,'given null pairedElement for element:',element.id);

    // clear all states
    removeClass(element, PAIRED_ELEMENT_STATE.HOVERED);
    removeClass(element,PAIRED_ELEMENT_STATE.SELECTED);

    console.log("divSyncModule: applyState: element:",element.id,"state:",state);
    if (state) addClass(element, state);

    const bizResumeDiv = getBizResumeDiv(element);
    const bizResumeDivId = bizResumeDiv.id;
    const resumeManager = getResumeManager();
    resumeManager.removeClass(bizResumeDivId, PAIRED_ELEMENT_STATE.HOVERED);
    resumeManager.removeClass(bizResumeDivId, PAIRED_ELEMENT_STATE.SELECTED);
    resumeManager.addClass(bizResumeDivId, PAIRED_ELEMENT_STATE.SELECTED);
}

// apply state to both elements without clearing other states
export function syncPairStates(element, state) {
    if (!element) return;
    //console.log("divSyncModule: syncPairStates: element:",element.id,"state:",state);
    // apply state to both elements
    applyState(element, state);
}

//=======================
// PAIRED ELEMENT VERIFICATION
//=======================


// return true if the element is a synced pair
// otherwise outputs a warning and return false
export function isSyncedPair(element) {
    if (element == null) return false;
    return (getPairedElement(getPairedElement(element)) == element);
}

// does a deep verification of the pairing
// each paired element references the other
// do not call this until after all bizCardDivs and bizResumeDivs
// have been created and appended to the DOM
// throws an Error if the pairing is not valid
// otherwise returns true
export function verifySyncedPair(element1, element2) {
    const errors = []
    try {
        if (!element1) errors.push("verifySyncedPair: null element1");
        if (!element2) errors.push("verifySyncedPair: null element2");
        if (!element1.id) errors.push(`verifySyncedPair: element1:${element1.id} has null id`);
        if (element1.id.indexOf('undefined') >= 0) errors.push(`verifySyncedPair: elemen1:${element1.id} includes "undefined"`);
        if (element2.id.indexOf('undefined') >= 0) errors.push(`verifySyncedPair: elemen2:${element2.id} includes "undefined"`);
        if (!isSyncedPair(element1)) errors.push(`verifySyncedPair: element1:${element1.id} is not a synced pair`);
        if (!isSyncedPair(element2)) errors.push(`verifySyncedPair: element2:${element2.id} is not a synced pair`);
        const pairedElement1 = getPairedElement(element1);
        if (pairedElement1 == null ) errors.push(`verifySyncedPair: element1:${element1.id} has null pairedElement`);
        if (!isSyncedPair(pairedElement1) ) errors.push(`verifySyncedPair: element1:${element1.id} has null pairedElement`);
        const pairedElement2 = getPairedElement(element2);
        if (pairedElement2 == null ) errors.push(`verifySyncedPair: element2:${element2.id} has null pairedElement`);
        if (!isSyncedPair(pairedElement2) ) errors.push(`verifySyncedPair: element2:${element2.id} has null pairedElement`);
        const pairOfPairedElement1 = getPairedElement(pairedElement1);
        if (pairOfPairedElement1 != element1) errors.push(`verifySyncedPair: element1:${element1.id} != pairOfPairedElement1:${pairOfPairedElement1.id}`);
        const bizCardDiv1 = getBizCardDiv(element1);
        const bizResumeDiv1 = getBizResumeDiv(element1);
        if (!bizCardDiv1) errors.push(`verifySyncedPair: element1:${element1.id} bizCardDiv is null`);
        const bizCardDiv2 = getBizCardDiv(element2);
        const bizResumeDiv2 = getBizResumeDiv(element2);
        if (!bizCardDiv2) errors.push(`verifySyncedPair: element2:${element2.id} bizCardDiv is null`);
        if (!bizResumeDiv2) errors.push(`verifySyncedPair: element2:${element2.id} bizResumeDiv is null`);
        
        if (errors.length > 0) {
            throw new Error(`divSyncModule: verifySyncedPair: ${element1.id} ${element2.id} errors: ${errors.join('\n')}`);
        }
        return true;
    } catch (error) {
        throw error;
    }
}

//========================
// PAIRED ELEMENT SELECTION
//========================

// Track the currently selected element (single source of truth)
let currentSelected = null;

// return true if the element or its pairedElement is the currentSelected
export function matchesCurrentSelected(element) {
    if ( element == null ) return false;
    if (!isSyncedPair(element) ) throw new Error('DivSyncModule: matchesCurrentSelected given null or unpaired element');
    return element === currentSelected || getPairedElement(element) === currentSelected;
}

export function clearSelected() {
    if (!currentSelected) return;
    if (!isSyncedPair(currentSelected) ) throw new Error('DivSyncModule: clearSelected currentSelected it not a synced pair');
    syncPairStates(currentSelected, null);

    // unselect / clear all selected elements
    document.querySelectorAll(`.${PAIRED_ELEMENT_STATE.SELECTED}`).forEach(element => {
        syncPairStates(element, null);
    });
    
    notifyDivSyncPairEventListeners(currentSelected, DivSyncPairEventTypes.UNSELECTED);
    currentSelected = null;
}
// set the currentSelected to the element`
export function setSelected(element) {
    if ( element == null ) return;
    if (!isSyncedPair(element) ) throw new Error('DivSyncModule: setSelected given null or unpaired element');

    // unselect / clear all selected elements
    document.querySelectorAll(`.${PAIRED_ELEMENT_STATE.SELECTED}`).forEach(element => {
        syncPairStates(element, null);
    });

    // Set element as STATUS_SELECTED
    syncPairStates(element, PAIRED_ELEMENT_STATE.SELECTED);

    // update global currentSelected tracker
    console.log("DivSyncModule:setSelected: currentSelected = ", element.id);
    currentSelected = element; // Update global tracker

    // notify divSyncPairEvent listeners
    notifyDivSyncPairEventListeners(element, DivSyncPairEventTypes.SELECTED);
}

// log the id of the selected element or null if no element is selected
export function getSelected() {
    //.log('DivSyncModule:getSelected', currentSelected ? currentSelected.id : 'null');
    return currentSelected;
}

export function setSelectedBizResumeDiv(element) {
    if ( element == null ) return;
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
    if ( element == null ) return;
    if ( !element.pairedElement ) throw new Error(`divSyncModule: handleClickEvent: element:${element.id} has null pairedElement`);

    // if the element is alredy selected and it is 
    // the currentSelected then unselect 
    // it and clear teh currentSelected and return
    if (elementHasClass(element, PAIRED_ELEMENT_STATE.SELECTED)) {
        if ( element === currentSelected || element.pairedElement === currentSelected ) {
            console.log("DivSyncModule:handleClickEvent: unselecting currentSelected");
            removeClass(element, PAIRED_ELEMENT_STATE.SELECTED);
            clearSelected();
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
        this.jobIndex = this.bizCardDiv.getAttribute('data-job-index');
    }
}

export class DivSyncPairEventError extends Error {
    constructor(element, eventType, message) {
        super(message);
        this.name = 'DivSyncPairEventError';
        this.element = element;
        this.pairedElement = element.pairedElement;
        if ( !isValidDivSyncPairEventType(eventType) ) throw new Error(`DivSyncPairEventError: given invalid eventType: ${eventType}`);
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
        console.error('OhNno DivSyncModule: notifyDivSyncPairEventListeners: error', errorEvent);
        divSyncPairEventListeners.forEach(eventListener => eventListener(errorEvent));
        return;
    }
    const bizResumeDiv = getBizResumeDiv(element);
    const normalEvent = new DivSyncPairEvent(bizResumeDiv, eventType);
    console.error('HaHa HaHa HaHa HaHa HaHa HaHa HaHa DivSyncModule: notifyDivSyncPairEventListeners: normalEvent:', normalEvent);
    divSyncPairEventListeners.forEach(eventListener => eventListener(normalEvent));
}

// stringify a DivSyncPair object
// by using a key-value replacer for known self-referencing keys
export function stringify(element) {
    if (!isPairedElement(element) ) throw new Error(`divSyncModule:stringify: element is null or element:${element.id} is not paired`);
    return jsonUtils.stringifyCircular(element);
}

export function removeDivSyncPairEventListener(divSyncPairEventListener) {
    if (!divSyncPairEventListener) throw new Error('DivSyncModule: removeDivSyncPairEventListener: null divSyncPairEventListener');
    divSyncPairEventListeners = divSyncPairEventListeners.filter(listener => listener !== divSyncPairEventListener);
}

function _setResumeManager(resumeManager) {
    _resumeManager = resumeManager;
}

function getResumeManager() {
    if ( !_resumeManager ) throw new Error('DivSyncModule: getResumeManager: _resumeManager is null');
    return _resumeManager;
}

// ========================
// INITIALIZATION
// ========================

// this should be called in main.mjs
// after all bixDivCards and bizResumeDivs 
// have been created and appended to the DOM
export function initializeDivSync(resumeManager) {

    if ( !resumeManager ) throw new Error('DivSyncModule: initializeDivSync: given null resumeManager');
    if ( ! (resumeManager instanceof ResumeManager) ) throw new Error('DivSyncModule: initializeDivSync: given resumeManager that is not an instance of ResumeManager');
    _setResumeManager(resumeManager);

    // click in scene-plane to unselected 
    // any selected biz-card-divs
    document.getElementById('scene-plane').addEventListener('click', () => {
        console.log('scene-plane click');
        if ( currentSelected ) {
            clearSelected();
        }
    });

    _resumeManager = resumeMenager;

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
            if (!elementHasClass(element, PAIRED_ELEMENT_STATE.SELECTED)) {
                //console.log("divSyncModule: mouseenter: element:",element.id);
                syncPairStates(element, PAIRED_ELEMENT_STATE.HOVERED);
            }
        });
        pairedElement.addEventListener('mouseenter', () => {
            if (!elementHasClass(pairedElement, PAIRED_ELEMENT_STATE.SELECTED)) {
                //console.log("divSyncModule: mouseenter: lement:",pairedElement.id);
                syncPairStates(pairedElement, PAIRED_ELEMENT_STATE.HOVERED);
            }
        });

        // Bind mouseleave events to both elements
        element.addEventListener('mouseleave', () => {
            if (!element.classList.contains(PAIRED_ELEMENT_STATE.SELECTED)) {
                syncPairStates(element, null);
            }
        });
        pairedElement.addEventListener('mouseleave', () => {
            if (!element.pairedElement.classList.contains(PAIRED_ELEMENT_STATE.SELECTED)) {
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

