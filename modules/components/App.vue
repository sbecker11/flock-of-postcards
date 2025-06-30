<script setup>
import { ref, onMounted, nextTick } from 'vue';
import ResumeContainer from './ResumeContainer.vue';
import SceneViewLabel from './SceneViewLabel.vue';
import { initializeState } from '@/modules/core/stateManager.mjs';
import * as moduleManager from '@/modules/core/moduleManager.mjs';
import { onColorPaletteChanged, applyCurrentColorPaletteToDocument } from '@/modules/colors/colorPalettes.mjs';

const isMounted = ref(true);
const isLoading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    // First, load the application state.
    await initializeState();

    // Now that state is loaded, we can stop loading and render the main app structure.
    isLoading.value = false;
    
    // Wait for the next DOM update cycle to ensure all elements are actually rendered.
    await nextTick();

    // With the DOM ready, initialize all other modules.
    await moduleManager.initialize();

    // Subscribe to color palette changes to update the document's theme.
    onColorPaletteChanged(applyCurrentColorPaletteToDocument);

    console.log("Application initialized successfully.");
  } catch (e) {
    console.error("App.vue: Error during initialization:", e);
    error.value = e.message || 'An unknown error occurred during initialization.';
    isLoading.value = false; // Also stop loading on error
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
      <div id="scene-plane-top-gradient"></div>
      <div id="scene-plane-btm-gradient"></div>
      <div id="scene-plane">
        <div id="timeline-container" class="timeline-container-left"></div>
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

/*
#timeline-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
}
*/

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