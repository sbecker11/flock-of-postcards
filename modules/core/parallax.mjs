// modules/core/parallax.mjs

import * as viewPort from './viewPort.mjs';
import { inRect } from '../utils/utils.mjs';
import * as focalPoint from './focalPoint.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("parallax", LogLevel.ERROR);

// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 0.05;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 0.1;

const sceneContainer = document.getElementById("scene-container");

export function initializeParallax() {
    console.log('=== PARALLAX INITIALIZATION ===');
    console.log('Registering viewAllBizCardDivs as focal point listener');
    console.log('viewAllBizCardDivs function:', viewAllBizCardDivs);    
    focalPoint.addFocalPointPositionListener(viewAllBizCardDivs);
}

function getSceneRectString( sceneRect ) {
    const srLeft = sceneRect.left;
    const srTop = sceneRect.top;
    const srRight = sceneRect.right;
    const srBottom = sceneRect.bottom;
    const sceneRectArray = ["sceneRect:",srLeft,srTop,srRight,srBottom];
    const sceneRectStr = sceneRectArray.join(",");
    return sceneRectStr;
}

function getFocalPontString(viewFP) {
    const {x, y} = viewFP;
    const viewFpArray = ["viewFP:",x,y];
    const viewFpStr = viewFpArray.join(",");
    return viewFpStr;
}


/**
 * External function called from focalPoint animation loop
 * registered as a focalPointPositionListener function
 * Applies parallax effect to all card divs in the viewPort
 * and nly called when focalPoint has moved whether dragged or not
 * @param {} viewFP - viewPort-relative position of focalPoint center
 * @param {*} prefix - used for verbosity
 * @param {*} sceneRect - scene-relative viewport rect
 */
export function viewAllBizCardDivs(viewFP, prefix, sceneRect) {
    if ( !viewPort.viewPortIsInitialized() ) {
        throw new Error("viewPortProperties is not initialized"); 
    }
    const { fpX, fpY } = viewFP; 
    const { vpX, vpY } = viewPort.getViewPortOrigin();
    const sceneRectStr = getSceneRectString(sceneRect);
    const viewFpStr = getFocalPontString(viewFP);
    logger.info("viewAllBizCardDivs viewFp:", viewFpStr, "sceneRect:", sceneRectStr);

    const dh = (vpX - fpX) * PARALLAX_X_EXAGGERATION_FACTOR;
    const dv = (vpY - fpY) * PARALLAX_Y_EXAGGERATION_FACTOR;

    const bizCardDivs = document.getElementsByClassName("biz-card-div");

    let numDivs = 0;
    let inSceneRectCount = 0;
    let outOfSceneRectCount = 0;

    for (const bizCardDiv of bizCardDivs) {

        // scene-relative position of bizCardDiv center
        const divX = parseFloat(bizCardDiv.getAttribute("data-sceneCenterX"));
        const divY = parseFloat(bizCardDiv.getAttribute("data-sceneCenterY"));
        
        let inTheSceneRect = inRect(divX, divY,  sceneRect);
        if ( inTheSceneRect ) {
            inSceneRectCount++;

            // scene-relative z of bizCardDiv
            const divZ = parseFloat(bizCardDiv.getAttribute("data-sceneZ"));
            if ( !divZ ) {
                logger.error(`divZ is null for ${bizCardDiv.id}`);
                continue;
            }
            // inverse of scene-relative z of bizCardDiv
            const inv_divZ = 1.0 / divZ;

            const dx = dh + (vpX - divX) * inv_divZ;
            const dy = dv + (vpY - divY) * inv_divZ;

            const zTranslateStr = `${dx}px ${dy}px`;

            bizCardDiv.style.translate = zTranslateStr;

        } else {
            outOfSceneRectCount++;
        }

        numDivs++;
    }

    // Log the viewport counts
    console.log(`📊 BizCardDiv Counts: ${inSceneRectCount} in sceneRect, ${outOfSceneRectCount}, ${outOfSceneRectCount} outside sceneRect (Total: ${bizCardDivs.length}) sceneRect:${sceneRectStr}`);
}

