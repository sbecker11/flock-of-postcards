// index.mjs

import * as aimPoint from './modules/core/aimPoint.mjs';


// Update container event handlers to focus on state changes
function onsceneContainerEnter(event) {
    const eventPosition = getEventPosition(event);
    setStatus("startEasingToAimPoint", "onsceneContainerEnter", LogLevel.LOG);
    awaken(eventPosition);
    startEasingToAimPoint("onsceneContainerEnter");
}

// Update container leave handler to focus on aim point
function onsceneContainerLeave(event) {
    const eventPosition = getEventPosition(event);
    setStatus("leaveContainer", "onsceneContainerLeave", LogLevel.LOG);
    if (_aimPointMode === AimPointMode.RETURN_TO_BULLS_EYE) {
        aimPoint.setAimPoint(getBullsEyeElement(), "onsceneContainerLeave");
        startEasingToBullsEye("onsceneContainerLeave");
    }
}

// Add cleanup for document event listener
function cleanup() {
    if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
    }
    // Remove document-level event listener
    document.removeEventListener("mousemove", onDocumentMouseMove);
}

function getDefaultState() {
    return {
        isDraggable: true,
        isLockedToBullsEye: false,
        aimPointMode: AimPointMode.RETURN_TO_BULLS_EYE,
        lastPosition: null,
        dividerPosition: 50,
        selectedPalette: null,
        lastUpdated: new Date().toISOString(),
        version: "1.0"
    };
}

export function saveState() {
    try {
        const paletteSelector = document.getElementById('color-palette-selector');
        const sceneContainer = document.getElementById('scene-container');
        
        const state = {
            isDraggable: _isDraggable,
            isLockedToBullsEye: _isLockedToBullsEye,
            aimPointMode: _aimPointMode,
            lastPosition: getFocalPoint(),
            dividerPosition: parseFloat(sceneContainer.style.width) || 50,
            selectedPalette: paletteSelector ? paletteSelector.value : null,
            lastUpdated: new Date().toISOString(),
            version: "1.0"
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
        logger.log('Saved focal point state:', state);
    } catch (e) {
        logger.error('Failed to save focal point state:', e);
    }
}

export function initializeState() {
    const state = loadState();
    _isDraggable = state.isDraggable;
    _isLockedToBullsEye = state.isLockedToBullsEye;
    _aimPointMode = state.aimPointMode ?? AimPointMode.RETURN_TO_BULLS_EYE;
    
    // Apply divider position
    const sceneContainer = document.getElementById('scene-container');
    const resumeColumn = document.getElementById('resume-column');
    if (sceneContainer && resumeColumn) {
        const leftPercent = state.dividerPosition;
        const rightPercent = 100 - leftPercent;
        sceneContainer.style.width = `${leftPercent}%`;
        resumeColumn.style.width = `${rightPercent}%`;
        const resizeHandle = document.getElementById('resize-handle');
        if (resizeHandle) {
            resizeHandle.style.left = `${leftPercent}%`;
        }
        // Update bulls-eye position after setting the divider
        updateBullsEyeCenter();
    }

    // Apply palette selection if available
    const paletteSelector = document.getElementById('color-palette-selector');
    if (paletteSelector && state.selectedPalette) {
        paletteSelector.value = state.selectedPalette;
        // Trigger change event to apply the palette
        const event = new Event('change');
        paletteSelector.dispatchEvent(event);
    }

    return state;
}

export function handleKeyDown(event) {
    if (event.code === 'Period') {
        aimPoint.toggleAimPointMode();
    }
} 