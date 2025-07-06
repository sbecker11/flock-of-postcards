import { ref, computed, nextTick } from 'vue';
import { useViewport } from './useViewport.mjs';
import { useBullsEye } from './useBullsEye.mjs';
import * as aimPoint from '@/modules/core/aimPoint.mjs';
import { AppState, saveState } from '@/modules/core/stateManager.mjs';
import { performanceMonitor } from '@/modules/utils/performanceMonitor.mjs';
import { errorBoundary } from '@/modules/core/errorBoundary.mjs';

const HANDLE_WIDTH = 20;
const DEFAULT_WIDTH_PERCENT = 50;

// --- Singleton State ---
const uiPercentage = ref(DEFAULT_WIDTH_PERCENT);
const sceneWidthInPixels = ref(0);
const isDragging = ref(false);
const steppingEnabled = ref(false);
const stepCount = ref(5); // Default to 5 steps, can be 1-10 (1 = free dragging)
let _viewport = null;
let _bullsEyeInstance = null;
let _resizeTimeoutId = null; // For debounced resize handling

function clampToRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function handleViewportResize(bullsEyeInstance) {
    // 1. Recenter the bullsEye
    if (bullsEyeInstance && bullsEyeInstance.isInitialized.value) {
        bullsEyeInstance.recenterBullsEye();
    }
    
    // 2. Update aimPoint position to bullsEye center
    if (aimPoint.isInitialized()) {
        const bullsEyeCenter = bullsEyeInstance ? bullsEyeInstance.getBullsEye() : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        aimPoint.setAimPoint(bullsEyeCenter, 'viewportResize');
    }
    
    // 3. Update focal point to aimPoint position
    const event = new CustomEvent('focal-point-update', { 
        detail: { 
            source: 'viewportResize',
            position: bullsEyeInstance ? bullsEyeInstance.getBullsEye() : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        } 
    });
    window.dispatchEvent(event);
}

function updateLayout(newUiPercentage, shouldSave = true) {
    // Performance monitoring
    const perfId = performanceMonitor.startTiming('resize_layout');
    
    // AGGRESSIVE DEBUGGING - Stack trace
    window.CONSOLE_LOG_IGNORE('=== UPDATE LAYOUT CALLED ===');
    window.CONSOLE_LOG_IGNORE('Caller stack:', new Error().stack);
    window.CONSOLE_LOG_IGNORE('Input percentage:', newUiPercentage);
    
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
    window.CONSOLE_LOG_IGNORE('=== RESIZE DEBUG START ===');
    window.CONSOLE_LOG_IGNORE('Input percentage:', newUiPercentage);
    window.CONSOLE_LOG_IGNORE('Window width:', windowWidth);
    window.CONSOLE_LOG_IGNORE('Resume container width:', resumeContainerWidth);
    window.CONSOLE_LOG_IGNORE('Max scene width:', maxSceneWidth);
    window.CONSOLE_LOG_IGNORE('Clamped percentage:', clampedPercentage);
    window.CONSOLE_LOG_IGNORE('Calculated scene width:', sceneWidth);
    window.CONSOLE_LOG_IGNORE('Final scene width:', finalSceneWidth);
    window.CONSOLE_LOG_IGNORE('Actual percentage:', actualPercentage);
    window.CONSOLE_LOG_IGNORE('Current uiPercentage.value:', uiPercentage.value);
    window.CONSOLE_LOG_IGNORE('Current sceneWidthInPixels.value:', sceneWidthInPixels.value);
    window.CONSOLE_LOG_IGNORE('=== RESIZE DEBUG END ===');
    
    // Store the values
    sceneWidthInPixels.value = finalSceneWidth;
    uiPercentage.value = actualPercentage; // Force update the percentage
    
    if (_viewport) {
        _viewport.setViewPortWidth(finalSceneWidth);
    } else {
        window.CONSOLE_LOG_IGNORE('RESIZE: ERROR - _viewport is null!');
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
    handleViewportResize(_bullsEyeInstance);
    
    // End performance monitoring
    if (perfId) {
        performanceMonitor.endTiming(perfId, { 
            percentage: actualPercentage, 
            sceneWidth: finalSceneWidth 
        });
    }
    
    return actualPercentage;
}

// --- Debounced Resize Handler ---
function debouncedResizeHandler() {
    if (_resizeTimeoutId) {
        clearTimeout(_resizeTimeoutId);
    }
    
    _resizeTimeoutId = setTimeout(() => {
        handleViewportResize(_bullsEyeInstance);
        _resizeTimeoutId = null;
    }, 100); // 100ms debounce
}

export function useResizeHandle() {

    function initializeResizeHandleState(viewport = null, bullsEyeInstance = null) {
        _viewport = viewport;
        _bullsEyeInstance = bullsEyeInstance;
        const initialPercentage = AppState?.layout?.panelSizePercentage || DEFAULT_WIDTH_PERCENT;
        steppingEnabled.value = AppState?.resizeHandle?.steppingEnabled || false;
        stepCount.value = AppState?.resizeHandle?.stepCount || 5;
        uiPercentage.value = initialPercentage;
        
        // Add debounced window resize listener
        window.addEventListener('resize', debouncedResizeHandler);
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
        window.CONSOLE_LOG_IGNORE('=== DRAG DEBUG START ===');
        window.CONSOLE_LOG_IGNORE('Mouse dx:', dx);
        window.CONSOLE_LOG_IGNORE('Start pixel width:', startPixelWidth);
        window.CONSOLE_LOG_IGNORE('New pixel width:', newPixelWidth);
        window.CONSOLE_LOG_IGNORE('Window width:', windowWidth);
        window.CONSOLE_LOG_IGNORE('Max scene width:', maxSceneWidth);
        window.CONSOLE_LOG_IGNORE('Clamped pixel width:', clampedPixelWidth);
        window.CONSOLE_LOG_IGNORE('Calculated percentage:', percentage);
        window.CONSOLE_LOG_IGNORE('Current uiPercentage.value:', uiPercentage.value);
        window.CONSOLE_LOG_IGNORE('=== DRAG DEBUG END ===');
        
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