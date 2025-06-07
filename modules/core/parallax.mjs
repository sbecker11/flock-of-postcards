// modules/core/parallax.mjs

import * as utils from '../utils/utils.mjs';
import * as viewPort from './viewPort.mjs';
import * as focalPoint from './focalPoint.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("parallax", LogLevel.LOG);

// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 0.05;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 0.1;

const PARANOID = true;

/**
 * initialize all parallax elements
 * called from main.mjs
 */
export function initializeParallax() {
    // console.log('=== PARALLAX INITIALIZATION ===');
    // console.log('Registering viewAllBizCardDivs as focal point listener');
    // console.log('viewAllBizCardDivs function:', viewAllBizCardDivs);    
    focalPoint.addFocalPointPositionListener(viewAllBizCardDivs);
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
    if ( !viewPort.isViewPortInitialized() ) {
        throw new Error("viewPortProperties is not initialized"); 
    }
    if (PARANOID) if (PARANOID) utils.validatePosition(focalPoint);
    if (PARANOID) utils.validatePosition(viewPort.getViewPortOrigin());
    if (PARANOID) utils.validateRect(sceneRect);

    const { x:fpX, y:fpY } = focalPoint; 
    const { x:vpX, y:vpY } = viewPort.getViewPortOrigin();
    if (PARANOID) utils.validateNumber(fpX);
    if (PARANOID) utils.validateNumber(fpY);
    if (PARANOID) utils.validateNumber(vpX);
    if (PARANOID) utils.validateNumber(vpY)
    
    // const sceneRectStr = utils.getRectAsString(sceneRect);
    // const focalPointStr = utils.getPositionAsString(focalPoint);

    const dh = (vpX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = (vpY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;
    if (PARANOID) utils.validateNumber(dh);
    if (PARANOID) utils.validateNumber(dv);

    const bizCardDivs = document.getElementsByClassName("biz-card-div");

    let numDivs = 0;
    let inSceneRectCount = 0;
    let outOfSceneRectCount = 0;
    for (const bizCardDiv of bizCardDivs) {

        // hidden by default
        bizCardDiv.style.display = "none";
    
        // scene-relative position of bizCardDiv center
        const divX = parseFloat(bizCardDiv.getAttribute("data-sceneCenterX"));
        const divY = parseFloat(bizCardDiv.getAttribute("data-sceneCenterY"));
        const divTop = parseFloat(bizCardDiv.getAttribute("data-sceneTop"));
        const divBtm = parseFloat(bizCardDiv.getAttribute("data-sceneBottom"));
        if (PARANOID) utils.validateNumber(divX);
        if (PARANOID) utils.validateNumber(divY);
        if (PARANOID) utils.validateNumber(divTop);
        if (PARANOID) utils.validateNumber(divBtm);
                
        // check to see if bizCardDiv is visible in 
        // the sceneRect (the scene-relative viewPoint bounds)
        let inTheSceneRect = inBounds(divTop, divBtm, sceneRect);

        if ( inTheSceneRect ) {

            inSceneRectCount++;

            // bizCardDiv is visible when inside the sceneRect
            bizCardDiv.style.display = "block";

            // scene-relative z of bizCardDiv
            const divZ = parseFloat(bizCardDiv.getAttribute("data-sceneZ"));
            // inverse of scene-relative z of bizCardDiv
            const inv_divZ = 1.0 / divZ;
            if (PARANOID) utils.validateNumber(divZ);
            if (PARANOID) utils.validateNumber(inv_divZ);

            let dx = dh + (vpX - divX) * inv_divZ;
            let dy = dv + (vpY - divY) * inv_divZ;
            if (PARANOID) utils.validateNumber(dx); 
            if (PARANOID) utils.validateNumber(dy);

            if (bizCardDiv && bizCardDiv.parentNode) {

                const zTranslateStr = `${dx}px ${dy}px`;
                
                // const computedStyle = getComputedStyle(bizCardDiv);

                //console.log("biz bizCardDiv.id:", bizCardDiv.id);
                // console.log("  biz position:", computedStyle.position);
                // console.log("  biz transform:", computedStyle.transform);
                // console.log("  biz left:", computedStyle.left);
                // console.log("  biz top:", computedStyle.top);
                // console.log("  biz display:", computedStyle.display);
                // console.log("  biz visibility:", computedStyle.visibility);
                // console.log("  biz opacity:", computedStyle.opacity);
                // console.log("  biz overflow:", computedStyle.overflow);
                // console.log("  biz z-index:", computedStyle.zIndex);
                // console.log("  biz Current transform:", getComputedStyle(bizCardDiv).transform);
                // console.log("  biz zTranslateStr:", zTranslateStr);

                // Add this debugging:
                // console.log("+OVERRIDE TEST for", bizCardDiv.id);
                // console.log("+Before rect:", bizCardDiv.getBoundingClientRect().left);
                // console.log("+Applied transform:", `translate(${dx}px, ${dy}px)`);
                // console.log("+Computed transform:", getComputedStyle(bizCardDiv).transform);


                //bizCardDiv.style.translate = zTranslateStr;
                //bizCardDiv.style.setProperty('transform', `translate(${dx}px, ${dy}px)`, 'important');
                
                bizCardDiv.style.transition = 'none';
                bizCardDiv.style.animation = 'none';
                // bizCardDiv.style.transform = `translate(${dx}px, ${dy}px)`;

                let debug=false;
                let id=0;

                if (bizCardDiv.id.includes("div-1")) {
                    debug = true; id = 1;
                }
                else if (bizCardDiv.id.includes("div-2")) {
                    debug = true; id = 2;
                }
                
                if (debug) {
                
                    // Right before applying transform
                    console.log("🎯 TRANSFORM DEBUG for", bizCardDiv.id);
                    console.log("  dx:", dx, "dy:", dy);
                    console.log("  Transform string:", `translate(${dx}px, ${dy}px)`);

                    // Get position before
                    const rectBefore = bizCardDiv.getBoundingClientRect();
                    console.log("  Position before:", rectBefore.left, rectBefore.top);
                } // debug

                // Apply transform
                bizCardDiv.style.transform = `translate(${dx}px, ${dy}px)`;

                if ( debug ) {
                    // Check immediately after
                    console.log("  Computed transform:", getComputedStyle(bizCardDiv).transform);

                    // Check position after a frame
                    requestAnimationFrame(() => {
                        const rectAfter = bizCardDiv.getBoundingClientRect();
                        console.log("  Position after:", rectAfter.left, rectAfter.top);
                        console.log("  Movement:", rectAfter.left - rectBefore.left, rectAfter.top - rectBefore.top);
                    });("+biz",id," after transform:", bizCardDiv.getBoundingClientRect().left);
                    
                } // debug

            } else {
                // element is out of sceneRect;
                continue;
            }
     
        } else {
            outOfSceneRectCount++;
        }

        numDivs++;
    }

    // Log the viewport counts
    // console.log(`📊 Counts:${numDivs} total, ${inSceneRectCount} in, ${outOfSceneRectCount} out`);
}

