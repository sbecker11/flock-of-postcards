// modules/core/bullsEye.mjs

import * as viewPort from './viewPort.mjs';
import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("bullsEye", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);

const _bullsEyeElement = document.getElementById("bulls-eye");
const _bullsEyeRad = _bullsEyeElement.offsetWidth/2;

export function initializeBullsEye() {
    updateBullsEyeCenter();
}

// return the center of the viewPort in viewPort coordinates
export function getBullsEyeCenter() {
    if ( !viewPort.viewPortIsInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    return viewPort.getViewPortOrigin()
}

// update the position of the HTML element based on the viewPortProperties
export function updateBullsEyeCenter() {
    const {x:_centerX, y:_centerY} = getBullsEyeCenter();

    // _bullsEyeElement.style.left = `${_centerX - _bullsEyeRad}px`;
    // _bullsEyeElement.style.top = `${_centerY - _bullsEyeRad}px`;
    _bullsEyeElement.style.left = `${_centerX}px`;
    _bullsEyeElement.style.top = `${_centerY}px`;

    console.log("BullsEye position updated:", getBullsEyeCenter());
}
