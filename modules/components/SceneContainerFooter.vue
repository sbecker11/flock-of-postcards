<template>
  <div id="scene-content-footer">
    <div>
      <span class="viewer-label">Scene Viewer ({{ scenePercentage }}%)</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useResizeHandle } from '@/modules/composables/useResizeHandle.mjs';

export default {
  name: 'SceneContainerFooter',
  setup() {
    const { percentage: scenePercentage } = useResizeHandle();

    return {
      scenePercentage: computed(() => Math.round(scenePercentage.value))
    };
  }
};
</script>

<style scoped>
#scene-content-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5) !important;
  padding: 10px;
  flex-shrink: 0; /* Fits children */
  z-index: 10; /* Ensure it's above scene content */
  pointer-events: none; /* Allow clicking through to scene content */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
  text-align: right;
  overflow: hidden; /* Clip text that goes beyond the container */
  width: 100%; /* Ensure it doesn't expand beyond container */
  box-sizing: border-box; /* Include padding in width calculation */
  height: 40px; /* Match resume footer height */
  min-width: 0; /* Allow shrinking to zero */
  max-width: 100%; /* Ensure it doesn't exceed parent width */
}

/* Override scene container background for the footer */
#scene-container #scene-content-footer {
  background-color: rgba(0, 0, 0, 0.5) !important;
}

/* Make all divs and spans in the footer transparent */
#scene-content-footer div,
#scene-content-footer span {
  background-color: transparent !important;
  text-align: right;
  white-space: nowrap; /* Prevent text wrapping */
  display: block; /* Ensure it takes full width */
  width: 100%; /* Take full width of parent */
  overflow: hidden; /* Clip overflow */
  position: relative; /* Keep within footer container */
  min-width: 0; /* Allow shrinking to zero */
  max-width: 100%; /* Don't exceed container width */
  text-overflow: clip; /* Clip text that overflows */
  box-sizing: border-box; /* Include padding in width calculation */
}

.viewer-label {
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 100;
  color: white;
  user-select: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  background-color: transparent !important;
  pointer-events: auto; /* Allow interaction with the text */
  text-align: right;
  overflow: hidden; /* Ensure text gets clipped */
  text-overflow: clip; /* Clip text that overflows */
  display: block; /* Take full width for proper clipping */
  width: 100%; /* Take full width */
  max-width: 100%; /* Don't exceed container width */
  box-sizing: border-box; /* Include padding in width calculation */
  position: relative; /* Keep within normal flow */
  direction: rtl; /* Make text flow right-to-left so it clips from left */
}
</style> 