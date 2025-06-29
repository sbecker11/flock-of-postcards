// modules/core/bullsEye.mjs

import * as viewPort from './viewPort.mjs';
import * as sceneViewLabel from './sceneViewLabel.mjs';

let _bullsEyeElement = null;
let _bullsEyeRad = 0;
let _isInitialized = false;

export function initialize() {
    if (_isInitialized) {
        console.warn("bullsEye.initialize: already initialized, ignoring duplicate initialization request");
        return;
    }
    
    _bullsEyeElement = document.getElementById("bulls-eye");
    if (!_bullsEyeElement) {
        throw new Error("bullsEye.initialize: #bulls-eye element not found in DOM");
    }
    _bullsEyeRad = _bullsEyeElement.offsetWidth / 2;
    
    // Check dependency on viewPort
    if (!viewPort.isInitialized()) {
        throw new Error("Cannot initialize bullsEye: viewPort not initialized");
    }
    
    console.log("Initializing bullsEye...");
    updateBullsEye();
    _isInitialized = true;
    console.log("bullsEye initialized successfully");
}

export function isInitialized() {
    return _isInitialized;
}

// return the center of the viewPort in viewPort coordinates
export function getBullsEye() {
    if ( !viewPort.isInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    return viewPort.getViewPortOrigin()
}

// update the position of the HTML element based on the viewPortProperties
export function updateBullsEye() {
    const {x:_centerX, y:_centerY} = viewPort.getViewPortOrigin();

    console.log(`Repositioning BullsEye to: top=${_centerY}px, left=${_centerX}px`);

    // _bullsEyeElement.style.left = `${_centerX - _bullsEyeRad}px`;
    // _bullsEyeElement.style.top = `${_centerY - _bullsEyeRad}px`;
    _bullsEyeElement.style.left = `${_centerX}px`;
    _bullsEyeElement.style.top = `${_centerY}px`;

    sceneViewLabel.repositionLabel();
}
