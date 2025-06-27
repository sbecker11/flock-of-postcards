// modules/core/bullsEye.mjs

import * as viewPort from './viewPort.mjs';

const _bullsEyeElement = document.getElementById("bulls-eye");
const _bullsEyeRad = _bullsEyeElement.offsetWidth/2;
let _isBullsEyeInitialized = false;

export function initializeBullsEye() {
    if (_isBullsEyeInitialized) {
        console.warn("bullsEye.initializeBullsEye(): already initialized, ignoring duplicate initialization request");
        return;
    }
    
    // Check dependency on viewPort
    if (!viewPort.isViewPortInitialized()) {
        throw new Error("Cannot initialize bullsEye: viewPort not initialized");
    }
    
    console.log("Initializing bullsEye...");
    updateBullsEye();
    _isBullsEyeInitialized = true;
    console.log("bullsEye initialized successfully");
}

export function isBullsEyeInitialized() {
    return _isBullsEyeInitialized;
}

// return the center of the viewPort in viewPort coordinates
export function getBullsEye() {
    if ( !viewPort.isViewPortInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    return viewPort.getViewPortOrigin()
}

// update the position of the HTML element based on the viewPortProperties
export function updateBullsEye() {
    const {x:_centerX, y:_centerY} = viewPort.getViewPortOrigin();

    // _bullsEyeElement.style.left = `${_centerX - _bullsEyeRad}px`;
    // _bullsEyeElement.style.top = `${_centerY - _bullsEyeRad}px`;
    _bullsEyeElement.style.left = `${_centerX}px`;
    _bullsEyeElement.style.top = `${_centerY}px`;
}
