// modules/colors/colorPalettes.mjs

import { AppState } from '../core/stateManager.mjs';

// This module is being refactored into the useColorPalette.mjs composable.
// The remaining functions are for legacy compatibility.

// Create a new EventTarget to act as our event hub for color palette changes.
const colorPaletteEventHub = new EventTarget();

// Add a public method to subscribe to color palette changes.
export function onColorPaletteChanged(callback) {
    colorPaletteEventHub.addEventListener('colorPaletteChanged', callback);
}

let _isInitialized = false;

export function isInitialized() {
    return _isInitialized;
}

// Minimal initialization for legacy compatibility.
// The actual logic is now in the useColorPalette composable.
async function initialize() {
    _isInitialized = true;
    console.log("Legacy color palettes module initialized.");
}

export default {
    initialize
};
