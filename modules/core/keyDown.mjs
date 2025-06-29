// modules/core/keyDown.mjs

// import { resumeListController } from "../resume/ResumeListController.mjs"; // Obsolete
import * as timeline from '../timeline/timeline.mjs';
import * as focalPoint from './focalPoint.mjs';
import * as colorPalettes from '../colors/colorPalettes.mjs';
import { selectionManager } from './selectionManager.mjs';
import { toggleStepping } from './resizeHandle.mjs';

/**
 * function that handles keyboard events
 * @param {*} event 
 */
export function handleKeyDown(event) {
    if (event.ctrlKey && event.shiftKey && event.altKey && event.key === 'D') {
        CONSOLE_LOG_IGNORE("Ctrl+Shift+Alt+D detected: Dumping managers to console");
        window.dumpManagersToConsole();
    }

    switch (event.key) {
        case "ArrowLeft":
            CONSOLE_LOG_IGNORE("ArrowLeft pressed");
            // resumeListController.goToPreviousResumeItem();
            break;
        case "ArrowRight":
            CONSOLE_LOG_IGNORE("ArrowRight pressed");
            // resumeListController.goToNextResumeItem();
            break;
        case "ArrowUp":
            CONSOLE_LOG_IGNORE("ArrowUp pressed");
            // resumeListController.goToFirstResumeItem();
            break;
        case "ArrowDown":
            CONSOLE_LOG_IGNORE("ArrowDown pressed");
            // resumeListController.goToLastResumeItem();
            break;
        case " ": // Spacebar
            CONSOLE_LOG_IGNORE("Spacebar pressed");
            // focalPoint.toggleFocalPointLock();
            break;
        case "b":
            CONSOLE_LOG_IGNORE("'b' key pressed");
            focalPoint.toggleLockedToBullsEye();
            break;
        case "c":
            CONSOLE_LOG_IGNORE("'c' key pressed");
            colorPalettes.cycleColorPalette();
            break;
        case "s":
            CONSOLE_LOG_IGNORE("'s' key pressed");
            toggleStepping();
            break;
        case "t":
            CONSOLE_LOG_IGNORE("'t' key pressed");
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
        CONSOLE_LOG_IGNORE("Keydown handler already initialized.");
        return;
    }

    document.addEventListener('keydown', handleKeyDown);

    _isInitialized = true;
    CONSOLE_LOG_IGNORE("Keydown handler initialized.");
}

export function isInitialized() {
    return _isInitialized;
}
