<script setup>
import { ref, onMounted, computed } from 'vue';
import { resizeManager } from '@/modules/core/resizeHandle.mjs';
import { toggleLockedToBullsEye } from '@/modules/core/focalPoint.mjs';

// Create a ref to attach to the component's root element
const handleRef = ref(null);

const scenePercentage = ref(50);
const isLeftCollapsed = computed(() => scenePercentage.value <= 0);
const isRightCollapsed = computed(() => scenePercentage.value >= 100);

// Expose the handleRef so it can be accessed from the component instance
defineExpose({
  handleRef
});

// The onMounted hook is removed. Initialization will be handled by main.ts

// --- Component Methods ---

function toggleFocalLock() {
  toggleLockedToBullsEye();
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
</script>

<template>
    <div id="resize-handle" ref="handleRef" class="resize-handle" @mousedown="startDrag">
        <button id="collapse-left" class="toggle-circle" @click.stop="collapseLeft" :disabled="isLeftCollapsed" title="Collapse Left">‹</button>
        <button id="collapse-right" class="toggle-circle" @click.stop="collapseRight" :disabled="isRightCollapsed" title="Collapse Right">›</button>
        <button id="focal-lock" class="toggle-circle" @click.stop="toggleFocalLock" title="Toggle Focal Point Lock"></button>
        <button id="stepping-indicator" class="toggle-circle" @click.stop="toggleStepping" title="Toggle Stepping (s)">S</button>
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

#focal-lock {
    background-size: 16px 16px;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url('/static_content/icons/focal-lock/Lock-Open-white.png');
}

/* This class will be added by focalPoint.mjs */
#focal-lock.locked {
    background-image: url('/static_content/icons/focal-lock/Lock-Closed-white.png');
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