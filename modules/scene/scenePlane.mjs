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
    clearAllSelected();
}

/**
 * Called when the scene plane is clicked
 * 
 * Also called by both bizCardDivModule and 
 * bizResumeDivModule before any new selection is made
 */
export function clearAllSelected() {
    const selectedElements = document.querySelectorAll('.selected');
    selectedElements.forEach(element => {
        element.classList.remove("selected");    
    });    
    console.log("scenePlane: clearAllSelected: num cleared:", selectedElements.length);
}
