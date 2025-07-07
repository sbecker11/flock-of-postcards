import { deepMerge } from '../utils/utils.mjs';

const STORAGE_KEY = 'flockOfPostcards_appState';

/**
 * Gets the default state for the application.
 * @returns {object} The default state object.
 */
function getDefaultState() {
    return {
        version: "1.1", // Updated for marginTop changes
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
            sortRule: { field: 'startDate', direction: 'asc' }, // Default to oldest first
            selectedJobNumber: 22 // Default to the last item (newest job when sorted oldest first)
        },
        theme: {
            colorPalette: '50_Dark_Grey_Monotone.json', // Default palette
            brightnessFactorSelected: 2.0,  // Brightness factor for selected elements (scene cards)
            brightnessFactorHovered: 1.75,   // Brightness factor for hovered elements (scene cards)
            borderSettings: {
                normal: {
                    padding: '8px',
                    innerBorderWidth: '1px',
                    innerBorderColor: 'white',
                    outerBorderWidth: '0px',
                    outerBorderColor: 'transparent',
                    borderRadius: '25px'
                },
                hovered: {
                    padding: '7px',
                    innerBorderWidth: '2px',
                    innerBorderColor: 'blue',
                    outerBorderWidth: '0px',
                    outerBorderColor: 'transparent',
                    borderRadius: '25px'
                },
                selected: {
                    padding: '6px',
                    innerBorderWidth: '3px',
                    innerBorderColor: 'purple',
                    outerBorderWidth: '0px',
                    outerBorderColor: 'transparent',
                    borderRadius: '25px'
                }
            },
            rDivBorderOverrideSettings: {
                normal: {
                    padding: '15px',
                    innerBorderWidth: '1px',
                    marginTop: '11px'
                },
                hovered: {
                    padding: '14px',
                    innerBorderWidth: '2px',
                    marginTop: '11px'
                },
                selected: {
                    padding: '13px',
                    innerBorderWidth: '3px',
                    marginTop: '11px'
                }
            }
        }
    };
}

/**
 * Migrates old state versions to current version
 * @param {object} state The state to migrate
 * @returns {object} The migrated state
 */
function migrateState(state) {
    if (!state.version) {
        state.version = "1.0"; // Assume version 1.0 if no version present
    }

    // Migration from 1.0 to 1.1: Update marginTop values
    if (state.version === "1.0") {
        console.log('[MIGRATION] Migrating state from v1.0 to v1.1: Updating marginTop values');
        
        // Ensure rDivBorderOverrideSettings exists
        if (!state.theme) state.theme = {};
        if (!state.theme.rDivBorderOverrideSettings) {
            state.theme.rDivBorderOverrideSettings = {
                normal: { padding: '15px', innerBorderWidth: '1px', marginTop: '11px' },
                hovered: { padding: '14px', innerBorderWidth: '2px', marginTop: '11px' },
                selected: { padding: '13px', innerBorderWidth: '3px', marginTop: '11px' }
            };
        } else {
            // Update existing marginTop values
            if (state.theme.rDivBorderOverrideSettings.normal) {
                state.theme.rDivBorderOverrideSettings.normal.marginTop = '11px';
            }
            if (state.theme.rDivBorderOverrideSettings.hovered) {
                state.theme.rDivBorderOverrideSettings.hovered.marginTop = '11px';
            }
            if (state.theme.rDivBorderOverrideSettings.selected) {
                state.theme.rDivBorderOverrideSettings.selected.marginTop = '11px';
            }
        }
        
        state.version = "1.1";
        console.log('[MIGRATION] Successfully migrated to v1.1');
    }

    // Future migrations can be added here:
    // if (state.version === "1.1") {
    //     // Migration logic for 1.1 → 1.2
    //     state.version = "1.2";
    // }

    return state;
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
                window.CONSOLE_LOG_IGNORE("No saved state found on server, using default state.");
            } else {
                window.CONSOLE_LOG_IGNORE(`Failed to load state, server responded with status: ${response.status}`);
            }
            return getDefaultState();
        }
        const rawState = await response.json();
        window.CONSOLE_LOG_IGNORE("Loaded raw state from server:", rawState);
        
        // Migrate the state to current version
        const migratedState = migrateState(rawState);
        
        // Merge the migrated state into the default state to ensure all keys exist
        const finalState = deepMerge(getDefaultState(), migratedState);
        
        window.CONSOLE_LOG_IGNORE("Final state after migration and merge:", finalState);
        return finalState;
    } catch (e) {
        window.CONSOLE_LOG_IGNORE('Error fetching state from server, using default state.', e);
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
        window.CONSOLE_LOG_IGNORE("Saved state to server:", state); // This can be noisy
    } catch (e) {
        window.CONSOLE_LOG_IGNORE('Failed to save state to server.', e);
    }
}

/**
 * A global state object to hold the current application state.
 * This will be populated by initializeState.
 */
export let AppState = null;

let initStatePromise = null;

/**
 * Initializes the global AppState by loading it from the server.
 * This must be called before any other module tries to access AppState.
 * This function is now idempotent: it will only load state once.
 */
export function initializeState() {
    if (!initStatePromise) {
        initStatePromise = loadState().then(state => {
            AppState = state;
            return state;
        });
    }
    return initStatePromise;
} 