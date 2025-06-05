// modules/resume/resumeContainer.mjs

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("resumeContainer", LogLevel.INFO);

import * as sceneContainer  from '../scene/sceneContainer.mjs';
import * as resizeHandle from '../core/resizeHandle.mjs';

// called from resizeHandle.mjs
export function initializeResumeContainer() {
    //console.log("initializeResumeContainer");
    sceneContainer.initializeSceneContainer();
    resizeHandle.initializeResizeHandle();
}
export function updateResumeContainer() {
    // console.log("updateResumeContainer");   
    sceneContainer.updateSceneContainer();
    resizeHandle.updateResizeHandle();
}
