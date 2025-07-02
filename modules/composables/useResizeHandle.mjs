import { ref, computed, nextTick } from 'vue';
import * as viewPort from '@/modules/core/viewPort.mjs';
import * as bullsEye from '@/modules/core/bullsEye.mjs';
import * as aimPoint from '@/modules/core/aimPoint.mjs';
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

function handleViewportResize() {
    window.CONSOLE_LOG_IGNORE('=== handleViewportResize START ===');
    
    // 1. Recenter the bullsEye
    if (bullsEye.isInitialized()) {
        window.CONSOLE_LOG_IGNORE('Recentering bullsEye...');
        bullsEye.recenterBullsEye();
    } else {
        window.CONSOLE_LOG_IGNORE('BullsEye not initialized, skipping recenter');
    }
    
    // 2. Update aimPoint position to bullsEye center
    if (aimPoint.isInitialized()) {
        window.CONSOLE_LOG_IGNORE('Updating aimPoint to bullsEye center...');
        const bullsEyeCenter = bullsEye.getBullsEye();
        aimPoint.setAimPoint(bullsEyeCenter, 'viewportResize');
    } else {
        window.CONSOLE_LOG_IGNORE('AimPoint not initialized, skipping update');
    }
    
    // 3. Update focal point to aimPoint position
    // The focal point should automatically follow the aimPoint in locked mode
    // We can trigger this by dispatching a custom event that the focal point listens to
    window.CONSOLE_LOG_IGNORE('Dispatching focal-point-update event...');
    const event = new CustomEvent('focal-point-update', { 
        detail: { 
            source: 'viewportResize',
            position: bullsEye.getBullsEye()
        } 
    });
    window.dispatchEvent(event);
    
    window.CONSOLE_LOG_IGNORE('=== handleViewportResize END ===');
}

function updateLayout(newUiPercentage, shouldSave = true) {
    window.CONSOLE_LOG_IGNORE("updateLayout called with:", newUiPercentage, "shouldSave:", shouldSave);
    window.CONSOLE_LOG_IGNORE('=== updateLayout START ===');
    window.CONSOLE_LOG_IGNORE('updateLayout called with percentage:', newUiPercentage, 'shouldSave:', shouldSave);
    const windowWidth = window.innerWidth;
    const maxSceneWidth = windowWidth - HANDLE_WIDTH;
    const clampedUiPercentage = clampToRange(newUiPercentage, 0, 100);

    const newSceneWidth = Math.round((clampedUiPercentage / 100) * maxSceneWidth);
    sceneWidthInPixels.value = newSceneWidth;
    
    window.CONSOLE_LOG_IGNORE('Calling viewPort.setViewPortWidth with:', newSceneWidth);
    viewPort.setViewPortWidth(newSceneWidth);
    
    if (AppState) {
        AppState.layout.panelSizePercentage = clampedUiPercentage;
        if (shouldSave) {
            window.CONSOLE_LOG_IGNORE('Saving state...');
            saveState(AppState);
        }
    }
    
    window.CONSOLE_LOG_IGNORE('About to dispatch layout-changed event with sceneWidth:', newSceneWidth);
    const event = new CustomEvent('layout-changed', { detail: { sceneWidth: newSceneWidth } });
    window.dispatchEvent(event);
    window.CONSOLE_LOG_IGNORE('layout-changed event dispatched');
    
    // Call the viewport resize handler after layout change
    handleViewportResize();
    
    window.CONSOLE_LOG_IGNORE('=== updateLayout END ===');
    
    return clampedUiPercentage;
}

export function useResizeHandle() {

    function initializeResizeHandleState() {
        const initialPercentage = AppState?.layout?.panelSizePercentage || DEFAULT_WIDTH_PERCENT;
        steppingEnabled.value = AppState?.resizeHandle?.steppingEnabled || false;
        uiPercentage.value = initialPercentage;
        
        // Add window resize listener
        window.addEventListener('resize', () => {
            window.CONSOLE_LOG_IGNORE('Window resize detected, calling handleViewportResize...');
            handleViewportResize();
        });
    }

    function applyInitialLayout() {
        window.CONSOLE_LOG_IGNORE("applyInitialLayout called");
        updateLayout(uiPercentage.value, false);
    }
    
    let startX = 0;
    let startPixelWidth = 0;

    const incrementPercentage = computed(() => {
        return steppingEnabled.value ? (100 / 3) : 0;
    });

    function updateLayoutFromPercentage(newPercentage, shouldSave = true) {
        window.CONSOLE_LOG_IGNORE("updateLayoutFromPercentage called with:", newPercentage, "shouldSave:", shouldSave);
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

    async function collapseLeft() {
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
        await nextTick();
        if (viewPort.isInitialized()) {
            viewPort.updateViewPort();
        }
    }

    async function collapseRight() {
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
        await nextTick();
        if (viewPort.isInitialized()) {
            viewPort.updateViewPort();
        }
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