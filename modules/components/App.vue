<script setup>
window.CONSOLE_LOG_IGNORE('App.vue script setup is running');

import { ref, onMounted, nextTick, computed } from 'vue';
import ResumeContainer from './ResumeContainer.vue';
import ResizeHandle from './ResizeHandle.vue';
import SceneViewLabel from './SceneViewLabel.vue';
import Timeline from './Timeline.vue';
import { initializeState } from '@/modules/core/stateManager.mjs';
import * as moduleManager from '@/modules/core/moduleManager.mjs';
import { useColorPalette } from '@/modules/composables/useColorPalette.mjs';
import { initialize as initializeTimeline } from '../composables/useTimeline.mjs';
import { useFocalPoint } from '@/modules/composables/usefocalpoint.mjs';
import { useResizeHandle } from '@/modules/composables/useResizeHandle.mjs';
import { jobs as jobsData } from '@/static_content/jobs/jobs.mjs';
import * as colorUtils from '../utils/colorUtils.mjs';
import { selectionManager } from '@/modules/core/selectionManager.mjs';

// Initialize reactive systems
useColorPalette();
const { position: focalPointPosition, isLocked, isDragging } = useFocalPoint();
const { sceneWidth, initializeResizeHandleState } = useResizeHandle();

const isLoading = ref(true);
const error = ref(null);

const focalPointStyle = computed(() => {
  const style = {
    left: `${focalPointPosition.value.x}px`,
    top: `${focalPointPosition.value.y}px`,
  };
  console.log('focalPointStyle computed:', style, 'focalPointPosition:', focalPointPosition.value);
  return style;
});

const sceneContainerStyle = computed(() => ({
  width: `${sceneWidth.value}px`,
}));

const handleSceneContainerClick = (event) => {
  // Only clear selection if clicking directly on the scene container or its immediate children
  // Don't clear if clicking on interactive elements like cards
  if (event.target.id === 'scene-container' || 
      event.target.id === 'scene-plane' ||
      event.target.id === 'scene-plane-top-gradient' ||
      event.target.id === 'scene-plane-btm-gradient' ||
      event.target.id === 'biz-details-div') {
    selectionManager.clearSelection('App.vue.sceneContainerClick');
  }
};

onMounted(async () => {
  try {
    window.CONSOLE_LOG_IGNORE('App.vue: onMounted started');
    await initializeState();
    window.CONSOLE_LOG_IGNORE('App.vue: initializeState completed');
    initializeResizeHandleState();
    window.CONSOLE_LOG_IGNORE('App.vue: initializeResizeHandleState completed');
    initializeTimeline(jobsData);
    window.CONSOLE_LOG_IGNORE('App.vue: initializeTimeline completed');
    isLoading.value = false;
    await nextTick();
    window.CONSOLE_LOG_IGNORE('App.vue: About to call moduleManager.initialize()');
    await moduleManager.initialize();
    window.CONSOLE_LOG_IGNORE('App.vue: moduleManager.initialize() completed');
    window.CONSOLE_LOG_IGNORE("Application initialized successfully.");
  } catch (e) {
    console.error("App.vue: Error during initialization:", e);
    error.value = e.message || 'An unknown error occurred during initialization.';
    isLoading.value = false;
  }
});
</script>

<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner"></div>
    <p>Loading Your Experience...</p>
  </div>
  <div v-else-if="error" class="error-overlay">
    <h2>Initialization Failed</h2>
    <p>{{ error }}</p>
  </div>
  <div v-else id="app-container">
    <div id="scene-container" :style="sceneContainerStyle" @click="handleSceneContainerClick">
      <div id="scene-plane-top-gradient"></div>
      <div id="scene-plane-btm-gradient"></div>
      <div id="scene-plane">
        <Timeline alignment="left" />
      </div>
      <div id="biz-details-div"></div>
    </div>
    <div id="resume-container">
      <ResizeHandle />
      <div class="resume-wrapper">
        <ResumeContainer />
      </div>
    </div>
    <div id="aim-point"></div>
    <div id="bulls-eye">+</div>
    <div 
      id="focal-point" 
      :style="focalPointStyle" 
      :class="{ locked: isLocked, dragging: isDragging }"
    >⦻</div>
    <SceneViewLabel />
  </div>
</template>

<style>
#app-container {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

#scene-container {
  position: relative; 
  height: 100%;
  flex-shrink: 0; 
  z-index: 1; 
}

#resume-container {
  display: flex;
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
}

.resume-wrapper {
  flex: 1;
  min-width: 0;
  position: relative; /* Required for child's absolute positioning */
}

#scene-plane {
    position: relative;
}
</style> 

<style scoped>
/* All scoped styles have been moved to global or are no longer needed */
</style> 