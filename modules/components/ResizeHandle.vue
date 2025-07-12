<script setup>
import { ref, computed } from 'vue';
import { useFocalPoint } from '@/modules/composables/useFocalPoint.mjs';
import { useResizeHandle } from '@/modules/composables/useResizeHandle.mjs';
import BadgeToggle from '@/modules/components/BadgeToggle.vue';

// --- Composables ---
const { 
  percentage: scenePercentage, 
  isLeftCollapsed, 
  isRightCollapsed, 
  steppingEnabled,
  stepCount,
  startDrag, 
  collapseLeft, 
  collapseRight, 
  toggleStepping 
} = useResizeHandle();

// Computed properties for button states
const isLeftDisabled = computed(() => {
  return isLeftCollapsed.value || stepCount.value === 1;
});

const isRightDisabled = computed(() => {
  return isRightCollapsed.value || stepCount.value === 1;
});

const { 
  mode: focalPointMode,
  cycleMode: cycleFocalPointMode
} = useFocalPoint();

const isHovering = ref(false);
const isSteppingHovering = ref(false);
const hasJustClicked = ref(false); // Track if we just clicked (to maintain hover state)

const nextMode = computed(() => {
  switch (focalPointMode.value) {
    case 'locked': return 'following';
    case 'following': return 'dragging';
    case 'dragging': return 'locked';
    default: return 'locked';
  }
});

// The mode whose icon we're currently displaying (for CSS class styling)
const displayedIconMode = computed(() => {
    return isHovering.value ? nextMode.value : focalPointMode.value;
});

// The actual icon to show
const displayIcon = computed(() => {
    const modeToShow = isHovering.value ? nextMode.value : focalPointMode.value;
    console.log('displayIcon computed:', {
        isHovering: isHovering.value,
        currentMode: focalPointMode.value,
        nextMode: nextMode.value,
        modeToShow,
        hasJustClicked: hasJustClicked.value
    });
    switch (modeToShow) {
        case 'locked': return '⦻';
        case 'following': return '›';
        case 'dragging': return '⤮';
        default: return '⦻';
    }
});

// CSS classes for the button
const buttonClasses = computed(() => {
    return [
        displayedIconMode.value, // for mode-specific styling (font size, etc.)
        { hovering: isHovering.value } // for hover styling (colors)
    ];
});

const nextStepCount = computed(() => {
  return stepCount.value >= 10 ? 1 : stepCount.value + 1;
});

const displayStepCount = computed(() => {
  const currentStep = isSteppingHovering.value ? nextStepCount.value : stepCount.value;
  return currentStep === 1 ? '∞' : currentStep;
});

// --- Component Methods ---
function toggleFocalLock(event) {
  event.stopPropagation();
  cycleFocalPointMode();
  // Mark that we just clicked (don't reset hover state yet)
  hasJustClicked.value = true;
  
  // Force a small delay to ensure the mode change has been processed
  // This allows the nextMode computed to recalculate with the new current mode
  setTimeout(() => {
    // This setTimeout ensures the DOM and computeds have updated
    // The isHovering state remains true, so we'll show the next mode of the NEW current mode
  }, 0);
}

function handleSteppingClick(event) {
  event.stopPropagation();
  toggleStepping();
  // Reset hover state when step changes to prevent immediate hover preview
  isSteppingHovering.value = false;
}
</script>

<template>
    <div id="resize-handle" class="resize-handle" @mousedown="startDrag">
        <div class="button-container">
            <button id="collapse-left" class="toggle-circle" @click.stop="collapseLeft" :disabled="isLeftDisabled" title="Collapse Left">‹</button>
            <button id="tri-state-toggle" 
                    class="toggle-circle" 
                    :class="buttonClasses"
                    @click.stop="toggleFocalLock" 
                    @mouseenter="isHovering = true; hasJustClicked = false"
                    @mouseleave="isHovering = false; hasJustClicked = false"
                    :title="isHovering ? 'Next: ' + nextMode + ' (click to switch)' : 'Current: ' + focalPointMode + ' (hover to preview next)'">
                <span>{{ displayIcon }}</span>
            </button>
            <BadgeToggle />
            <button id="stepping-indicator" 
                    class="toggle-circle" 
                    :class="{ 'inverted': steppingEnabled, 'hovering': isSteppingHovering, 'infinity-mode': stepCount === 1 }"
                    @click.stop="handleSteppingClick" 
                    @mouseenter="isSteppingHovering = true"
                    @mouseleave="isSteppingHovering = false"
                    :title="stepCount === 1 ? 'Free dragging (no steps)' : `Stepping: ${stepCount} steps`">{{ displayStepCount }}</button>
            <button id="collapse-right" class="toggle-circle" @click.stop="collapseRight" :disabled="isRightDisabled" title="Collapse Right">›</button>
        </div>
    </div>
</template>

<style scoped>
.resize-handle {
    position: relative;
    width: 20px;
    height: 100%;
    cursor: col-resize;
    background-color: var(--resize-handle-bg-color, #333);
    z-index: 20;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding-bottom: 20px;
    box-sizing: border-box;
    flex-shrink: 0;
}



.button-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.toggle-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid white;
    background-color: var(--button-bg-color, #555);
    color: var(--button-text-color, white);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    font-weight: bold;
    padding: 0;
    flex-shrink: 0;
    transition: all 0.2s ease;
}

#tri-state-toggle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid white;
    background-color: rgba(0,0,0,0.5);
    background-image: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 16px;
    line-height: 1;
    text-align: center;
    position: relative;
}

/* Default state: current mode with white icon on black background */
#tri-state-toggle span {
    color: white;
    transition: color 0.2s ease;
}

/* Hover state: next mode with black icon on white background */
#tri-state-toggle.hovering {
    background-color: white;
    color: black;
    border-color: black;
}

#tri-state-toggle.hovering span {
    color: black;
}

/* Mode-specific font sizing adjustments */
#tri-state-toggle.following span,
#tri-state-toggle.dragging span {
    font-size: 20px;
}

#tri-state-toggle.following span {
    position: relative;
    top: -1px;
}

#stepping-indicator {
    font-size: 12px;
}

#stepping-indicator.infinity-mode {
    font-size: 16px;
}

#stepping-indicator.hovering {
    background-color: white;
    color: black;
    border-color: black;
}

/* Hover effects for collapse buttons only */
#collapse-left:hover:not(:disabled),
#collapse-right:hover:not(:disabled) {
    background-color: var(--button-text-color, white);
    color: var(--button-bg-color, #555);
    border-color: var(--button-text-color, white);
}

/* Disabled state for collapse buttons */
#collapse-left:disabled,
#collapse-right:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #444;
    color: #999;
    border-color: #666;
    transform: scale(0.95);
    pointer-events: none;
}
</style> 