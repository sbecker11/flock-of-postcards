<template>
  <div id="resume-content-footer">
    <div>
      <span class="viewer-label">Resume Viewer ({{ resumePercentage }}%)</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useResizeHandle } from '@/modules/composables/useResizeHandle.mjs';

export default {
  name: 'ResumeContainerFooter',
  setup() {
    const { percentage: scenePercentage } = useResizeHandle();

    const resumePercentage = computed(() => {
      return 100 - Math.round(scenePercentage.value);
    });

    return {
      resumePercentage
    };
  }
};
</script>

<style scoped>
#resume-content-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: transparent !important;
  padding: 10px;
  flex-shrink: 0; /* Fits children */
  z-index: 10; /* Ensure it's above resume content */
  pointer-events: none; /* Allow clicking through to resume content */
}

/* Make all divs and spans in the footer transparent */
#resume-content-footer div,
#resume-content-footer span {
  background-color: transparent !important;
}

.viewer-label {
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: black;
  user-select: none;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  background-color: transparent !important;
  pointer-events: auto; /* Allow interaction with the text */
}
</style> 