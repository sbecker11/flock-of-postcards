export function createFocalPoint(focalPointElement) {
    if (!focalPointElement) {
        throw new Error("focalPointElement is null");
    }

    _focalPointElement = focalPointElement;
    _focalPointRadius = focalPointElement.getBoundingClientRect().width / 2.0;

    // Initialize state from storage
    const state = initializeState();
    
    _focalPointNowSubpixelPrecision = getFocalPoint();
    _isAwake = true;
    _isEasingToBullsEye = false;
    
    // Set initial pointer-events based on loaded draggable state
    _focalPointElement.style.pointerEvents = _isDraggable ? 'all' : 'none';
    if (_isDraggable) {
        _focalPointElement.classList.add('focal-point-is-draggable');
    }
    
    if (!_sceneContainer) {
        throw new Error("sceneContainer not initialized");
    }

    // Initialize resize observer before any other operations
    initializeResizeObserver();
    
    logger.log("Scene-div container initialized:", {
        exists: !!_sceneContainer,
        width: _sceneContainer.offsetWidth,
        left: _sceneContainer.offsetLeft,
        state: state
    });

    // Initial bulls-eye position update
    updateBullsEyeCenter();
    checkFixtureParents();

    // Add document-level mouse event listeners instead of container-level
    document.addEventListener("mousemove", onDocumentMouseMove);
    
    // Keep container enter/leave events for state management
    _sceneContainer.addEventListener("mouseenter", onsceneContainerEnter);
    _sceneContainer.addEventListener("mouseleave", onsceneContainerLeave);

    // Add hover listeners to the focal-point element
    _focalPointElement.addEventListener('mouseenter', () => {
        if (_isDraggable) {
            _focalPointElement.classList.add('focal-point-is-draggable');
        }
    });
    
    _focalPointElement.addEventListener('mouseleave', () => {
        if (_isDraggable) {
            _focalPointElement.classList.remove('focal-point-is-draggable');
        }
    });

    // Add drag event listeners to the focal-point element
    _focalPointElement.addEventListener('mousedown', onMouseDown_startDraggingFocalPoint);

    setAimPoint(getBullsEye(), "createFocalPoint");
    moveFocalPointTo(getBullsEye(), "createFocalPoint");

    // Update bulls-eye position again after any CSS transitions complete
    setTimeout(() => {
        updateBullsEyeCenter();
    }, 310); // Match the transition duration from CSS
}

// Define the aim point modes
const AimPointMode = {
    RETURN_TO_BULLS_EYE: 'returnToBullsEye',
    ALWAYS_FOLLOW_POINTER: 'alwaysFollowPointer'
};

// Add configuration for aim point mode
let _aimPointMode = AimPointMode.RETURN_TO_BULLS_EYE; // Default mode

export function toggleAimPointMode() {
    const newMode = _aimPointMode === AimPointMode.RETURN_TO_BULLS_EYE 
        ? AimPointMode.ALWAYS_FOLLOW_POINTER 
        : AimPointMode.RETURN_TO_BULLS_EYE;
    setAimPointMode(newMode);
}

// Add setter/getter for the mode
export function setAimPointMode(mode) {
    if (!Object.values(AimPointMode).includes(mode)) {
        logger.error(`Invalid aim point mode: ${mode}`);
        return;
    }
    _aimPointMode = mode;
    logger.info(`AimPoint mode: ${mode}`);
    saveState();
}

export function getAimPointMode() {
    return _aimPointMode;
}

// Generic helper function to check if pointer is in any container
function isPointerInContainer(container) {
    if (!container) return false;
    const rect = container.getBoundingClientRect();
    const lastPointerPosition = getAimPoint();
    if (!lastPointerPosition) return false;
    
    return (
        lastPointerPosition.x >= rect.left &&
        lastPointerPosition.x <= rect.right &&
        lastPointerPosition.y >= rect.top &&
        lastPointerPosition.y <= rect.bottom
    );
}

// Modify the document mouse move handler to respect the mode
function onDocumentMouseMove(event) {
    const eventPosition = getEventPosition(event);
    if (_aimPointMode === AimPointMode.ALWAYS_FOLLOW_POINTER || isPointerInContainer(_sceneContainer)) {
        setAimPoint(eventPosition, "onDocumentMouseMove");
    }
}

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
        setAimPoint(getBullsEye(), "onsceneContainerLeave");
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
    const rightColumn = document.getElementById('right-column');
    if (sceneContainer && rightColumn) {
        const leftPercent = state.dividerPosition;
        const rightPercent = 100 - leftPercent;
        sceneContainer.style.width = `${leftPercent}%`;
        rightColumn.style.width = `${rightPercent}%`;
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
        toggleAimPointMode();
    }
} 