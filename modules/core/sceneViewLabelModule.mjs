import * as domUtils from '../utils/domUtils.mjs';
import * as viewPort from './viewPortModule.mjs';

let _sceneViewLabelElement = null;
let _isInitialized = false;

export function isInitialized() {
    return _isInitialized;
}

function getResizeHandlePosition() {
    // Find the resize handle element
    const resizeHandleElement = document.querySelector('#resize-handle');
    if (!resizeHandleElement) {
        console.warn('Resize handle element not found');
        return null;
    }
    
    // Get the bounding rectangle of the resize handle
    const rect = resizeHandleElement.getBoundingClientRect();
    
    // Return the left edge position
    return {
        left: rect.left
    };
}

export function initialize() {
    if (!viewPort.isInitialized()) {
        throw new Error("sceneViewLabel requires viewPort to be initialized.");
    }
    
    if (_isInitialized) {
        console.warn("sceneViewLabel.initialize: already initialized");
        return;
    }
    _sceneViewLabelElement = document.getElementById("scene-view-label");
    if (!_sceneViewLabelElement) {
        throw new Error("sceneViewLabel.initialize: #scene-view-label element not found in DOM");
    }

    // Listen for layout changes to reposition the label
    window.addEventListener('layout-changed', () => repositionLabel());
    
    // Listen for viewport changes to reposition the label
    window.addEventListener('viewport-changed', () => repositionLabel());

    // Initial positioning
    repositionLabel();

    _isInitialized = true;
}

export function repositionLabel() {
    if (!_sceneViewLabelElement) {
        console.warn('SceneViewLabel: element not found');
        return;
    }

    // Get the resize handle position
    const resizeHandlePos = getResizeHandlePosition();
    
    console.log(`DEBUG SceneViewLabel positioning:`);
    console.log(`  window.innerHeight: ${window.innerHeight}`);
    console.log(`  window.innerWidth: ${window.innerWidth}`);
    
    if (resizeHandlePos) {
        console.log(`  resizeHandlePos.left: ${resizeHandlePos.left}`);
        
        // Simple positioning: bottom right of viewport
        const bottom = 15; // 15px from bottom
        const right = 13; // 13px from right edge
        
        // Calculate top position (from top of viewport)
        const top = window.innerHeight - bottom - 20 - 3; // 20px is approximate text height, -3px to move up
        
        // Calculate left position (from left of viewport)
        const left = resizeHandlePos.left - 13 - 120 + 30; // 120px is approximate text width, +30px to move right
        
        console.log(`  calculated top: ${top}`);
        console.log(`  calculated left: ${left}`);
        console.log(`  calculated bottom: ${bottom}`);
        console.log(`  calculated right: ${right}`);
        
        // Apply positioning
        _sceneViewLabelElement.style.top = `${top}px`;
        _sceneViewLabelElement.style.left = `${left}px`;
        _sceneViewLabelElement.style.right = 'auto';
        _sceneViewLabelElement.style.bottom = 'auto';
        
        console.log(`  Applied styles - top: ${_sceneViewLabelElement.style.top}, left: ${_sceneViewLabelElement.style.left}`);
        
        // Also log the element's computed position
        const rect = _sceneViewLabelElement.getBoundingClientRect();
        console.log(`  Actual position - top: ${rect.top}, left: ${rect.left}, bottom: ${rect.bottom}, right: ${rect.right}`);
    } else {
        console.warn('SceneViewLabel: resize handle not found, using fallback positioning');
        // Fallback to bottom right corner
        const top = window.innerHeight - 40;
        const left = window.innerWidth - 120;

        _sceneViewLabelElement.style.top = `${top}px`;
        _sceneViewLabelElement.style.left = `${left}px`;
        _sceneViewLabelElement.style.right = 'auto';
        _sceneViewLabelElement.style.bottom = 'auto';
    }
}

export function setSceneViewLabel(text) {
    // ... existing code ...
} 