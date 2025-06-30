<script setup>
import { ref, onMounted, nextTick } from 'vue';
import ResizeHandle from './ResizeHandle.vue';
import ResumeContainer from './ResumeContainer.vue';
import SceneViewLabel from './SceneViewLabel.vue';
import * as parallax from '@/modules/core/parallax.mjs';
import * as focalPoint from '@/modules/core/focalPoint.mjs';
import * as aimPoint from '@/modules/core/aimPoint.mjs';
import * as bullsEye from '@/modules/core/bullsEye.mjs';
import * as viewPort from '@/modules/core/viewport.mjs';
import * as eventBus from '@/modules/core/eventBus.mjs';
import * as keyDown from '@/modules/core/keyDown.mjs';
import * as colorPalettes from '@/modules/colors/colorPalettes.mjs';
import * as sceneContainer from '@/modules/scene/sceneContainer.mjs';
import * as timeline from '@/modules/timeline/timeline.mjs';
import * as bizDetailsDivModule from '@/modules/scene/bizDetailsDivModule.mjs';
import { cardsController } from '@/modules/scene/CardsController.mjs';
import { resumeListController } from '@/modules/resume/ResumeListController.mjs';
import { resumeItemsController } from '@/modules/scene/ResumeItemsController.mjs';
import * as moduleManager from '@/modules/core/moduleManager.mjs';
import * as jobsData from '@/static_content/jobs/jobs.mjs';
import * as dateUtils from '@/modules/utils/dateUtils.mjs';
import * as resizeHandle from '@/modules/core/resizeHandle.mjs';
import * as scenePlane from '@/modules/scene/scenePlane.mjs';
import * as autoScroll from '@/modules/animation/autoScroll.mjs';
import * as sceneViewLabel from '@/modules/core/sceneViewLabel.mjs';
import { initializeState } from './modules/core/stateManager.mjs';

const isMounted = ref(true);
const isLoading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    // First, load the application state from the server.
    await initializeState();
    
    // Once state is loaded, initialize all other modules.
    // The moduleManager will ensure they are initialized in the correct order.
    await moduleManager.initialize();

    console.log("Application initialized successfully.");
  } catch (e) {
    console.error("App.vue: Error during initialization:", e);
    error.value = e.message || 'An unknown error occurred during initialization.';
  } finally {
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
    <div id="scene-container">
      <div id="scene-plane">
        <div id="scene-plane-top-gradient"></div>
        <div id="scene-plane-btm-gradient"></div>
        <div id="timeline-container" class="timeline-timelineContainer-left"></div>
      </div>
      <div id="biz-details-div"></div>
    </div>
    <div id="aim-point"></div>
    <div id="bulls-eye">+</div>
    <div id="focal-point">⦻</div>
    <SceneViewLabel />
    <ResumeContainer />
  </div>
</template>

<style>
#resume-container {
  z-index: 2; /* Higher stacking context to ensure controls are clickable */
}

/* Global styles or component-specific styles */
#app-container {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

#scene-container {
  position: relative; /* For scene plane, timeline, and resize handle positioning */
  height: 100%;
  flex-grow: 1; /* Allow scene to take up remaining space */
  z-index: 1; /* Lower stacking context */
}

#timeline-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3; /* Must be lower than the minimum card z-index (10) */
  pointer-events: none;
}

#scene-plane {
    position: relative;
}

</style> 

<style scoped>
#resume-container {
    flex: 1;
    display: flex;
    flex-direction: row; /* Horizontal columns */
    gap: 5px;
    overflow: hidden;
    width: 100%;
    background-color: var(--grey-darkest); /* Dark Grey */
    position: relative; /* Needed for positioning the absolute label */
}

#resume-content {
    flex: 1; /* This makes it resizable */
}
</style> 