/**
 * Centralized coordinate system manager
 * Ensures all coordinate-dependent systems stay synchronized
 */

class CoordinateManager {
    constructor() {
        this.coordinateSystems = new Map();
        this.listeners = new Set();
        this.isInitialized = false;
    }

    /**
     * Register a coordinate system
     * @param {string} name - Name of the coordinate system
     * @param {Object} system - The coordinate system object
     */
    registerSystem(name, system) {
        this.coordinateSystems.set(name, system);
        window.CONSOLE_LOG_IGNORE(`[COORDS] Registered coordinate system: ${name}`);
    }

    /**
     * Update all coordinate systems when layout changes
     * @param {Object} layoutInfo - Layout information
     */
    updateAllSystems(layoutInfo) {
        if (!this.isInitialized) return;

        window.CONSOLE_LOG_IGNORE('[COORDS] Updating all coordinate systems:', layoutInfo);
        
        // Update each registered system
        for (const [name, system] of this.coordinateSystems) {
            if (system.updateCoordinates) {
                try {
                    system.updateCoordinates(layoutInfo);
                } catch (error) {
                    window.CONSOLE_LOG_IGNORE(`[COORDS] Error updating ${name}:`, error);
                }
            }
        }

        // Notify listeners
        this.notifyListeners(layoutInfo);
    }

    /**
     * Add a listener for coordinate updates
     * @param {Function} listener - The listener function
     */
    addListener(listener) {
        this.listeners.add(listener);
    }

    /**
     * Remove a listener
     * @param {Function} listener - The listener function to remove
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of coordinate changes
     * @param {Object} layoutInfo - Layout information
     */
    notifyListeners(layoutInfo) {
        for (const listener of this.listeners) {
            try {
                listener(layoutInfo);
            } catch (error) {
                window.CONSOLE_LOG_IGNORE('[COORDS] Error in coordinate listener:', error);
            }
        }
    }

    /**
     * Initialize the coordinate manager
     */
    initialize() {
        this.isInitialized = true;
        window.CONSOLE_LOG_IGNORE('[COORDS] Coordinate manager initialized');
    }

    /**
     * Get the status of all coordinate systems
     */
    getStatus() {
        const status = {};
        for (const [name, system] of this.coordinateSystems) {
            status[name] = {
                registered: true,
                hasUpdateMethod: !!system.updateCoordinates,
                isInitialized: system.isInitialized ? system.isInitialized() : 'unknown'
            };
        }
        return status;
    }
}

// Export singleton instance
export const coordinateManager = new CoordinateManager(); 