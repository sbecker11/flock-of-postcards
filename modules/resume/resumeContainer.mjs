// modules/resume/resumeContainer.mjs

import * as sceneContainer  from '../scene/sceneContainer.mjs';
import { getJobsData } from '../../static_content/jobs/jobs.mjs';
import * as selectionManager from '../core/selectionManager.mjs';
import * as dom from '../utils/domUtils.mjs';
import * as eventBus from '../core/eventBus.mjs';

// Add a flag to track initialization
let _isInitialized = false;

// called from resizeHandle.mjs
export function initialize() {
    if (isInitialized()) {
        window.CONSOLE_LOG_IGNORE("initializeResumeContainer: Resume container already initialized, ignoring duplicate initialization request");
        return;
    }
    
    window.CONSOLE_LOG_IGNORE("initializeResumeContainer");
    
    // Check if sceneContainer is already initialized
    if (!sceneContainer.isInitialized()) {
        sceneContainer.initialize();
    }
    
    // Check if resizeHandle is already initialized
    if (!resizeHandle.isInitialized()) {
        resizeHandle.initialize();
        window.CONSOLE_LOG_IGNORE("ResizeManager initialized by resumeContainer");
    } else {
        window.CONSOLE_LOG_IGNORE("ResizeManager already initialized");
    }
    
    // Mark as initialized
    _isInitialized = true;
}
export function updateResumeContainer() {
    window.CONSOLE_LOG_IGNORE("updateResumeContainer");   
    sceneContainer.updateSceneContainer();
    resizeHandle.updateResizeHandle();
}

// Add a function to check if initialized
export function isInitialized() {
    return _isInitialized;
}
