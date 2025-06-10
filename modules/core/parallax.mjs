/**
 * Module: parallax
 * 
 * Dependencies:
 * - viewPort (must be initialized first)
 * - focalPoint (must be initialized first)
 * 
 * This module handles parallax effects for bizCardDivs based on focal point position.
 */

import * as utils from '../utils/utils.mjs';
import * as viewPort from './viewPort.mjs';
import * as focalPoint from './focalPoint.mjs';
import * as zUtils from '../utils/zUtils.mjs';
import * as filters from './filters.mjs';
import * as eventBus from '../core/eventBus.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("parallax", LogLevel.LOG);

// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 5.0;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 4.0;

const PARANOID = true;

// Track if parallax is initialized
let _isParallaxInitialized = false;

// Store references to event listeners for cleanup
let _sceneContainerScrollListener = null;
let _windowResizeObserver = null;
let _windowResizeListener = null;

// Cache for the last update time to prevent too frequent updates
let _lastUpdateTime = 0;
const MIN_UPDATE_INTERVAL = 16; // ~60fps

/**
 * initialize all parallax elements
 * called from main.mjs
 */
export function initializeParallax() {
    // Check dependencies first
    if (!viewPort.isViewPortInitialized()) {
        throw new Error("Cannot initialize parallax: viewPort not initialized");
    }
    
    if (!focalPoint.isFocalPointInitialized()) {
        throw new Error("Cannot initialize parallax: focalPoint not initialized");
    }
    
    // Prevent duplicate initialization
    if (_isParallaxInitialized) {
        console.log("Parallax already initialized, cleaning up first");
        cleanupParallax();
    }
    
    // initializded set at the end of this function
    console.log("Initializing parallax...");
    
    // Check if any bizCardDivs exist
    const bizCardDivs = document.getElementsByClassName("biz-card-div");
    // console.log(`Found ${bizCardDivs.length} bizCardDivs for parallax`);
    
    // Check if they have the required attributes
    let missingAttributesCount = 0;
    for (const bizCardDiv of bizCardDivs) {
        if (!hasRequiredAttributes(bizCardDiv)) {
            missingAttributesCount++;
        }
    }
    
    if (missingAttributesCount > 0) {
        throw new Error(`${missingAttributesCount} bizCardDivs are missing required attributes for parallax`);
    } else {
        // console.log("All bizCardDivs have required attributes for parallax");
    }
    
    // Remove any existing listeners before adding a new one
    focalPoint.removeFocalPointAndSceneRectListener(viewAllBizCardDivs); // Remove from new combined system
    focalPoint.removeFocalPointOnlyListener(handleFocalPointChange); // Remove from new focal-point-only system
    
    // Register as a focalPoint-only listener with our new handler
    focalPoint.addFocalPointOnlyListener(handleFocalPointChange);
    // console.log("Parallax registered with focalPoint as a focal-point-only listener");
    
    // Add direct scroll event listener to scene container
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        // Create scroll listener function
        _sceneContainerScrollListener = function(event) {
            // Get the current scroll position
            const scrollTop = sceneContainer.scrollTop;
            
            // Get the viewport rect
            const vpRect = viewPort.getViewPortRect();
            
            // Create scene-relative viewport rect
            const sceneRect = {
                left: vpRect.left,
                top: vpRect.top + scrollTop,
                right: vpRect.right,
                bottom: vpRect.bottom + scrollTop
            };
            
            // Call viewAllBizCardDivs directly with current focal point
            const currentFocalPoint = focalPoint.getFocalPoint();
            viewAllBizCardDivs(currentFocalPoint, "parallax-direct-scroll", sceneRect);
        };
        
        // Remove any existing listener first
        sceneContainer.removeEventListener('scroll', _sceneContainerScrollListener);
        
        // Add the listener
        sceneContainer.addEventListener('scroll', _sceneContainerScrollListener);

        // Clean up any existing ResizeObserver
        if (_windowResizeObserver) {
            _windowResizeObserver.disconnect();
        }

        // Use ResizeObserver to detect actual size changes to the scene container
        _windowResizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === sceneContainer) {
                    // Get the current scroll position
                    const scrollTop = sceneContainer.scrollTop;
                    
                    // Get the viewport rect
                    const vpRect = viewPort.getViewPortRect();
                    
                    // Create scene-relative viewport rect
                    const sceneRect = {
                        left: vpRect.left,
                        top: vpRect.top + scrollTop,
                        right: vpRect.right,
                        bottom: vpRect.bottom + scrollTop
                    };
                    
                    // Call viewAllBizCardDivs directly with current focal point
                    const currentFocalPoint = focalPoint.getFocalPoint();
                    viewAllBizCardDivs(currentFocalPoint, "parallax-resize-observer", sceneRect);
                }
            }
        });
        
        // Start observing the scene container
        _windowResizeObserver.observe(sceneContainer);
        // console.log("Added ResizeObserver to scene container in parallax");
        
        // Store previous dimensions to check for actual changes
        let prevWidth = sceneContainer.clientWidth;
        let prevHeight = sceneContainer.clientHeight;
        
        // Create window resize listener
        _windowResizeListener = function(event) {
            // Check if scene container dimensions actually changed
            const currentWidth = sceneContainer.clientWidth;
            const currentHeight = sceneContainer.clientHeight;
            
            if (currentWidth !== prevWidth || currentHeight !== prevHeight) {
                // Dimensions changed, update previous values
                prevWidth = currentWidth;
                prevHeight = currentHeight;
                
                // Get the current scroll position
                const scrollTop = sceneContainer.scrollTop;
                
                // Get the viewport rect
                const vpRect = viewPort.getViewPortRect();
                
                // Create scene-relative viewport rect
                const sceneRect = {
                    left: vpRect.left,
                    top: vpRect.top + scrollTop,
                    right: vpRect.right,
                    bottom: vpRect.bottom + scrollTop
                };
                
                // Call viewAllBizCardDivs directly with current focal point
                const currentFocalPoint = focalPoint.getFocalPoint();
                viewAllBizCardDivs(currentFocalPoint, "parallax-window-resize", sceneRect);
            }
        };
        
        // Remove any existing listener first
        window.removeEventListener('resize', _windowResizeListener);
        
        // Add the listener
        window.addEventListener('resize', _windowResizeListener);
    }
    
    _isParallaxInitialized = true;
    
    // Emit event when initialization is complete
    eventBus.emit('parallax:initialized', {});
}

function inBounds(top, bottom, rect) {
    const inBnds = ( bottom >= rect.top && top <= rect.bottom );
    return inBnds;
}


/**
 * invoked by way of parallax.handlFocalPointChange and from 
 * focalPoint.notifyFocalPointAndSceneRectListeners
 * 
 * Applies parallax effect to all scene-relative bizCardDivs visible 
 * in the given sceneRect (the scene-relative position of the viewPort).
 * This function is only called when either the focalPoint or the sceneRect 
 * are changed.
 * 
 * @param {} focalPoint - viewPort-relative position of focalPoint center
 * @param {*} prefix - used for verbosity
 * @param {*} sceneRect - scene-relative viewport rect
 */
export function viewAllBizCardDivs(focalPoint, prefix, sceneRect) {
    if (!viewPort.isViewPortInitialized()) {
        throw new Error("viewPortProperties is not initialized"); 
    }

    // console.log(`viewAllBizCardDivs called from "${prefix}"`);
    // console.log(`  sceneRect: t:${sceneRect.top.toFixed(0)}, b:${sceneRect.bottom.toFixed(0)}`);
    // console.log(`  focalPoint: x:${focalPoint.x.toFixed(0)} y:${focalPoint}.y.toFixed(0)}`);
    
    if (PARANOID) utils.validatePosition(focalPoint);
    if (PARANOID) utils.validatePosition(viewPort.getViewPortOrigin());
    if (PARANOID) utils.validateRect(sceneRect);

    const { x:fpX, y:fpY } = focalPoint; 
    const { x:vpX, y:vpY } = viewPort.getViewPortOrigin();
    if (PARANOID) utils.validateNumber(fpX);
    if (PARANOID) utils.validateNumber(fpY);
    if (PARANOID) utils.validateNumber(vpX);
    if (PARANOID) utils.validateNumber(vpY);
        
    // Get the scene container for scroll information
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error("Scene container not found");
        return;
    }
    
    const dh = (vpX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = (vpY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;
    if (PARANOID) utils.validateNumber(dh);
    if (PARANOID) utils.validateNumber(dv);
    
    // Log parallax values
    // console.log(`Parallax offsets: dh=${dh.toFixed(2)}, dv=${dv.toFixed(2)}`);
    
    const bizCardDivs = document.getElementsByClassName("biz-card-div");
    let numDivs = 0;
    let inSceneRectCount = 0;
    let outOfSceneRectCount = 0;
    let missingAttributesCount = 0;

    for (let i = 0; i < bizCardDivs.length; i++) {
        const bizCardDiv = bizCardDivs[i];
        if (!bizCardDiv || !bizCardDiv.parentNode) {
            throw new Error(`viewAllBizCardDivs: bizCardDiv is null or has no parent`);
        }

        // Check if bizCardDiv has all required attributes
        if (!hasRequiredAttributes(bizCardDiv)) {
            missingAttributesCount++;
            continue;
        }

        // hidden by default
        bizCardDiv.style.display = "none";
    
        // scene-relative position of bizCardDiv center
        const divX = parseFloat(bizCardDiv.getAttribute("data-sceneCenterX"));
        const divY = parseFloat(bizCardDiv.getAttribute("data-sceneCenterY"));
        const divTop = parseFloat(bizCardDiv.getAttribute("data-sceneTop"));
        const divBtm = parseFloat(bizCardDiv.getAttribute("data-sceneBottom"));
        const divLeft = parseFloat(bizCardDiv.getAttribute("data-sceneLeft"));
        const divRight = parseFloat(bizCardDiv.getAttribute("data-sceneRight"));
        const divWidth = parseFloat(bizCardDiv.getAttribute("data-sceneWidth"));
        const divHeight = parseFloat(bizCardDiv.getAttribute("data-sceneHeight"));
        const divZ = parseFloat(bizCardDiv.getAttribute("data-sceneZ"));

        if (PARANOID) utils.validateNumber(divX);
        if (PARANOID) utils.validateNumber(divY);
        if (PARANOID) utils.validateNumber(divTop);
        if (PARANOID) utils.validateNumber(divBtm);
        if (PARANOID) utils.validateNumber(divLeft);
        if (PARANOID) utils.validateNumber(divRight);
        if (PARANOID) utils.validateNumber(divWidth);
        if (PARANOID) utils.validateNumber(divHeight);
        if (PARANOID) utils.validateNumber(divZ);

        // check to see if bizCardDiv is visible in 
        // the sceneRect (the scene-relative viewPoint bounds)
        let inTheSceneRect = inBounds(divTop, divBtm, sceneRect);

        if (inTheSceneRect) {

            // bizCardDiv is visible when inside the sceneRect
            bizCardDiv.style.display = "block";

            let viewLeft = divLeft + vpX;
            let viewRight = divRight + vpX;
            let viewTop = divTop;
            let viewBtm = divBtm;
            let viewWidth = divWidth;
            let viewHeight = divHeight;
            const zIndexStr = zUtils.get_zIndexStr_from_z(divZ);
            const zFilterStr = filters.get_filterStr_from_z(divZ);

            if (viewHeight < 200) {
                viewHeight = 200;
                viewBtm = viewTop + viewHeight;
            }

            bizCardDiv.style.setProperty('top', `${viewTop}px`);
            bizCardDiv.style.setProperty('bottom', `${viewBtm}px`);
            bizCardDiv.style.setProperty('left', `${viewLeft}px`);
            bizCardDiv.style.setProperty('right', `${viewRight}px`);
            bizCardDiv.style.setProperty('width', `${viewWidth}px`);
            bizCardDiv.style.setProperty('height', `${viewHeight}px`);
            bizCardDiv.style.setProperty('z-index', zIndexStr, 'important');
            bizCardDiv.style.setProperty('filter', zFilterStr, 'important');

            // const computedStyle = window.getComputedStyle(bizCardDiv);
            // console.log(`viewTop:${computedStyle.getPropertyValue('top')}`);
            // console.log(`viewBtm:${computedStyle.getPropertyValue('bottom')}`);
            // console.log(`viewLeft:${computedStyle.getPropertyValue('left')}`);
            // console.log(`viewRight:${computedStyle.getPropertyValue('right')}`);
            // console.log(`viewWidth:${computedStyle.getPropertyValue('width')}`);
            // console.log(`viewHeight:${computedStyle.getPropertyValue('height')}`);
            // console.log(`zIndex:${computedStyle.getPropertyValue('z-index')}`);
            // console.log(`filter:${computedStyle.getPropertyValue('filter')}`);

            // Position the card using absolute positioning
            bizCardDiv.style.setProperty('position', 'absolute', 'important');

            // inverse of scene-relative z of bizCardDiv
            const inv_divZ = 1.0 / divZ;
            if (PARANOID) utils.validateNumber(inv_divZ);

            let dx = dh * inv_divZ;
            let dy = dv * inv_divZ;
            if (PARANOID) utils.validateNumber(dx); 
            if (PARANOID) utils.validateNumber(dy);

            // Apply parallax transform
            bizCardDiv.style.transform = `translate(${dx}px, ${dy}px)`;

            inSceneRectCount++;
        } 
        else {
            outOfSceneRectCount++;
        }
        numDivs++;
    }

    // console.log(`in:${inSceneRectCount} out:${outOfSceneRectCount}`);
}

/**
 * Check if a bizCardDiv has all required attributes for parallax
 * @param {HTMLElement} bizCardDiv - The business card div to check
 * @returns {boolean} - True if all required attributes are present
 */
function hasRequiredAttributes(bizCardDiv) {
    const requiredAttributes = [
        "data-sceneCenterX", 
        "data-sceneCenterY", 
        "data-sceneTop", 
        "data-sceneBottom",
        "data-sceneZ"
    ];
    
    for (const attr of requiredAttributes) {
        if (!bizCardDiv.hasAttribute(attr)) {
            // Only log once per div per attribute
            if (!bizCardDiv.hasAttribute(`data-logged-missing-${attr}`)) {
                console.warn(`${bizCardDiv.id} missing required attribute: ${attr}`);
                bizCardDiv.setAttribute(`data-logged-missing-${attr}`, "true");
            }
            return false;
        }
    }
    
    return true;
}

/**
 * External function that can be called directly to trigger parallax update
 * @param {string} source - Source of the update request for logging
 * @param {boolean} force - Force update even if within throttle interval
 */
export function updateParallax(source = "external", force = false) {
    // Throttle updates to prevent performance issues
    const now = performance.now();
    if (!force && now - _lastUpdateTime < MIN_UPDATE_INTERVAL) {
        return; // Skip this update if it's too soon after the last one
    }
    _lastUpdateTime = now;
    
    // Get the scene container
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error("Scene container not found");
        return;
    }
    
    // Get the current scroll position
    const scrollTop = sceneContainer.scrollTop;
    
    // Get the viewport rect
    const vpRect = viewPort.getViewPortRect();
    
    // Create scene-relative viewport rect
    const sceneRect = {
        left: vpRect.left,
        top: vpRect.top + scrollTop,
        right: vpRect.right,
        bottom: vpRect.bottom + scrollTop
    };
    
    // Get current focal point
    const currentFocalPoint = focalPoint.getFocalPoint();
    if (!currentFocalPoint) {
        console.warn("Focal point not available for parallax update");
        return;
    }
    
    // Call viewAllBizCardDivs directly
    viewAllBizCardDivs(currentFocalPoint, `update-parallax-${source}`, sceneRect);
}

/**
 * Handler for focal point changes
 * This is called by focalPoint when only the focal point position changes
 * @param {Object} focalPointPos - The current focal point position
 * @param {string} prefix - Source of the update for logging
 */
function handleFocalPointChange(focalPointPos, prefix) {
    // console.log("parallax.handleFocalPointChange called with:", {
    //     focalPointPos,
    //     prefix
    // });
    
    // Get the scene container
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        throw new Error("Scene container not found");
    }
    
    // Get the current scroll position
    const scrollTop = sceneContainer.scrollTop;
    
    // Get the viewport rect
    const vpRect = viewPort.getViewPortRect();
    
    // Create scene-relative viewport rect
    const sceneRect = {
        left: vpRect.left,
        top: vpRect.top + scrollTop,
        right: vpRect.right,
        bottom: vpRect.bottom + scrollTop
    };
    
    // Call viewAllBizCardDivs with the focal point position and our calculated scene rect
    viewAllBizCardDivs(focalPointPos, `focal-point-change-${prefix}`, sceneRect);
}

// /**
//  * Clean up parallax event listeners and observers
//  */
// export function cleanupParallax() {
//     console.log("Cleaning up parallax...");
    
//     // Remove focalPoint position listeners
//     focalPoint.removeFocalPointAndSceneRectListener(viewAllBizCardDivs); // Remove from new combined system
//     focalPoint.removeFocalPointOnlyListener(handleFocalPointChange); // Remove from new focal-point-only system
    
//     // Clean up scroll listener
//     const sceneContainer = document.getElementById('scene-container');
//     if (sceneContainer && _sceneContainerScrollListener) {
//         sceneContainer.removeEventListener('scroll', _sceneContainerScrollListener);
//         _sceneContainerScrollListener = null;
//     }
    
//     // Clean up ResizeObserver
//     if (_windowResizeObserver) {
//         _windowResizeObserver.disconnect();
//         _windowResizeObserver = null;
//     }
    
//     // Clean up window resize listener
//     if (_windowResizeListener) {
//         window.removeEventListener('resize', _windowResizeListener);
//         _windowResizeListener = null;
//     }
// }

// /**
//  * Check if parallax is initialized
//  * @returns {boolean} True if parallax is initialized
//  */
// export function isParallaxInitialized() {
//     return _isParallaxInitialized;
// }

// // Listen for focalPoint initialization
// eventBus.on('focalPoint:initialized', () => {
//     console.log('FocalPoint initialized, parallax can now register listeners');
//     // Register listeners with focalPoint
//     focalPoint.addFocalPointOnlyListener(handleFocalPointChange);
// });

 
// /**
//  * Check if a bizCardDiv has all required attributes for parallax
//  * @param {HTMLElement} bizCardDiv - The business card div to check
//  * @returns {boolean} - True if all required attributes are present
//  */
// function hasRequiredAttributes(bizCardDiv) {
//     const requiredAttributes = [
//         "data-sceneCenterX", 
//         "data-sceneCenterY", 
//         "data-sceneTop", 
//         "data-sceneBottom",
//         "data-sceneZ"
//     ];
    
//     for (const attr of requiredAttributes) {
//         if (!bizCardDiv.hasAttribute(attr)) {
//             // Only log once per div per attribute
//             if (!bizCardDiv.hasAttribute(`data-logged-missing-${attr}`)) {
//                 console.warn(`${bizCardDiv.id} missing required attribute: ${attr}`);
//                 bizCardDiv.setAttribute(`data-logged-missing-${attr}`, "true");
//             }
//             return false;
//         }
//     }
    
//     return true;
// }


// /**
//  * External function that can be called directly to trigger parallax update
//  * @param {string} source - Source of the update request for logging
//  * @param {boolean} force - Force update even if within throttle interval
//  */
// export function updateParallax(source = "external", force = false) {
//     // Throttle updates to prevent performance issues
//     const now = performance.now();
//     if (!force && now - _lastUpdateTime < MIN_UPDATE_INTERVAL) {
//         return; // Skip this update if it's too soon after the last one
//     }
//     _lastUpdateTime = now;
    
//     // Get the scene container
//     const sceneContainer = document.getElementById('scene-container');
//     if (!sceneContainer) {
//         console.error("Scene container not found");
//         return;
//     }
    
//     // Get the current scroll position
//     const scrollTop = sceneContainer.scrollTop;
    
//     // Get the viewport rect
//     const vpRect = viewPort.getViewPortRect();
    
//     // Create scene-relative viewport rect
//     const sceneRect = {
//         left: vpRect.left,
//         top: vpRect.top + scrollTop,
//         right: vpRect.right,
//         bottom: vpRect.bottom + scrollTop
//     };
    
//     // Get current focal point
//     const currentFocalPoint = focalPoint.getFocalPoint();
//     if (!currentFocalPoint) {
//         console.warn("Focal point not available for parallax update");
//         return;
//     }
    
//     // Call viewAllBizCardDivs directly
//     viewAllBizCardDivs(currentFocalPoint, `update-parallax-${source}`, sceneRect);
// }

// /**
//  * Handler for focal point changes
//  * This is called by focalPoint when only the focal point position changes
//  * @param {Object} focalPointPos - The current focal point position
//  * @param {string} prefix - Source of the update for logging
//  */
// function handleFocalPointChange(focalPointPos, prefix) {
//     console.log("parallax.handleFocalPointChange called with:", {
//         focalPointPos,
//         prefix
//     });
    
//     // Get the scene container
//     const sceneContainer = document.getElementById('scene-container');
//     if (!sceneContainer) {
//         console.error("Scene container not found");
//         return;
//     }
    
//     // Get the current scroll position
//     const scrollTop = sceneContainer.scrollTop;
    
//     // Get the viewport rect
//     const vpRect = viewPort.getViewPortRect();
    
//     // Create scene-relative viewport rect
//     const sceneRect = {
//         left: vpRect.left,
//         top: vpRect.top + scrollTop,
//         right: vpRect.right,
//         bottom: vpRect.bottom + scrollTop
//     };
    
//     // Call viewAllBizCardDivs with the focal point position and our calculated scene rect
//     viewAllBizCardDivs(focalPointPos, `focal-point-change-${prefix}`, sceneRect);
// }

// /**
//  * Clean up parallax event listeners and observers
//  */
// export function cleanupParallax() {
//     console.log("Cleaning up parallax...");
    
//     // Remove focalPoint position listeners
//     focalPoint.removeFocalPointAndSceneRectListener(viewAllBizCardDivs); // Remove from new combined system
//     focalPoint.removeFocalPointOnlyListener(handleFocalPointChange); // Remove from new focal-point-only system
    
//     // Clean up scroll listener
//     const sceneContainer = document.getElementById('scene-container');
//     if (sceneContainer && _sceneContainerScrollListener) {
//         sceneContainer.removeEventListener('scroll', _sceneContainerScrollListener);
//         _sceneContainerScrollListener = null;
//     }
    
//     // Clean up ResizeObserver
//     if (_windowResizeObserver) {
//         _windowResizeObserver.disconnect();
//         _windowResizeObserver = null;
//     }
    
//     // Clean up window resize listener
//     if (_windowResizeListener) {
//         window.removeEventListener('resize', _windowResizeListener);
//         _windowResizeListener = null;
//     }
// }

// /**
//  * Check if parallax is initialized
//  * @returns {boolean} True if parallax is initialized
//  */
// export function isParallaxInitialized() {
//     return _isParallaxInitialized;
// }

// // Listen for focalPoint initialization
// eventBus.on('focalPoint:initialized', () => {
//     console.log('FocalPoint initialized, parallax can now register listeners');
//     // Register listeners with focalPoint
//     focalPoint.addFocalPointOnlyListener(handleFocalPointChange);
// });

// export function initializeParallax() {
//     // Existing initialization code...
    
//     // Emit event when initialization is complete
//     eventBus.emit('parallax:initialized', {});
// }

