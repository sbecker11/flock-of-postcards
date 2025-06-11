// modules/core/keyDown.mjs

import * as focalPoint from './focalPoint.mjs';
import { Logger, LogLevel } from '../logger.mjs';

const logger = new Logger("keyDown", LogLevel.INFO);

/**
 * function that handles keyboard events
 * @param {*} event 
 */
export function handleKeyDown(event) {
    const key = event.key.toLowerCase(); // Normalize key to lowercase
    console.log(`keyDown.handleKeyDown: Key pressed: ${key}`);
    
    // Don't handle key events if they're in an input field or textarea
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        console.log(`keyDown.handleKeyDown: Ignoring key event in ${event.target.tagName}`);
        return;
    }
    
    switch (key) {
        case 'b':
            console.log("keyDown.handleKeyDown: 'b' key pressed - toggling focal point lock to bulls-eye");
            
            // Check if focalPoint module is available
            if (typeof focalPoint === 'undefined' || focalPoint === null) {
                console.error("keyDown.handleKeyDown: focalPoint module is not available");
                return;
            }
            
            // Check if toggleLockedToBullsEye function exists
            if (typeof focalPoint.toggleLockedToBullsEye !== 'function') {
                console.error("keyDown.handleKeyDown: toggleLockedToBullsEye function not found");
                return;
            }
            
            // If focal point is being dragged, first stop dragging
            if (focalPoint.isBeingDragged && focalPoint.isBeingDragged()) {
                console.log("keyDown.handleKeyDown: Stopping drag before toggling lock");
                focalPoint.set_isBeingDragged_false(focalPoint.getFocalPoint());
            }
            
            // Call toggleLockedToBullsEye and log the result
            try {
                const isLocked = focalPoint.toggleLockedToBullsEye();
                console.log(`keyDown.handleKeyDown: Focal point lock toggled to: ${isLocked}`);
                
                // Log the state after toggling
                if (typeof focalPoint.logFocalPointState === 'function') {
                    focalPoint.logFocalPointState();
                }
            } catch (error) {
                console.error("keyDown.handleKeyDown: Error toggling focal point lock:", error);
            }
            break;
            
        case 'd':
            console.log("keyDown.handleKeyDown: 'd' key pressed - toggling draggable");
            if (typeof focalPoint.toggleDraggable === 'function') {
                focalPoint.toggleDraggable();
            } else {
                console.error("keyDown.handleKeyDown: toggleDraggable function not found");
            }
            break;
            
        case 'f':
            console.log("keyDown.handleKeyDown: 'f' key pressed - toggling follow pointer");
            if (typeof focalPoint.toggleFollowPointerOutsideContainer === 'function') {
                focalPoint.toggleFollowPointerOutsideContainer();
            } else {
                console.error("keyDown.handleKeyDown: toggleFollowPointerOutsideContainer function not found");
            }
            break;
            
        default:
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
