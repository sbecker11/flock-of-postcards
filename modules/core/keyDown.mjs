// modules/core/keyDown.mjs

import { resumeListController } from '../resume/ResumeListController.mjs';
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
            resumeListController.goToPreviousResumeItem();
            break;
        case "ArrowRight":
            console.log("ArrowRight pressed");
            resumeListController.goToNextResumeItem();
            break;
        case "ArrowUp":
            console.log("ArrowUp pressed");
            resumeListController.goToFirstResumeItem();
            break;
        case "ArrowDown":
            console.log("ArrowDown pressed");
            resumeListController.goToLastResumeItem();
            break;
        case " ": // Spacebar
            console.log("Spacebar pressed");
            // focalPoint.toggleFocalPointLock();
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

/**
 * Initialize the key down handler
 */
export function initializeKeyDownHandler() {
    console.log("keyDown.initializeKeyDownHandler: Initializing key down handler");
    
    // Remove any existing event listeners to avoid duplicates
    document.removeEventListener('keydown', handleKeyDown);
    
    // Add the event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Log that the handler is initialized
    console.log("keyDown.initializeKeyDownHandler: Key down handler initialized - press 'b' to toggle focal point lock to bulls-eye");
    
    // Make the handler available globally for debugging
    window.handleKeyDown = handleKeyDown;
    console.log("keyDown.initializeKeyDownHandler: handleKeyDown function is now available globally as window.handleKeyDown");
}

/**
 * Check if key events are being captured
 */
export function checkKeyEventCapture() {
    console.log("keyDown.checkKeyEventCapture: Checking if key events are being captured...");
    
    // Add a temporary key handler for testing
    const tempHandler = (e) => {
        console.log(`keyDown.checkKeyEventCapture: TEST KEYDOWN: Key pressed: ${e.key}`);
        
        if (e.key.toLowerCase() === 'b') {
            console.log("keyDown.checkKeyEventCapture: TEST KEYDOWN: 'b' key pressed");
            
            // Try to toggle the focal point lock directly
            try {
                const isLocked = focalPoint.toggleLockedToBullsEye();
                console.log(`keyDown.checkKeyEventCapture: TEST KEYDOWN: Focal point lock toggled to: ${isLocked}`);
                
                if (typeof focalPoint.logFocalPointState === 'function') {
                    focalPoint.logFocalPointState();
                }
            } catch (error) {
                console.error("keyDown.checkKeyEventCapture: TEST KEYDOWN: Error toggling focal point lock:", error);
            }
        }
    };
    
    // Add the temporary handler
    document.addEventListener('keydown', tempHandler);
    console.log("keyDown.checkKeyEventCapture: Added temporary test key handler to document");
    console.log("keyDown.checkKeyEventCapture: Press any key to test if events are being captured");
    
    // Remove the temporary handler after 10 seconds
    setTimeout(() => {
        document.removeEventListener('keydown', tempHandler);
        console.log("keyDown.checkKeyEventCapture: Removed temporary test key handler");
    }, 10000);
}
