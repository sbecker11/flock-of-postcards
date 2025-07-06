// modules/core/keyDown.mjs

// import { toggleStepping } from './resizeHandle.mjs'; // TODO: Re-implement with composable

/**
 * function that handles keyboard events
 * @param {*} event 
 */
export function handleKeyDown(event) {
    if (event.ctrlKey && event.shiftKey && event.altKey && event.key === 'D') {
        window.CONSOLE_LOG_IGNORE("Ctrl+Shift+Alt+D detected: Dumping managers to console");
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
            window.CONSOLE_LOG_IGNORE("'b' key pressed for bullseye");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'locked' } }));
            break;
        case "f":
            window.CONSOLE_LOG_IGNORE("'f' key pressed for following");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'following' } }));
            break;
        case "d":
            window.CONSOLE_LOG_IGNORE("'d' key pressed for dragging");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'dragging' } }));
            break;
        
        // Other controls
        case "s":
            window.CONSOLE_LOG_IGNORE("'s' key pressed");
            // toggleStepping();
            break;
        
        // Obsolete controls 'c' (color palettes) and 't' (timeline) were removed.
        
        case 'l':
            eventBus.emit('focal-point-lock-toggle');
            break;
        
        default:
            window.CONSOLE_LOG_IGNORE("Key pressed: " + event.key);
            break;
    }
}

let _isInitialized = false;

/**
 * Initializes the keydown handler and attaches the event listener.
 */
export function initialize() {
    if (_isInitialized) {
        window.CONSOLE_LOG_IGNORE("Keydown handler already initialized.");
        return;
    }

    document.addEventListener('keydown', handleKeyDown);

    _isInitialized = true;
    window.CONSOLE_LOG_IGNORE("Keydown handler initialized.");
}

export function isInitialized() {
    return _isInitialized;
}
