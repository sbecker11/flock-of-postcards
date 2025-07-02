import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAimPoint, MODES } from './useAimPoint.mjs';
import * as mathUtils from '@/modules/utils/mathUtils.mjs';

// --- Constants ---
const EASE_FACTOR = 0.05;

// --- Private State ---
let _focalPointElement = null;
let _isInitialized = false;
let _mode = MODES.LOCKED;
let _animationFrameId = null;

// --- Reactive State ---
const focalPointState = ref({
  current: { x: 0, y: 0 },
  target: { x: 0, y: 0 }
});

// --- Private Functions ---
function updateFocalPointPosition() {
  if (!_focalPointElement) return;

  _focalPointElement.style.left = `${focalPointState.value.current.x}px`;
  _focalPointElement.style.top = `${focalPointState.value.current.y}px`;
}



// --- Composable ---
export function useFocalPoint() {
  const aimPoint = useAimPoint();
  const { position: aimPointPosition, mode: aimPointMode } = aimPoint;

  // Reactive properties
  const position = computed(() => focalPointState.value.current);
  const target = computed(() => focalPointState.value.target);
  const mode = computed(() => _mode);
  const isLocked = computed(() => _mode === MODES.LOCKED);
  const isDragging = computed(() => _mode === MODES.DRAGGING);

  function animate() {
    // Always update target from aimPoint position during animation
    focalPointState.value.target.x = aimPointPosition.value.x;
    focalPointState.value.target.y = aimPointPosition.value.y;
    
    if (_mode === MODES.DRAGGING) {
      // In dragging mode, move immediately without easing
      console.log('focalPoint dragging: updating position to', focalPointState.value.target);
      focalPointState.value.current.x = focalPointState.value.target.x;
      focalPointState.value.current.y = focalPointState.value.target.y;
      updateFocalPointPosition();
      // Continue animation in dragging mode to keep updating
      _animationFrameId = requestAnimationFrame(animate);
      return;
    }

    const distanceSq = mathUtils.getPositionsSquaredDistance(
      focalPointState.value.current, 
      focalPointState.value.target
    );

    if (distanceSq < 0.5) {
      focalPointState.value.current.x = focalPointState.value.target.x;
      focalPointState.value.current.y = focalPointState.value.target.y;
      updateFocalPointPosition();
      
      // Keep animating if locked or following to always track the target
      if (_mode === MODES.LOCKED || _mode === MODES.FOLLOWING) {
        _animationFrameId = requestAnimationFrame(animate);
      } else {
        _animationFrameId = null;
      }
    } else {
      focalPointState.value.current.x += (focalPointState.value.target.x - focalPointState.value.current.x) * EASE_FACTOR;
      focalPointState.value.current.y += (focalPointState.value.target.y - focalPointState.value.current.y) * EASE_FACTOR;
      updateFocalPointPosition();
      _animationFrameId = requestAnimationFrame(animate);
    }
  }

  function startAnimation() {
    if (!_animationFrameId) {
      _animationFrameId = requestAnimationFrame(animate);
    }
  }

  // Watch aimPoint position and update target accordingly
  const updateTargetFromAimPoint = computed(() => {
    console.log('RESIZE: focalPoint aimPoint watcher triggered, position:', aimPointPosition.value);
    focalPointState.value.target.x = aimPointPosition.value.x;
    focalPointState.value.target.y = aimPointPosition.value.y;
    
    // Start animation if not in dragging mode and initialized
    if (_mode !== MODES.DRAGGING && _isInitialized) {
      console.log('RESIZE: focalPoint starting animation, target:', focalPointState.value.target);
      startAnimation();
    }
    return aimPointPosition.value;
  });

  // Force the computed to be used so it triggers updates
  const _ = updateTargetFromAimPoint.value;

  function setMode(newMode) {
    console.log('focalPoint.setMode called with:', newMode, 'current mode was:', _mode);
    _mode = newMode;
    
    // Update aimPoint mode to match
    aimPoint.setMode(newMode);
    
    // Immediately update target to current aimPoint position
    focalPointState.value.target.x = aimPointPosition.value.x;
    focalPointState.value.target.y = aimPointPosition.value.y;
    console.log('focalPoint.setMode: updated target to:', focalPointState.value.target);
    
    // Start animation for all modes (including dragging)
    if (_isInitialized) {
      console.log('focalPoint.setMode: starting animation for mode:', _mode);
      startAnimation();
    }
  }

  function cycleMode() {
    const modes = Object.values(MODES);
    const currentIndex = modes.indexOf(_mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    console.log('focalPoint.cycleMode: current mode:', _mode, 'next mode:', modes[nextIndex]);
    setMode(modes[nextIndex]);
  }

  function initialize() {
    console.log('focalPoint.initialize() called');
    if (_isInitialized) {
      console.warn("focalPoint.initialize: already initialized, ignoring duplicate initialization request");
      return;
    }
    
    _focalPointElement = document.getElementById("focal-point");
    if (!_focalPointElement) {
      throw new Error("focalPoint.initialize: #focal-point element not found in DOM");
    }
    
    // Initialize position to aimPoint position
    console.log('focalPoint.initialize: aimPoint position:', aimPointPosition.value);
    focalPointState.value.current.x = aimPointPosition.value.x;
    focalPointState.value.current.y = aimPointPosition.value.y;
    focalPointState.value.target.x = aimPointPosition.value.x;
    focalPointState.value.target.y = aimPointPosition.value.y;
    
    console.log('focalPoint.initialize: setting position to:', focalPointState.value.current);
    updateFocalPointPosition();
    startAnimation();
    
    _isInitialized = true;
    console.log("focalPoint initialized successfully");
  }

  function isInitialized() {
    return _isInitialized;
  }

  function cleanup() {
    if (_animationFrameId) {
      cancelAnimationFrame(_animationFrameId);
      _animationFrameId = null;
    }
    _focalPointElement = null;
    _isInitialized = false;
  }

  // Register cleanup on component unmount
  onUnmounted(() => {
    cleanup();
  });

  return {
    // Reactive properties
    position,
    target,
    mode,
    isLocked,
    isDragging,
    
    // Functions
    initialize,
    setMode,
    cycleMode,
    isInitialized
  };
} 