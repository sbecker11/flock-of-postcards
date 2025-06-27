import { bizCardDivManager } from './bizCardDivManager.mjs';
import { resumeManager } from '../resume/resumeManager.mjs';
import { selectionManager } from '../core/selectionManager.mjs';

let isInitialized = false;
let scenePlane = null;

export function initializeScenePlane() {
    if (isScenePlaneInitialized()) {
        console.log("initializeScenePlane: Scene plane already initialized, ignoring duplicate initialization request");
        return;
    }
    
    // Set up the scene plane
    scenePlane = document.getElementById('scene-plane');
    if (!scenePlane) {
        throw new Error('Scene plane element not found');
    }
    
    // Initialize any scene-related properties
    // ...
    
    // Remove any existing click handler to avoid duplicates
    scenePlane.removeEventListener('click', handleScenePlaneClick);

    // Add the click handler
    scenePlane.addEventListener('click', handleScenePlaneClick);
    
    isInitialized = true;
    console.log("Scene plane initialized");
}

export function isScenePlaneInitialized() {
    return isInitialized;
}

function handleScenePlaneClick(event) {
    // Check if the click was on the scene plane itself and not on a child element (like a card)
    if (event.target.id === 'scene-plane') {
        selectionManager.clearSelection("scenePlane.handleScenePlaneClick");
    }
}

/**
 * DEPRECATED: This function is no longer needed.
 * The selectionManager now handles clearing selections.
 * Components should call selectionManager.clearSelection() instead.
 * 
 * @deprecated
 */
export function clearAllSelected(caller='') {
    console.warn(`[DEPRECATED] clearAllSelected was called by ${caller}. This function is deprecated. Use selectionManager.clearSelection() instead.`);
    selectionManager.clearSelection(`clearAllSelected from ${caller}`);
}
