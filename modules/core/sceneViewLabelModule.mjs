import * as domUtils from '../utils/domUtils.mjs';
import * as viewPort from './viewPortModule.mjs';

let _sceneViewLabelElement = null;
let _isInitialized = false;

export function isInitialized() {
    return _isInitialized;
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

    // Initial positioning
    repositionLabel();

    _isInitialized = true;
}

export function repositionLabel() {
    if (!_sceneViewLabelElement) return;

    // Position it at a fixed location in the viewport (bottom-right)
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    const top = viewportHeight - 40;
    const left = viewportWidth - 120;

    console.log(`Repositioning SceneViewLabel to: top=${top}px, left=${left}px, viewport: ${viewportWidth}x${viewportHeight}`);

    _sceneViewLabelElement.style.top = `${top}px`;
    _sceneViewLabelElement.style.left = `${left}px`;
    _sceneViewLabelElement.style.right = 'auto';
}

export function setSceneViewLabel(text) {
    // ... existing code ...
} 