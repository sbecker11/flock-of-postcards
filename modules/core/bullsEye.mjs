// modules/core/bullsEye.mjs

console.log('BullsEye module file is being executed');

import * as viewPort from './viewPortModule.mjs';
import * as sceneViewLabel from './sceneViewLabelModule.mjs';

let _bullsEyeElement = null;
let _bullsEyeRad = 0;
let _isInitialized = false;

export function initialize() {
    console.log('BullsEye.initialize() called, _isInitialized:', _isInitialized);
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
        throw new Error("bullsEye requires viewPort to be initialized.");
    }
    
    console.log("Initializing bullsEye...");
    recenterBullsEye();
    
    // Set up the layout-changed event listener
    window.addEventListener('layout-changed', () => {
        console.log('BullsEye: layout-changed event received, _isInitialized:', _isInitialized);
        if (_isInitialized && _bullsEyeElement) {
            console.log('BullsEye: calling recenterBullsEye()');
            recenterBullsEye();
        } else {
            console.log('BullsEye: not initialized or element not found, skipping recenter');
        }
    });
    
    _isInitialized = true;
    console.log("bullsEye initialized successfully");
}

export function isInitialized() {
    return _isInitialized;
}

export function reset() {
    _isInitialized = false;
    _bullsEyeElement = null;
    _bullsEyeRad = 0;
}

// return the center of the viewPort in viewPort coordinates
export function getBullsEye() {
    if ( !viewPort.isInitialized() ) {
        throw new Error("viewPortProperties is not initialized");
    }
    return viewPort.getViewPortOrigin()
}

// update the position of the HTML element based on the viewPortProperties
export function recenterBullsEye() {
    if (!_bullsEyeElement) {
        console.warn('BullsEye: Cannot recenter - element not found');
        return;
    }
    
    const {x:_centerX, y:_centerY} = viewPort.getViewPortOrigin();

    console.log(`Repositioning BullsEye to: top=${_centerY}px, left=${_centerX}px`);

    // Since CSS has transform: translate(-50%, -50%), set position to exact center
    // The transform will handle centering the element around this point
    _bullsEyeElement.style.left = `${_centerX}px`;
    _bullsEyeElement.style.top = `${_centerY}px`;
    
    console.log(`BullsEye final position - left: ${_centerX}px, top: ${_centerY}px`);
    
    sceneViewLabel.repositionLabel();
}

// Alias for backward compatibility
export const updateBullsEye = recenterBullsEye;
