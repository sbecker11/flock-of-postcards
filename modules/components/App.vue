<script setup>
import { ref, onMounted, nextTick } from 'vue';
import ResizeHandle from './ResizeHandle.vue';
import ResumeContainer from './ResumeContainer.vue';
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

const isMounted = ref(false);

onMounted(() => {
  nextTick(async () => {
    try {
      console.log("App.vue: Component is mounted. Version check: 3. Initializing legacy modules...");

      // Initialize core modules that have no DOM dependencies or whose DOM is always present
      viewPort.initialize();
      focalPoint.initialize();
      parallax.initialize();
      aimPoint.initialize();
      bullsEye.initialize();
      keyDown.initialize();
      sceneContainer.initialize();
      resizeHandle.initialize();
      
      // Await palettes, as they are needed for card creation
      await colorPalettes.initializePaletteSelectorInstance();

      // Initialize timeline, which is also needed for card creation
      const { minYear, maxYear } = dateUtils.getMinMaxYears(jobsData.jobs);
      timeline.initialize(minYear, maxYear, maxYear);

      // Initialize controllers
      cardsController.initialize(jobsData.jobs);
      
      // ResumeItemsController creates the resume divs from the card divs
      const bizResumeDivs = resumeItemsController.createAllBizResumeDivs(cardsController.bizCardDivs);
      
      // Manually append the created resume divs into the Vue component's managed DOM
      const resumeContentDiv = document.getElementById('resume-content-div');
      if (resumeContentDiv) {
        bizResumeDivs.forEach(div => resumeContentDiv.appendChild(div));
      } else {
        console.error("App.vue: #resume-content-div not found! Cannot add resume items.");
      }

      // Now that the resume items are in the DOM, initialize the list controller
      resumeListController.initialize(jobsData.jobs, bizResumeDivs);
      window.resumeListController = resumeListController; // Expose for legacy access

      // Initialize the scene plane after cards and resume are ready
      scenePlane.initialize();

      // Perform the initial render of the parallax effect on the newly created cards
      const currentFocalPoint = focalPoint.getFocalPoint();
      const sceneRect = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }; // A default rect is fine for init
      parallax.viewAllBizCardDivs(currentFocalPoint, "App.vue-initial-render", sceneRect);

      console.log("App.vue: All legacy modules initialized successfully.");

    } catch (error) {
      console.error("App.vue: Error during initialization:", error);
    }
  });
  isMounted.value = true;
});
</script>

<template>
  <div id="app-container">
    <div id="scene-container">
      <div id="scene-plane">
        <div id="timeline-container" class="timeline-timelineContainer-left"></div>
      </div>
      <div id="biz-details-div"></div>
      <div id="aim-point"></div>
      <div id="bulls-eye">+</div>
      <div id="focal-point">⦻</div>
    </div>
    <ResumeContainer v-if="isMounted" />
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