// eventBus.mjs - A simple event bus for module communication

const listeners = new Map();

/**
 * Register a listener for an event
 * @param {string} eventName - Name of the event
 * @param {Function} callback - Function to call when event is triggered
 */
export function on(eventName, callback) {
    if (!listeners.has(eventName)) {
        listeners.set(eventName, []);
    }
    listeners.get(eventName).push(callback);
}

/**
 * Trigger an event
 * @param {string} eventName - Name of the event
 * @param {any} data - Data to pass to listeners
 */
export function emit(eventName, data) {
    window.CONSOLE_LOG_IGNORE(`Event emitted: ${eventName}`);
    if (listeners.has(eventName)) {
        for (const callback of listeners.get(eventName)) {
            try {
                callback(data);
            } catch (error) {
                window.CONSOLE_LOG_IGNORE(`Error in event listener for ${eventName}:`, error);
            }
        }
    }
}

/**
 * Remove a listener for an event
 * @param {string} eventName - Name of the event
 * @param {Function} callback - Function to remove
 */
export function off(eventName, callback) {
    if (listeners.has(eventName)) {
        const index = listeners.get(eventName).indexOf(callback);
        if (index !== -1) {
            listeners.get(eventName).splice(index, 1);
        }
    }
}