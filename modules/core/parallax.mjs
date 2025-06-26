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
    // Prevent duplicate initialization
    if (_isParallaxInitialized) {
        console.log("Parallax already initialized, ignoring duplicate initialization request");
        return;
    }
    
    // Check dependencies first
    if (!viewPort.isViewPortInitialized()) {
        throw new Error("Cannot initialize parallax: viewPort not initialized");
    }
    
    // Check if focalPoint is initialized
    try {
        if (!focalPoint.isFocalPointInitialized()) {
            console.warn("FocalPoint not initialized, attempting to initialize it now");
            
            // Try to initialize focalPoint if not already initialized
            const focalPointElement = document.getElementById('focal-point');
            if (focalPointElement) {
                focalPoint.initializeFocalPoint(focalPointElement);
                console.log("FocalPoint initialized from parallax module");
            } else {
                throw new Error("Cannot initialize parallax: focalPoint not initialized and focal-point element not found");
            }
        }
    } catch (error) {
        throw new Error("Cannot initialize parallax: focalPoint not initialized - " + error.message);
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
    console.log("Parallax initialized successfully");
    
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

    const { x:fpX, y:fpY } = focalPoint; 
    const { x:vpX, y:vpY } = viewPort.getViewPortOrigin();
    
    const dh = (vpX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = (vpY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;

    const bizCardDivs = document.getElementsByClassName("biz-card-div");
    for (const bizCardDiv of bizCardDivs) {
        applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
    }
}

function applyParallaxToBizCardDiv(bizCardDiv, dh, dv) {
    if (!hasRequiredAttributes(bizCardDiv)) {
        return;
    }

    bizCardDiv.style.display = "block";

    const { x:vpX, y:vpY } = viewPort.getViewPortOrigin();
    const divTop = parseFloat(bizCardDiv.getAttribute("data-sceneTop"));
    const divLeft = parseFloat(bizCardDiv.getAttribute("data-sceneLeft"));
    const divZ = parseFloat(bizCardDiv.getAttribute("data-sceneZ"));
    const viewHeight = parseFloat(bizCardDiv.getAttribute("data-sceneHeight"));
    const viewWidth = parseFloat(bizCardDiv.getAttribute("data-sceneWidth"));
    const zIndexStr = zUtils.get_zIndexStr_from_z(divZ);

    const viewTop = divTop;
    const viewLeft = divLeft + vpX;

    bizCardDiv.style.setProperty('top', `${viewTop}px`);
    bizCardDiv.style.setProperty('left', `${viewLeft}px`);
    bizCardDiv.style.setProperty('height', `${viewHeight}px`);
    bizCardDiv.style.setProperty('width', `${viewWidth}px`);
    bizCardDiv.style.setProperty('z-index', zIndexStr, 'important');
    bizCardDiv.style.setProperty('position', 'absolute', 'important');

    const inv_divZ = 1.0 / divZ;
    let dx = dh * inv_divZ;
    let dy = dv * inv_divZ;

    bizCardDiv.style.transform = `translate(${dx}px, ${dy}px) translateZ(${divZ}px)`;

    // Log the ID and computed top position
    // console.log(`Card ID: ${bizCardDiv.id}, Top: ${viewTop}px`);
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
    
    // Schedule the update in the next animation frame
    requestAnimationFrame(() => {
        _lastUpdateTime = performance.now();
        
        // Get the scene container
        const sceneContainer = document.getElementById('scene-container');
        if (!sceneContainer) {
            console.error("Scene container not found");
            return;
        }
        
        // Batch DOM reads
        const scrollTop = sceneContainer.scrollTop;
        const currentFocalPoint = focalPoint.getFocalPoint();
        
        // Get the viewport rect
        const vpRect = viewPort.getViewPortRect();
        
        // Create scene-relative viewport rect
        const sceneRect = {
            left: vpRect.left,
            top: vpRect.top + scrollTop,
            right: vpRect.right,
            bottom: vpRect.bottom + scrollTop
        };
        
        // Then perform the update with the read values
        if (currentFocalPoint) {
            viewAllBizCardDivs(currentFocalPoint, `update-parallax-${source}`, sceneRect);
        }
    });
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

