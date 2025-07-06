import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as bullsEyeModule from '../core/bullsEye.mjs';

// --- Constants ---
export const MODES = {
  LOCKED: 'locked',
  FOLLOWING: 'following',
  DRAGGING: 'dragging'
};

// --- Private State ---
let _mode = MODES.LOCKED;
let _mousePosition = { x: 0, y: 0 };

// --- Reactive State ---
const bullsEyeState = ref({
  x: 0,
  y: 0
});

// --- Private Functions ---
function updateBullsEyePosition() {
  if (bullsEyeModule.isInitialized()) {
    const position = bullsEyeModule.getBullsEye();
    bullsEyeState.value.x = position.x;
    bullsEyeState.value.y = position.y;
  }
}

function handleMouseMove(event) {
  _mousePosition.x = event.clientX;
  _mousePosition.y = event.clientY;
  
  if (_mode === MODES.FOLLOWING || _mode === MODES.DRAGGING) {
    bullsEyeState.value.x = _mousePosition.x;
    bullsEyeState.value.y = _mousePosition.y;
  }
}

function handleViewportChanged() {
  if (_mode === MODES.LOCKED && bullsEyeModule.isInitialized()) {
    // Recenter the bullsEye element to stay centered in the scene container
    bullsEyeModule.recenterBullsEye();
    // Update the reactive state to match the new position
    updateBullsEyePosition();
  }
}

// --- Composable ---
export function useBullsEye(viewport = null) {
  // Register cleanup on component unmount
  onUnmounted(() => {
    cleanup();
  });

  // Reactive properties
  const position = computed(() => bullsEyeState.value);
  const x = computed(() => bullsEyeState.value.x);
  const y = computed(() => bullsEyeState.value.y);

  // Mode management
  const mode = computed(() => _mode);

  function getBullsEye() {
    if (_mode === MODES.LOCKED) {
      return bullsEyeModule.getBullsEye();
    } else {
      return bullsEyeState.value;
    }
  }

  function setMode(newMode) {
    window.CONSOLE_LOG_IGNORE('bullsEye.setMode called with:', newMode, 'current mode was:', _mode);
    _mode = newMode;
    
    // Update position based on new mode
    if (_mode === MODES.LOCKED) {
      updateBullsEyePosition();
    } else if (_mode === MODES.FOLLOWING || _mode === MODES.DRAGGING) {
      // Use current mouse position
      bullsEyeState.value.x = _mousePosition.x;
      bullsEyeState.value.y = _mousePosition.y;
    }
  }

  function cycleMode() {
    const modes = Object.values(MODES);
    const currentIndex = modes.indexOf(_mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  }

  function initialize() {
    window.CONSOLE_LOG_IGNORE('bullsEye.initialize() called');
    
    // Initialize the centralized bullsEye module
    bullsEyeModule.initialize();
    
    // Set up mouse move listener
    window.addEventListener('mousemove', handleMouseMove);
    
    // Listen for viewport changes to update position
    window.addEventListener('viewport-changed', handleViewportChanged);
    
    window.CONSOLE_LOG_IGNORE("bullsEye initialized successfully");
    
    // Initial position update
    updateBullsEyePosition();
  }

  function isInitialized() {
    return bullsEyeModule.isInitialized();
  }

  function recenterBullsEye() {
    bullsEyeModule.recenterBullsEye();
    updateBullsEyePosition();
  }

  function cleanup() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('viewport-changed', handleViewportChanged);
    bullsEyeModule.cleanup();
  }

  return {
    // Reactive properties
    position,
    x,
    y,
    mode,
    
    // Functions
    initialize,
    setMode,
    cycleMode,
    isInitialized,
    getBullsEye,
    recenterBullsEye
  };
} 