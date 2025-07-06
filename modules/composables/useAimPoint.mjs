import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useBullsEye } from './useBullsEye.mjs';

// --- Constants ---
export const MODES = {
  LOCKED: 'locked',
  FOLLOWING: 'following',
  DRAGGING: 'dragging'
};

// --- Private State ---
let _aimPointElement = null;
let _isInitialized = false;
let _mode = MODES.LOCKED;
let _mousePosition = { x: 0, y: 0 };

// --- Reactive State ---
const aimPointState = ref({
  x: 0,
  y: 0
});

// --- Private Functions ---
function updateAimPointPosition() {
  if (!_aimPointElement) return;

  _aimPointElement.style.left = `${aimPointState.value.x}px`;
  _aimPointElement.style.top = `${aimPointState.value.y}px`;
}

function handleMouseMove(event) {
  _mousePosition.x = event.clientX;
  _mousePosition.y = event.clientY;
  
  if (_mode === MODES.FOLLOWING || _mode === MODES.DRAGGING) {
    aimPointState.value.x = _mousePosition.x;
    aimPointState.value.y = _mousePosition.y;
    updateAimPointPosition();
  }
}

// This will be set by the composable
let _updatePositionFromBullsEye = null;

function handleViewportChanged() {
  if (_mode === MODES.LOCKED && _isInitialized && _updatePositionFromBullsEye) {
    _updatePositionFromBullsEye();
  }
}

// --- Composable ---
export function useAimPoint(viewport = null) {
  // Register cleanup on component unmount
  // This must be done immediately to avoid Vue lifecycle warnings
  onUnmounted(() => {
    cleanup();
  });

  const bullsEye = useBullsEye(viewport);

  // Reactive properties
  const position = computed(() => aimPointState.value);
  const x = computed(() => aimPointState.value.x);
  const y = computed(() => aimPointState.value.y);

  // Mode management
  const mode = computed(() => _mode);

  function updatePositionFromBullsEye() {
    if (_mode === MODES.LOCKED) {
      const bullsEyePos = bullsEye.getBullsEye();
      aimPointState.value.x = bullsEyePos.x;
      aimPointState.value.y = bullsEyePos.y;
      updateAimPointPosition();
    }
  }
  
  // Set the function reference for the event handler
  _updatePositionFromBullsEye = updatePositionFromBullsEye;

  function setMode(newMode) {
    window.CONSOLE_LOG_IGNORE('aimPoint.setMode called with:', newMode, 'current mode was:', _mode);
    _mode = newMode;
    
    // Update position based on new mode
    if (_mode === MODES.LOCKED) {
      updatePositionFromBullsEye();
    } else if (_mode === MODES.FOLLOWING || _mode === MODES.DRAGGING) {
      // Use current mouse position
      aimPointState.value.x = _mousePosition.x;
      aimPointState.value.y = _mousePosition.y;
      updateAimPointPosition();
    }
  }

  function cycleMode() {
    const modes = Object.values(MODES);
    const currentIndex = modes.indexOf(_mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  }

  function initialize() {
    window.CONSOLE_LOG_IGNORE('aimPoint.initialize() called');
    if (_isInitialized) {
      window.CONSOLE_LOG_IGNORE("aimPoint.initialize: already initialized, ignoring duplicate initialization request");
      return;
    }
    
    _aimPointElement = document.getElementById("aim-point");
    if (!_aimPointElement) {
      throw new Error("aimPoint.initialize: #aim-point element not found in DOM");
    }
    
    // Set up mouse move listener
    window.addEventListener('mousemove', handleMouseMove);
    
    // Listen for viewport changes to update position from bullsEye
    window.addEventListener('viewport-changed', handleViewportChanged);
    
    _isInitialized = true;
    window.CONSOLE_LOG_IGNORE("aimPoint initialized successfully");
    
    // Initial position update
    updatePositionFromBullsEye();
  }

  function isInitialized() {
    return _isInitialized;
  }

  function cleanup() {
    if (_isInitialized) {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('viewport-changed', handleViewportChanged);
      _aimPointElement = null;
      _isInitialized = false;
    }
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
    updatePositionFromBullsEye
  };
} 