// modules/core/keyDown.mjs

import * as focalPoint from './focalPoint.mjs';

import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("keyDown", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);

/**
 * function that handles keyboard events
 * @param {*} event 
 */
export function handleKeyDown(event) {
    const key = event.key.toLowerCase(); // Normalize key to lowercase
    logger.info("handleKeyDown", key);
    
    switch (key) {
        case 'b':
            // If focal point is being dragged, first stop dragging
            if (focalPoint.isBeingDragged()) {
                focalPoint.set_isBeingDragged_false(focalPoint.getFocalPoint());
            }
            // Call toggleLockedToBullsEye and log the result
            focalPoint.toggleLockedToBullsEye();
            // Log the state after toggling
            focalPoint.logFocalPointState();
            logger.info("Toggled focal point lock to bulls-eye");
            break;
        case 'd':
            logger.info("handleKeyDown calling toggleDraggable");
            focalPoint.toggleDraggable();
            break;
        case 'f':
            if (typeof focalPoint.toggleFollowPointerOutsideContainer === 'function') {
                focalPoint.toggleFollowPointerOutsideContainer();
            } else {
                logger.error("toggleFollowPointerOutsideContainer function not found");
            }
            break;
        default:
            break;
    }
}
