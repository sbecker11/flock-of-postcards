import { computed, onMounted, onUnmounted } from 'vue';
import { useViewport } from './useViewport.mjs';
import * as sceneViewLabel from '@/modules/core/sceneViewLabelModule.mjs';

// --- Private State ---
let _bullsEyeElement = null;
let _bullsEyeRad = 0;
let _isInitialized = false;



// --- Composable ---
export function useBullsEye(viewport = null) {
  console.log('RESIZE: useBullsEye called with viewport:', !!viewport);
  console.log('RESIZE: useBullsEye viewport type:', typeof viewport);
  console.log('RESIZE: useBullsEye viewport value:', viewport);
  
  // Use the passed viewport instance or get the singleton
  const viewportInstance = viewport || useViewport('useBullsEye-fallback');
  
  const { centerX, centerY, isInitialized: viewportInitialized } = viewportInstance;

  // Computed properties that automatically update when viewport changes
  const position = computed(() => ({
    x: centerX.value,
    y: centerY.value
  }));

  const isInitialized = computed(() => _isInitialized && viewportInitialized());

  // Updated recenterBullsEye function that uses the composable's viewport values
  function recenterBullsEye() {
    if (!_bullsEyeElement || !_isInitialized) return;

    console.log(`Repositioning BullsEye to: top=${centerY.value}px, left=${centerX.value}px`);

    // Since CSS has transform: translate(-50%, -50%), set position to exact center
    // The transform will handle centering the element around this point
    _bullsEyeElement.style.left = `${centerX.value}px`;
    _bullsEyeElement.style.top = `${centerY.value}px`;
    
    console.log(`BullsEye final position - left: ${centerX.value}px, top: ${centerY.value}px`);
    
    sceneViewLabel.repositionLabel();
  }

  function initialize() {
    console.log('BullsEye.initialize() called, _isInitialized:', _isInitialized);
    if (_isInitialized) {
      console.warn("bullsEye.initialize: already initialized, ignoring duplicate initialization request");
      return;
    }
    
    _bullsEyeElement = document.getElementById("bulls-eye");
    if (!_bullsEyeElement) {
      throw new Error("bullsEye.initialize: #bulls-eye element not found in DOM");
    }
    _bullsEyeRad = _bullsEyeElement.offsetWidth / 2;
    
    // Check dependency on viewport
    if (!viewportInitialized()) {
      throw new Error("bullsEye requires viewport to be initialized.");
    }
    
    console.log("Initializing bullsEye...");
    recenterBullsEye();
    
    // Listen for viewport changes to reposition the bullsEye
    window.addEventListener('viewport-changed', () => {
      console.log('BullsEye: viewport-changed event received, repositioning...');
      if (_isInitialized) {
        recenterBullsEye();
      }
    });
    
    _isInitialized = true;
    console.log("bullsEye initialized successfully");
  }

  function reset() {
    _isInitialized = false;
    _bullsEyeElement = null;
    _bullsEyeRad = 0;
  }

  function getBullsEye() {
    if (!viewportInitialized()) {
      throw new Error("viewport is not initialized");
    }
    const pos = position.value;
    console.log('getBullsEye called, returning position:', pos);
    return pos;
  }



  // Register cleanup on component unmount
  onUnmounted(() => {
    reset();
  });

  return {
    position,
    isInitialized,
    initialize,
    getBullsEye,
    recenterBullsEye
  };
} 