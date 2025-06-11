// modules/resume/resumeContainer.mjs

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("resumeContainer", LogLevel.INFO);

import * as sceneContainer  from '../scene/sceneContainer.mjs';
import * as resizeHandle from '../core/resizeHandle.mjs';

// Add a flag to track initialization
let _isResumeContainerInitialized = false;

// called from resizeHandle.mjs
export function initializeResumeContainer() {
    // Add a flag to track initialization
    if (typeof _isResumeContainerInitialized !== 'undefined' && _isResumeContainerInitialized) {
        console.log("initializeResumeContainer: Resume container already initialized, ignoring duplicate initialization request");
        return;
    }
    
    console.log("initializeResumeContainer");
    
    // Check if sceneContainer is already initialized
    if (!sceneContainer.isSceneContainerInitialized()) {
        sceneContainer.initializeSceneContainer();
    }
    
    // Check if resizeHandle is already initialized
    if (!resizeHandle.isResizeManagerInitialized()) {
        resizeHandle.initializeResizeHandle();
        console.log("ResizeManager initialized by resumeContainer");
    } else {
        console.log("ResizeManager already initialized");
    }
    
    // Mark as initialized
    _isResumeContainerInitialized = true;
}
export function updateResumeContainer() {
    // console.log("updateResumeContainer");   
    sceneContainer.updateSceneContainer();
    resizeHandle.updateResizeHandle();
}

// Add a function to check if initialized
export function isResumeContainerInitialized() {
    return typeof _isResumeContainerInitialized !== 'undefined' && _isResumeContainerInitialized;
}
