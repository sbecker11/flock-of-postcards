const STORAGE_KEY = 'flockOfPostcards_appState';

/**
 * Gets the default state for the application.
 * @returns {object} The default state object.
 */
function getDefaultState() {
    return {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        layout: {
            panelSizePercentage: 50 // Default to a 50/50 split
        },
        resizeHandle: {
            steppingEnabled: true // Default to stepping/snapping enabled
        },
        focalPoint: {
            mode: 'locked' // Default to locked mode
        },
        resume: {
            sortRule: { field: 'startDate', direction: 'desc' }, // Default to newest first
            selectedJobIndex: 0 // Default to the first item
        },
        theme: {
            colorPalette: '50_Dark_Grey_Monotone.json' // Default palette
        }
    };
}

/**
 * Loads the application state from the server.
 * If no state is found, it returns the default state.
 * @returns {Promise<object>} A promise that resolves to the application state.
 */
async function loadState() {
    try {
        const response = await fetch('/api/state');
        if (!response.ok) {
            if (response.status === 404) {
                console.log("No saved state found on server, using default state.");
            } else {
                console.error(`Failed to load state, server responded with status: ${response.status}`);
            }
            return getDefaultState();
        }
        const state = await response.json();
        console.log("Loaded state from server:", state);
        return state;
    } catch (e) {
        console.error('Error fetching state from server, using default state.', e);
        return getDefaultState();
    }
}

/**
 * Saves the provided state object to the server.
 * @param {object} state The application state to save.
 */
export async function saveState(state) {
    try {
        state.lastUpdated = new Date().toISOString();
        await fetch('/api/state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(state),
        });
        // console.log("Saved state to server:", state); // This can be noisy
    } catch (e) {
        console.error('Failed to save state to server.', e);
    }
}

/**
 * A global state object to hold the current application state.
 * This will be populated by initializeState.
 */
export let AppState = null;

/**
 * Initializes the global AppState by loading it from the server.
 * This must be called before any other module tries to access AppState.
 */
export async function initializeState() {
    AppState = await loadState();
} 