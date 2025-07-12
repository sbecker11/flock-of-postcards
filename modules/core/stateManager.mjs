import { deepMerge } from '../utils/utils.mjs';

const STORAGE_KEY = 'flockOfPostcards_appState';

/**
 * Gets the default state for the application.
 * @returns {object} The default state object.
 */
function getDefaultState() {
    return {
        version: "1.2", // Updated for constants system
        lastUpdated: new Date().toISOString(),
        layout: {
            panelSizePercentage: 50 // Default to a 50/50 split
        },
        resizeHandle: {
            steppingEnabled: true, // Default to stepping/snapping enabled
            stepCount: 4
        },
        focalPoint: {
            mode: 'locked' // Default to locked mode
        },
        badgeToggle: {
            mode: 'none' // Default to no badges shown
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
        },
        color: {
            palettes: {}
        },
        // NEW: Constants system for centralized configuration
        constants: {
            // Z-Index System
            zIndex: {
                root: 0,
                scene: 1,
                sceneGradients: 2,
                timeline: 3,
                connectionLines: 4,
                badges: 5,
                backgroundMax: 6,
                cardsMin: 10,
                cardsMax: 19,
                bullsEye: 98,
                selectedCard: 99,
                focalPoint: 100,
                aimPoint: 101
            },
            // Card Layout
            cards: {
                meanWidth: 180,
                minHeight: 180,
                maxXOffset: 100,
                maxWidthOffset: 30,
                minZDiff: 2
            },
            // Timeline Configuration
            timeline: {
                pixelsPerYear: 200,
                paddingTop: 0,
                gradientLength: "50vh"
            },
            // Resize Handle
            resizeHandle: {
                width: 20,
                shadowWidth: 8,
                shadowBlur: 5,
                defaultWidthPercent: 50
            },
            // Animation & Timing
            animation: {
                durations: {
                    fast: "0.2s",
                    medium: "0.3s",
                    slow: "0.5s",
                    spinner: "1s"
                },
                autoScroll: {
                    repeatMillis: 10,
                    maxVelocity: 3.0,
                    minVelocity: 2.0,
                    changeThreshold: 2.0,
                    scrollZonePercentage: 0.20
                }
            },
            // Performance
            performance: {
                thresholds: {
                    resizeTime: 16,
                    scrollTime: 8,
                    memoryUsage: 52428800
                },
                debounceTimeout: 100
            },
            // Typography
            typography: {
                fontSizes: {
                    small: "10px",
                    medium: "12px",
                    large: "14px",
                    xlarge: "16px",
                    xxlarge: "20px",
                    timeline: "48px"
                },
                fontFamily: "'Inter', sans-serif"
            },
            // Visual Effects
            visualEffects: {
                parallax: {
                    xExaggerationFactor: 0.9,
                    yExaggerationFactor: 1.0
                },
                depthEffects: {
                    minBrightnessPercent: 15,
                    blurScaleFactor: 2.0,
                    filterMultipliers: {
                        brightness: { min: 0.4, factor: 0.10 },
                        blur: { min: 0, factor: 0.10 },
                        contrast: { min: 0.75, factor: 0.010 },
                        saturate: { min: 0.75, factor: 0.010 }
                    }
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

    // Migration from 1.1 to 1.2: Add constants system while preserving user preferences
    if (state.version === "1.1") {
        console.log('[MIGRATION] Migrating state from v1.1 to v1.2: Adding constants system');
        
        // Preserve existing focal point mode (don't reset to locked)
        // The user's saved preference should be maintained
        
        // Ensure resizeHandle has stepCount
        if (!state.resizeHandle) {
            state.resizeHandle = {};
        }
        if (!state.resizeHandle.stepCount) {
            state.resizeHandle.stepCount = 4;
        }
        
        // Ensure color section exists
        if (!state.color) {
            state.color = { palettes: {} };
        }
        
        // Constants will be added via deepMerge with default state
        
        state.version = "1.2";
        console.log('[MIGRATION] Successfully migrated to v1.2 - preserved user preferences');
    }

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
        
        // Merge the default state into migrated state to ensure all keys exist
        // This way, default values (like locked focal point mode) take precedence for new fields
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