// modules/core/keyDown.mjs

// import { toggleStepping } from './resizeHandle.mjs'; // TODO: Re-implement with composable

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
        // Arrow keys and spacebar are currently disabled pending a refactor
        // to use the central selectionManager or a new composable.
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
        case " ": // Spacebar
            break;

        // Focal point mode controls
        case "b":
            console.log("'b' key pressed for bullseye");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'locked' } }));
            break;
        case "f":
            console.log("'f' key pressed for following");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'following' } }));
            break;
        case "d":
            console.log("'d' key pressed for dragging");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'dragging' } }));
            break;
        
        // Other controls
        case "s":
            console.log("'s' key pressed");
            // toggleStepping();
            break;
        
        // Obsolete controls 'c' (color palettes) and 't' (timeline) were removed.
        
        case 'l':
            eventBus.emit('focal-point-lock-toggle');
            break;
        
        default:
            // console.log("Key pressed: " + event.key);
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
