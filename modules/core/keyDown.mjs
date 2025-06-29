// modules/core/keyDown.mjs

// import { resumeListController } from "../resume/ResumeListController.mjs"; // Obsolete
import * as timeline from '../timeline/timeline.mjs';
import * as focalPoint from './focalPoint.mjs';
import * as colorPalettes from '../colors/colorPalettes.mjs';
import { selectionManager } from './selectionManager.mjs';

/**
 * function that handles keyboard events
 * @param {*} event 
 */
export function handleKeyDown(event) {
    if (event.ctrlKey && event.shiftKey && event.altKey && event.key === 'D') {
        console.log("Ctrl+Shift+Alt+D detected: Dumping managers to console");
        window.dumpManagersToConsole();
    }

    switch (event.key) {
        case "ArrowLeft":
            console.log("ArrowLeft pressed");
            // resumeListController.goToPreviousResumeItem();
            break;
        case "ArrowRight":
            console.log("ArrowRight pressed");
            // resumeListController.goToNextResumeItem();
            break;
        case "ArrowUp":
            console.log("ArrowUp pressed");
            // resumeListController.goToFirstResumeItem();
            break;
        case "ArrowDown":
            console.log("ArrowDown pressed");
            // resumeListController.goToLastResumeItem();
            break;
        case " ": // Spacebar
            console.log("Spacebar pressed");
            // focalPoint.toggleFocalPointLock();
            break;
        case "b":
            console.log("'b' key pressed");
            focalPoint.toggleLockedToBullsEye();
            break;
        case "c":
            console.log("'c' key pressed");
            colorPalettes.cycleColorPalette();
            break;
        case "t":
            console.log("'t' key pressed");
            timeline.toggleTimelineVisibility();
            break;
        default:
            // log.log("Key pressed: " + event.key);
            break;
    }
}

let _isInitialized = false;

/**
 * Initializes the keydown handler and attaches the event listener.
 */
export function initialize() {
    if (_isInitialized) {
        console.log("Keydown handler already initialized.");
        return;
    }

    document.addEventListener('keydown', handleKeyDown);

    _isInitialized = true;
    console.log("Keydown handler initialized.");
}

export function isInitialized() {
    return _isInitialized;
}
