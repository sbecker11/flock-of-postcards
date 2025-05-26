// modules/core/bullsEye.mjs

import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("bullsEye", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);
import * as utils from "../utils/utils.mjs";
import * as mathUtils from "../utils/mathUtils.mjs";

// initialize the bulls-eye element called from main.mjs
export function initializeBullsEye() {
    _sceneContainer = document.getElementById("scene-container");
    _bullsEyeElement = document.getElementById("bulls-eye");

   updateBullsEyeVerticalPosition();

}

export function updateBullsEyeVerticalPosition(bullEyeY) {
    getBullsEyeElement().style.top = `${bullEyeY}px`;
}

var _sceneContainer = document.getElementById("scene-container");
var _bullsEyeElement = document.getElementById("bulls-eye");

export function getBullsEyeCenter() {
    // Convert bulls-eye center to viewPort coordinates
    const containerRect = _sceneContainer.getBoundingClientRect();
    return {
        x: containerRect.left + (_sceneContainer.offsetWidth / 2),
        y: containerRect.top + (_sceneContainer.offsetHeight / 2)
    };
}

export function getBullsEyeElement() {
    return _bullsEyeElement;
}

export function getBullsEyeCenterX() {
    if ( !viewPortIsInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    return getViewPortProperties().centerX;
}

export function setBullsEyeLeft(left) {
    _bullsEyeElement.style.left = `${left}px`;
}

// on window resize
export function updateBullsEyeCenter() {

    const containerRect = _sceneContainer.getBoundingClientRect();
    const centerX = containerRect.left + (containerRect.width / 2);
    const centerY = containerRect.top + (containerRect.height / 2);
    
    const bullsEyeRad = _bullsEyeElement.offsetWidth/2;
    const bullsEyeRadY = _bullsEyeElement.offsetHeight/2;
    if ( bullsEyeRadY != bullsEyeRad ) {
        console.warrn(`bullsEyeRadY:{bullsEyeRadY} != BullsEyeRad:{bullsEyeRad}`)
    } 

    _bullsEyeElement.style.left = `${centerX - bullsEyeRad}px`;
    _bullsEyeElement.style.top = `${centerY - bullsEyeRad}px`;

    const newCenter = { x: centerX, y: centerY };
    const checkCenter = getBullsEyeCenter();
    if ( !utils.matchPositions(newCenter, checkCenter) ) {
        const dist = mathUtils.getPositionsEuclideanDistance(newCenter, checkCenter);
        console.warn(`bullsEye newCenter:${newCenter} does not match checkCenter:${checkCenter} with error:${dist}`);
    } 
    logger.log("BullsEye position updated:", checkCenter);
}
