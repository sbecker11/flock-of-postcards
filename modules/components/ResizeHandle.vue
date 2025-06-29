<script setup>
import { ref } from 'vue';
import { resizeManager } from '@/modules/core/resizeHandle.mjs';
import { toggleLockedToBullsEye } from '@/modules/core/focalPoint.mjs';

// Create a ref to attach to the component's root element
const handleRef = ref(null);

// Expose the handleRef so it can be accessed from the component instance
defineExpose({
  handleRef
});

// The onMounted hook is removed. Initialization will be handled by main.ts

// --- Component Methods ---

function toggleFocalLock() {
  toggleLockedToBullsEye();
}

function collapseLeft() {
    resizeManager.collapseLeft();
}

function collapseRight() {
    resizeManager.collapseRight();
}
</script>

<template>
    <div id="resize-handle" ref="handleRef" class="resize-handle">
        <button id="collapse-left" @click="collapseLeft" class="toggle-circle">‹</button>
        <div class="center-controls">
            <button id="focal-lock" class="toggle-circle" @click="toggleFocalLock">
                <!-- Icon is managed by CSS background-image -->
            </button>
            <div id="scene-visible-percentage" class="percentage-display">50%</div>
        </div>
        <button id="collapse-right" @click="collapseRight" class="toggle-circle">›</button>
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
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    flex-shrink: 0; /* Prevent the handle from shrinking */
}

.center-controls {
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
    font-size: 18px;
    padding: 0;
    margin: 0 2px;
    pointer-events: auto; /* Ensure buttons are always clickable */
}

#focal-lock {
    background-size: 16px 16px;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url('/static_content/icons/focal-lock/Lock-Open-black.png');
}

/* This class will be added by focalPoint.mjs */
#focal-lock.locked {
    background-image: url('/static_content/icons/focal-lock/Lock-Closed-black.png');
}

.percentage-display {
    font-family: monospace;
    font-size: 12px;
    color: var(--percentage-text-color, #ccc);
    transform: rotate(90deg);
    white-space: nowrap;
    margin: 20px 0;
}
</style> 