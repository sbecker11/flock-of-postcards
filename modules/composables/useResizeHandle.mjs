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
const stepCount = ref(5); // Default to 5 steps, can be 1-10 (1 = free dragging)
let _viewport = null;

function clampToRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function handleViewportResize() {
    // 1. Recenter the bullsEye
    if (bullsEye.isInitialized()) {
        bullsEye.recenterBullsEye();
    }
    
    // 2. Update aimPoint position to bullsEye center
    if (aimPoint.isInitialized()) {
        const bullsEyeCenter = bullsEye.getBullsEye();
        aimPoint.setAimPoint(bullsEyeCenter, 'viewportResize');
    }
    
    // 3. Update focal point to aimPoint position
    const event = new CustomEvent('focal-point-update', { 
        detail: { 
            source: 'viewportResize',
            position: bullsEye.getBullsEye()
        } 
    });
    window.dispatchEvent(event);
}

function updateLayout(newUiPercentage, shouldSave = true) {
    // AGGRESSIVE DEBUGGING - Stack trace
    console.log('=== UPDATE LAYOUT CALLED ===');
    console.log('Caller stack:', new Error().stack);
    console.log('Input percentage:', newUiPercentage);
    
    const windowWidth = window.innerWidth;
    
    // Core constraints:
    // - resumeContainerWidth: 20px minimum, windowWidth maximum
    // - sceneContainerWidth: 0px minimum, (windowWidth - 20px) maximum
    
    const resumeContainerWidth = 20; // Fixed at 20px
    const maxSceneWidth = windowWidth - resumeContainerWidth;
    
    // Clamp input percentage to valid range
    const clampedPercentage = Math.max(0, Math.min(100, newUiPercentage));
    
    // Calculate scene width based on percentage
    const sceneWidth = Math.round((clampedPercentage / 100) * maxSceneWidth);
    
    // Ensure scene width is within bounds (0 to maxSceneWidth)
    const finalSceneWidth = Math.max(0, Math.min(maxSceneWidth, sceneWidth));
    
    // Calculate actual percentage based on final scene width
    const actualPercentage = maxSceneWidth > 0 ? (finalSceneWidth / maxSceneWidth) * 100 : 0;
    
    // AGGRESSIVE DEBUGGING
    console.log('=== RESIZE DEBUG START ===');
    console.log('Input percentage:', newUiPercentage);
    console.log('Window width:', windowWidth);
    console.log('Resume container width:', resumeContainerWidth);
    console.log('Max scene width:', maxSceneWidth);
    console.log('Clamped percentage:', clampedPercentage);
    console.log('Calculated scene width:', sceneWidth);
    console.log('Final scene width:', finalSceneWidth);
    console.log('Actual percentage:', actualPercentage);
    console.log('Current uiPercentage.value:', uiPercentage.value);
    console.log('Current sceneWidthInPixels.value:', sceneWidthInPixels.value);
    console.log('=== RESIZE DEBUG END ===');
    
    // Store the values
    sceneWidthInPixels.value = finalSceneWidth;
    uiPercentage.value = actualPercentage; // Force update the percentage
    
    if (_viewport) {
        _viewport.setViewPortWidth(finalSceneWidth);
    } else {
        console.log('RESIZE: ERROR - _viewport is null!');
    }
    
    if (AppState) {
        AppState.layout.panelSizePercentage = actualPercentage;
        if (shouldSave) {
            saveState(AppState);
        }
    }
    
    const event = new CustomEvent('layout-changed', { detail: { sceneWidth: finalSceneWidth } });
    window.dispatchEvent(event);
    
    // Call the viewport resize handler after layout change
    handleViewportResize();
    
    return actualPercentage;
}

export function useResizeHandle() {

    function initializeResizeHandleState(viewport = null) {
        _viewport = viewport;
        const initialPercentage = AppState?.layout?.panelSizePercentage || DEFAULT_WIDTH_PERCENT;
        steppingEnabled.value = AppState?.resizeHandle?.steppingEnabled || false;
        stepCount.value = AppState?.resizeHandle?.stepCount || 5;
        uiPercentage.value = initialPercentage;
        
        // Add window resize listener
        window.addEventListener('resize', () => {
            handleViewportResize();
        });
    }

    function applyInitialLayout() {
        updateLayout(uiPercentage.value, false);
    }
    
    let startX = 0;
    let startPixelWidth = 0;

    const incrementPercentage = computed(() => {
        // Step count 1 means free dragging (no stepping)
        if (!steppingEnabled.value || stepCount.value === 1) {
            return 0;
        }
        return 100 / stepCount.value;
    });

    function updateLayoutFromPercentage(newPercentage, shouldSave = true) {
        // Ensure the input percentage is valid before calling updateLayout
        const validPercentage = Math.max(0, Math.min(100, newPercentage));
        uiPercentage.value = updateLayout(validPercentage, shouldSave);
    }

    function handleDrag(e) {
        if (!isDragging.value) {
            return;
        }
        
        const windowWidth = window.innerWidth;
        const resumeContainerWidth = 20; // Fixed at 20px
        const maxSceneWidth = windowWidth - resumeContainerWidth;
        
        const dx = e.clientX - startX;
        const newPixelWidth = startPixelWidth + dx;
        
        // Clamp pixel width to valid range (0 to maxSceneWidth)
        const clampedPixelWidth = Math.max(0, Math.min(maxSceneWidth, newPixelWidth));
        
        // Calculate percentage based on clamped pixel width
        const percentage = maxSceneWidth > 0 ? (clampedPixelWidth / maxSceneWidth) * 100 : 0;
        
        // AGGRESSIVE DRAG DEBUGGING
        console.log('=== DRAG DEBUG START ===');
        console.log('Mouse dx:', dx);
        console.log('Start pixel width:', startPixelWidth);
        console.log('New pixel width:', newPixelWidth);
        console.log('Window width:', windowWidth);
        console.log('Max scene width:', maxSceneWidth);
        console.log('Clamped pixel width:', clampedPixelWidth);
        console.log('Calculated percentage:', percentage);
        console.log('Current uiPercentage.value:', uiPercentage.value);
        console.log('=== DRAG DEBUG END ===');
        
        updateLayoutFromPercentage(percentage, false);
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
        if (e.target.closest('button')) {
            return;
        }
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
            newPercentage = Math.min(100, currentSnapIndex + 1) * snapPercentage;
        } else {
            const increment = secondaryIncrementPercentage;
            const nBlocks = 100 / increment;
            const currentBlock = Math.floor(uiPercentage.value / increment);
            newPercentage = Math.min(100, currentBlock + 1) * increment;
        }
        updateLayoutFromPercentage(newPercentage);
        await nextTick();
        if (_viewport && _viewport.isInitialized()) {
            _viewport.updateViewportProperties();
        }
    }
    
    function toggleStepping() {
        // Cycle through step count: 1 -> 2 -> 3 -> ... -> 10 -> 1
        stepCount.value = stepCount.value >= 10 ? 1 : stepCount.value + 1;
        
        // Enable stepping if it was disabled
        if (!steppingEnabled.value) {
            steppingEnabled.value = true;
        }
        
        // Disable stepping when step count is 1 (free dragging)
        if (stepCount.value === 1) {
            steppingEnabled.value = false;
        }
        
        if (AppState) {
            AppState.resizeHandle.steppingEnabled = steppingEnabled.value;
            AppState.resizeHandle.stepCount = stepCount.value;
            saveState(AppState);
        }
    }

    return {
        percentage: uiPercentage,
        sceneWidth: sceneWidthInPixels,
        isDragging,
        steppingEnabled,
        stepCount,
        isLeftCollapsed: computed(() => uiPercentage.value <= 0.1),
        isRightCollapsed: computed(() => uiPercentage.value >= 99.9),
        initializeResizeHandleState,
        applyInitialLayout,
        startDrag,
        collapseLeft,
        collapseRight,
        toggleStepping,
    };
} 