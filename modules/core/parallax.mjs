// modules/core/parallax.mjs

import * as utils from '../utils/utils.mjs';
import * as viewPort from './viewPort.mjs';
import * as focalPoint from './focalPoint.mjs';
import * as zUtils from '../utils/zUtils.mjs';
import * as filters from './filters.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("parallax", LogLevel.LOG);

// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 5.0;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 4.0;

const PARANOID = true;

/**
 * initialize all parallax elements
 * called from main.mjs
 */
export function initializeParallax() {
    console.log("Initializing parallax...");
    
    // Check if any bizCardDivs exist
    const bizCardDivs = document.getElementsByClassName("biz-card-div");
    console.log(`Found ${bizCardDivs.length} bizCardDivs for parallax`);
    
    // Check if they have the required attributes
    let missingAttributesCount = 0;
    for (const bizCardDiv of bizCardDivs) {
        if (!hasRequiredAttributes(bizCardDiv)) {
            missingAttributesCount++;
        }
    }
    
    if (missingAttributesCount > 0) {
        console.warn(`${missingAttributesCount} bizCardDivs are missing required attributes for parallax`);
        console.warn("You may need to call bizCardDivModule.setGeometryForAllBizCardDivs()");
    } else {
        console.log("All bizCardDivs have required attributes for parallax");
    }
    
    // Register as a focalPoint position listener
    // The viewAllBizCardDivs function will receive:
    // 1. focalPoint - viewPort-relative position of focalPoint center
    // 2. prefix - used for verbosity
    // 3. sceneRect - scene-relative viewport rect
    focalPoint.addFocalPointPositionListener(viewAllBizCardDivs);
    console.log("Parallax initialized and registered with focalPoint");
}

function inBounds(top, bottom, rect) {
    const inBnds = ( bottom >= rect.top && top <= rect.bottom );
    return inBnds;
}

/**
 * External function called from focalPoint animation loop
 * registered as a focalPointPositionListener function.
 * Applies parallax effect to all card divs in the viewPort
 * and only called when focalPoint or the viewPort are changed.
 * @param {} focalPoint - viewPort-relative position of focalPoint center
 * @param {*} prefix - used for verbosity
 * @param {*} sceneRect - scene-relative viewport rect
 */
export function viewAllBizCardDivs(focalPoint, prefix, sceneRect) {
    if (!viewPort.isViewPortInitialized()) {
        throw new Error("viewPortProperties is not initialized"); 
    }
    
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
    
    // Get current scroll position
    const scrollTop = sceneContainer.scrollTop;
    
    const dh = (vpX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = (vpY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;
    if (PARANOID) utils.validateNumber(dh);
    if (PARANOID) utils.validateNumber(dv);

    const bizCardDivs = document.getElementsByClassName("biz-card-div");
    let numDivs = 0;
    let inSceneRectCount = 0;
    let outOfSceneRectCount = 0;
    let missingAttributesCount = 0;

    for (let i = 0; i < bizCardDivs.length; i++) {
        const bizCardDiv = bizCardDivs[i];
        if (!bizCardDiv || !bizCardDiv.parentNode) {
            console.log(`viewAllBizCardDivs: bizCardDiv is null or has no parent`);
            continue;
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

            const computedStyle = window.getComputedStyle(bizCardDiv);
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

    // Log the viewport counts
    if (missingAttributesCount > 0) {
        console.log(`📊 Counts: ${numDivs} total, ${inSceneRectCount} in, ${outOfSceneRectCount} out, ${missingAttributesCount} missing attributes`);
    }
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

