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
        window.CONSOLE_LOG_IGNORE('Resize handle element not found');
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
        window.CONSOLE_LOG_IGNORE("sceneViewLabel.initialize: already initialized");
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

    // Initial positioning with a small delay to ensure DOM is ready
    setTimeout(() => {
        repositionLabel();
    }, 100);

    _isInitialized = true;
}

export function repositionLabel() {
    if (!_sceneViewLabelElement) {
        window.CONSOLE_LOG_IGNORE('SceneViewLabel: element not found');
        return;
    }

    // Get the resize handle position
    const resizeHandlePos = getResizeHandlePosition();
    
    if (resizeHandlePos) {
        // Position the label at the bottom right of the scene container
        // Calculate position relative to the scene container
        const sceneContainer = document.getElementById('scene-container');
        if (sceneContainer) {
            const sceneRect = sceneContainer.getBoundingClientRect();
            
            // Position at bottom right of scene container
            const bottom = 15; // 15px from bottom
            const right = 13; // 13px from right edge
            
            // Calculate position relative to viewport
            const top = sceneRect.bottom - bottom - 20; // 20px is approximate text height
            const left = sceneRect.right - right - 120; // 120px is approximate text width
            
            window.CONSOLE_LOG_IGNORE('SceneViewLabel positioning:', { top, left, sceneRect });
            
            // Apply positioning
            _sceneViewLabelElement.style.top = `${top}px`;
            _sceneViewLabelElement.style.left = `${left}px`;
            _sceneViewLabelElement.style.right = 'auto';
            _sceneViewLabelElement.style.bottom = 'auto';
        } else {
            window.CONSOLE_LOG_IGNORE('SceneViewLabel: scene container not found');
            // Fallback positioning
            const top = window.innerHeight - 40;
            const left = window.innerWidth - 120;
            _sceneViewLabelElement.style.top = `${top}px`;
            _sceneViewLabelElement.style.left = `${left}px`;
            _sceneViewLabelElement.style.right = 'auto';
            _sceneViewLabelElement.style.bottom = 'auto';
        }
    } else {
        window.CONSOLE_LOG_IGNORE('SceneViewLabel: resize handle not found, using fallback positioning');
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