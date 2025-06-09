// modules/core/keyDown.mjs

import * as focalPoint from './focalPoint.mjs';

import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("keyDown", LogLevel.INFO, LogLevel.TRACE_ON_FAILURE);

/**
 * function that handles keyboard events
 * @param {*} event 
 */
export function handleKeyDown(event) {
    const key = event.key;
    logger.info("handleKeyDown", key);
    event.preventDefault();
    switch (key) {
        case 'b':
            // If focal point is being dragged, first stop dragging
            if (focalPoint.isBeingDragged()) {
                focalPoint.set_isBeingDragged_false(focalPoint.getFocalPoint());
            }
            focalPoint.toggleLockedToBullsEye();
            break;
        case 'd':
            logger.info("handleKeyDown calling toggleDraggable")
            focalPoint.toggleDraggable();
            break;
        case 'f':
            focalPoint.toggleFollowPointerOutsideContainer();
            break;
        default:
          break;
    }
}
