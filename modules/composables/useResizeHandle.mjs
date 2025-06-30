import { ref, computed } from 'vue';
import * as viewPort from '@/modules/core/viewPort.mjs';
import { AppState, saveState } from '@/modules/core/stateManager.mjs';

const HANDLE_WIDTH = 20;
const DEFAULT_WIDTH_PERCENT = 50;

// --- Singleton State ---
const uiPercentage = ref(DEFAULT_WIDTH_PERCENT);
const sceneWidthInPixels = ref(0);
const isDragging = ref(false);
const steppingEnabled = ref(false);

function clampToRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function updateLayout(newUiPercentage, shouldSave = true) {
    console.log('=== updateLayout START ===');
    console.log('updateLayout called with percentage:', newUiPercentage, 'shouldSave:', shouldSave);
    const windowWidth = window.innerWidth;
    const maxSceneWidth = windowWidth - HANDLE_WIDTH;
    const clampedUiPercentage = clampToRange(newUiPercentage, 0, 100);

    const newSceneWidth = Math.round((clampedUiPercentage / 100) * maxSceneWidth);
    sceneWidthInPixels.value = newSceneWidth;
    
    console.log('Calling viewPort.setViewPortWidth with:', newSceneWidth);
    viewPort.setViewPortWidth(newSceneWidth);
    
    if (AppState) {
        AppState.layout.panelSizePercentage = clampedUiPercentage;
        if (shouldSave) {
            console.log('Saving state...');
            saveState(AppState);
        }
    }
    
    console.log('About to dispatch layout-changed event with sceneWidth:', newSceneWidth);
    const event = new CustomEvent('layout-changed', { detail: { sceneWidth: newSceneWidth } });
    window.dispatchEvent(event);
    console.log('layout-changed event dispatched');
    console.log('=== updateLayout END ===');
    
    return clampedUiPercentage;
}

export function useResizeHandle() {

    function initializeResizeHandleState() {
        const initialPercentage = AppState?.layout?.panelSizePercentage || DEFAULT_WIDTH_PERCENT;
        steppingEnabled.value = AppState?.resizeHandle?.steppingEnabled || false;
        uiPercentage.value = initialPercentage;
    }

    function applyInitialLayout() {
        updateLayout(uiPercentage.value, false);
    }
    
    let startX = 0;
    let startPixelWidth = 0;

    const incrementPercentage = computed(() => {
        return steppingEnabled.value ? (100 / 3) : 0;
    });

    function updateLayoutFromPercentage(newPercentage, shouldSave = true) {
        uiPercentage.value = updateLayout(newPercentage, shouldSave);
    }

    function handleDrag(e) {
        if (!isDragging.value) return;
        const dx = e.clientX - startX;
        const newPixelWidth = startPixelWidth + dx;
        const maxSceneWidth = window.innerWidth - HANDLE_WIDTH;
        const newDragPercentage = (newPixelWidth / maxSceneWidth) * 100;
        
        updateLayoutFromPercentage(newDragPercentage, false);
    }

    function stopDrag() {
        if (!isDragging.value) return;
        isDragging.value = false;
        document.body.style.userSelect = 'auto';

        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);

        if (incrementPercentage.value > 0) {
            const snapPercentage = incrementPercentage.value;
            const currentSnapIndex = Math.round(uiPercentage.value / snapPercentage);
            const newSnappedPercentage = currentSnapIndex * snapPercentage;
            updateLayoutFromPercentage(newSnappedPercentage, true);
        } else {
            if (AppState) saveState(AppState);
        }
    }

    function startDrag(e) {
        if (e.target.closest('button')) return;
        isDragging.value = true;
        startX = e.clientX;
        startPixelWidth = sceneWidthInPixels.value;
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    function collapseLeft() {
        const secondaryIncrementPercentage = 100 / 10;
        let newPercentage;
        if (incrementPercentage.value > 0) {
            const snapPercentage = incrementPercentage.value;
            const currentSnapIndex = Math.round(uiPercentage.value / snapPercentage);
            newPercentage = Math.max(0, currentSnapIndex - 1) * snapPercentage;
        } else {
            const increment = secondaryIncrementPercentage;
            const currentBlock = Math.ceil(uiPercentage.value / increment);
            newPercentage = Math.max(0, currentBlock - 1) * increment;
        }
        updateLayoutFromPercentage(newPercentage);
    }

    function collapseRight() {
        const secondaryIncrementPercentage = 100 / 10;
        let newPercentage;
        if (incrementPercentage.value > 0) {
            const snapPercentage = incrementPercentage.value;
            const nIncrements = 100 / snapPercentage;
            const currentSnapIndex = Math.round(uiPercentage.value / snapPercentage);
            newPercentage = Math.min(nIncrements, currentSnapIndex + 1) * snapPercentage;
        } else {
            const increment = secondaryIncrementPercentage;
            const nBlocks = 100 / increment;
            const currentBlock = Math.floor(uiPercentage.value / increment);
            newPercentage = Math.min(nBlocks, currentBlock + 1) * increment;
        }
        updateLayoutFromPercentage(newPercentage);
    }
    
    function toggleStepping() {
        steppingEnabled.value = !steppingEnabled.value;
        if (AppState) {
            AppState.resizeHandle.steppingEnabled = steppingEnabled.value;
            saveState(AppState);
        }
    }

    return {
        percentage: uiPercentage,
        sceneWidth: sceneWidthInPixels,
        isDragging,
        steppingEnabled,
        isLeftCollapsed: computed(() => uiPercentage.value <= 0),
        isRightCollapsed: computed(() => uiPercentage.value >= 100),
        initializeResizeHandleState,
        applyInitialLayout,
        startDrag,
        collapseLeft,
        collapseRight,
        toggleStepping,
    };
} 