<script setup>
import { ref, onMounted, computed } from 'vue';
import { resizeManager } from '@/modules/core/resizeHandle.mjs';
import * as focalPoint from '@/modules/core/focalPoint.mjs';

// Create a ref to attach to the component's root element
const handleRef = ref(null);

const scenePercentage = ref(50);
const isLeftCollapsed = computed(() => scenePercentage.value <= 0);
const isRightCollapsed = computed(() => scenePercentage.value >= 100);

const focalPointMode = ref('locked'); // locked, following, dragging
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

// Expose the handleRef so it can be accessed from the component instance
defineExpose({
  handleRef
});

// The onMounted hook is removed. Initialization will be handled by main.ts

// --- Component Methods ---

function setMode(newMode) {
  focalPointMode.value = newMode;
  focalPoint.setMode(newMode);
}

function toggleFocalLock() {
  let nextMode;
  switch (focalPointMode.value) {
    case 'locked':
      nextMode = 'following';
      break;
    case 'following':
      nextMode = 'dragging';
      break;
    case 'dragging':
      nextMode = 'locked';
      break;
  }
  setMode(nextMode);
}

const startDrag = (e) => {
  // Prevent drag from starting on a button
  if (e.target.closest('button')) return;
  resizeManager.startDrag(e);
};

const collapseLeft = () => {
  resizeManager.collapseLeft();
};

const collapseRight = () => {
  resizeManager.collapseRight();
};

const toggleStepping = () => resizeManager.toggleStepping();

// Expose a method for the legacy module to update the Vue component's state
resizeManager.setStateUpdater = (newPercentage) => {
  scenePercentage.value = Math.round(newPercentage);
};

onMounted(() => {
  document.addEventListener('focalModeChange', (event) => {
    const newMode = event.detail.mode;
    if (['locked', 'following', 'dragging'].includes(newMode)) {
      setMode(newMode);
    }
  });
});
</script>

<template>
    <div id="resize-handle" ref="handleRef" class="resize-handle" @mousedown="startDrag">
        <button id="collapse-left" class="toggle-circle" @click.stop="collapseLeft" :disabled="isLeftCollapsed" title="Collapse Left">‹</button>
        <button id="collapse-right" class="toggle-circle" @click.stop="collapseRight" :disabled="isRightCollapsed" title="Collapse Right">›</button>
        <button id="stepping-indicator" class="toggle-circle" @click.stop="toggleStepping" title="Toggle Stepping (s)">S</button>
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
        <span id="scene-visible-percentage" class="percentage-display">{{ scenePercentage }}%</span>
    </div>
</template>

<style scoped>
.resize-handle {
    width: 20px;
    height: 100%;
    cursor: col-resize;
    background-color: var(--resize-handle-bg-color, #333);
    z-index: 20;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: 20px 0;
    box-sizing: border-box;
    flex-shrink: 0;
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
    position: relative;
    left: 3px;
}

.toggle-circle:not(:first-child) {
    margin-top: 10px;
}

.toggle-circle.inverted {
    background-color: var(--button-text-color, white);
    color: var(--button-bg-color, #555);
    border: 1px solid var(--button-bg-color, #555);
}

#tri-state-toggle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid white;
    background-color: rgba(0,0,0,0.5);
    background-size: 60%;
    background-position: center;
    background-repeat: no-repeat;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 16px;
    line-height: 1;
    color: white;
    text-align: center;
    position: relative;
}

#tri-state-toggle:hover {
    background-color: rgba(0,0,0,0.8);
}

#tri-state-toggle.hovering {
    background-color: white;
    color: black;
    border-color: black;
}

#tri-state-toggle.locked {
    background-image: none;
}

#tri-state-toggle.following {
    background-image: none;
    font-size: 24px;
}

#tri-state-toggle.dragging {
    background-image: none;
    font-size: 24px;
}

#stepping-indicator {
    font-size: 12px;
}

.percentage-display {
    margin-top: 12px;
    font-family: monospace;
    font-size: 12px;
    color: var(--percentage-text-color, #ccc);
    white-space: nowrap;
}
</style> 