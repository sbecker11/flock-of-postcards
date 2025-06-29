// modules/core/viewPort mjs

import * as utils from '../utils/utils.mjs';    

import * as domUtils from '../utils/domUtils.mjs';
import * as bullsEye from './bullsEye.mjs';

// Constants
const VIEWPORT_PADDING = 100; // Padding around the viewPortProperties

// ViewPort state
const viewPortProperties = {
    padding: VIEWPORT_PADDING,
    top: null,
    left: null,
    right: null,
    bottom: null,
    centerX: null,
    centerY: null,
    width: null,
    height: null
};


let _isInitialized = false;

let _sceneContainer = null;
const _resumeContainer = document.getElementById("resume-container");

/**
 * Initializes the viewport module, sets up properties and event listeners.
 */
export function initialize() {
    if (_isInitialized) {
        console.warn("viewPort.initialize: already initialized, ignoring duplicate initialization request");
        return;
    }

    _sceneContainer = document.getElementById('scene-container');
    if (!_sceneContainer) {
        throw new Error("Viewport element #scene-container not found");
    }

    // Initial calculation
    calculateViewPortProperties();

    // Listen for resize events to recalculate properties
    window.addEventListener('resize', calculateViewPortProperties);

    _isInitialized = true;
    console.log("ViewPort initialized successfully");
}

export function isInitialized() {
    return _isInitialized;
}

/**
 * called from sceneContainer.updateSceneContainer
 * viewPort uopdates interal properties and its chlldren
 * using the current sceneContainer.offsetWidth and resumeContainerw.offsetWidth
 * tells the bullsEye to update the position of its HTML element
 */
export function updateViewPort() {
    // console.log("updateViewPort");
    if ( !isInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    const sceneContainerRect = _sceneContainer.getBoundingClientRect();

    // the scene matches the size of the window
    const sceneWidth =_sceneContainer.offsetWidth;
    const viewPortWidth = sceneWidth;
    const viewPortLeft = 0;
    const viewPortHeight = sceneContainerRect.height;
    const viewPortTop = sceneContainerRect.top;
    
    viewPortProperties.padding = VIEWPORT_PADDING;
    viewPortProperties.top = viewPortTop - viewPortProperties.padding;
    viewPortProperties.left = viewPortLeft - viewPortProperties.padding;
    viewPortProperties.right = viewPortWidth + 2*viewPortProperties.padding;
    viewPortProperties.bottom = viewPortHeight + 2*viewPortProperties.padding;
    viewPortProperties.centerX = viewPortWidth / 2;
    viewPortProperties.centerY = viewPortHeight / 2;
    
    // Calculate bullsEye position as midpoint between window left edge (0) and resize handle center
    // If handle is at left edge (initial state), use window width / 2 as initial position
    // const handleLeft = resizeHandle.getResizeHandleRect.left || window.innerWidth / 2;

    // tell the bullsEye to update the position of its HTML element (using getViewPortCenter()
    bullsEye.updateBullsEye();
}

export function getViewPortOrigin() {
    // console.log("viewPort.getViewPortOrigin()");
    if ( !isInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    //console.log("^^^^^^^^^ getViewPortOrigin: viewPortProperties.centerX:", viewPortProperties.centerX);
    return { 
        x: viewPortProperties.centerX, 
        y: viewPortProperties.centerY 
    };
}

export function getViewPortRect() {
    if ( !isInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    return {
        left: viewPortProperties.left,
        top: viewPortProperties.top,
        right: viewPortProperties.right,
        bottom: viewPortProperties.bottom
    };
}

export function getVisualRect() {
    if (!_sceneContainer) {
        return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 };
    }
    return _sceneContainer.getBoundingClientRect();
}

/**
 * Checks if a card div is within the viewPortProperties
 * @param {HTMLElement} cardDiv - The card div to check
 * @returns {boolean} True if the card div is within the viewPortProperties
 */
export function isBizCardDivWithinViewPort(bizCardDiv) {
    if ( !isInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    const rect = bizCardDiv.getBoundingClientRect();
    return (
        rect.right >= viewPortProperties.left &&
        rect.left <= viewPortProperties.right &&
        rect.bottom >= viewPortProperties.top &&
        rect.top <= viewPortProperties.bottom
    );
}

export function setViewPortWidth(width) {
    // console.log("viewPort.setViewPortWidth:", width );
    if ( !isInitialized() ) {
        throw new Error("viewPort not yet initialized");
    }
    if ( !utils.isNumber(width) ) {
        throw new Error("viewPort.setViewPortWidth:", width, "is not a Number");
    }
    viewPortProperties.width = width;
    viewPortProperties.centerX = width/2;
    updateViewPort();
}

// /**
//  * Applies view-relative styling for a bizCardDiv 
//  * with scene-plane relative coordinates
//  * @param {HTMLElement} bizCardDiv - The card div
//  */
// export function applyViewRelativeStyling(bizCardDiv) {
//     if ( !isInitialized() ) {
//         throw new Error("viewPortProperties is not initialized");
//     }
//     if ( !isHTMLElement(bizCardDiv) ) {
//         throw new Error(`bizCardDiv is not an HTMLElement: ${bizCardDiv}`);
//     }


//     // extract the static scene-relative geometry
//     const sceneTop = parseInt(bizCardDiv.getAttribute("data-sceneTop"));
//     const sceneLeft = parseInt(bizCardDiv.getAttribute("data-sceneLeft"));
//     const sceneWidth = parseInt(bizCardDiv.getAttribute("data-sceneWidth"));
//     const sceneHeight = parseInt(bizCardDiv.getAttribute("data-sceneHeight"));
//     const sceneZ = parseInt(bizCardDiv.getAttribute("data-sceneZ"));
    

//     // transform scene-relative attributes to get view-relative styling
//     const viewTop = sceneTop;
//     const viewLeft = sceneLeft + bullsEyeX;
//     const viewWidth = sceneWidth;
//     const viewHeight = sceneHeight;
//     const viewZIndexStr = zUtils.get_zIndexStr_from_z(sceneZ, bizCardDiv.id);

//     // console.log(`sceneLeft:${sceneLeft} + bullsEyeX:${bullsEyeX} viewLeft:${viewLeft}`);

//     // apply view-relative styling
//     bizCardDiv.style.top =     `${viewTop}px`;
//     bizCardDiv.style.left =    `${viewLeft}px`;
//     bizCardDiv.style.width =   `${viewWidth}px`;
//     bizCardDiv.style.height =  `${viewHeight}px`;
//     bizCardDiv.style.zIndex =   viewZIndexStr;

//     // // console.log(`bizCardDiv view-relativestyling for ${bizCardDiv.id}:`, {
//     //     styleLeft: bizCardDiv.style.left,
//     //     offsetLeft: bizCardDiv.offsetLeft,
//     //     boundingLeft: bizCardDiv.getBoundingClientRect().left,
//     //     viewLeft,
//     //     bullsEyeX,
//     //     sceneLeft,
//     //     parsedSceneLeft: parseFloat(sceneLeft)
//     // });
// }

function calculateViewPortProperties() {
    // ... existing code ...
}
