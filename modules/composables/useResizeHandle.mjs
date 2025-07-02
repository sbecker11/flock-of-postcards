import { ref, computed, nextTick } from 'vue';
import { useViewport } from './useViewport.mjs';
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
let _viewport = null;

function clampToRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function handleViewportResize() {
    console.log('=== handleViewportResize START ===');
    
    // 1. Recenter the bullsEye
    if (bullsEye.isInitialized()) {
        console.log('Recentering bullsEye...');
        bullsEye.recenterBullsEye();
    } else {
        console.log('BullsEye not initialized, skipping recenter');
    }
    
    // 2. Update aimPoint position to bullsEye center
    if (aimPoint.isInitialized()) {
        console.log('Updating aimPoint to bullsEye center...');
        const bullsEyeCenter = bullsEye.getBullsEye();
        aimPoint.setAimPoint(bullsEyeCenter, 'viewportResize');
    } else {
        console.log('AimPoint not initialized, skipping update');
    }
    
    // 3. Update focal point to aimPoint position
    // The focal point should automatically follow the aimPoint in locked mode
    // We can trigger this by dispatching a custom event that the focal point listens to
    console.log('Dispatching focal-point-update event...');
    const event = new CustomEvent('focal-point-update', { 
        detail: { 
            source: 'viewportResize',
            position: bullsEye.getBullsEye()
        } 
    });
    window.dispatchEvent(event);
    
    console.log('=== handleViewportResize END ===');
}

function updateLayout(newUiPercentage, shouldSave = true) {
    console.log('RESIZE: updateLayout:', newUiPercentage, shouldSave);
    const windowWidth = window.innerWidth;
    const maxSceneWidth = windowWidth - HANDLE_WIDTH;
    const clampedUiPercentage = clampToRange(newUiPercentage, 0, 100);

    const newSceneWidth = Math.round((clampedUiPercentage / 100) * maxSceneWidth);
    sceneWidthInPixels.value = newSceneWidth;
    
    if (_viewport) {
        _viewport.setViewPortWidth(newSceneWidth);
    } else {
        console.log('RESIZE: ERROR - _viewport is null!');
    }
    
    if (AppState) {
        AppState.layout.panelSizePercentage = clampedUiPercentage;
        if (shouldSave) {
            console.log('Saving state...');
            saveState(AppState);
        }
    }
    
    const event = new CustomEvent('layout-changed', { detail: { sceneWidth: newSceneWidth } });
    window.dispatchEvent(event);
    
    // Call the viewport resize handler after layout change
    handleViewportResize();
    

    
    return clampedUiPercentage;
}

export function useResizeHandle() {

    function initializeResizeHandleState(viewport = null) {
        _viewport = viewport;
        const initialPercentage = AppState?.layout?.panelSizePercentage || DEFAULT_WIDTH_PERCENT;
        steppingEnabled.value = AppState?.resizeHandle?.steppingEnabled || false;
        uiPercentage.value = initialPercentage;
        
        // Add window resize listener
        window.addEventListener('resize', () => {
            console.log('Window resize detected, calling handleViewportResize...');
            handleViewportResize();
        });
    }

    function applyInitialLayout() {
        console.log("applyInitialLayout called");
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
            if (!isDragging.value) {
        return;
    }
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
        console.log('startDrag called, target:', e.target, 'closest button:', e.target.closest('button'));
        if (e.target.closest('button')) {
            console.log('startDrag: clicked on button, ignoring drag');
            return;
        }
        console.log('startDrag: starting drag, isDragging set to true');
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
        if (_viewport && _viewport.isInitialized()) {
            _viewport.updateViewportProperties();
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
        if (_viewport && _viewport.isInitialized()) {
            _viewport.updateViewportProperties();
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