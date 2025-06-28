// modules/resume/resumeContainer.mjs

import * as sceneContainer  from '../scene/sceneContainer.mjs';
import * as resizeHandle from '../core/resizeHandle.mjs';

// Add a flag to track initialization
let _isInitialized = false;

// called from resizeHandle.mjs
export function initialize() {
    if (isInitialized()) {
        console.log("initializeResumeContainer: Resume container already initialized, ignoring duplicate initialization request");
        return;
    }
    
    console.log("initializeResumeContainer");
    
    // Check if sceneContainer is already initialized
    if (!sceneContainer.isInitialized()) {
        sceneContainer.initialize();
    }
    
    // Check if resizeHandle is already initialized
    if (!resizeHandle.isInitialized()) {
        resizeHandle.initialize();
        console.log("ResizeManager initialized by resumeContainer");
    } else {
        console.log("ResizeManager already initialized");
    }
    
    // Mark as initialized
    _isInitialized = true;
}
export function updateResumeContainer() {
    // console.log("updateResumeContainer");   
    sceneContainer.updateSceneContainer();
    resizeHandle.updateResizeHandle();
}

// Add a function to check if initialized
export function isInitialized() {
    return _isInitialized;
}
