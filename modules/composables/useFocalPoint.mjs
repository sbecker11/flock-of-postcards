import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as focalPointManager from '@/modules/core/focalPointManager.mjs';

// --- Private State & Constants ---
export const MODES = focalPointManager.MODES;

// --- Private Logic ---
// All logic is now handled by focalPointManager

// --- Composable ---

export function useFocalPoint() {
  // Create a reactive ref for the mode
  const modeRef = ref(focalPointManager.getMode());
  
  // Create reactive references to the focal point manager state
  const position = computed(() => {
    const pos = focalPointManager.getPosition();
    console.log('focalPoint position computed:', pos);
    return pos;
  });
  const mode = computed(() => modeRef.value);
  const isLocked = computed(() => mode.value === MODES.LOCKED);
  const isDragging = computed(() => mode.value === MODES.DRAGGING);

  function cycleMode() {
    focalPointManager.cycleMode();
  }

  // Listen for mode changes from the focal point manager
  function handleModeChange(event) {
    if (event.detail && event.detail.mode) {
      modeRef.value = event.detail.mode;
    }
  }

  onMounted(() => {
    // Ensure the focal point manager is initialized
    focalPointManager.initialize();
    
    // Listen for mode changes
    window.addEventListener('focal-point-mode-changed', handleModeChange);
  });

  onUnmounted(() => {
    // Clean up the focal point manager
    focalPointManager.cleanup();
    
    // Remove event listener
    window.removeEventListener('focal-point-mode-changed', handleModeChange);
  });

  return {
    position,
    mode,
    isLocked,
    isDragging,
    cycleMode,
  };
} 