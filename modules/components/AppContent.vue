<template>
  <div id="app-container">
    <div id="scene-container" :style="sceneContainerStyle" @click="handleSceneContainerClick">
      <div id="scene-content">
        <div id="scene-plane-top-gradient"></div>
        <div id="scene-plane-btm-gradient"></div>
        <div id="scene-plane">
          <Timeline alignment="left" />
          <NewConnectionLines />
          <SkillBadges />
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
import { useColorPalette } from '@/modules/composables/useColorPalette.mjs';
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
import { initializationManager } from '@/modules/core/initializationManager.mjs';
import * as scenePlane from '@/modules/scene/scenePlaneModule.mjs';
import * as parallax from '@/modules/core/parallaxModule.mjs';
import * as autoScroll from '@/modules/animation/autoScrollModule.mjs';
import { selectionManager } from '@/modules/core/selectionManager.mjs';
import { badgeManager } from '@/modules/core/badgeManager.mjs';


import Timeline from '@/modules/components/Timeline.vue';
import ResizeHandle from '@/modules/components/ResizeHandle.vue';
import ResumeContainer from '@/modules/components/ResumeContainer.vue';
import SceneContainerFooter from '@/modules/components/SceneContainerFooter.vue';
import SkillBadges from '@/modules/components/SkillBadges.vue';
import NewConnectionLines from '@/modules/components/NewConnectionLines.vue';
import BadgeToggle from '@/modules/components/BadgeToggle.vue';


export default {
  name: 'AppContent',
  components: {
    Timeline,
    ResizeHandle,
    ResumeContainer,
    SceneContainerFooter,
    SkillBadges,
    NewConnectionLines,
    BadgeToggle,
  },
  async setup() {

    
    // Register lifecycle hooks immediately (before any await statements)
    let handleSceneWidthChanged = null;
    onUnmounted(() => {
      if (handleSceneWidthChanged) {
        window.removeEventListener('scene-width-changed', handleSceneWidthChanged);
      }
    });
    
    // Initialize reactive composables immediately (before any await statements)
    // This ensures Vue lifecycle hooks are registered in the correct component context
    const viewport = useViewport('AppContent');
    const bullsEye = useBullsEye(viewport);
    const aimPoint = useAimPoint(viewport);
    const focalPoint = useFocalPoint();
    const resizeHandle = useResizeHandle();
    useTimeline();
    
    // Initialize color palette composable immediately (before any await statements)
    const colorPalette = useColorPalette();
    
    // Register lifecycle hooks before any await statements
    onMounted(async () => {
      try {
        window.CONSOLE_LOG_IGNORE('[INIT] AppContent: Starting event-driven initialization');
        
        // Register Timeline as the first component (no dependencies)
        initializationManager.register(
          'Timeline',
          async () => {
            window.CONSOLE_LOG_IGNORE('[INIT] Initializing Timeline');
            initializeTimeline(jobsData);
          },
          [], // No dependencies
          { priority: 'high' }
        );
        
        // Register all controllers with their dependencies
        cardsController.registerForInitialization();
        resumeItemsController.registerForInitialization();
        resumeListController.registerForInitialization();
        
        // Register other components that depend on controllers
        initializationManager.register(
          'Viewport',
          async () => {
            window.CONSOLE_LOG_IGNORE('[INIT] Initializing Viewport systems');
            await initializationManager.waitForComponents(['CardsController', 'ResumeListController']);
            viewport.initialize();
            viewPort.initialize();
          },
          ['CardsController', 'ResumeListController'],
          { priority: 'medium' }
        );
        
        initializationManager.register(
          'Layout',
          async () => {
            window.CONSOLE_LOG_IGNORE('[INIT] Initializing Layout systems');
            await initializationManager.waitForComponent('Viewport');
            resizeHandle.initializeResizeHandleState(viewport, bullsEye);
            const { applyInitialLayout } = resizeHandle;
            applyInitialLayout();
          },
          ['Viewport'],
          { priority: 'medium' }
        );
        
        initializationManager.register(
          'ReactiveSystems',
          async () => {
            window.CONSOLE_LOG_IGNORE('[INIT] Initializing Reactive systems');
            await initializationManager.waitForComponent('Viewport');
            bullsEye.initialize();
            aimPoint.initialize();
            focalPoint.initialize();
          },
          ['Viewport'],
          { priority: 'medium' }
        );
        
        initializationManager.register(
          'SceneSystems',
          async () => {
            window.CONSOLE_LOG_IGNORE('[INIT] Initializing Scene systems');
            await initializationManager.waitForComponents(['Viewport', 'Layout']);
            sceneContainer.initialize();
            autoScroll.initialize();
            scenePlane.initialize();
            parallax.initialize(focalPoint);
          },
          ['Viewport', 'Layout'],
          { priority: 'low' }
        );
        
        // Register SkillBadges component - needs CardsController and ColorPalette ready
        initializationManager.register(
          'SkillBadges',
          async () => {
            window.CONSOLE_LOG_IGNORE('[INIT] Initializing SkillBadges');
            // Wait for both CardsController and color palette to be ready
            await initializationManager.waitForComponents(['CardsController']);
            await colorPalette.readyPromise; // Wait for color palette to load
            
            // Dispatch event to trigger SkillBadges initialization
            window.dispatchEvent(new CustomEvent('skill-badges-init-ready'));
          },
          ['CardsController'],
          { priority: 'low' }
        );
        
        // Register ConnectionLines component - needs CardsController and SkillBadges
        initializationManager.register(
          'ConnectionLines',
          async () => {
            window.CONSOLE_LOG_IGNORE('[INIT] Initializing ConnectionLines');
            await initializationManager.waitForComponents(['CardsController', 'SkillBadges']);
            
            // Dispatch event to trigger ConnectionLines initialization
            window.dispatchEvent(new CustomEvent('connection-lines-init-ready'));
          },
          ['CardsController', 'SkillBadges'],
          { priority: 'low' }
        );
        
        // Wait for all components to be ready
        await initializationManager.waitForComponents([
          'Timeline',
          'CardsController', 
          'ResumeItemsController', 
          'ResumeListController',
          'Viewport',
          'Layout',
          'ReactiveSystems',
          'SceneSystems',
          'SkillBadges',
          'ConnectionLines'
        ]);
        
        // Badge manager is automatically initialized - force refresh visibility
        badgeManager.refreshVisibility();
        
        window.CONSOLE_LOG_IGNORE('[INIT] AppContent: All components initialized successfully');
        
        // Expose controllers for testing
        window.cardsController = cardsController;
        window.resumeListController = resumeListController;
        
        // Add global functions for debugging initialization
        window.checkInitializationStatus = () => {
          window.CONSOLE_LOG_IGNORE('[INIT] Current initialization status:');
          console.table(initializationManager.getStatus());
        };
        
        window.showDependencyGraph = () => {
          window.CONSOLE_LOG_IGNORE('[INIT] Dependency graph:');
          window.CONSOLE_LOG_IGNORE(initializationManager.getDependencyGraph());
        };
        
        window.validateDependencies = () => {
          const result = initializationManager.validateDependencies();
          window.CONSOLE_LOG_IGNORE('[INIT] Dependency validation:');
          if (result.isValid) {
            window.CONSOLE_LOG_IGNORE('✅ Dependency graph is valid');
          } else {
            console.error('❌ Dependency graph has errors:', result.errors);
          }
          if (result.warnings.length > 0) {
            console.warn('⚠️ Warnings:', result.warnings);
          }
          return result;
        };
        
        window.CONSOLE_LOG_IGNORE('[INIT] Added window.checkInitializationStatus(), window.showDependencyGraph(), and window.validateDependencies() for debugging');
        
      } catch (error) {
        console.error("AppContent: Error in event-driven initialization:", error);
      }
    });
    
    // Wait for everything to be ready before any initialization
    
    // Load color palettes
    await colorPalette.loadPalettes();
    
    await initializeState();
    
    // Initialize core services (event system first)
    keyDown.initialize();
    
                  // Initialize data controllers (non-DOM dependent)
      
      // Initialize assembly (non-DOM dependent)
  
    // Initialize layout systems (will be done after viewport is ready)
    
    // Initialize final services (non-DOM dependent)
    // Note: autoScroll will be initialized in onMounted after DOM is available
    
    // Return the setup data - this allows Vue to render the template
    // DOM-dependent initialization will happen in onMounted
    
    // Computed properties
    const focalPointStyle = computed(() => {
      if (!focalPoint.value) return { left: '0px', top: '0px' };
      const style = {
        left: `${focalPoint.value.position.value.x}px`,
        top: `${focalPoint.value.position.value.y}px`,
      };

      return style;
    });

    // Create a reactive reference to scene width that updates via events
    // Start with a reasonable default width (50% of window width)
    const sceneWidth = ref(viewport.value?.width.value || Math.round(window.innerWidth * 0.5));
    
    // Set up event listener for scene width changes immediately
    handleSceneWidthChanged = (event) => {
      sceneWidth.value = event.detail.width;
    };
    
    // Add event listener immediately (will be cleaned up in onUnmounted)
    window.addEventListener('scene-width-changed', handleSceneWidthChanged);
    
    const sceneContainerStyle = computed(() => {
      const width = `${sceneWidth.value}px`;
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
          event.target.id === 'scene-content' ||
          event.target.id === 'scene-plane' ||
          event.target.id === 'scene-plane-top-gradient' ||
          event.target.id === 'scene-plane-btm-gradient' ||
          event.target.id === 'biz-details-div' ||
          event.target.id === 'scene-content-footer' ||
          event.target.closest('#scene-content-footer')) {
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