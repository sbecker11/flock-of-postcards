<script setup>
import { ref, computed } from 'vue';
import { useFocalPoint } from '@/modules/composables/usefocalpoint.mjs';
import { useResizeHandle } from '@/modules/composables/useResizeHandle.mjs';

// --- Composables ---
const { 
  percentage: scenePercentage, 
  isLeftCollapsed, 
  isRightCollapsed, 
  steppingEnabled,
  startDrag, 
  collapseLeft, 
  collapseRight, 
  toggleStepping 
} = useResizeHandle();

const { 
  mode: focalPointMode,
  cycleMode: cycleFocalPointMode
} = useFocalPoint();

const isHovering = ref(false);

const nextMode = computed(() => {
  switch (focalPointMode.value) {
    case 'locked': return 'following';
    case 'following': return 'dragging';
    case 'dragging': return 'locked';
    default: return 'locked';
  }
});

const displayMode = computed(() => {
    return isHovering.value ? nextMode.value : focalPointMode.value;
});

// --- Component Methods ---
function toggleFocalLock(event) {
  event.stopPropagation();
  cycleFocalPointMode();
  // Reset hover state when mode changes to prevent immediate hover preview
  isHovering.value = false;
}
</script>

<template>
    <div id="resize-handle" class="resize-handle" @mousedown="startDrag">
        <div class="button-container">
            <button id="collapse-left" class="toggle-circle" @click.stop="collapseLeft" :disabled="isLeftCollapsed" title="Collapse Left">‹</button>
            <button id="tri-state-toggle" 
                    class="toggle-circle" 
                    :class="[displayMode, { hovering: isHovering }]"
                    @click.stop="toggleFocalLock" 
                    @mouseenter="isHovering = true"
                    @mouseleave="isHovering = false"
                    :title="'Focal Point: ' + focalPointMode">
                <span v-if="displayMode === 'locked'">⦻</span>
                <span v-if="displayMode === 'following'">›</span>
                <span v-if="displayMode === 'dragging'">⤮</span>
            </button>
            <button id="stepping-indicator" class="toggle-circle" :class="{ 'inverted': steppingEnabled }" @click.stop="toggleStepping" title="Toggle Stepping (s)">S</button>
            <button id="collapse-right" class="toggle-circle" @click.stop="collapseRight" :disabled="isRightCollapsed" title="Collapse Right">›</button>
        </div>
        <span id="scene-visible-percentage" class="percentage-display">{{ Math.round(scenePercentage) }}%</span>
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
    border: 1px solid var(--button-border-color, #888);
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
}

#tri-state-toggle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid white;
    background-color: rgba(0,0,0,0.5);
    background-image: none;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 16px;
    line-height: 1;
    text-align: center;
    position: relative;
}

#tri-state-toggle span {
    color: white;
}

#tri-state-toggle.hovering {
    background-color: white;
    color: black;
    border-color: black;
}

#tri-state-toggle.hovering span {
    color: black;
}

#tri-state-toggle.following {
    font-size: 24px;
}

#tri-state-toggle.dragging {
    font-size: 24px;
}

#tri-state-toggle.following span {
    position: relative;
    top: -1px;
}

#stepping-indicator {
    font-size: 12px;
}

/* Hover effects for collapse and stepping buttons */
#collapse-left:hover,
#collapse-right:hover,
#stepping-indicator:hover {
    background-color: var(--button-text-color, white);
    color: var(--button-bg-color, #555);
    border-color: var(--button-text-color, white);
}

.percentage-display {
    margin-top: 12px;
    font-family: monospace;
    font-size: 12px;
    color: var(--percentage-text-color, #ccc);
    white-space: nowrap;
}
</style> 