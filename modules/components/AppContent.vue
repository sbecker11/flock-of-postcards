<template>
  <div id="app-container">
    <div id="scene-container" :style="sceneContainerStyle" @click="handleSceneContainerClick">
      <div id="scene-content">
        <div id="scene-plane-top-gradient"></div>
        <div id="scene-plane-btm-gradient"></div>
        <div id="scene-plane">
          <Timeline alignment="left" />
        </div>
        <div id="biz-details-div"></div>
      </div>
      <SceneContainerFooter />
    </div>
    <div id="resume-container">
      <div id="resume-container-left">
        <ResizeHandle />
      </div>
      <div id="resume-container-right">
        <div class="resume-wrapper">
          <ResumeContainer />
        </div>
        <div id="resume-content-footer">
          <div>
            <span class="viewer-label">({{ resumePercentage }}%) Resume Viewer</span>
          </div>
        </div>
      </div>
    </div>
    <SceneViewLabel />
    <div id="aim-point"></div>
    <div id="bulls-eye">+</div>
    <div 
      id="focal-point" 
      :style="focalPointStyle" 
      :class="{ locked: focalPoint.value?.isLocked, dragging: focalPoint.value?.isDragging }"
    >⦻</div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useColorPalette, readyPromise as palettesReady } from '@/modules/composables/useColorPalette.mjs';
import { useViewport } from '@/modules/composables/useViewport.mjs';
import { useBullsEye } from '@/modules/composables/useBullsEye.mjs';
import { useAimPoint } from '@/modules/composables/useAimPoint.mjs';
import { useFocalPoint } from '@/modules/composables/useFocalPoint.mjs';
import { useResizeHandle } from '@/modules/composables/useResizeHandle.mjs';
import { useTimeline, initialize as initializeTimeline } from '@/modules/composables/useTimeline.mjs';


import { initializeState } from '@/modules/core/stateManager.mjs';
import { jobs as jobsData } from '@/static_content/jobs/jobs.mjs';
import * as keyDown from '@/modules/core/keyDownModule.mjs';
import * as sceneContainer from '@/modules/scene/sceneContainerModule.mjs';
import * as viewPort from '@/modules/core/viewPortModule.mjs';
import { cardsController } from '@/modules/scene/CardsController.mjs';
import { resumeItemsController } from '@/modules/scene/ResumeItemsController.mjs';
import { resumeListController } from '@/modules/resume/ResumeListController.mjs';
import * as scenePlane from '@/modules/scene/scenePlaneModule.mjs';
import * as parallax from '@/modules/core/parallaxModule.mjs';
import * as autoScroll from '@/modules/animation/autoScrollModule.mjs';
import { selectionManager } from '@/modules/core/selectionManager.mjs';
import Timeline from '@/modules/components/Timeline.vue';
import ResizeHandle from '@/modules/components/ResizeHandle.vue';
import ResumeContainer from '@/modules/components/ResumeContainer.vue';
import SceneContainerFooter from '@/modules/components/SceneContainerFooter.vue';

export default {
  name: 'AppContent',
  components: {
    Timeline,
    ResizeHandle,
    ResumeContainer,
    SceneContainerFooter
  },
  async setup() {
    console.log('AppContent: setup started');
    
    // Register lifecycle hooks before any await statements
    onMounted(async () => {
      console.log('AppContent: onMounted - DOM is now available');
      
      try {
        // Initialize viewport systems after DOM is available
        viewport.initialize();
        console.log('AppContent: initializeViewport completed');
        
        // Initialize legacy viewPortModule for backward compatibility
        viewPort.initialize();
        console.log('AppContent: legacy viewPortModule initialized');
        
        // Apply initial layout (after viewPortModule is initialized)
        const { applyInitialLayout } = resizeHandle;
        applyInitialLayout();
        console.log('AppContent: applyInitialLayout completed');
        
        // Initialize reactive systems that depend on viewport
        bullsEye.initialize();
        console.log('AppContent: initializeBullsEye completed');
        aimPoint.initialize();
        console.log('AppContent: initializeAimPoint completed');
        focalPoint.initialize();
        console.log('AppContent: initializeFocalPoint completed');
        
        // Initialize sceneContainer after viewport is available
        sceneContainer.initialize();
        console.log('AppContent: sceneContainer completed');
        
        // Initialize autoScroll after sceneContainer is available
        autoScroll.initialize();
        console.log('AppContent: autoScroll completed');
        
        // Initialize scenePlane after DOM is rendered
        scenePlane.initialize();
        console.log('AppContent: scenePlane completed');
        
        // Initialize CardsController after DOM is rendered (sets up selectionManager event listeners)
        await cardsController.initialize(jobsData);
        console.log('AppContent: cardsController completed');
        
        // Initialize parallax after business cards are created
        parallax.initialize(focalPoint);
        console.log('AppContent: parallax completed');
      
        // Initialize ResumeItemsController after cardsController is ready (sets up selectionManager event listeners)
        resumeItemsController.initialize();
        console.log('AppContent: resumeItemsController completed');
        
        // Create resume divs after cards are initialized
        const bizResumeDivs = await resumeItemsController.createAllBizResumeDivs(cardsController.bizCardDivs);
        
        // Initialize ResumeListController after DOM is rendered
        resumeListController.initialize(jobsData, bizResumeDivs);
        window.resumeListController = resumeListController; // Expose for legacy access
        console.log('AppContent: resumeListController completed');
        
        // Add resume divs to the DOM after ResumeListController is initialized
        const resumeContentDivElement = document.getElementById('resume-content-div');
        if (resumeContentDivElement) {
          bizResumeDivs.forEach(div => resumeContentDivElement.appendChild(div));
        } else {
          console.error("AppContent: #resume-content-div not found!");
        }
        
        console.log("AppContent: DOM-dependent initialization completed successfully.");
      } catch (error) {
        console.error("AppContent: Error in DOM-dependent initialization:", error);
      }
    });
    
    // Wait for everything to be ready before any initialization
    console.log('AppContent: Waiting for color palettes to load...');
    
    // Initialize color palette composable and load palettes
    const colorPalette = useColorPalette();
    await colorPalette.loadPalettes();
    
    console.log('AppContent: Color palettes loaded');
    
    await initializeState();
    console.log('AppContent: initializeState completed');
    
    // Initialize reactive composables
    const viewport = useViewport('AppContent');
    const bullsEye = useBullsEye(viewport);
    const aimPoint = useAimPoint(viewport);
    const focalPoint = useFocalPoint();
    const resizeHandle = useResizeHandle();
    const timeline = useTimeline();
    
    // Initialize core services (event system first)
    keyDown.initialize();
    console.log('AppContent: keyDown completed');
    
    // Ensure selectionManager is ready (it's a singleton, but let's be explicit)
    console.log('AppContent: selectionManager ready');
    
            // Initialize data controllers (non-DOM dependent)
        console.log('AppContent: Data controllers will be initialized after DOM is available');
        
        // Initialize assembly (non-DOM dependent)
        console.log('AppContent: parallax will be initialized after focalPoint is ready');
    
    // Initialize layout systems
    resizeHandle.initializeResizeHandleState(viewport);
    console.log('AppContent: initializeResizeHandleState completed');
    initializeTimeline(jobsData);
    console.log('AppContent: initializeTimeline completed');
    
    // Initialize final services (non-DOM dependent)
    // Note: autoScroll will be initialized in onMounted after DOM is available
    
    console.log("AppContent: Setup completed, template will now render.");
    
    // Return the setup data - this allows Vue to render the template
    // DOM-dependent initialization will happen in onMounted
    
    // Computed properties
    const focalPointStyle = computed(() => {
      if (!focalPoint.value) return { left: '0px', top: '0px' };
      const style = {
        left: `${focalPoint.value.position.value.x}px`,
        top: `${focalPoint.value.position.value.y}px`,
      };
      console.log('focalPointStyle computed:', style, 'focalPointPosition:', focalPoint.value.position.value);
      return style;
    });

    // Create a reactive reference to scene width that updates via events
    const sceneWidth = ref(viewport.value?.width.value || 0);
    
    // Set up event listener for scene width changes immediately
    const handleSceneWidthChanged = (event) => {
      // console.log('RESIZE: scene-width-changed:', event.detail.width);
      sceneWidth.value = event.detail.width;
    };
    
    // Add event listener immediately (will be cleaned up in onUnmounted)
    window.addEventListener('scene-width-changed', handleSceneWidthChanged);
    
    // Clean up event listener on unmount
    onUnmounted(() => {
      window.removeEventListener('scene-width-changed', handleSceneWidthChanged);
    });
    
    const sceneContainerStyle = computed(() => {
      const width = `${sceneWidth.value}px`;
      // console.log('RESIZE: sceneContainerStyle:', width);
      return { width };
    });

    const totalWidth = computed(() => {
      return window.innerWidth;
    });

    const resumePercentage = computed(() => {
      return 100 - Math.round(resizeHandle.percentage.value);
    });

    const handleSceneContainerClick = (event) => {
      // Only clear selection if clicking directly on the scene container or its immediate children
      // Don't clear if clicking on interactive elements like cards
      if (event.target.id === 'scene-container' || 
          event.target.id === 'scene-plane' ||
          event.target.id === 'scene-plane-top-gradient' ||
          event.target.id === 'scene-plane-btm-gradient' ||
          event.target.id === 'biz-details-div') {
        selectionManager.clearSelection('AppContent.sceneContainerClick');
      }
    };
    

    
    return {
      focalPoint,
      viewport,
      focalPointStyle,
      sceneContainerStyle,
      handleSceneContainerClick,
      totalWidth,
      sceneWidth,
      resumePercentage
    };
  }
};
</script>

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
  flex-shrink: 1; 
  flex-grow: 0;
  z-index: 1; 
  min-width: 0;
  max-width: none;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* width will be set by computed style */
}

#scene-content {
  flex-grow: 1;
  position: relative;
  overflow-y: scroll; 
  overscroll-behavior: contain;
  -ms-overflow-style: none; /* Hide scrollbar for IE and Edge */
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  overflow-x: hidden; /* prevent horizontal scrolling */
  isolation: isolate;
  background-color: var(--background-dark);
  z-index: 0;
  margin: 0;
  padding: 0;
}

#scene-content::-webkit-scrollbar {
  display: none; /* Hide scrollbar for Chrome, Safari, and Opera */
}

#resume-container {
  display: flex;
  height: 100%;
  flex-grow: 1; /* Take up remaining space after scene container */
  z-index: 10;
}

.resume-wrapper {
  flex: 1;
  min-width: 0;
  position: relative; /* Required for child's absolute positioning */
}

#resume-container-right {
  position: relative; /* Required for footer absolute positioning */
  flex: 1;
  display: flex;
  flex-direction: column;
}

#resume-content-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.2) !important;
  padding: 10px;
  flex-shrink: 0;
  z-index: 10; /* Ensure it's above resume content */
  pointer-events: none; /* Allow clicking through to resume content */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
  height: 40px; /* Match scene footer height */
}

#resume-content-footer div,
#resume-content-footer span {
  background-color: transparent !important;
}

#resume-content-footer .viewer-label {
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: black;
  user-select: none;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  background-color: transparent !important;
  pointer-events: auto; /* Allow interaction with the text */
}

#scene-plane {
    position: relative;
}
</style> 